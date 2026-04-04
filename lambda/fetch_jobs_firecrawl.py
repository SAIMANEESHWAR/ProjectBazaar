"""
Async batched Firecrawl Agent jobs for job listings (India).

- **start** mode: starts a few small agent runs (narrow prompts), stores Firecrawl job ids in DynamoDB.
- **poll** mode: one status check per pending job (no long blocking loop), writes completed results to JOBS_TABLE.

Env:
  FIRECRAWL_API_KEY (required)
  JOBS_TABLE (default JobListings) — job rows
  FIRECRAWL_BATCH_TABLE (default JobFirecrawlBatches) — pending agent jobs + cursor
    Must be a single-attribute primary key: id (String). No sort key. No Query; Scan + begins_with(id, "PENDING#") for listing.
  FIRECRAWL_AGENT_URL (default https://api.firecrawl.dev/v2/agent)
  FIRECRAWL_MODEL (optional, default spark-1-pro)
  BATCHES_PER_RUN (default 3) — how many agent jobs to start per start invocation
  MAX_PENDING (default 10) — cap concurrent pending Firecrawl jobs
  STALE_SECONDS (default 7200) — drop pending row if older than this (2h)

Event:
  { "mode": "start" }  — EventBridge schedule for enqueue
  { "mode": "poll" }   — EventBridge schedule every 2–5 min

Legacy synchronous single prompt (not recommended):
  { "mode": "legacy" } or HANDLER_MODE=legacy

DynamoDB batch table (JobFirecrawlBatches): partition key id only.
  Pending: id = PENDING#<firecrawl_job_id>. Cursor: id = META#cursor.
  Listing pending uses Scan with begins_with(id, "PENDING#") (pending count is capped).
"""

from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

# ============================================================
# CONFIG
# ============================================================
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
TABLE_NAME = os.environ.get("JOBS_TABLE", "JobListings")
BATCH_TABLE_NAME = os.environ.get("FIRECRAWL_BATCH_TABLE", "JobFirecrawlBatches")
AGENT_URL = os.environ.get("FIRECRAWL_AGENT_URL", "https://api.firecrawl.dev/v2/agent").rstrip("/")
FIRECRAWL_MODEL = os.environ.get("FIRECRAWL_MODEL", "spark-1-pro")

BATCHES_PER_RUN = max(1, int(os.environ.get("BATCHES_PER_RUN", "3")))
MAX_PENDING = max(1, int(os.environ.get("MAX_PENDING", "10")))
STALE_SECONDS = max(300, int(os.environ.get("STALE_SECONDS", "7200")))
MAX_POLL_ITEMS = max(1, int(os.environ.get("MAX_POLL_ITEMS", "15")))

# Legacy single-run (blocking) timeout — only for mode=legacy
POLL_INTERVAL = 5
MAX_WAIT_LEGACY = 900

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
batch_table = dynamodb.Table(BATCH_TABLE_NAME)

# JobFirecrawlBatches: single partition key `id` only (no sort key). No Query on this table.
BATCH_KEY_MODE_SINGLE = True
BATCH_PARTITION_KEY = "id"

if BATCH_TABLE_NAME == TABLE_NAME:
    print("WARNING: FIRECRAWL_BATCH_TABLE is the same as JOBS_TABLE — use a dedicated batch table.")

PK_PENDING = "PENDING"
PK_META = "META"
SK_CURSOR = "cursor"
SINGLE_CURSOR_ITEM_ID = f"{PK_META}#{SK_CURSOR}"


def _single_pending_item_id(firecrawl_job_id: str) -> str:
    return f"{PK_PENDING}#{firecrawl_job_id}"


def _firecrawl_id_from_pending_item(item: Dict[str, Any]) -> Optional[str]:
    raw = item.get(BATCH_PARTITION_KEY)
    if not isinstance(raw, str):
        return None
    pfx = f"{PK_PENDING}#"
    if raw.startswith(pfx):
        return raw[len(pfx) :]
    return None


def _key_for_cursor_row() -> Dict[str, str]:
    return {BATCH_PARTITION_KEY: SINGLE_CURSOR_ITEM_ID}


