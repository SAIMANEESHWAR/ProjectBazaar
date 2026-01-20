import json
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from botocore.config import Config

# ================= CONFIG =================
# Adjust table names and region to match your AWS setup
REGION = "ap-south-2"
TRENDING_CAREERS_TABLE = "TrendingCareers"
PROJECT_IDEAS_TABLE = "ProjectIdeas"


# ================= AWS =================
dynamodb = boto3.resource("dynamodb", region_name=REGION)
trending_table = dynamodb.Table(TRENDING_CAREERS_TABLE)
projects_table = dynamodb.Table(PROJECT_IDEAS_TABLE)

CONFIG_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "3600",
}


# ================= HELPERS =================
def response(status: int, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            **CONFIG_CORS_HEADERS,
        },
        "body": json.dumps(body, default=str) if body is not None else "",
    }


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def to_decimal(value):
    if value is None:
        return None
    return Decimal(str(value))


def parse_body(event):
    try:
        return json.loads(event.get("body", "{}") or "{}")
    except Exception:
        return {}


# ================= MAIN HANDLER =================
def lambda_handler(event, context):
    """
    Admin API for Career Guidance content.

    Expected JSON body:
      {
        "section": "trending" | "projects",
        "action": "put" | "list" | "delete",
        "items": [...],     # for action=put (full replacement of list)
        "id": "..."         # for action=delete (single item)
      }

    For `section = "trending"`, each item should match frontend `TrendingCareer` shape:
      {
        "id": "optional-id",
        "title": "...",
        "avgSalary": "...",
        "growth": "...",
        "demand": "Very High" | "High" | "Medium",
        "skills": [...],
        "companies": [...],
        "description": "...",
        "links": ["https://...", ...]  # roadmap links
      }

    For `section = "projects"`, each item should match frontend `ProjectIdea` shape:
      {
        "id": "optional-id",
        "title": "...",
        "difficulty": "Beginner" | "Intermediate" | "Advanced",
        "duration": "...",
        "technologies": [...],
        "description": "...",
        "features": [...],
        "githubLinks": ["https://github.com/...", ...],
        "demoLinks": ["https://demo...", ...]
      }
    """
    http_method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method", "")
    )

    # CORS preflight
    if http_method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CONFIG_CORS_HEADERS,
            "body": "",
        }

    body = parse_body(event)
    section = body.get("section")
    action = body.get("action", "list")

    if section not in ("trending", "projects"):
        return response(400, {"success": False, "message": "Invalid or missing 'section'"})

    try:
        if action == "list" or http_method == "GET":
            return handle_list(section)
        if action == "put" and http_method in ("POST", "PUT", "PATCH"):
            return handle_put(section, body.get("items", []))
        if action == "delete" and http_method in ("POST", "DELETE"):
            item_id = body.get("id")
            if not item_id:
                return response(400, {"success": False, "message": "Missing 'id' for delete"})
            return handle_delete(section, item_id)

        return response(400, {"success": False, "message": "Unsupported action or HTTP method"})

    except Exception as exc:  # pragma: no cover - defensive
        # In a real deployment you might log this with CloudWatch
        return response(
            500,
            {
                "success": False,
                "message": "Internal server error",
                "error": str(exc),
            },
        )


# ================= ACTION HANDLERS =================
def handle_list(section: str):
    table = trending_table if section == "trending" else projects_table
    result = table.scan()
    items = result.get("Items", [])
    # Sort by createdAt desc if present
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return response(200, {"success": True, "items": items})


def handle_put(section: str, items):
    """
    Replaces the entire list for a section.
    The frontend should send the full current list from admin UI.
    """
    if not isinstance(items, list):
        return response(400, {"success": False, "message": "'items' must be a list"})

    table = trending_table if section == "trending" else projects_table
    now = now_iso()

    # First, fetch existing ids so we can delete ones that disappeared
    existing = table.scan().get("Items", [])
    existing_ids = {item.get("id") for item in existing if item.get("id")}

    incoming_ids = set()
    with table.batch_writer() as batch:
        for raw in items:
            if not isinstance(raw, dict):
                continue

            item_id = raw.get("id") or str(uuid.uuid4())
            incoming_ids.add(item_id)

            if section == "trending":
                normalized = normalize_trending_item(item_id, raw, now)
            else:
                normalized = normalize_project_item(item_id, raw, now)

            batch.put_item(Item=normalized)

    # Delete entries that are no longer present
    to_delete = [item_id for item_id in existing_ids if item_id not in incoming_ids]
    with table.batch_writer() as batch:
        for item_id in to_delete:
            batch.delete_item(Key={"id": item_id})

    return response(
        200,
        {
            "success": True,
            "message": f"Updated {len(incoming_ids)} items for section '{section}'",
            "count": len(incoming_ids),
        },
    )


def handle_delete(section: str, item_id: str):
    table = trending_table if section == "trending" else projects_table
    table.delete_item(Key={"id": item_id})
    return response(200, {"success": True, "message": "Item deleted", "id": item_id})


# ================= NORMALIZERS =================
def normalize_trending_item(item_id: str, raw: dict, now: str) -> dict:
    return {
        "id": item_id,
        "title": raw.get("title", "").strip(),
        "avgSalary": raw.get("avgSalary", "").strip(),
        "growth": raw.get("growth", "").strip(),
        "demand": raw.get("demand", "High"),
        "skills": [s.strip() for s in raw.get("skills", []) if s],
        "companies": [c.strip() for c in raw.get("companies", []) if c],
        "description": (raw.get("description") or "").strip(),
        "links": [l.strip() for l in raw.get("links", []) if l],  # roadmap links
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_project_item(item_id: str, raw: dict, now: str) -> dict:
    return {
        "id": item_id,
        "title": raw.get("title", "").strip(),
        "difficulty": raw.get("difficulty", "Intermediate"),
        "duration": raw.get("duration", "").strip(),
        "technologies": [t.strip() for t in raw.get("technologies", []) if t],
        "description": (raw.get("description") or "").strip(),
        "features": [f.strip() for f in raw.get("features", []) if f],
        "githubLinks": [l.strip() for l in raw.get("githubLinks", []) if l],
        "demoLinks": [l.strip() for l in raw.get("demoLinks", []) if l],
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


