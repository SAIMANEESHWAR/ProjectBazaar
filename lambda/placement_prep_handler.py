import json
import uuid
from datetime import datetime
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# ================= CONFIG =================
REGION = "ap-south-2"
PLACEMENT_PREP_TABLE = "PlacementPrep"

# ================= AWS =================
dynamodb = boto3.resource("dynamodb", region_name=REGION)
placement_table = dynamodb.Table(PLACEMENT_PREP_TABLE)

CONFIG_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Max-Age": "3600",
}


# ================= HELPERS =================
def response(status: int, body, headers=None):
    """Create API Gateway response with CORS headers"""
    response_headers = {
        "Content-Type": "application/json",
        **CONFIG_CORS_HEADERS,
    }
    if headers:
        response_headers.update(headers)
    
    return {
        "statusCode": status,
        "headers": response_headers,
        "body": json.dumps(body, default=str) if body is not None else "",
    }


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def parse_body(event):
    """Parse request body from event"""
    try:
        body = event.get("body", "{}") or "{}"
        if isinstance(body, str):
            return json.loads(body)
        return body
    except Exception as e:
        print(f"Error parsing body: {e}")
        return {}


def get_path_parameter(event, param_name):
    """Get path parameter from event"""
    path_params = event.get("pathParameters") or {}
    return path_params.get(param_name)


def normalize_phase_item(item_id: str, raw: dict, now: str) -> dict:
    """Normalize and validate placement phase item"""
    
    # helper for resources validation
    def normalize_resources(res_list):
        if not isinstance(res_list, list): return []
        normalized_res = []
        for res in res_list:
            if isinstance(res, dict):
                normalized_res.append({
                    "name": str(res.get("name", "")).strip(),
                    "url": str(res.get("url", "")).strip(),
                    "type": str(res.get("type", "")).strip(),
                })
        return normalized_res

    # helper for tasks validation
    def normalize_tasks(tasks_list):
        if not isinstance(tasks_list, list): return []
        normalized_tasks = []
        for task in tasks_list:
            if isinstance(task, dict):
                normalized_tasks.append({
                    "id": str(task.get("id") or f"task-{uuid.uuid4()}"),
                    "title": str(task.get("title", "")).strip(),
                    "description": str(task.get("description", "")).strip(),
                    "difficulty": str(task.get("difficulty", "Easy")).strip(),
                    "practiceLink": str(task.get("practiceLink", "")).strip(),
                    "note": str(task.get("note", "")).strip(),
                    "needsRevision": bool(task.get("needsRevision", False)),
                    "helpfulLinks": normalize_resources(task.get("helpfulLinks", []))
                })
        return normalized_tasks

    return {
        "id": item_id,
        "year": str(raw.get("year", "")).strip(),
        "months": str(raw.get("months", "")).strip(),
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "colorClass": str(raw.get("colorClass", "from-gray-400 to-gray-600")).strip(),
        "badgeClass": str(raw.get("badgeClass", "bg-gray-100 text-gray-700")).strip(),
        "icon": str(raw.get("icon", "📋")).strip(),
        "relatedTopics": [str(t).strip() for t in raw.get("relatedTopics", []) if isinstance(t, str)],
        "tasks": normalize_tasks(raw.get("tasks", [])),
        "resources": normalize_resources(raw.get("resources", [])),
        "createdAt": raw.get("createdAt") or now,
        "updatedAt": now,
        "type": "phase" # Marker to distinguish from other items if table is shared
    }


# ================= CRUD OPERATIONS =================

