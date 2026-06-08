"""
Shared feature entitlement helpers for subscription trials.

Keep FREE_USE_LIMIT / feature sets in sync with lib/subscriptionFeatures.ts.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION", "ap-south-2")
USERS_TABLE = os.environ.get("USERS_TABLE", "Users")
SUBSCRIPTIONS_TABLE = os.environ.get("SUBSCRIPTIONS_TABLE", "UserSubscriptions")

FREE_USE_LIMIT = 2
# Extra trials for paid-plan subscribers on features not in their plan (sync with lib/subscriptionFeatures.ts)
PLAN_TRIAL_LIMITS: Dict[str, Dict[str, int]] = {
    "monthly": {"portfolio": 4, "live-ai": 4},
    "yearly": {"portfolio": 7},
}
ALWAYS_FREE_FEATURES: Set[str] = {
    "company-posts",
    "coding",
    "hackathons",
    "peer-interview",
}
TRIAL_GATED_FEATURES: Set[str] = {
    "preparation",
    "live-ai",
    "ats-scorer",
    "portfolio",
    "resume-builder",
}

_dynamodb = boto3.resource("dynamodb", region_name=REGION)
_users_table = _dynamodb.Table(USERS_TABLE)
_subscriptions_table = _dynamodb.Table(SUBSCRIPTIONS_TABLE)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _int_val(val: Any) -> int:
    if val is None:
        return 0
    if isinstance(val, Decimal):
        return int(val)
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def is_subscription_active(item: Dict[str, Any]) -> bool:
    if item.get("status") != "active":
        return False
    end = item.get("endDate")
    if end is None:
        return True
    try:
        end_dt = datetime.fromisoformat(str(end).replace("Z", "+00:00"))
        return end_dt > datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return False


def get_active_subscription_item(user_id: str) -> Optional[Dict[str, Any]]:
    try:
        result = _subscriptions_table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
        )
    except ClientError as e:
        print(f"Query UserSubscriptions failed: {e}")
        raise

    items = result.get("Items") or []
    active = [i for i in items if is_subscription_active(i)]
    if not active:
        return None
    active.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return active[0]


def get_user_plan_features(user_id: str) -> List[str]:
    item = get_active_subscription_item(user_id)
    if not item:
        return []
    return list(item.get("enabledFeatures") or [])


def get_trial_limit(
    user_id: str,
    feature_id: str,
    *,
    plan_item: Optional[Dict[str, Any]] = None,
    plan_features: Optional[List[str]] = None,
) -> int:
    """Resolve per-user trial cap (default 2; higher for plan-specific extended trials)."""
    if plan_item is None:
        plan_item = get_active_subscription_item(user_id)
    plan_id = str((plan_item or {}).get("planId") or "").strip().lower()
    overrides = PLAN_TRIAL_LIMITS.get(plan_id, {})
    if feature_id in overrides:
        if plan_features is None:
            plan_features = list((plan_item or {}).get("enabledFeatures") or [])
        if feature_id not in plan_features:
            return overrides[feature_id]
    return FREE_USE_LIMIT


def get_user_feature_usage(user_id: str) -> Dict[str, int]:
    try:
        resp = _users_table.get_item(Key={"userId": user_id})
    except ClientError as e:
        print(f"get_item Users for featureUsage failed: {e}")
        raise
    item = resp.get("Item") or {}
    raw = item.get("featureUsage") or {}
    return {k: _int_val(v) for k, v in raw.items()}


def resolve_entitlement(
    user_id: str,
    feature_id: str,
    *,
    plan_features: Optional[List[str]] = None,
    usage_map: Optional[Dict[str, int]] = None,
) -> Dict[str, Any]:
    feature_id = (feature_id or "").strip()
    if feature_id in ALWAYS_FREE_FEATURES:
        return {
            "featureId": feature_id,
            "used": 0,
            "limit": FREE_USE_LIMIT,
            "remaining": FREE_USE_LIMIT,
            "allowed": True,
            "source": "always_free",
        }
    if feature_id not in TRIAL_GATED_FEATURES:
        return {
            "featureId": feature_id,
            "used": 0,
            "limit": FREE_USE_LIMIT,
            "remaining": 0,
            "allowed": False,
            "source": "exhausted",
        }

    plan_item = get_active_subscription_item(user_id)
    if plan_features is None:
        plan_features = list((plan_item or {}).get("enabledFeatures") or [])
    if usage_map is None:
        usage_map = get_user_feature_usage(user_id)

    trial_limit = get_trial_limit(
        user_id, feature_id, plan_item=plan_item, plan_features=plan_features
    )

    if feature_id in plan_features:
        return {
            "featureId": feature_id,
            "used": 0,
            "limit": trial_limit,
            "remaining": trial_limit,
            "allowed": True,
            "source": "plan",
        }

    used = usage_map.get(feature_id, 0)
    remaining = max(0, trial_limit - used)
    if remaining > 0:
        return {
            "featureId": feature_id,
            "used": used,
            "limit": trial_limit,
            "remaining": remaining,
            "allowed": True,
            "source": "trial",
        }

    return {
        "featureId": feature_id,
        "used": used,
        "limit": trial_limit,
        "remaining": 0,
        "allowed": False,
        "source": "exhausted",
    }


def is_entitled(user_id: str, feature_id: str) -> bool:
    return resolve_entitlement(user_id, feature_id)["allowed"]


def get_all_entitlements(user_id: str) -> Dict[str, Dict[str, Any]]:
    plan_features = get_user_plan_features(user_id)
    usage_map = get_user_feature_usage(user_id)
    result: Dict[str, Dict[str, Any]] = {}
    for fid in sorted(TRIAL_GATED_FEATURES):
        result[fid] = resolve_entitlement(
            user_id, fid, plan_features=plan_features, usage_map=usage_map
        )
    return result


def _session_already_consumed(
    user_item: Dict[str, Any], feature_id: str, session_id: str
) -> bool:
    sessions = user_item.get("featureUsageSessions") or {}
    feature_sessions = sessions.get(feature_id) or {}
    return bool(feature_sessions.get(session_id))


def consume_feature_use(
    user_id: str,
    feature_id: str,
    session_id: Optional[str] = None,
) -> Tuple[bool, Dict[str, Any], Optional[str]]:
    """
    Increment trial usage for feature_id if user is on trial (not plan / always-free).
    Returns (ok, entitlement_dict, error_message).
    """
    feature_id = (feature_id or "").strip()
    if not user_id:
        return False, {}, "userId is required"
    if feature_id in ALWAYS_FREE_FEATURES:
        ent = resolve_entitlement(user_id, feature_id)
        return True, ent, None
    if feature_id not in TRIAL_GATED_FEATURES:
        return False, {}, f"Feature {feature_id} is not trial-gated"

    ent = resolve_entitlement(user_id, feature_id)
    if ent["source"] == "plan":
        return True, ent, None
    if not ent["allowed"]:
        return False, ent, "Free trial uses exhausted for this feature"

    try:
        user_resp = _users_table.get_item(Key={"userId": user_id})
    except ClientError as e:
        print(f"consume get_item failed: {e}")
        return False, {}, "Could not verify user"

    user_item = user_resp.get("Item")
    if not user_item:
        return False, {}, "User not found"

    if session_id and _session_already_consumed(user_item, feature_id, session_id):
        return True, ent, None

    ent = resolve_entitlement(user_id, feature_id)
    if ent["source"] == "plan":
        return True, ent, None

    used = ent["used"]
    trial_limit = _int_val(ent.get("limit")) or FREE_USE_LIMIT
    if used >= trial_limit:
        return False, ent, "Free trial uses exhausted for this feature"

    expr_names = {"#fid": feature_id, "#fu": "featureUsage"}
    expr_values: Dict[str, Any] = {
        ":zero": 0,
        ":one": 1,
        ":limit": trial_limit,
        ":now": _now_iso(),
    }
    update_expr = (
        "SET #fu.#fid = if_not_exists(#fu.#fid, :zero) + :one, updatedAt = :now"
    )

    if session_id:
        expr_names["#fus"] = "featureUsageSessions"
        expr_names["#sid"] = session_id
        expr_values[":true"] = True
        update_expr += ", #fus.#fid.#sid = :true"

    try:
        _users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression=update_expr,
            ConditionExpression=(
                "attribute_not_exists(#fu.#fid) OR #fu.#fid < :limit"
            ),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            refreshed = resolve_entitlement(user_id, feature_id)
            return False, refreshed, "Free trial uses exhausted for this feature"
        print(f"consume update_item failed: {e}")
        return False, {}, "Could not record feature use"

    updated = resolve_entitlement(user_id, feature_id)
    return True, updated, None


def check_entitlement_or_error(user_id: str, feature_id: str) -> Tuple[bool, Optional[str]]:
    """For server enforcement before expensive operations."""
    if not user_id:
        return False, "userId is required"
    ent = resolve_entitlement(user_id, feature_id)
    if ent["allowed"]:
        return True, None
    return False, "Free trial uses exhausted. Upgrade your plan to continue."


# ---------- API Gateway handler (deploy as feature_entitlement Lambda) ----------

import json
import traceback

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def _api_response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Credentials": "true",
        },
        "body": json.dumps(body),
    }


def handle_get_feature_entitlements(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        return _api_response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })

    feature_id = (body.get("featureId") or "").strip()
    try:
        if feature_id:
            ent = resolve_entitlement(user_id, feature_id)
            return _api_response(200, {
                "success": True,
                "data": ent,
                "limit": FREE_USE_LIMIT,
            })
        entitlements = get_all_entitlements(user_id)
        return _api_response(200, {
            "success": True,
            "data": entitlements,
            "limit": FREE_USE_LIMIT,
        })
    except ClientError as e:
        print(f"get_feature_entitlements failed: {e}")
        return _api_response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not load entitlements"},
        })


def handle_consume_feature_use(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    feature_id = (body.get("featureId") or "").strip()
    session_id = (body.get("sessionId") or "").strip() or None

    if not user_id or not feature_id:
        return _api_response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "userId and featureId are required",
            },
        })

    try:
        ok, ent, err = consume_feature_use(user_id, feature_id, session_id=session_id)
    except ClientError as e:
        print(f"consume_feature_use failed: {e}")
        return _api_response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not consume feature use"},
        })

    if not ok:
        return _api_response(403, {
            "success": False,
            "error": {
                "code": "TRIAL_EXHAUSTED",
                "message": err or "Free trial uses exhausted",
            },
            "data": ent,
        })

    return _api_response(200, {
        "success": True,
        "message": "Feature use recorded",
        "data": ent,
    })


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS" or event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return _api_response(200, {"success": True})

    try:
        raw = event.get("body") or "{}"
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except json.JSONDecodeError:
        return _api_response(400, {
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Request body must be valid JSON"},
        })

    action = (body.get("action") or "").strip().lower()

    try:
        if action == "get_feature_entitlements":
            return handle_get_feature_entitlements(body)
        if action == "consume_feature_use":
            return handle_consume_feature_use(body)
        return _api_response(400, {
            "success": False,
            "error": {
                "code": "UNKNOWN_ACTION",
                "message": "Supported actions: get_feature_entitlements, consume_feature_use",
            },
        })
    except Exception as e:
        print(f"Unhandled error: {e}")
        traceback.print_exc()
        return _api_response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": str(e)},
        })
