import json
import uuid
import math
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# ========================== CONFIG ==========================
REGION = "ap-south-2"
S3_BUCKET = "projectbazaar-prep-notes"

# Content tables (read-only from user side)
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

# User-specific tables
TABLE_COLLECTIONS = "PrepCollections"
TABLE_COLLECTION_ITEMS = "PrepCollectionItems"
TABLE_USER_PROGRESS = "PrepUserProgress"
TABLE_USER_ACTIVITY = "PrepUserActivity"
TABLE_USER_STATS = "PrepUserStats"
TABLE_QUIZ_RESULTS = "PrepQuizResults"

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

# CORS: allow browser requests from any origin (enable in API Gateway too if needed)
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,Accept,Origin",
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


def _progress_key(content_type: str, item_id: str) -> str:
    return f"{content_type}#{item_id}"


# ======================================================================
#                    READ CONTENT (user-facing)
# ======================================================================

def handle_list_content(content_type: str, query_params: dict) -> dict:
    """List content items with server-side filtering & pagination (read-only)."""
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
            "success": True, "items": paginated,
            "total": total, "page": page, "totalPages": total_pages, "limit": limit,
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_content(content_type: str, item_id: str) -> dict:
    """Get a single content item by ID (read-only)."""
    table_name = CONTENT_TYPE_TABLE_MAP.get(content_type)
    if not table_name:
        return api_response(400, {"success": False, "message": f"Unknown content type: {content_type}"})

    table = get_table(table_name)
    try:
        result = table.get_item(Key={"id": item_id})
        item = result.get("Item")
        if not item:
            return api_response(404, {"success": False, "message": "Item not found"})
        return api_response(200, {"success": True, "item": item})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_list_content_with_progress(user_id: str, content_type: str, query_params: dict) -> dict:
    """List content merged with the user's per-item progress (solved, bookmarked, etc.)."""
    content_resp = handle_list_content(content_type, query_params)
    content_body = json.loads(content_resp["body"])
    if not content_body.get("success"):
        return content_resp

    items = content_body.get("items", [])

    progress_resp = handle_get_user_progress(user_id, content_type)
    progress_body = json.loads(progress_resp["body"])
    progress_map = progress_body.get("progress", {})

    merged = []
    for item in items:
        key = _progress_key(content_type, item["id"])
        p = progress_map.get(key, {})
        merged.append({
            **item,
            "isSolved": p.get("isSolved", False),
            "isBookmarked": p.get("isBookmarked", False),
            "isFavorite": p.get("isFavorite", False),
            "isApplied": p.get("isApplied", False),
        })

    return api_response(200, {
        "success": True, "items": merged,
        "total": content_body.get("total", 0),
        "page": content_body.get("page", 1),
        "totalPages": content_body.get("totalPages", 1),
        "limit": content_body.get("limit", 50),
    })


# ======================================================================
#                        USER PROGRESS
# ======================================================================