def handle_get_all():
    """GET / - Get all placement phases"""
    try:
        # Scan table and filter by type="phase" (optional, if table is shared)
        # For now assuming table is dedicated or we just return everything that looks like a phase
        result = placement_table.scan()
        items = result.get("Items", [])
        
        # Filter for phases if necessary (based on presence of 'year' or 'type')
        phases = [item for item in items if item.get("type") == "phase" or "year" in item]
        
        # Sort could be complex due to "3rd Year", "Jan-Jun" strings.
        # Ideally, we return as is and frontend handles sorting, or we add a orderIndex field.
        # For now, returning as is.
        
        return response(200, {
            "success": True,
            "phases": phases, # Frontend expects 'phases' key per new logic? Or check frontend fetch.
            # Checking frontend fetchPhases: setPhases(parsed)
            # Frontend currently uses localStorage.
            # But the 'fetchTopics' called 'topics'.
            # I should return a key that generic or specific?
            # User wants backend for phases.
            "count": len(phases)
        })
    except ClientError as e:
        return response(500, {
            "success": False,
            "message": "Failed to retrieve phases",
            "error": str(e)
        })
    except Exception as e:
        return response(500, {
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        })

def handle_bulk_put(phases: list):
    """Bulk create/update phases (replaces entire list logic or upsert)"""
    if not isinstance(phases, list):
        return response(400, {
            "success": False,
            "message": "'phases' must be a list"
        })
    
    now = now_iso()
    incoming_ids = set()
    
    try:
        with placement_table.batch_writer() as batch:
            for raw in phases:
                if not isinstance(raw, dict): continue
                
                item_id = raw.get("id") or f"phase-{uuid.uuid4()}"
                incoming_ids.add(item_id)
                
                normalized = normalize_phase_item(item_id, raw, now)
                batch.put_item(Item=normalized)
        
        # Optional: Delete items that are not in incoming_list (Full sync)
        # Be careful with this pattern if table is huge. For admin panel settings it's fine.
        existing = placement_table.scan().get("Items", [])
        existing_phases = [i for i in existing if i.get("type") == "phase" or "year" in i]
        
        with placement_table.batch_writer() as batch:
            for item in existing_phases:
                if item["id"] not in incoming_ids:
                    batch.delete_item(Key={"id": item["id"]})

        return response(200, {
            "success": True,
            "message": f"Updated {len(incoming_ids)} phases",
            "count": len(incoming_ids)
        })
    except Exception as e:
        return response(500, {
            "success": False,
            "message": "Failed to save phases",
            "error": str(e)
        })

def handle_delete(item_id: str):
    try:
        placement_table.delete_item(Key={"id": item_id})
        return response(200, {"success": True, "message": "Deleted successfully"})
    except Exception as e:
        return response(500, {"success": False, "error": str(e)})

# ================= MAIN HANDLER =================
def lambda_handler(event, context):
    """
    Handler for Placement Prep Phases
    """
    http_method = (
        event.get("httpMethod") or
        event.get("requestContext", {}).get("http", {}).get("method", "") or
        event.get("requestContext", {}).get("httpMethod", "")
    )
    
    if http_method == "OPTIONS":
        return {"statusCode": 204, "headers": CONFIG_CORS_HEADERS, "body": ""}
    
    body = parse_body(event)
    action = body.get("action")
    
    try:
        if http_method == "GET":
             return handle_get_all()
             
        elif http_method == "POST":
            # Action based routing (compatible with frontend logic if it sends action)
            # Frontend fetchPhases (currently localStorage) needs to be updated to call this API.
            # But here we implement the backend capabilities.
            
            if action == "list":
                return handle_get_all()
            elif action == "put" or action == "savePhases": # accepting various action names
                # expect 'phases' list in body
                phases = body.get("phases", [])
                return handle_bulk_put(phases)
            elif action == "delete":
                return handle_delete(body.get("id"))
            else:
                # Default POST behavior if just sending data?
                # Assume bulk put if 'phases' is present
                if "phases" in body:
                    return handle_bulk_put(body.get("phases"))
                return response(400, {"success": False, "message": "Unknown action or missing data"})
                
        elif http_method == "DELETE":
             item_id = get_path_parameter(event, "id")
             return handle_delete(item_id)
             
        return response(405, {"success": False, "message": "Method not allowed"})

    except Exception as e:
        print(f"Error: {e}")
        return response(500, {"success": False, "message": "Internal Server Error", "error": str(e)})
