"""
Scheduled job: extract India job listings via Firecrawl Agent (v2) + poll until complete, then upsert DynamoDB.

Same flow as the hackathon Firecrawl Lambda: start agent job → poll up to 15 minutes → parse results.
Duplicates skipped with ConditionExpression on PK.

Env: FIRECRAWL_API_KEY, JOBS_TABLE, optional FIRECRAWL_MODEL, FIRECRAWL_AGENT_URL
"""

from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

# ============================================================
# CONFIG (aligned with hackathon / Firecrawl v2 agent)
# ============================================================
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
TABLE_NAME = os.environ.get("JOBS_TABLE", "JobListings")
AGENT_URL = os.environ.get("FIRECRAWL_AGENT_URL", "https://api.firecrawl.dev/v2/agent")
FIRECRAWL_MODEL = os.environ.get("FIRECRAWL_MODEL", "spark-1-mini")

POLL_INTERVAL = 5  # seconds between status checks
MAX_WAIT = 900  # 15 minutes (Lambda max timeout should be >= this)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
}


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


def normalize_item(job: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "PK": generate_pk(job),
        "created_at": int(time.time()),
        "scraped_at": int(time.time()),
        "job_title": job.get("job_title") or job.get("title"),
        "company": job.get("company"),
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
    """Accept Firecrawl completed payload shapes."""
    if not data:
        return []
    nested = data.get("job_listings")
    if nested is None and isinstance(data.get("data"), dict):
        nested = data["data"].get("job_listings")
    if isinstance(nested, list):
        return [x for x in nested if isinstance(x, dict)]
    return []


def run_firecrawl_agent_with_poll() -> List[Dict[str, Any]]:
    """
    Start v2 agent job, then poll GET {AGENT_URL}/{id} until completed or timeout (15 min).
    """
    if not FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY is not set")

    start_payload: Dict[str, Any] = {
        "prompt": """
Extract job listings across India from Indeed, Internshala, Naukri, LinkedIn, and other relevant job boards.
Target roles including software development, data science, AI, management, design, and operations
across major Indian cities like Bangalore, Hyderabad, Mumbai, and Delhi.
For each listing, capture: job title, company, location, salary, job type, experience level, full description,
direct apply link, and source platform.
Limit results to jobs posted within the last 30 days. Navigate up to 2 pages of results per search query.
Remove duplicate listings. Return only structured data per schema.
""".strip(),
        "schema": {
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
                            "source_platform": {"type": ["string", "null"]},
                            "platform": {"type": ["string", "null"]},
                        },
                    },
                }
            },
            "required": ["job_listings"],
        },
    }
    if FIRECRAWL_MODEL:
        start_payload["model"] = FIRECRAWL_MODEL

    print("Starting Firecrawl agent job (jobs)...")
    start_resp = http_request(AGENT_URL, start_payload, timeout=120)
    print("Firecrawl start response keys:", list(start_resp.keys()) if isinstance(start_resp, dict) else type(start_resp))

    job_id = start_resp.get("id") if isinstance(start_resp, dict) else None
    if not job_id:
        raise RuntimeError(f"Firecrawl did not return job id: {json.dumps(start_resp, default=str)[:2000]}")

    print("Firecrawl job_id:", job_id)

    start_time = time.time()
    while time.time() - start_time < MAX_WAIT:
        time.sleep(POLL_INTERVAL)
        elapsed = int(time.time() - start_time)
        print(f"----- POLLING jobs ({elapsed}s elapsed) -----")

        job_resp = http_request(f"{AGENT_URL.rstrip('/')}/{job_id}", None, timeout=90)
        status = job_resp.get("status") if isinstance(job_resp, dict) else None
        print("Firecrawl status:", status)

        if status == "completed":
            print("Firecrawl job COMPLETED (jobs)")
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
            if not listings and isinstance(job_resp, dict):
                listings = extract_job_listings_from_completed_payload(job_resp)
            print("Job listings count:", len(listings))
            return listings

        if status == "failed":
            err = job_resp.get("error") if isinstance(job_resp, dict) else None
            raise RuntimeError(f"Firecrawl job FAILED: {err or job_resp}")

    raise TimeoutError(f"Firecrawl job did not complete within {MAX_WAIT} seconds")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    print("========== FETCH JOBS (Firecrawl, poll up to 15 min) ==========")
    print("Event:", json.dumps(event, default=str))

    try:
        listings = run_firecrawl_agent_with_poll()
        inserted = 0
        skipped = 0

        for job in listings:
            item = normalize_item(job)
            if insert_if_new(item):
                inserted += 1
            else:
                skipped += 1

        body = {
            "success": True,
            "total_fetched": len(listings),
            "newly_inserted": inserted,
            "already_existing": skipped,
            "table": TABLE_NAME,
        }
        return {"statusCode": 200, "body": json.dumps(body)}
    except Exception as exc:
        print("Error:", str(exc))
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "error": str(exc)}),
        }
