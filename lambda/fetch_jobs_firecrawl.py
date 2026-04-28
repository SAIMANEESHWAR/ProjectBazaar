"""
Single-run Firecrawl Agent for job listings (India).

Each invocation: start one agent job with a minimal prompt, poll until complete or timeout,
then insert new rows into JOBS_TABLE (duplicates skipped by the configured partition key).

Env:
  FIRECRAWL_API_KEY (required)
  JOBS_TABLE (default JobListings)
  JOBS_PARTITION_KEY (default id) — must match JobListings table partition key attribute (use PK if your table uses PK)
  FIRECRAWL_AGENT_URL (default https://api.firecrawl.dev/v2/agent)
  FIRECRAWL_MODEL (optional, default spark-1-pro)
  FIRECRAWL_PROMPT (optional) — full prompt override
  POLL_INTERVAL_SEC (default 5)
  MAX_WAIT_SEC (default 900) — max poll window (15 minutes)
  LOG_LEVEL (optional) — DEBUG, INFO, WARNING, ERROR (default INFO)

Event (optional):
  { "prompt": "..." }  — one-off prompt override (else env or default)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import urllib.error
import urllib.request
from decimal import Decimal
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
_LOG_LEVEL = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO)
logger.setLevel(_LOG_LEVEL)

# ============================================================
# CONFIG
# ============================================================
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
TABLE_NAME = os.environ.get("JOBS_TABLE", "JobListings")
JOBS_PARTITION_KEY = os.environ.get("JOBS_PARTITION_KEY", "id").strip() or "id"
AGENT_URL = os.environ.get("FIRECRAWL_AGENT_URL", "https://api.firecrawl.dev/v2/agent").rstrip("/")
FIRECRAWL_MODEL = os.environ.get("FIRECRAWL_MODEL", "spark-1-pro")

POLL_INTERVAL = max(1, int(os.environ.get("POLL_INTERVAL_SEC", "5")))
MAX_WAIT_SEC = max(60, int(os.environ.get("MAX_WAIT_SEC", "900")))

# Firecrawl fills job_listings[]; partition key, created_at, scraped_at, and raw are set in normalize_item().
DEFAULT_PROMPT = (
    "PRIORITY: Finish within ~10 minutes and use well under ~2000 Firecrawl credits (free tier is ~2500 total—stay frugal). "
    "Minimize pages, clicks, and follow-up extractions. One search or listing surface is enough; do not deep-crawl or paginate "
    "beyond what is needed to fill job_listings.\n\n"
    "IMPORTANT FOR FIRECRAWL: Return immediately with whatever you successfully extracted—partial results are acceptable. "
    "Do not keep browsing to “perfect” the set. If you have any valid rows, output them in job_listings and complete.\n\n"
    "Scope: software development, data science, AI, and related tech roles in Bangalore, Hyderabad, Mumbai, or Delhi on naukari , internshala , linkedin , indeed.com "
    "(or the shallowest single Indeed search/list page you open). Full-time and internships;  experience when visible. "
    "Every job_listings row MUST include company_logo and job_type (schema required): "
    "company_logo = https URL string or null if no logo is shown—never omit the key; do not invent URLs. "
    "job_type = employment type string (e.g. full-time, part-time, contract, internship); if unclear use \"unknown\"—never omit the key. "
    "Also when shown: job_title, company, skills, location, salary (including “competitive”/“not disclosed”), "
    "experience_level, description snippet (not full HTML walls), direct_apply_link, source_platform.\n\n"
    "Cap: prefer at most ~35-40 listings total, last few days only, 1 page per query max, dedupe, then STOP and return structured JSON per schema."
)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
logger.info("Configured jobs_table=%s jobs_partition_key=%s", TABLE_NAME, JOBS_PARTITION_KEY)

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
}

JOB_LISTINGS_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "job_listings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "job_title": {"type": ["string", "null"]},
                    "title": {"type": ["string", "null"]},
                    "company": {"type": ["string", "null"]},
                    "company_logo": {"type": ["string", "null"]},
                    "company_logo_url": {"type": ["string", "null"]},
                    "logo_url": {"type": ["string", "null"]},
                    "location": {"type": ["string", "null"]},
                    "salary": {"type": ["string", "null"]},
                    "job_type": {"type": ["string", "null"]},
                    "employment_type": {"type": ["string", "null"]},
                    "experience_level": {"type": ["string", "null"]},
                    "experience": {"type": ["string", "null"]},
                    "description": {"type": ["string", "null"]},
                    "full_description": {"type": ["string", "null"]},
                    "skills": {"type": ["string", "null"]},
                    "apply_link": {"type": ["string", "null"]},
                    "apply_url": {"type": ["string", "null"]},
                    "direct_apply_link": {"type": ["string", "null"]},
                    "source_platform": {"type": ["string", "null"]},
                    "platform": {"type": ["string", "null"]},
                },
                "required": ["company_logo", "job_type", "description"],
            },
        }
    },
    "required": ["job_listings"],
}

LOGO_FIELD_HINT = (
    " Required keys per row: company_logo (string URL or null), job_type (string, use \"unknown\" if not stated)."
)


def _apply_link(job: Dict[str, Any]) -> str:
    for key in (
        "apply_link",
        "apply_url",
        "application_url",
        "url",
        "link",
        "direct_apply_link",
    ):
        v = job.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def generate_pk(job: Dict[str, Any]) -> str:
    link = _apply_link(job)
    if link:
        return hashlib.sha256(link.encode()).hexdigest()[:32]
    title = str(job.get("job_title") or job.get("title") or "").strip()
    company = str(job.get("company") or "").strip()
    location = str(job.get("location") or "").strip()
    raw = f"{title}|{company}|{location}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


_LOGO_BOGUS = frozenset(
    {"", "null", "none", "undefined", "n/a", "na", "nil", "false", "(null)"}
)


def _normalize_logo_url(candidate: str) -> Optional[str]:
    s = candidate.strip()
    if not s or s.lower() in _LOGO_BOGUS:
        return None
    if s.startswith("//"):
        s = "https:" + s
    if not s.startswith(("http://", "https://")):
        return None
    try:
        parsed = urlparse(s)
        if not parsed.netloc:
            return None
    except Exception:
        return None
    return s


def _company_logo_url(job: Dict[str, Any]) -> Optional[str]:
    """
    Pick first usable logo URL from common Firecrawl / board fields (Naukri img.naukimg.com, Internshala CDN, etc.).
    JSON null and string placeholders are ignored.
    """
    keys = (
        "company_logo",
        "company_logo_url",
        "logo_url",
        "employer_logo",
        "company_image",
        "brand_logo",
        "logo",
        "image_url",
    )
    for key in keys:
        v = job.get(key)
        if v is None:
            continue
        if isinstance(v, str):
            norm = _normalize_logo_url(v)
            if norm:
                return norm
            continue
        if isinstance(v, dict) and isinstance(v.get("url"), str):
            norm = _normalize_logo_url(v["url"])
            if norm:
                return norm
    return None


def _skills_text(job: Dict[str, Any]) -> Optional[str]:
    s = job.get("skills")
    if isinstance(s, str) and s.strip():
        return s.strip()
    if isinstance(s, list):
        joined = ", ".join(str(x).strip() for x in s if x is not None and str(x).strip())
        return joined or None
    return None


def _dynamo_serialize_value(obj: Any) -> Any:
    """DynamoDB (boto3) does not accept plain float; normalize nested maps/lists for put_item."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _dynamo_serialize_value(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_dynamo_serialize_value(x) for x in obj]
    return obj