def handle_get_user_progress(user_id: str, content_type: Optional[str] = None) -> dict:
    """Get all progress records for a user, optionally filtered by content type prefix."""
    table = get_table(TABLE_USER_PROGRESS)
    try:
        kce = Key("userId").eq(user_id)
        if content_type:
            kce = kce & Key("itemKey").begins_with(f"{content_type}#")

        result = table.query(KeyConditionExpression=kce)
        items = result.get("Items", [])
        while "LastEvaluatedKey" in result:
            result = table.query(KeyConditionExpression=kce, ExclusiveStartKey=result["LastEvaluatedKey"])
            items.extend(result.get("Items", []))

        progress_map = {}
        for item in items:
            progress_map[item["itemKey"]] = {
                "isSolved": item.get("isSolved", False),
                "isBookmarked": item.get("isBookmarked", False),
                "isFavorite": item.get("isFavorite", False),
                "isApplied": item.get("isApplied", False),
                "solvedAt": item.get("solvedAt"),
                "updatedAt": item.get("updatedAt"),
            }

        return api_response(200, {"success": True, "progress": progress_map, "count": len(progress_map)})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_toggle_progress(user_id: str, content_type: str, item_id: str, field: str) -> dict:
    """Toggle a boolean progress field (isSolved, isBookmarked, isFavorite, isApplied)."""
    valid_fields = {"isSolved", "isBookmarked", "isFavorite", "isApplied"}
    if field not in valid_fields:
        return api_response(400, {"success": False, "message": f"Invalid field: {field}"})

    table = get_table(TABLE_USER_PROGRESS)
    item_key = _progress_key(content_type, item_id)
    now = now_iso()

    try:
        existing = table.get_item(Key={"userId": user_id, "itemKey": item_key}).get("Item")
        current_value = existing.get(field, False) if existing else False
        new_value = not current_value

        update_expr = "SET #field = :val, updatedAt = :now, contentType = :ct, itemId = :iid"
        expr_names = {"#field": field}
        expr_values = {":val": new_value, ":now": now, ":ct": content_type, ":iid": item_id}

        if field == "isSolved" and new_value:
            update_expr += ", solvedAt = :now"

        table.update_item(
            Key={"userId": user_id, "itemKey": item_key},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )

        _log_activity(user_id, f"toggle_{field}", content_type, item_id, {"new_value": new_value})

        if field == "isSolved":
            _update_stat_counter(user_id, content_type, 1 if new_value else -1)

        return api_response(200, {
            "success": True, "field": field, "value": new_value,
            "contentType": content_type, "itemId": item_id,
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_batch_toggle_progress(user_id: str, updates: list) -> dict:
    """Batch-update progress for multiple items."""
    table = get_table(TABLE_USER_PROGRESS)
    now = now_iso()
    results = []

    try:
        for u in updates:
            ct, iid, field, value = u.get("contentType"), u.get("itemId"), u.get("field"), u.get("value")
            if not all([ct, iid, field]):
                continue
            item_key = _progress_key(ct, iid)

            update_expr = "SET #field = :val, updatedAt = :now, contentType = :ct, itemId = :iid"
            expr_names = {"#field": field}
            expr_values = {":val": bool(value), ":now": now, ":ct": ct, ":iid": iid}
            if field == "isSolved" and value:
                update_expr += ", solvedAt = :now"

            table.update_item(
                Key={"userId": user_id, "itemKey": item_key},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
            )
            results.append({"itemKey": item_key, "field": field, "value": bool(value)})

        return api_response(200, {"success": True, "updated": len(results), "results": results})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                           COLLECTIONS
# ======================================================================

def handle_list_collections(user_id: str) -> dict:
    table = get_table(TABLE_COLLECTIONS)
    try:
        result = table.query(KeyConditionExpression=Key("userId").eq(user_id))
        collections = sorted(result.get("Items", []), key=lambda x: x.get("createdAt", ""), reverse=True)
        return api_response(200, {"success": True, "collections": collections, "count": len(collections)})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_create_collection(user_id: str, data: dict) -> dict:
    table = get_table(TABLE_COLLECTIONS)
    now = now_iso()
    cid = generate_id("col")

    collection = {
        "userId": user_id,
        "collectionId": cid,
        "name": str(data.get("name", "")).strip(),
        "description": str(data.get("description", "")).strip(),
        "color": str(data.get("color", "#f97316")).strip(),
        "itemCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    if not collection["name"]:
        return api_response(400, {"success": False, "message": "Collection name is required"})

    try:
        table.put_item(Item=collection)
        _log_activity(user_id, "create_collection", "collection", cid, {"name": collection["name"]})
        return api_response(201, {"success": True, "collection": collection})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_update_collection(user_id: str, collection_id: str, data: dict) -> dict:
    table = get_table(TABLE_COLLECTIONS)
    now = now_iso()

    parts = ["updatedAt = :now"]
    vals: dict = {":now": now}
    names: dict = {}

    if "name" in data:
        parts.append("#n = :name")
        vals[":name"] = str(data["name"]).strip()
        names["#n"] = "name"
    if "description" in data:
        parts.append("description = :desc")
        vals[":desc"] = str(data["description"]).strip()
    if "color" in data:
        parts.append("color = :color")
        vals[":color"] = str(data["color"]).strip()

    try:
        kwargs: dict = {
            "Key": {"userId": user_id, "collectionId": collection_id},
            "UpdateExpression": "SET " + ", ".join(parts),
            "ExpressionAttributeValues": vals,
        }
        if names:
            kwargs["ExpressionAttributeNames"] = names
        table.update_item(**kwargs)
        return api_response(200, {"success": True, "message": "Collection updated"})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_delete_collection(user_id: str, collection_id: str) -> dict:
    col_table = get_table(TABLE_COLLECTIONS)
    items_table = get_table(TABLE_COLLECTION_ITEMS)

    try:
        items_result = items_table.query(KeyConditionExpression=Key("collectionId").eq(collection_id))
        with items_table.batch_writer() as batch:
            for item in items_result.get("Items", []):
                batch.delete_item(Key={"collectionId": collection_id, "itemKey": item["itemKey"]})

        col_table.delete_item(Key={"userId": user_id, "collectionId": collection_id})
        return api_response(200, {"success": True, "message": "Collection deleted"})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_add_to_collection(user_id: str, collection_id: str, content_type: str, item_id: str) -> dict:
    items_table = get_table(TABLE_COLLECTION_ITEMS)
    col_table = get_table(TABLE_COLLECTIONS)
    item_key = _progress_key(content_type, item_id)
    now = now_iso()

    try:
        items_table.put_item(Item={
            "collectionId": collection_id, "itemKey": item_key,
            "contentType": content_type, "itemId": item_id, "addedAt": now,
        })
        col_table.update_item(
            Key={"userId": user_id, "collectionId": collection_id},
            UpdateExpression="SET itemCount = if_not_exists(itemCount, :zero) + :inc, updatedAt = :now",
            ExpressionAttributeValues={":inc": 1, ":zero": 0, ":now": now},
        )
        return api_response(200, {"success": True, "message": "Item added to collection"})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_remove_from_collection(user_id: str, collection_id: str, content_type: str, item_id: str) -> dict:
    items_table = get_table(TABLE_COLLECTION_ITEMS)
    col_table = get_table(TABLE_COLLECTIONS)
    item_key = _progress_key(content_type, item_id)
    now = now_iso()

    try:
        items_table.delete_item(Key={"collectionId": collection_id, "itemKey": item_key})
        col_table.update_item(
            Key={"userId": user_id, "collectionId": collection_id},
            UpdateExpression="SET itemCount = if_not_exists(itemCount, :one) - :dec, updatedAt = :now",
            ExpressionAttributeValues={":dec": 1, ":one": 1, ":now": now},
        )
        return api_response(200, {"success": True, "message": "Item removed from collection"})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_collection_items(collection_id: str) -> dict:
    items_table = get_table(TABLE_COLLECTION_ITEMS)
    try:
        result = items_table.query(KeyConditionExpression=Key("collectionId").eq(collection_id))
        items = sorted(result.get("Items", []), key=lambda x: x.get("addedAt", ""), reverse=True)
        return api_response(200, {"success": True, "items": items, "count": len(items)})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                      ACTIVITY & STATS
# ======================================================================

def _log_activity(user_id: str, action: str, content_type: str, item_id: str, metadata: dict = None):
    try:
        get_table(TABLE_USER_ACTIVITY).put_item(Item={
            "userId": user_id, "timestamp": now_iso(),
            "action": action, "contentType": content_type,
            "itemId": item_id, "metadata": metadata or {},
        })
    except Exception:
        pass


def _update_stat_counter(user_id: str, content_type: str, delta: int):
    counter_map = {
        "interview_questions": "solvedQuestions",
        "dsa_problems": "solvedDSA",
        "quizzes": "completedQuizzes",
    }
    counter = counter_map.get(content_type)
    if not counter:
        return
    try:
        get_table(TABLE_USER_STATS).update_item(
            Key={"userId": user_id},
            UpdateExpression="SET #c = if_not_exists(#c, :zero) + :d, updatedAt = :now",
            ExpressionAttributeNames={"#c": counter},
            ExpressionAttributeValues={":d": delta, ":zero": 0, ":now": now_iso()},
        )
    except Exception:
        pass


def handle_log_activity(user_id: str, data: dict) -> dict:
    action = data.get("activityAction", "") or data.get("type", "")
    if not action:
        return api_response(400, {"success": False, "message": "activityAction is required"})

    _log_activity(user_id, action, data.get("contentType", ""), data.get("itemId", ""), {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
    })
    return api_response(200, {"success": True, "message": "Activity logged"})


def handle_get_activity(user_id: str, limit: int = 20) -> dict:
    table = get_table(TABLE_USER_ACTIVITY)
    try:
        result = table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ScanIndexForward=False, Limit=limit,
        )
        items = result.get("Items", [])
        return api_response(200, {"success": True, "activities": items, "count": len(items)})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_stats(user_id: str) -> dict:
    try:
        result = get_table(TABLE_USER_STATS).get_item(Key={"userId": user_id})
        stats = result.get("Item", {})
        defaults = {
            "userId": user_id, "solvedQuestions": 0, "solvedDSA": 0,
            "completedQuizzes": 0, "streak": 0, "longestStreak": 0,
            "lastActiveDate": None, "totalStudyMinutes": 0, "quizAverageScore": 0,
        }
        defaults.update(stats)
        return api_response(200, {"success": True, "stats": defaults})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_dashboard(user_id: str) -> dict:
    """Full dashboard payload: stats + recent activity + content counts."""
    try:
        stats_body = handle_get_stats(user_id).get("body") or "{}"
        try:
            stats = json.loads(stats_body).get("stats", {})
        except (json.JSONDecodeError, TypeError):
            stats = {"userId": user_id, "solvedQuestions": 0, "solvedDSA": 0, "completedQuizzes": 0, "streak": 0, "longestStreak": 0}

        act_body = handle_get_activity(user_id, 10).get("body") or "[]"
        try:
            activities = json.loads(act_body).get("activities", [])
        except (json.JSONDecodeError, TypeError):
            activities = []

        content_counts = {}
        for ct, tn in CONTENT_TYPE_TABLE_MAP.items():
            try:
                content_counts[ct] = get_table(tn).scan(Select="COUNT").get("Count", 0)
            except Exception:
                content_counts[ct] = 0

        return api_response(200, {
            "success": True, "stats": stats,
            "recentActivity": activities, "contentCounts": content_counts,
        })
    except Exception as e:
        import traceback
        print(f"[prep_user_handler] get_dashboard error: {e}")
        traceback.print_exc()
        return api_response(500, {"success": False, "message": "Internal error", "error": str(e)})


# ======================================================================
#                          STREAK
# ======================================================================

def handle_update_streak(user_id: str) -> dict:
    table = get_table(TABLE_USER_STATS)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    try:
        stats = table.get_item(Key={"userId": user_id}).get("Item", {})
        last_active = stats.get("lastActiveDate", "")
        cur = int(stats.get("streak", 0))
        longest = int(stats.get("longestStreak", 0))

        if last_active == today:
            return api_response(200, {"success": True, "message": "Already updated today", "streak": cur})

        new_streak = (cur + 1) if last_active == yesterday else 1
        new_longest = max(longest, new_streak)

        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET streak = :s, longestStreak = :l, lastActiveDate = :d, updatedAt = :now",
            ExpressionAttributeValues={":s": new_streak, ":l": new_longest, ":d": today, ":now": now_iso()},
        )
        return api_response(200, {"success": True, "streak": new_streak, "longestStreak": new_longest})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                         QUIZ
# ======================================================================

def handle_submit_quiz(user_id: str, data: dict) -> dict:
    quiz_id = data.get("quizId")
    answers = data.get("answers", [])
    time_taken = data.get("timeTaken", 0)

    if not quiz_id:
        return api_response(400, {"success": False, "message": "quizId is required"})

    quiz_table = get_table(TABLE_QUIZZES)
    results_table = get_table(TABLE_QUIZ_RESULTS)
    now = now_iso()

    try:
        quiz = quiz_table.get_item(Key={"id": quiz_id}).get("Item")
        if not quiz:
            return api_response(404, {"success": False, "message": "Quiz not found"})

        questions = quiz.get("questions", [])
        total = len(questions)
        correct = 0
        detailed = []

        for i, q in enumerate(questions):
            user_ans = answers[i] if i < len(answers) else None
            correct_ans = q.get("correctAnswer")
            ok = user_ans == correct_ans
            if ok:
                correct += 1
            detailed.append({"questionIndex": i, "userAnswer": user_ans, "correctAnswer": correct_ans, "isCorrect": ok})

        score = round((correct / total) * 100, 1) if total > 0 else 0
        passing = int(quiz.get("passingScore", 70))
        passed = score >= passing

        rid = generate_id("qr")
        results_table.put_item(Item={
            "userId": user_id, "resultId": rid, "quizId": quiz_id,
            "quizTitle": quiz.get("title", ""), "score": to_decimal(score),
            "correctCount": correct, "totalQuestions": total, "passed": passed,
            "timeTaken": time_taken, "detailedResults": detailed, "submittedAt": now,
        })

        if passed:
            _update_stat_counter(user_id, "quizzes", 1)

        _log_activity(user_id, "submit_quiz", "quizzes", quiz_id, {
            "score": score, "passed": passed, "title": quiz.get("title", ""),
        })

        return api_response(200, {
            "success": True, "resultId": rid, "score": score,
            "correctCount": correct, "totalQuestions": total,
            "passed": passed, "passingScore": passing,
        })
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_quiz_history(user_id: str, quiz_id: Optional[str] = None) -> dict:
    table = get_table(TABLE_QUIZ_RESULTS)
    try:
        items = table.query(KeyConditionExpression=Key("userId").eq(user_id)).get("Items", [])
        if quiz_id:
            items = [i for i in items if i.get("quizId") == quiz_id]
        items.sort(key=lambda x: x.get("submittedAt", ""), reverse=True)
        return api_response(200, {"success": True, "history": items, "count": len(items)})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                    NOTES DOWNLOAD
# ======================================================================

def handle_get_note_download_url(note_id: str) -> dict:
    table = get_table(TABLE_HANDWRITTEN_NOTES)
    try:
        note = table.get_item(Key={"id": note_id}).get("Item")
        if not note:
            return api_response(404, {"success": False, "message": "Note not found"})
        s3_key = note.get("s3Key")
        if not s3_key:
            return api_response(404, {"success": False, "message": "No file for this note"})

        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": S3_BUCKET, "Key": s3_key}, ExpiresIn=3600,
        )
        return api_response(200, {"success": True, "downloadUrl": url, "expiresIn": 3600})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Error generating URL", "error": str(e)})


