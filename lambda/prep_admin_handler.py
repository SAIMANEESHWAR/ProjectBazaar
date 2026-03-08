import json
import uuid
import math
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

# ========================== CONFIG ==========================
REGION = "ap-south-2"
S3_BUCKET = "projectbazaar-prep-notes"

TABLE_INTERVIEW_QUESTIONS = "PrepInterviewQuestions"
TABLE_DSA_PROBLEMS = "PrepDSAProblems"
TABLE_QUIZZES = "PrepQuizzes"
TABLE_COLD_DM_TEMPLATES = "PrepColdDMTemplates"
TABLE_MASS_RECRUITMENT = "PrepMassRecruitment"
TABLE_JOB_PORTALS = "PrepJobPortals"
TABLE_HANDWRITTEN_NOTES = "PrepHandwrittenNotes"
TABLE_ROADMAPS = "PrepRoadmaps"
TABLE_POSITION_RESOURCES = "PrepPositionResources"
TABLE_SYSTEM_DESIGN = "PrepSystemDesign"
TABLE_FUNDAMENTALS = "PrepFundamentals"

CONTENT_TYPE_TABLE_MAP = {
    "interview_questions": TABLE_INTERVIEW_QUESTIONS,
    "dsa_problems": TABLE_DSA_PROBLEMS,
    "quizzes": TABLE_QUIZZES,
    "cold_dm_templates": TABLE_COLD_DM_TEMPLATES,
    "mass_recruitment": TABLE_MASS_RECRUITMENT,
    "job_portals": TABLE_JOB_PORTALS,
    "handwritten_notes": TABLE_HANDWRITTEN_NOTES,
    "roadmaps": TABLE_ROADMAPS,
    "position_resources": TABLE_POSITION_RESOURCES,
    "system_design": TABLE_SYSTEM_DESIGN,
    "fundamentals": TABLE_FUNDAMENTALS,
}

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Max-Age": "3600",
}

# ========================== AWS CLIENTS ==========================
dynamodb = boto3.resource("dynamodb", region_name=REGION)
s3_client = boto3.client("s3", region_name=REGION)
_tables = {}


def get_table(table_name: str):
    if table_name not in _tables:
        _tables[table_name] = dynamodb.Table(table_name)
    return _tables[table_name]


# ========================== HELPERS ==========================
def api_response(status: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS_HEADERS},
        "body": json.dumps(body, default=_decimal_ser) if body is not None else "",
    }