def normalize_item(job: Dict[str, Any]) -> Dict[str, Any]:
    logo = _company_logo_url(job)
    out: Dict[str, Any] = {
        JOBS_PARTITION_KEY: generate_pk(job),
        "created_at": int(time.time()),
        "scraped_at": int(time.time()),
        "job_title": job.get("job_title") or job.get("title"),
        "company": job.get("company"),
        # Canonical image URL for UI (same value mirrored for any consumer expecting *_url)
        "company_logo": logo,
        "company_logo_url": logo,
        "location": job.get("location"),
        "salary": job.get("salary"),
        "job_type": job.get("job_type") or job.get("employment_type"),
        "experience_level": job.get("experience_level") or job.get("experience"),
        "description": job.get("description") or job.get("full_description"),
        "skills": _skills_text(job),
        "apply_link": _apply_link(job) or None,
        "source_platform": job.get("source_platform") or job.get("platform"),
        "raw": _dynamo_serialize_value(job),
    }
    return {k: v for k, v in out.items() if v is not None}


def insert_if_new(item: Dict[str, Any]) -> bool:
    try:
        safe = _dynamo_serialize_value(item)
        table.put_item(
            Item=safe,
            ConditionExpression="attribute_not_exists(#jobspk)",
            ExpressionAttributeNames={"#jobspk": JOBS_PARTITION_KEY},
        )
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "ConditionalCheckFailedException":
            return False
        logger.error(
            "DynamoDB put_item failed table=%s partition_key_attr=%s value=%s code=%s message=%s",
            TABLE_NAME,
            JOBS_PARTITION_KEY,
            item.get(JOBS_PARTITION_KEY),
            code,
            e.response.get("Error", {}).get("Message", str(e)),
        )
        raise