def _key_for_pending_row(firecrawl_job_id: str) -> Dict[str, str]:
    return {BATCH_PARTITION_KEY: _single_pending_item_id(firecrawl_job_id)}

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
                    "apply_link": {"type": ["string", "null"]},
                    "apply_url": {"type": ["string", "null"]},
                    "direct_apply_link": {"type": ["string", "null"]},
                    "source_platform": {"type": ["string", "null"]},
                    "platform": {"type": ["string", "null"]},
                },
            },
        }
    },
    "required": ["job_listings"],
}

# Small, single-focus prompts: one board (Indeed, Naukri, Internshala, LinkedIn Jobs) + one city/slice;
# cap volume; discourage deep multi-page crawls.
SMALL_BATCHES: List[Dict[str, str]] = [
    {
        "id": "indeed_blr_sw",
        "prompt": (
            "On indeed.com, find up to 15 software developer or engineer job listings in Bangalore, India "
            "posted in the last 14 days. Use search result snippets only; do not open more than 20 pages total. "
            "Return: job_title, company, location, salary if shown, job_type, experience_level, short description, "
            "direct_apply_link, source_platform indeed."
        ),
    },
    {
        "id": "indeed_hyd_sw",
        "prompt": (
            "On indeed.com, up to 15 software or IT job listings in Hyderabad, India, last 14 days. "
            "Minimal navigation; prefer listing cards. Fields: job_title, company, location, salary, job_type, "
            "experience_level, description snippet, apply link, source_platform indeed."
        ),
    },
    {
        "id": "indeed_mum_sw",
        "prompt": (
            "On indeed.com, up to 15 software development listings in Mumbai, India, last 14 days. "
            "Cap browsing; listing-level data only. Same schema fields as prior batches."
        ),
    },
    {
        "id": "indeed_del_sw",
        "prompt": (
            "On indeed.com, up to 15 software or data roles in Delhi NCR, India, last 14 days. "
            "Keep crawl shallow. Return structured job_listings only."
        ),
    },
    {
        "id": "indeed_blr_ds",
        "prompt": (
            "On indeed.com, up to 12 data science or ML engineer jobs in Bangalore, last 14 days. "
            "Shallow crawl. Include apply_link and source_platform."
        ),
    },
    {
        "id": "naukri_blr_sw",
        "prompt": (
            "On naukri.com, up to 15 IT-software jobs in Bangalore, last 14 days. "
            "Stay on search/list pages; avoid visiting every job detail. Standard job fields + source_platform naukri."
        ),
    },
    {
        "id": "naukri_hyd_sw",
        "prompt": (
            "On naukri.com, up to 15 software jobs in Hyderabad, last 14 days. Shallow listing extraction only."
        ),
    },
    {
        "id": "internshala_tech_in",
        "prompt": (
            "On internshala.com, up to 12 active technology internships (software/data) in India, last 30 days. "
            "List view only where possible. job_type internship; include stipend as salary if shown."
        ),
    },
    {
        "id": "indeed_pune_sw",
        "prompt": (
            "On indeed.com, up to 15 software jobs in Pune, India, last 14 days. Minimal page depth."
        ),
    },
    {
        "id": "indeed_chennai_sw",
        "prompt": (
            "On indeed.com, up to 15 software jobs in Chennai, India, last 14 days. Minimal page depth."
        ),
    },
    {
        "id": "indeed_blr_product",
        "prompt": (
            "On indeed.com, up to 12 product manager or product owner roles in Bangalore, last 14 days. Shallow crawl."
        ),
    },
    {
        "id": "indeed_design_blr",
        "prompt": (
            "On indeed.com, up to 12 UX or UI designer jobs in Bangalore, last 14 days. Shallow crawl."
        ),
    },
    # -------------------------------------------------------------------------
    # Additional major cities (Indeed)
    # -------------------------------------------------------------------------
    {
        "id": "indeed_kolkata_sw",
        "prompt": (
            "On indeed.com, up to 15 software or IT job listings in Kolkata, India, last 14 days. "
            "Shallow listing extraction. source_platform indeed."
        ),
    },
    {
        "id": "indeed_ahmedabad_sw",
        "prompt": (
            "On indeed.com, up to 15 software or IT jobs in Ahmedabad, Gujarat, India, last 14 days. "
            "Shallow crawl. source_platform indeed."
        ),
    },
    {
        "id": "indeed_kochi_sw",
        "prompt": (
            "On indeed.com, up to 12 software jobs in Kochi or Ernakulam, Kerala, India, last 14 days. "
            "Shallow crawl. source_platform indeed."
        ),
    },
    # -------------------------------------------------------------------------
    # Naukri — more major cities
    # -------------------------------------------------------------------------
    {
        "id": "naukri_mum_sw",
        "prompt": (
            "On naukri.com, up to 15 IT-software jobs in Mumbai, last 14 days. List/search pages only; shallow. "
            "source_platform naukri."
        ),
    },
    {
        "id": "naukri_del_sw",
        "prompt": (
            "On naukri.com, up to 15 IT-software jobs in Delhi or NCR, last 14 days. Shallow listing extraction. "
            "source_platform naukri."
        ),
    },
    {
        "id": "naukri_pune_sw",
        "prompt": (
            "On naukri.com, up to 15 software jobs in Pune, last 14 days. Shallow. source_platform naukri."
        ),
    },
    {
        "id": "naukri_chennai_sw",
        "prompt": (
            "On naukri.com, up to 15 IT jobs in Chennai, last 14 days. Shallow. source_platform naukri."
        ),
    },
    # -------------------------------------------------------------------------
    # LinkedIn Jobs — public search, major Indian cities (one city per batch)
    # -------------------------------------------------------------------------
    {
        "id": "linkedin_blr_sw",
        "prompt": (
            "On linkedin.com/jobs, search public job listings: up to 12 software engineer or developer roles in "
            "Bengaluru/Bangalore, India, posted in the last 14 days. Extract from job cards in search results; "
            "avoid deep multi-page detail crawls (cap ~15 page loads). source_platform linkedin. "
            "Include job_title, company, location, workplace type if shown, apply or job URL, description snippet."
        ),
    },
    {
        "id": "linkedin_hyd_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software or engineering jobs in Hyderabad, India, last 14 days. "
            "Shallow search results only. source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_mum_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software developer or tech jobs in Mumbai, India, last 14 days. "
            "Shallow listing cards. source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_del_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software or IT jobs in Delhi or NCR, India, last 14 days. "
            "Shallow crawl from search. source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_pune_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software engineering jobs in Pune, India, last 14 days. "
            "source_platform linkedin; shallow extraction."
        ),
    },
    {
        "id": "linkedin_chennai_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 tech/software jobs in Chennai, India, last 14 days. "
            "source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_kolkata_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software or IT jobs in Kolkata, India, last 14 days. "
            "source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_ahmedabad_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 12 software or IT jobs in Ahmedabad, India, last 14 days. "
            "source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_kochi_sw",
        "prompt": (
            "On linkedin.com/jobs, up to 10 software jobs in Kochi or Ernakulam, Kerala, India, last 14 days. "
            "source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_data_blr",
        "prompt": (
            "On linkedin.com/jobs, up to 10 data scientist, ML engineer, or AI roles in Bengaluru, India, last 14 days. "
            "Shallow search results. source_platform linkedin."
        ),
    },
    {
        "id": "linkedin_product_mum",
        "prompt": (
            "On linkedin.com/jobs, up to 10 product manager or product owner roles in Mumbai, India, last 14 days. "
            "source_platform linkedin."
        ),
    },
]


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