def _decimal_ser(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def parse_body(event: dict) -> dict:
    try:
        body = event.get("body", "{}") or "{}"
        return json.loads(body) if isinstance(body, str) else body
    except (json.JSONDecodeError, TypeError):
        return {}


def to_decimal(value):
    if value is None:
        return None
    return Decimal(str(value)) if isinstance(value, float) else Decimal(value)


def get_query_params(event: dict) -> dict:
    return event.get("queryStringParameters") or {}


def generate_id(prefix: str = "") -> str:
    short_id = str(uuid.uuid4())[:8]
    return f"{prefix}-{short_id}" if prefix else short_id


# ========================== CONTENT NORMALIZERS ==========================

def normalize_interview_question(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("iq")),
        "question": str(raw.get("question", "")).strip(),
        "difficulty": raw.get("difficulty", "Medium"),
        "category": str(raw.get("category", "")).strip(),
        "role": str(raw.get("role", "")).strip(),
        "tags": [str(t).strip() for t in raw.get("tags", []) if t],
        "answer": str(raw.get("answer", "")).strip(),
        "hints": [str(h).strip() for h in raw.get("hints", []) if h],
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_dsa_problem(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("dsa")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "difficulty": raw.get("difficulty", "Medium"),
        "topic": str(raw.get("topic", "")).strip(),
        "company": [str(c).strip() for c in raw.get("company", []) if c],
        "acceptance": to_decimal(raw.get("acceptance", 0)),
        "constraints": str(raw.get("constraints", "")).strip(),
        "examples": raw.get("examples", []),
        "solutionLink": str(raw.get("solutionLink", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_quiz(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("quiz")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "questionCount": int(raw.get("questionCount", 0)),
        "difficulty": raw.get("difficulty", "Medium"),
        "category": str(raw.get("category", "")).strip(),
        "role": str(raw.get("role", "")).strip(),
        "duration": int(raw.get("duration", 0)),
        "questions": raw.get("questions", []),
        "passingScore": int(raw.get("passingScore", 70)),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_cold_dm(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("dm")),
        "title": str(raw.get("title", "")).strip(),
        "content": str(raw.get("content", "")).strip(),
        "category": str(raw.get("category", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_mass_recruitment(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("mr")),
        "name": str(raw.get("name", "")).strip(),
        "logo": str(raw.get("logo", "")).strip(),
        "interviewQuestions": int(raw.get("interviewQuestions", 0)),
        "dsaProblems": int(raw.get("dsaProblems", 0)),
        "aptitudeQuestions": int(raw.get("aptitudeQuestions", 0)),
        "website": str(raw.get("website", "")).strip(),
        "hiringPattern": str(raw.get("hiringPattern", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_job_portal(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("jp")),
        "name": str(raw.get("name", "")).strip(),
        "logo": str(raw.get("logo", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "url": str(raw.get("url", "")).strip(),
        "category": str(raw.get("category", "")).strip(),
        "region": str(raw.get("region", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_handwritten_note(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("note")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "topic": str(raw.get("topic", "")).strip(),
        "pageCount": int(raw.get("pageCount", 0)),
        "thumbnailUrl": str(raw.get("thumbnailUrl", "")).strip(),
        "s3Key": str(raw.get("s3Key", "")).strip(),
        "fileSize": int(raw.get("fileSize", 0)),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_roadmap(raw: dict, now: str) -> dict:
    steps = []
    for s in raw.get("steps", []):
        if isinstance(s, dict):
            steps.append({
                "title": str(s.get("title", "")).strip(),
                "description": str(s.get("description", "")).strip(),
                "resources": [str(r).strip() for r in s.get("resources", []) if r],
            })
    return {
        "id": str(raw.get("id") or generate_id("rm")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "category": str(raw.get("category", "")).strip(),
        "steps": steps,
        "isFree": bool(raw.get("isFree", True)),
        "estimatedDuration": str(raw.get("estimatedDuration", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_position_resource(raw: dict, now: str) -> dict:
    """Per-question item: id, question, category?, difficulty, roleId, roleLabel, subType."""
    return {
        "id": str(raw.get("id") or generate_id("pr")),
        "question": str(raw.get("question", "")).strip(),
        "category": str(raw.get("category", "")).strip(),
        "difficulty": str(raw.get("difficulty", "Medium")).strip() if raw.get("difficulty") else "Medium",
        "roleId": str(raw.get("roleId", "")).strip(),
        "roleLabel": str(raw.get("roleLabel", "")).strip(),
        "subType": str(raw.get("subType", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_system_design(raw: dict, now: str) -> dict:
    dt = raw.get("designType") or raw.get("type") or "HLD"
    design_type = str(dt).strip().lower() if isinstance(dt, str) else "hld"
    if design_type not in ("hld", "lld"):
        design_type = "hld"
    return {
        "id": str(raw.get("id") or generate_id("sd")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "type": design_type.upper(),
        "designType": design_type,
        "section": str(raw.get("section", "")).strip() or "System Design",
        "difficulty": str(raw.get("difficulty", "Medium")).strip() if raw.get("difficulty") else "Medium",
        "topics": [str(t).strip() for t in raw.get("topics", []) if t],
        "content": str(raw.get("content", "")).strip(),
        "diagramUrl": str(raw.get("diagramUrl", "")).strip(),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


def normalize_fundamental(raw: dict, now: str) -> dict:
    return {
        "id": str(raw.get("id") or generate_id("fund")),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "category": raw.get("category", "Language"),
        "subcategory": str(raw.get("subcategory", "")).strip(),
        "content": str(raw.get("content", "")).strip(),
        "codeExamples": raw.get("codeExamples", []),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
    }


NORMALIZER_MAP = {
    "interview_questions": normalize_interview_question,
    "dsa_problems": normalize_dsa_problem,
    "quizzes": normalize_quiz,
    "cold_dm_templates": normalize_cold_dm,
    "mass_recruitment": normalize_mass_recruitment,
    "job_portals": normalize_job_portal,
    "handwritten_notes": normalize_handwritten_note,
    "roadmaps": normalize_roadmap,
    "position_resources": normalize_position_resource,
    "system_design": normalize_system_design,
    "fundamentals": normalize_fundamental,
}


# ======================================================================
#                         CONTENT CRUD
# ======================================================================

def handle_list_content(content_type: str, query_params: dict) -> dict:
    """List all items of a content type with optional server-side filtering & pagination."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})

    table = get_table(table_name)

    difficulty = query_params.get("difficulty")
    category = query_params.get("category")
    topic = query_params.get("topic")
    role = query_params.get("role")
    search = query_params.get("search", "").lower()
    page = int(query_params.get("page", 1))
    limit = int(query_params.get("limit", 50))

    try:
        filter_expressions = []
        if difficulty and difficulty != "all":
            filter_expressions.append(Attr("difficulty").eq(difficulty))
        if category and category != "all":
            filter_expressions.append(Attr("category").eq(category))
        if topic and topic != "all":
            filter_expressions.append(Attr("topic").eq(topic))
        if role and role != "all":
            filter_expressions.append(Attr("role").eq(role))

        scan_kwargs = {}
        if filter_expressions:
            combined = filter_expressions[0]
            for expr in filter_expressions[1:]:
                combined = combined & expr
            scan_kwargs["FilterExpression"] = combined

        result = table.scan(**scan_kwargs)
        items = result.get("Items", [])
        while "LastEvaluatedKey" in result:
            scan_kwargs["ExclusiveStartKey"] = result["LastEvaluatedKey"]
            result = table.scan(**scan_kwargs)
            items.extend(result.get("Items", []))

        if search:
            searchable = ["question", "title", "name", "description", "content", "role"]
            items = [i for i in items if any(search in str(i.get(f, "")).lower() for f in searchable)]

        items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        total = len(items)
        total_pages = max(1, math.ceil(total / limit))
        start = (page - 1) * limit
        paginated = items[start : start + limit]

        return api_response(200, {
            "success": True,
            "items": paginated,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "limit": limit,
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_content(content_type: str, item_id: str) -> dict:
    """Get a single content item by ID."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})

    table = get_table(table_name)
    # DynamoDB key type must match schema: content tables use partition key "id" (String)
    key_id = str(item_id) if item_id is not None else ""
    if not key_id:
        return api_response(400, {"success": False, "message": "Missing item id"})
    try:
        result = table.get_item(Key={"id": key_id})
        item = result.get("Item")
        if not item:
            return api_response(404, {"success": False, "message": "Item not found"})
        return api_response(200, {"success": True, "item": item})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_put_content(content_type: str, items: list) -> dict:
    """Bulk create/update content items."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})
    normalizer = NORMALIZER_MAP.get(content_type)
    if not normalizer:
        return api_response(400, {"success": False, "message": f"No normalizer for: {content_type}"})
    if not isinstance(items, list):
        return api_response(400, {"success": False, "message": "'items' must be a list"})

    table = get_table(table_name)
    now = now_iso()
    written_ids = set()

    try:
        with table.batch_writer() as batch:
            for raw in items:
                if not isinstance(raw, dict):
                    continue
                normalized = normalizer(raw, now)
                written_ids.add(normalized["id"])
                batch.put_item(Item=normalized)

        return api_response(200, {
            "success": True,
            "message": f"Saved {len(written_ids)} {content_type} items",
            "count": len(written_ids),
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_put_content_single(content_type: str, raw: dict) -> dict:
    """Create or update a single content item."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})
    normalizer = NORMALIZER_MAP.get(content_type)
    if not normalizer:
        return api_response(400, {"success": False, "message": f"No normalizer for: {content_type}"})

    table = get_table(table_name)
    now = now_iso()
    try:
        normalized = normalizer(raw, now)
        table.put_item(Item=normalized)
        return api_response(200, {"success": True, "item": normalized})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_delete_content(content_type: str, item_id: str) -> dict:
    """Delete a single content item."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})

    table = get_table(table_name)
    key_id = str(item_id) if item_id is not None else ""
    if not key_id:
        return api_response(400, {"success": False, "message": "Missing item id"})
    try:
        table.delete_item(Key={"id": key_id})
        return api_response(200, {"success": True, "message": "Deleted", "id": item_id})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_bulk_delete_content(content_type: str, ids: list) -> dict:
    """Delete multiple content items by IDs."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})

    table = get_table(table_name)
    try:
        with table.batch_writer() as batch:
            for item_id in ids:
                batch.delete_item(Key={"id": str(item_id)})
        return api_response(200, {"success": True, "message": f"Deleted {len(ids)} items"})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_full_sync_content(content_type: str, items: list) -> dict:
    """Full-replace sync: writes all incoming items and deletes any that are no longer present."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})
    normalizer = NORMALIZER_MAP.get(content_type)
    if not normalizer:
        return api_response(400, {"success": False, "message": f"No normalizer for: {content_type}"})
    if not isinstance(items, list):
        return api_response(400, {"success": False, "message": "'items' must be a list"})

    table = get_table(table_name)
    now = now_iso()
    incoming_ids = set()

    try:
        with table.batch_writer() as batch:
            for raw in items:
                if not isinstance(raw, dict):
                    continue
                normalized = normalizer(raw, now)
                incoming_ids.add(normalized["id"])
                batch.put_item(Item=normalized)

        existing = table.scan(ProjectionExpression="id").get("Items", [])
        stale_ids = [item["id"] for item in existing if item["id"] not in incoming_ids]

        if stale_ids:
            with table.batch_writer() as batch:
                for item_id in stale_ids:
                    batch.delete_item(Key={"id": item_id})

        return api_response(200, {
            "success": True,
            "message": f"Synced {len(incoming_ids)} items, removed {len(stale_ids)} stale items",
            "count": len(incoming_ids),
            "removed": len(stale_ids),
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                    S3 PRESIGNED URLS (Notes)
# ======================================================================

def handle_get_note_upload_url(data: dict) -> dict:
    """Generate a presigned S3 URL for uploading a note file."""
    filename = data.get("filename", "")
    content_type = data.get("contentType", "application/pdf")

    if not filename:
        return api_response(400, {"success": False, "message": "filename is required"})

    s3_key = f"notes/{generate_id('upload')}/{filename}"

    try:
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key, "ContentType": content_type},
            ExpiresIn=3600,
        )
        return api_response(200, {"success": True, "uploadUrl": presigned_url, "s3Key": s3_key, "expiresIn": 3600})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Error generating upload URL", "error": str(e)})


def handle_get_content_stats() -> dict:
    """Get counts for every content type (admin dashboard overview)."""
    counts = {}
    for ct, table_name in CONTENT_TYPE_TABLE_MAP.items():
        try:
            result = get_table(table_name).scan(Select="COUNT")
            counts[ct] = result.get("Count", 0)
        except Exception:
            counts[ct] = 0

    return api_response(200, {"success": True, "counts": counts})


# ======================================================================
#                       MAIN LAMBDA HANDLER
# ======================================================================

def lambda_handler(event, context):
    """
    Admin Lambda for Preparation Mode content management.

    ──────────────────────────────────────────────────────────────
    ACTION                  METHOD     BODY / PARAMS
    ──────────────────────────────────────────────────────────────
    list_content            GET/POST   { contentType, page?, limit?, difficulty?, category?, topic?, role?, search? }
    get_content             GET/POST   { contentType, id }
    put_content             POST       { contentType, items: [...] }
    put_content_single      POST       { contentType, item: {...} }
    delete_content          DELETE/POST { contentType, id }
    bulk_delete_content     POST       { contentType, ids: [...] }
    full_sync_content       POST       { contentType, items: [...] }
    get_note_upload_url     POST       { filename, contentType? }
    get_content_stats       GET/POST   (no params)
    ──────────────────────────────────────────────────────────────

    Content types:
      interview_questions, dsa_problems, quizzes, cold_dm_templates,
      mass_recruitment, job_portals, handwritten_notes, roadmaps,
      position_resources, system_design, fundamentals
    """
    http_method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method", "")
        or event.get("requestContext", {}).get("httpMethod", "")
    )

    if http_method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    body = parse_body(event)
    query_params = get_query_params(event)
    action = body.get("action") or query_params.get("action", "")
    print(f"[prep_admin_handler] {http_method} action={action!r} contentType={body.get('contentType') or query_params.get('contentType')!r}")

    try:
        if action == "list_content":
            ct = body.get("contentType") or query_params.get("contentType", "")
            filters = {**query_params, **{k: v for k, v in body.items() if k not in ("action", "contentType")}}
            return handle_list_content(ct, filters)

        if action == "get_content":
            ct = body.get("contentType") or query_params.get("contentType", "")
            item_id = body.get("id") or query_params.get("id", "")
            return handle_get_content(ct, item_id)

        if action == "put_content":
            return handle_put_content(body.get("contentType", ""), body.get("items", []))

        if action == "put_content_single":
            return handle_put_content_single(body.get("contentType", ""), body.get("item", {}))

        if action == "delete_content":
            ct = body.get("contentType") or query_params.get("contentType", "")
            item_id = body.get("id") or query_params.get("id", "")
            return handle_delete_content(ct, item_id)

        if action == "bulk_delete_content":
            return handle_bulk_delete_content(body.get("contentType", ""), body.get("ids", []))

        if action == "full_sync_content":
            return handle_full_sync_content(body.get("contentType", ""), body.get("items", []))

        if action == "get_note_upload_url":
            return handle_get_note_upload_url(body)

        if action == "get_content_stats":
            return handle_get_content_stats()

        print(f"[prep_admin_handler] Unknown action: {action!r}")
        return api_response(400, {
            "success": False,
            "message": f"Unknown action: '{action}'",
            "availableActions": [
                "list_content", "get_content", "put_content", "put_content_single",
                "delete_content", "bulk_delete_content", "full_sync_content",
                "get_note_upload_url", "get_content_stats",
            ],
        })

    except Exception as e:
        import traceback
        print(f"[prep_admin_handler] Unhandled error: {e}")
        traceback.print_exc()
        return api_response(500, {"success": False, "message": "Internal Server Error", "error": str(e)})