# ======================================================================
#                    ROADMAP STEP PROGRESS
# ======================================================================

def handle_update_roadmap_step(user_id: str, data: dict) -> dict:
    roadmap_id = data.get("roadmapId")
    step_index = data.get("stepIndex")
    if roadmap_id is None or step_index is None:
        return api_response(400, {"success": False, "message": "roadmapId and stepIndex are required"})

    table = get_table(TABLE_USER_PROGRESS)
    item_key = f"roadmap_step#{roadmap_id}#{step_index}"
    now = now_iso()

    try:
        existing = table.get_item(Key={"userId": user_id, "itemKey": item_key}).get("Item")
        new_val = not (existing.get("completed", False) if existing else False)

        table.update_item(
            Key={"userId": user_id, "itemKey": item_key},
            UpdateExpression="SET completed = :v, updatedAt = :now, contentType = :ct, itemId = :rid, stepIndex = :si",
            ExpressionAttributeValues={
                ":v": new_val, ":now": now, ":ct": "roadmaps", ":rid": roadmap_id, ":si": step_index,
            },
        )
        return api_response(200, {"success": True, "roadmapId": roadmap_id, "stepIndex": step_index, "completed": new_val})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


def handle_get_roadmap_progress(user_id: str, roadmap_id: str) -> dict:
    table = get_table(TABLE_USER_PROGRESS)
    prefix = f"roadmap_step#{roadmap_id}#"

    try:
        items = table.query(
            KeyConditionExpression=Key("userId").eq(user_id) & Key("itemKey").begins_with(prefix),
        ).get("Items", [])

        steps = {}
        for item in items:
            idx = item.get("stepIndex")
            if idx is not None:
                steps[int(idx)] = item.get("completed", False)

        return api_response(200, {"success": True, "roadmapId": roadmap_id, "steps": steps})
    except ClientError as e:
        return api_response(500, {"success": False, "message": "Database error", "error": str(e)})