def _company_logo_url(job: Dict[str, Any]) -> Optional[str]:
    for key in ("company_logo", "company_logo_url", "logo_url", "employer_logo", "company_image"):
        v = job.get(key)
        if isinstance(v, str) and v.strip().startswith(("http://", "https://")):
            return v.strip()
    return None


def normalize_item(job: Dict[str, Any]) -> Dict[str, Any]:
    logo = _company_logo_url(job)
    out: Dict[str, Any] = {
        "PK": generate_pk(job),
        "created_at": int(time.time()),
        "scraped_at": int(time.time()),
        "job_title": job.get("job_title") or job.get("title"),
        "company": job.get("company"),
        "company_logo": logo,
        "location": job.get("location"),
        "salary": job.get("salary"),
        "job_type": job.get("job_type") or job.get("employment_type"),
        "experience_level": job.get("experience_level") or job.get("experience"),
        "description": job.get("description") or job.get("full_description"),
        "apply_link": _apply_link(job) or None,
        "source_platform": job.get("source_platform") or job.get("platform"),
        "raw": job,
    }
    return {k: v for k, v in out.items() if v is not None}


def insert_if_new(item: Dict[str, Any]) -> bool:
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK)",
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
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
        raise RuntimeError(f"HTTP {e.code}: {err_body or e.reason}") from e