def http_request(url: str, payload: Optional[Dict[str, Any]] = None, timeout: int = 120) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers=HEADERS,
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if not raw:
                return {}
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        logger.error(
            "HTTP error method=%s url=%s code=%s reason=%s body_preview=%s",
            "POST" if payload is not None else "GET",
            url[:120],
            e.code,
            e.reason,
            (err_body[:500] + "…") if len(err_body) > 500 else err_body,
        )
        raise RuntimeError(f"HTTP {e.code}: {err_body or e.reason}") from e


def _parse_json_if_string(blob: Any) -> Any:
    if isinstance(blob, str):
        try:
            return json.loads(blob)
        except json.JSONDecodeError:
            return blob
    return blob


def _coerce_top_level_blob(job_resp: Dict[str, Any]) -> Dict[str, Any]:
    """Turn Firecrawl GET /agent/{id} payload into a dict we can search for job_listings."""
    for key in ("data", "result", "output", "extract", "json", "extracted"):
        blob = job_resp.get(key)
        if blob is None:
            continue
        blob = _parse_json_if_string(blob)
        if isinstance(blob, dict):
            return blob
    return job_resp if isinstance(job_resp, dict) else {}


def extract_job_listings_from_completed_payload(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not data:
        return []

    nested = data.get("job_listings")
    if isinstance(nested, list):
        out = [x for x in nested if isinstance(x, dict)]
        if out:
            return out

    inner = data.get("data")
    if isinstance(inner, dict):
        jl = inner.get("job_listings")
        if isinstance(jl, list):
            out = [x for x in jl if isinstance(x, dict)]
            if out:
                return out

    for alt in ("jobs", "listings", "items", "results"):
        arr = data.get(alt)
        if isinstance(arr, list):
            out = [x for x in arr if isinstance(x, dict)]
            if out:
                return out

    for wrap_key in ("json", "extract", "structured", "schema", "output"):
        block = data.get(wrap_key)
        block = _parse_json_if_string(block)
        if isinstance(block, dict):
            jl = block.get("job_listings") or block.get("jobs")
            if isinstance(jl, list):
                out = [x for x in jl if isinstance(x, dict)]
                if out:
                    return out

    return []


def extract_job_listings_from_job_response(job_resp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Walk Firecrawl agent completion response for job_listings."""
    root = _coerce_top_level_blob(job_resp)
    listings = extract_job_listings_from_completed_payload(root)
    if listings:
        return listings
    # Second pass: search one level deeper (e.g. data.extract)
    for key in ("data", "result", "output"):
        blob = job_resp.get(key)
        blob = _parse_json_if_string(blob)
        if isinstance(blob, dict):
            listings = extract_job_listings_from_completed_payload(blob)
            if listings:
                return listings
            for inner_key in ("json", "extract", "data"):
                inner = _parse_json_if_string(blob.get(inner_key))
                if isinstance(inner, dict):
                    listings = extract_job_listings_from_completed_payload(inner)
                    if listings:
                        return listings
    return []


def start_agent_job(prompt: str) -> str:
    if not FIRECRAWL_API_KEY:
        logger.error("FIRECRAWL_API_KEY is not set")
        raise RuntimeError("FIRECRAWL_API_KEY is not set")
    logger.info(
        "Firecrawl agent start url=%s model=%s prompt_chars=%s",
        AGENT_URL,
        FIRECRAWL_MODEL or "(default)",
        len(prompt) + len(LOGO_FIELD_HINT),
    )
    body: Dict[str, Any] = {
        "prompt": prompt.strip() + LOGO_FIELD_HINT,
        "schema": JOB_LISTINGS_SCHEMA,
    }
    if FIRECRAWL_MODEL:
        body["model"] = FIRECRAWL_MODEL
    start_resp = http_request(AGENT_URL, body, timeout=120)
    job_id = start_resp.get("id") if isinstance(start_resp, dict) else None
    if not job_id:
        logger.error("Firecrawl start response missing id: %s", json.dumps(start_resp, default=str)[:2000])
        raise RuntimeError(f"Firecrawl did not return job id: {json.dumps(start_resp, default=str)[:2000]}")
    logger.info("Firecrawl job created job_id=%s", job_id)
    return str(job_id)


def poll_one_firecrawl_job(firecrawl_job_id: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    job_resp = http_request(f"{AGENT_URL}/{firecrawl_job_id}", None, timeout=90)
    status = (job_resp.get("status") or "").lower() if isinstance(job_resp, dict) else "unknown"
    if status == "completed":
        return "completed", job_resp
    if status == "failed":
        return "failed", job_resp
    if status in ("running", "pending", "processing", "queued", "active"):
        return "running", None
    return status or "unknown", job_resp


def ingest_listings_from_response(job_resp: Dict[str, Any]) -> Tuple[int, int]:
    listings = extract_job_listings_from_job_response(job_resp)
    if not listings:
        keys = list(job_resp.keys()) if isinstance(job_resp, dict) else []
        snippet = json.dumps(job_resp, default=str)[:2500]
        logger.warning(
            "Ingest: no job_listings extracted from Firecrawl payload top_level_keys=%s response_snippet=%s",
            keys,
            snippet,
        )
    inserted = 0
    skipped = 0
    for job in listings:
        item = normalize_item(job)
        if insert_if_new(item):
            inserted += 1
        else:
            skipped += 1
    logger.info(
        "Ingest complete table=%s listings_extracted=%s newly_inserted=%s skipped_duplicates=%s",
        TABLE_NAME,
        len(listings),
        inserted,
        skipped,
    )
    return inserted, skipped


def resolve_prompt(event: Optional[Dict[str, Any]]) -> Tuple[str, str]:
    if isinstance(event, dict):
        p = event.get("prompt")
        if isinstance(p, str) and p.strip():
            return p.strip(), "event.prompt"
    env_p = os.environ.get("FIRECRAWL_PROMPT", "").strip()
    if env_p:
        return env_p, "env.FIRECRAWL_PROMPT"
    return DEFAULT_PROMPT, "DEFAULT_PROMPT"


def run_sync_fetch_and_ingest(
    event: Optional[Dict[str, Any]] = None,
    context: Any = None,
) -> Dict[str, Any]:
    prompt, prompt_source = resolve_prompt(event)
    logger.info(
        "Run started prompt_source=%s prompt_length=%s table=%s partition_key=%s max_wait_sec=%s poll_interval_sec=%s",
        prompt_source,
        len(prompt),
        TABLE_NAME,
        JOBS_PARTITION_KEY,
        MAX_WAIT_SEC,
        POLL_INTERVAL,
    )

    job_id = start_agent_job(prompt)
    t0 = time.time()
    last_status = "started"
    last_logged_status: Optional[str] = None
    last_log_ts = t0
    poll_round = 0

    while time.time() - t0 < MAX_WAIT_SEC:
        time.sleep(POLL_INTERVAL)
        poll_round += 1
        st, payload = poll_one_firecrawl_job(job_id)
        last_status = st
        now = time.time()
        elapsed = int(now - t0)
        rem_fn = getattr(context, "get_remaining_time_in_millis", None) if context is not None else None
        rem_lambda_ms = rem_fn() if callable(rem_fn) else None
        if rem_lambda_ms is not None and rem_lambda_ms < 30_000:
            logger.warning(
                "Lambda time running low job_id=%s remaining_ms=%s elapsed_sec=%s status=%s",
                job_id,
                rem_lambda_ms,
                elapsed,
                st,
            )
        if st != last_logged_status or (now - last_log_ts) >= 60:
            logger.info(
                "Poll job_id=%s status=%s round=%s elapsed_sec=%s",
                job_id,
                st,
                poll_round,
                elapsed,
            )
            last_logged_status = st
            last_log_ts = now

        if st == "completed" and payload:
            logger.info("Firecrawl completed job_id=%s elapsed_sec=%s", job_id, elapsed)
            inserted, skipped = ingest_listings_from_response(payload)
            total = inserted + skipped
            out: Dict[str, Any] = {
                "success": True,
                "firecrawl_job_id": job_id,
                "total_listings_parsed": total,
                "newly_inserted": inserted,
                "skipped_duplicates": skipped,
                "elapsed_sec": elapsed,
                "last_status": st,
                "prompt_source": prompt_source,
            }
            if total == 0:
                out["ingest_note"] = (
                    "Firecrawl returned completed but no job_listings were found in the payload; "
                    "see CloudWatch WARNING log 'Ingest: no job_listings extracted' for payload snippet."
                )
                logger.warning(
                    "Completed with zero listings job_id=%s — check ingest extraction logs above",
                    job_id,
                )
            else:
                logger.info(
                    "Run finished OK job_id=%s inserted=%s skipped_duplicates=%s",
                    job_id,
                    inserted,
                    skipped,
                )
            return out
        if st == "failed":
            err = payload.get("error") if isinstance(payload, dict) else None
            logger.error("Firecrawl job failed job_id=%s error=%s", job_id, err or payload)
            raise RuntimeError(f"Firecrawl job failed: {err or payload}")

    logger.error(
        "Firecrawl poll timeout job_id=%s max_wait_sec=%s last_status=%s polls=%s",
        job_id,
        MAX_WAIT_SEC,
        last_status,
        poll_round,
    )
    raise TimeoutError(
        f"Firecrawl job {job_id} did not complete within {MAX_WAIT_SEC}s (last_status={last_status})"
    )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    request_id = getattr(context, "aws_request_id", None) or "local"
    logger.info(
        "========== fetch_jobs_firecrawl request_id=%s ==========",
        request_id,
    )
    if isinstance(event, dict):
        logger.info(
            "Event summary keys=%s detail_type=%s source=%s",
            list(event.keys()),
            event.get("detail-type") or event.get("detail_type"),
            event.get("source"),
        )
        logger.debug("Event body=%s", json.dumps(event, default=str)[:4000])
    else:
        logger.info("Event type=%s", type(event).__name__)

    try:
        body = run_sync_fetch_and_ingest(
            event if isinstance(event, dict) else None,
            context=context,
        )
        body["table"] = TABLE_NAME
        body["request_id"] = request_id
        logger.info("Lambda success request_id=%s firecrawl_job_id=%s", request_id, body.get("firecrawl_job_id"))
        return {"statusCode": 200, "body": json.dumps(body, default=str)}
    except Exception as exc:
        logger.exception("Lambda failed request_id=%s error=%s", request_id, exc)
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "success": False,
                    "error": str(exc),
                    "request_id": request_id,
                }
            ),
        }