# ======================================================================
#                       MAIN LAMBDA HANDLER
# ======================================================================

def lambda_handler(event, context):
    """
    User Lambda for Preparation Mode.

    Every action requires userId (except read-only content listing).

    ──────────────────────────────────────────────────────────────
    ACTION                      METHOD     BODY / PARAMS
    ──────────────────────────────────────────────────────────────
    READ CONTENT (public):
      list_content              GET/POST   { contentType, page?, limit?, ...filters }
      get_content               GET/POST   { contentType, id }
      list_with_progress        POST       { userId, contentType, ...filters }

    PROGRESS:
      get_progress              POST       { userId, contentType? }
      toggle_solved             POST       { userId, contentType, itemId }
      toggle_bookmarked         POST       { userId, contentType, itemId }
      toggle_favorite           POST       { userId, contentType, itemId }
      toggle_applied            POST       { userId, contentType, itemId }
      batch_toggle              POST       { userId, updates: [{contentType, itemId, field, value}] }

    COLLECTIONS:
      list_collections          POST       { userId }
      create_collection         POST       { userId, name, description?, color? }
      update_collection         POST       { userId, collectionId, name?, description?, color? }
      delete_collection         POST       { userId, collectionId }
      add_to_collection         POST       { userId, collectionId, contentType, itemId }
      remove_from_collection    POST       { userId, collectionId, contentType, itemId }
      get_collection_items      POST       { collectionId }

    ACTIVITY & STATS:
      log_activity              POST       { userId, activityAction, contentType, itemId, title?, description? }
      get_activity              POST       { userId, limit? }
      get_stats                 POST       { userId }
      get_dashboard             POST       { userId }
      update_streak             POST       { userId }

    QUIZ:
      submit_quiz               POST       { userId, quizId, answers, timeTaken }
      get_quiz_history          POST       { userId, quizId? }

    NOTES:
      get_note_download_url     POST       { noteId }

    ROADMAPS:
      update_roadmap_step       POST       { userId, roadmapId, stepIndex }
      get_roadmap_progress      POST       { userId, roadmapId }
    ──────────────────────────────────────────────────────────────
    """
    http_method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method", "")
        or event.get("requestContext", {}).get("httpMethod", "")
    )

    # CORS preflight: must return CORS headers and 2xx so browser sends actual request
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                **CORS_HEADERS,
                "Content-Type": "application/json",
            },
            "body": "",
        }

    body = parse_body(event)
    qp = get_query_params(event)
    action = body.get("action") or qp.get("action", "")
    user_id = body.get("userId", "") or qp.get("userId", "")
    print(f"[prep_user_handler] {http_method} action={action!r} userId={user_id[:8] if user_id else '(empty)'}...")

    try:
        # ── READ CONTENT ──
        if action == "list_content":
            ct = body.get("contentType") or qp.get("contentType", "")
            filters = {**qp, **{k: v for k, v in body.items() if k not in ("action", "contentType", "userId")}}
            return handle_list_content(ct, filters)

        if action == "get_content":
            ct = body.get("contentType") or qp.get("contentType", "")
            return handle_get_content(ct, body.get("id") or qp.get("id", ""))

        if action == "list_with_progress":
            uid = body.get("userId", "")
            ct = body.get("contentType", "")
            filters = {k: v for k, v in body.items() if k not in ("action", "userId", "contentType")}
            filters.update(qp)
            return handle_list_content_with_progress(uid, ct, filters)

        # ── PROGRESS ──
        if action == "get_progress":
            return handle_get_user_progress(body.get("userId", ""), body.get("contentType"))

        if action in ("toggle_solved", "toggle_bookmarked", "toggle_favorite", "toggle_applied"):
            field_map = {
                "toggle_solved": "isSolved", "toggle_bookmarked": "isBookmarked",
                "toggle_favorite": "isFavorite", "toggle_applied": "isApplied",
            }
            return handle_toggle_progress(
                body.get("userId", ""), body.get("contentType", ""),
                body.get("itemId", ""), field_map[action],
            )

        if action == "batch_toggle":
            return handle_batch_toggle_progress(body.get("userId", ""), body.get("updates", []))

        # ── COLLECTIONS ──
        if action == "list_collections":
            return handle_list_collections(body.get("userId", ""))

        if action == "create_collection":
            return handle_create_collection(body.get("userId", ""), body)

        if action == "update_collection":
            return handle_update_collection(body.get("userId", ""), body.get("collectionId", ""), body)

        if action == "delete_collection":
            return handle_delete_collection(body.get("userId", ""), body.get("collectionId", ""))

        if action == "add_to_collection":
            return handle_add_to_collection(
                body.get("userId", ""), body.get("collectionId", ""),
                body.get("contentType", ""), body.get("itemId", ""),
            )

        if action == "remove_from_collection":
            return handle_remove_from_collection(
                body.get("userId", ""), body.get("collectionId", ""),
                body.get("contentType", ""), body.get("itemId", ""),
            )

        if action == "get_collection_items":
            return handle_get_collection_items(body.get("collectionId", ""))

        # ── ACTIVITY & STATS ──
        if action == "log_activity":
            return handle_log_activity(body.get("userId", ""), body)

        if action == "get_activity":
            return handle_get_activity(body.get("userId", ""), int(body.get("limit", 20)))

        if action == "get_stats":
            return handle_get_stats(body.get("userId", ""))

        if action == "get_dashboard":
            return handle_get_dashboard(body.get("userId", ""))

        if action == "update_streak":
            return handle_update_streak(body.get("userId", ""))

        # ── QUIZ ──
        if action == "submit_quiz":
            return handle_submit_quiz(body.get("userId", ""), body)

        if action == "get_quiz_history":
            return handle_get_quiz_history(body.get("userId", ""), body.get("quizId"))

        # ── NOTES ──
        if action == "get_note_download_url":
            return handle_get_note_download_url(body.get("noteId", ""))

        # ── ROADMAPS ──
        if action == "update_roadmap_step":
            return handle_update_roadmap_step(body.get("userId", ""), body)

        if action == "get_roadmap_progress":
            return handle_get_roadmap_progress(body.get("userId", ""), body.get("roadmapId", ""))

        # ── FALLBACK ──
        return api_response(400, {
            "success": False,
            "message": f"Unknown action: '{action}'",
            "availableActions": [
                "list_content", "get_content", "list_with_progress",
                "get_progress", "toggle_solved", "toggle_bookmarked",
                "toggle_favorite", "toggle_applied", "batch_toggle",
                "list_collections", "create_collection", "update_collection",
                "delete_collection", "add_to_collection", "remove_from_collection",
                "get_collection_items", "log_activity", "get_activity",
                "get_stats", "get_dashboard", "update_streak",
                "submit_quiz", "get_quiz_history",
                "get_note_download_url",
                "update_roadmap_step", "get_roadmap_progress",
            ],
        })

    except Exception as e:
        import traceback
        print(f"[prep_user_handler] Unhandled error: {e}")
        traceback.print_exc()
        return api_response(500, {"success": False, "message": "Internal Server Error", "error": str(e)})