def extract_job_listings_from_completed_payload(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not data:
        return []
    nested = data.get("job_listings")
    if nested is None and isinstance(data.get("data"), dict):
        nested = data["data"].get("job_listings")
    if isinstance(nested, list):
        return [x for x in nested if isinstance(x, dict)]
    return []


def _pending_firecrawl_job_id(item: Dict[str, Any]) -> Optional[str]:
    return _firecrawl_id_from_pending_item(item)


def _dynamo_to_python(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _dynamo_to_python(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_dynamo_to_python(x) for x in obj]
    return obj


def _scan_pending_items(limit: int) -> List[Dict[str, Any]]:
    """Pending rows: id = PENDING#<firecrawl_job_id>."""
    out: List[Dict[str, Any]] = []
    kwargs: Dict[str, Any] = {
        "FilterExpression": "begins_with(#k, :pfx)",
        "ExpressionAttributeNames": {"#k": BATCH_PARTITION_KEY},
        "ExpressionAttributeValues": {":pfx": f"{PK_PENDING}#"},
    }
    while len(out) < limit:
        r = batch_table.scan(**kwargs)
        for it in r.get("Items", []):
            out.append(it)
            if len(out) >= limit:
                break
        lek = r.get("LastEvaluatedKey")
        if not lek:
            break
        kwargs["ExclusiveStartKey"] = lek
    return out


def count_pending() -> int:
    total = 0
    kwargs: Dict[str, Any] = {
        "FilterExpression": "begins_with(#k, :pfx)",
        "ExpressionAttributeNames": {"#k": BATCH_PARTITION_KEY},
        "ExpressionAttributeValues": {":pfx": f"{PK_PENDING}#"},
        "Select": "COUNT",
    }
    while True:
        r = batch_table.scan(**kwargs)
        total += int(r.get("Count", 0))
        lek = r.get("LastEvaluatedKey")
        if not lek:
            break
        kwargs["ExclusiveStartKey"] = lek
    return total


def get_cursor() -> int:
    try:
        r = batch_table.get_item(Key=_key_for_cursor_row())
        item = r.get("Item")
        if not item:
            return 0
        n = item.get("next_index", 0)
        if isinstance(n, Decimal):
            n = int(n)
        return int(n) % len(SMALL_BATCHES)
    except ClientError:
        return 0


def set_cursor(idx: int) -> None:
    item = {
        **_key_for_cursor_row(),
        "next_index": idx % len(SMALL_BATCHES),
        "updated_at": int(time.time()),
    }
    batch_table.put_item(Item=item)


def put_pending(firecrawl_job_id: str, batch_label: str) -> None:
    batch_table.put_item(
        Item={
            **_key_for_pending_row(firecrawl_job_id),
            "batch_label": batch_label,
            "started_at": int(time.time()),
            "poll_count": 0,
        }
    )


def delete_pending(firecrawl_job_id: str) -> None:
    batch_table.delete_item(Key=_key_for_pending_row(firecrawl_job_id))


LOGO_FIELD_HINT = (
    " For each row, include company_logo: a full https URL to the employer logo image when visible on the listing; "
    "otherwise null. Do not invent URLs."
)


def start_agent_job(prompt: str) -> str:
    if not FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY is not set")
    body: Dict[str, Any] = {
        "prompt": prompt.strip() + LOGO_FIELD_HINT,
        "schema": JOB_LISTINGS_SCHEMA,
    }
    if FIRECRAWL_MODEL:
        body["model"] = FIRECRAWL_MODEL
    start_resp = http_request(AGENT_URL, body, timeout=120)
    job_id = start_resp.get("id") if isinstance(start_resp, dict) else None
    if not job_id:
        raise RuntimeError(f"Firecrawl did not return job id: {json.dumps(start_resp, default=str)[:2000]}")
    return str(job_id)


def poll_one_firecrawl_job(firecrawl_job_id: str) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Returns (status, payload_or_none).
    status in: completed, failed, running, unknown
    """
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
    data = (
        job_resp.get("data")
        or job_resp.get("result")
        or job_resp.get("output")
        or {}
    )
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            data = {}
    if not isinstance(data, dict):
        data = {}
    listings = extract_job_listings_from_completed_payload(data)
    if not listings:
        listings = extract_job_listings_from_completed_payload(job_resp)
    inserted = 0
    skipped = 0
    for job in listings:
        item = normalize_item(job)
        if insert_if_new(item):
            inserted += 1
        else:
            skipped += 1
    return inserted, skipped


def handle_start() -> Dict[str, Any]:
    pending_n = count_pending()
    if pending_n >= MAX_PENDING:
        return {
            "success": True,
            "skipped": True,
            "reason": f"Already {pending_n} pending Firecrawl jobs (max {MAX_PENDING})",
            "pending_count": pending_n,
        }

    slots = min(BATCHES_PER_RUN, MAX_PENDING - pending_n)
    cursor = get_cursor()
    started: List[Dict[str, str]] = []
    errors: List[str] = []

    for i in range(slots):
        idx = (cursor + i) % len(SMALL_BATCHES)
        batch = SMALL_BATCHES[idx]
        try:
            jid = start_agent_job(batch["prompt"])
            put_pending(jid, batch["id"])
            started.append({"batch_id": batch["id"], "firecrawl_job_id": jid})
            print(f"Started batch {batch['id']} -> Firecrawl id {jid}")
        except Exception as e:
            err = f"{batch['id']}: {e}"
            print("ERROR", err)
            errors.append(err)

    new_cursor = (cursor + slots) % len(SMALL_BATCHES)
    set_cursor(new_cursor)

    return {
        "success": True,
        "mode": "start",
        "started": started,
        "errors": errors,
        "cursor_next": new_cursor,
        "pending_after": count_pending(),
    }


def handle_poll() -> Dict[str, Any]:
    if _batch_key_mode_single():
        raw_items = _scan_pending_items_single(MAX_POLL_ITEMS)
    else:
        r = batch_table.query(
            KeyConditionExpression=Key(BATCH_PARTITION_KEY).eq(PK_PENDING),
            Limit=MAX_POLL_ITEMS,
        )
        raw_items = r.get("Items", [])
    now = int(time.time())
    results: List[Dict[str, Any]] = []

    for raw in raw_items:
        item = _dynamo_to_python(raw)
        sk = _pending_firecrawl_job_id(item)
        if not sk:
            continue
        started_at = int(item.get("started_at", 0))
        poll_count = int(item.get("poll_count", 0))

        if now - started_at > STALE_SECONDS:
            print(f"Dropping stale pending job {sk} (age {now - started_at}s)")
            delete_pending(sk)
            results.append({"firecrawl_job_id": sk, "action": "dropped_stale"})
            continue

        try:
            status, payload = poll_one_firecrawl_job(sk)
        except Exception as e:
            print(f"Poll error for {sk}: {e}")
            batch_table.update_item(
                Key=_key_for_pending_row(sk),
                UpdateExpression="SET poll_count = poll_count + :one, last_error = :err",
                ExpressionAttributeValues={":one": 1, ":err": str(e)[:500]},
            )
            results.append({"firecrawl_job_id": sk, "action": "poll_error", "error": str(e)[:200]})
            continue

        if status == "completed" and payload:
            ins, skp = ingest_listings_from_response(payload)
            delete_pending(sk)
            results.append(
                {
                    "firecrawl_job_id": sk,
                    "action": "completed",
                    "inserted": ins,
                    "skipped_duplicates": skp,
                    "batch_label": item.get("batch_label"),
                }
            )
        elif status == "failed":
            err = payload.get("error") if isinstance(payload, dict) else None
            print(f"Firecrawl failed {sk}: {err}")
            delete_pending(sk)
            results.append({"firecrawl_job_id": sk, "action": "failed", "error": str(err)[:300]})
        else:
            batch_table.update_item(
                Key=_key_for_pending_row(sk),
                UpdateExpression="SET poll_count = poll_count + :one, last_status = :st",
                ExpressionAttributeValues={":one": 1, ":st": status[:100]},
            )
            results.append({"firecrawl_job_id": sk, "action": "still_running", "status": status, "poll_count": poll_count + 1})

    return {
        "success": True,
        "mode": "poll",
        "processed": len(results),
        "results": results,
        "remaining_pending": count_pending(),
    }


def run_firecrawl_agent_with_poll_legacy() -> List[Dict[str, Any]]:
    """Original single huge prompt + block up to 15 min (emergency only)."""
    if not FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY is not set")
    big_prompt = (
        "Extract job listings across India from Indeed, Internshala, Naukri. "
        "Software, data, AI, design roles in Bangalore, Hyderabad, Mumbai, Delhi. "
        "Up to 2 pages per query. Full fields + apply link."
    )
    body: Dict[str, Any] = {
        "prompt": big_prompt.strip() + LOGO_FIELD_HINT,
        "schema": JOB_LISTINGS_SCHEMA,
    }
    if FIRECRAWL_MODEL:
        body["model"] = FIRECRAWL_MODEL
    start_resp = http_request(AGENT_URL, body, timeout=120)
    job_id = start_resp.get("id") if isinstance(start_resp, dict) else None
    if not job_id:
        raise RuntimeError(f"Firecrawl did not return job id: {json.dumps(start_resp, default=str)[:2000]}")

    start_time = time.time()
    while time.time() - start_time < MAX_WAIT_LEGACY:
        time.sleep(POLL_INTERVAL)
        st, payload = poll_one_firecrawl_job(str(job_id))
        if st == "completed" and payload:
            data = payload.get("data") or payload.get("result") or payload.get("output") or {}
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    data = {}
            if not isinstance(data, dict):
                data = {}
            listings = extract_job_listings_from_completed_payload(data)
            if not listings:
                listings = extract_job_listings_from_completed_payload(payload)
            return listings
        if st == "failed":
            err = payload.get("error") if isinstance(payload, dict) else None
            raise RuntimeError(f"Firecrawl job FAILED: {err or payload}")

    raise TimeoutError(f"Firecrawl job did not complete within {MAX_WAIT_LEGACY} seconds")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    mode = (
        (event.get("mode") if isinstance(event, dict) else None)
        or os.environ.get("HANDLER_MODE", "start")
    )
    mode = str(mode).lower().strip()
    print("========== fetch_jobs_firecrawl ==========")
    print("mode:", mode)
    print("Event:", json.dumps(event, default=str)[:2000])

    try:
        if mode == "poll":
            body = handle_poll()
            return {"statusCode": 200, "body": json.dumps(body, default=str)}

        if mode == "legacy":
            listings = run_firecrawl_agent_with_poll_legacy()
            inserted = skipped = 0
            for job in listings:
                item = normalize_item(job)
                if insert_if_new(item):
                    inserted += 1
                else:
                    skipped += 1
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {
                        "success": True,
                        "mode": "legacy",
                        "total_fetched": len(listings),
                        "newly_inserted": inserted,
                        "already_existing": skipped,
                        "table": TABLE_NAME,
                    }
                ),
            }

        # default: start
        body = handle_start()
        return {"statusCode": 200, "body": json.dumps(body, default=str)}

    except Exception as exc:
        print("Error:", str(exc))
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "error": str(exc), "mode": mode}),
        }
