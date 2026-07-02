"""
Subscription Lambda — UserSubscriptions table + Users sync + Razorpay.

POST JSON body: { "action": "...", "userId": "...", ... }

Actions:
  - get_active_subscription       — latest active sub for user
  - create_subscription_order     — Razorpay order for plan checkout
  - verify_subscription_payment   — verify Razorpay payment + activate plan
  - create_subscription           — dev-only stub when Razorpay keys unset
  - get_feature_entitlements      — per-feature trial/plan access for user
  - get_subscription_receipt      — presigned URL for active plan invoice PDF

Environment:
  ALLOWED_ORIGIN, USERS_TABLE, SUBSCRIPTIONS_TABLE, REGION
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (same as course purchase Lambda)
  INVOICE_S3_BUCKET, SMTP_USER, SMTP_APP_PASSWORD (invoice PDF + receipt email)
"""
import base64
import hashlib
import hmac
import json
import os
import traceback
import uuid
import urllib.error
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from feature_entitlement import (
    FREE_USE_LIMIT as ENTITLEMENT_FREE_USE_LIMIT,
    consume_feature_use,
    get_all_entitlements,
    resolve_entitlement,
)

try:
    from email_service import is_smtp_configured, send_subscription_receipt_email
except ImportError:
    def is_smtp_configured() -> bool:
        return False

    def send_subscription_receipt_email(*_args, **_kwargs) -> bool:
        return False

try:
    from subscription_invoice import (
        build_subscription_invoice_pdf,
        generate_invoice_number,
        get_invoice_presigned_url,
        invoice_download_filename,
        is_invoice_pdf_available,
        upload_invoice_pdf,
    )
except ImportError:
    def is_invoice_pdf_available() -> bool:
        return False

    def generate_invoice_number() -> str:
        return f"CXC-INV-{uuid.uuid4().hex[:8].upper()}"

    def build_subscription_invoice_pdf(**_kwargs) -> bytes:
        raise RuntimeError("subscription_invoice module not available")

    def upload_invoice_pdf(*_args, **_kwargs):
        return None, "subscription_invoice module not available"

    def get_invoice_presigned_url(*_args, **_kwargs):
        return None

REGION = os.environ.get("REGION", "ap-south-2")
USERS_TABLE = os.environ.get("USERS_TABLE", "Users")
SUBSCRIPTIONS_TABLE = os.environ.get("SUBSCRIPTIONS_TABLE", "UserSubscriptions")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
dynamodb = boto3.resource("dynamodb", region_name=REGION)
users_table = dynamodb.Table(USERS_TABLE)
subscriptions_table = dynamodb.Table(SUBSCRIPTIONS_TABLE)

# Keep in sync with frontend data/pricingPlans.ts
PLAN_CONFIG: Dict[str, Dict[str, Any]] = {
    "monthly": {
        "planName": "Monthly",
        "priceInr": 299,
        "enabledFeatures": [
            "job-hunt",
            "hackathons",
            "company-posts",
            "preparation",
            "ats-scorer",
            "coding",
            "resume-builder",
        ],
        "durationMonths": 1,
    },
    "yearly": {
        "planName": "Yearly",
        "priceInr": 699,
        "enabledFeatures": [
            "job-hunt",
            "preparation",
            "live-ai",
            "hackathons",
            "ats-scorer",
            "coding",
            "resume-builder",
            "company-posts",
        ],
        "durationMonths": 12,
    },
    "lifetime": {
        "planName": "Lifetime",
        "priceInr": 999,
        "enabledFeatures": [
            "job-hunt",
            "preparation",
            "live-ai",
            "hackathons",
            "ats-scorer",
            "coding",
            "portfolio",
            "resume-builder",
            "company-posts",
        ],
        "durationMonths": None,
    },
}

# Keep in sync with frontend lib/subscriptionFeatures.ts
FREE_USE_LIMIT = 2
PLAN_RANK: Dict[str, int] = {"monthly": 1, "yearly": 2, "lifetime": 3}


def decimal_to_native(obj: Any) -> Any:
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj


def response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Credentials": "true",
        },
        "body": json.dumps(decimal_to_native(body)),
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def add_months_iso(start_iso: str, months: int) -> str:
    """Approximate month addition for subscription end dates."""
    from datetime import datetime as dt

    start = dt.fromisoformat(start_iso.replace("Z", "+00:00"))
    year = start.year
    month = start.month + months
    while month > 12:
        month -= 12
        year += 1
    day = min(start.day, 28)
    end = start.replace(year=year, month=month, day=day)
    return end.strftime("%Y-%m-%dT%H:%M:%SZ")


def subscription_to_payload(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "subscriptionId": item.get("subscriptionId"),
        "userId": item.get("userId"),
        "planId": item.get("planId"),
        "planName": item.get("planName"),
        "priceInr": item.get("priceInr"),
        "status": item.get("status"),
        "startDate": item.get("startDate"),
        "endDate": item.get("endDate"),
        "enabledFeatures": item.get("enabledFeatures") or [],
        "paymentStatus": item.get("paymentStatus"),
        "paymentId": item.get("paymentId"),
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
        "invoiceNumber": item.get("invoiceNumber"),
        "invoiceS3Key": item.get("invoiceS3Key"),
        "invoiceGeneratedAt": item.get("invoiceGeneratedAt"),
    }


def get_plan_rank(plan_id: Optional[str]) -> int:
    if not plan_id:
        return 0
    return PLAN_RANK.get(str(plan_id).lower(), 0)


def is_valid_upgrade(existing: Dict[str, Any], target_plan_id: str) -> bool:
    current = existing.get("planId")
    return get_plan_rank(target_plan_id) > get_plan_rank(current)


def deactivate_subscription(
    item: Dict[str, Any],
    *,
    reason: str = "upgraded",
    replaced_by: Optional[str] = None,
) -> None:
    ts = now_iso()
    expr_values: Dict[str, Any] = {
        ":s": reason,
        ":u": ts,
        ":inactive": "inactive" if reason != "upgraded" else "upgraded",
    }
    update_expr = "SET #st = :inactive, deactivatedAt = :u, deactivationReason = :s, updatedAt = :u"
    expr_names = {"#st": "status"}
    if replaced_by:
        update_expr += ", replacedBySubscriptionId = :rb"
        expr_values[":rb"] = replaced_by
    subscriptions_table.update_item(
        Key={"userId": item["userId"], "subscriptionId": item["subscriptionId"]},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )


def get_user_contact(user_id: str) -> Dict[str, str]:
    try:
        resp = users_table.get_item(Key={"userId": user_id})
    except ClientError:
        return {"name": "Customer", "email": ""}
    item = resp.get("Item") or {}
    first = (item.get("firstName") or item.get("name") or "").strip()
    last = (item.get("lastName") or "").strip()
    name = (f"{first} {last}".strip() or item.get("fullName") or "Customer").strip()
    email = (item.get("email") or "").strip()
    return {"name": name, "email": email}


def issue_invoice_and_email(
    item: Dict[str, Any],
    *,
    upgrade_from_plan: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate invoice PDF, store on S3, email user. Mutates item dict with invoice fields."""
    has_invoice = bool(item.get("invoiceS3Key"))
    email_sent = bool(item.get("invoiceEmailSentAt"))
    if has_invoice and email_sent:
        return item

    user_id = item["userId"]
    subscription_id = item["subscriptionId"]
    contact = get_user_contact(user_id)
    invoice_number = item.get("invoiceNumber") or generate_invoice_number()
    payment_date = item.get("startDate") or now_iso()
    price_inr = int(item.get("priceInr") or PLAN_CONFIG.get(item.get("planId", ""), {}).get("priceInr", 0))
    plan_name = item.get("planName") or item.get("planId", "Plan")
    payment_id = item.get("paymentId")

    pdf_bytes: Optional[bytes] = None
    s3_key: Optional[str] = item.get("invoiceS3Key")
    if not s3_key and is_invoice_pdf_available():
        try:
            pdf_bytes = build_subscription_invoice_pdf(
                invoice_number=invoice_number,
                user_name=contact["name"],
                user_email=contact["email"],
                plan_name=plan_name,
                plan_id=str(item.get("planId") or ""),
                price_inr=price_inr,
                payment_id=str(payment_id) if payment_id else None,
                payment_date_iso=payment_date,
                upgrade_from_plan=upgrade_from_plan,
            )
            s3_key, upload_err = upload_invoice_pdf(user_id, subscription_id, pdf_bytes)
            if upload_err:
                print(f"invoice upload: {upload_err}")
        except Exception as exc:
            print(f"invoice pdf build failed: {exc}")

    ts = now_iso()
    item["invoiceNumber"] = invoice_number
    item["invoiceGeneratedAt"] = ts
    if s3_key:
        item["invoiceS3Key"] = s3_key

    subscriptions_table.update_item(
        Key={"userId": user_id, "subscriptionId": subscription_id},
        UpdateExpression=(
            "SET invoiceNumber = :inv, invoiceGeneratedAt = :ts, updatedAt = :ts"
            + (", invoiceS3Key = :key" if s3_key else "")
        ),
        ExpressionAttributeValues={
            ":inv": invoice_number,
            ":ts": ts,
            **({":key": s3_key} if s3_key else {}),
        },
    )

    email = contact.get("email")
    if email and is_smtp_configured() and not email_sent:
        sent = send_subscription_receipt_email(
            email,
            plan_name=plan_name,
            price_inr=price_inr,
            invoice_number=invoice_number,
            payment_id=str(payment_id) if payment_id else None,
            pdf_bytes=pdf_bytes,
            is_upgrade=bool(upgrade_from_plan),
            upgrade_from_plan=upgrade_from_plan,
        )
        subscriptions_table.update_item(
            Key={"userId": user_id, "subscriptionId": subscription_id},
            UpdateExpression="SET invoiceEmailSentAt = :ts, invoiceEmailStatus = :st, updatedAt = :ts",
            ExpressionAttributeValues={
                ":ts": ts,
                ":st": "sent" if sent else "failed",
            },
        )
        item["invoiceEmailSentAt"] = ts
        item["invoiceEmailStatus"] = "sent" if sent else "failed"

    return item


def regenerate_invoice_pdf(item: Dict[str, Any]) -> Dict[str, Any]:
    """Rebuild invoice PDF and overwrite the S3 object (used when user views/downloads receipt)."""
    if not is_invoice_pdf_available():
        if not item.get("invoiceS3Key"):
            return issue_invoice_and_email(item)
        return item

    user_id = item["userId"]
    subscription_id = item["subscriptionId"]
    contact = get_user_contact(user_id)
    invoice_number = item.get("invoiceNumber") or generate_invoice_number()
    payment_date = item.get("startDate") or now_iso()
    price_inr = int(item.get("priceInr") or PLAN_CONFIG.get(item.get("planId", ""), {}).get("priceInr", 0))
    plan_name = item.get("planName") or item.get("planId", "Plan")
    payment_id = item.get("paymentId")

    try:
        pdf_bytes = build_subscription_invoice_pdf(
            invoice_number=invoice_number,
            user_name=contact["name"],
            user_email=contact["email"],
            plan_name=plan_name,
            plan_id=str(item.get("planId") or ""),
            price_inr=price_inr,
            payment_id=str(payment_id) if payment_id else None,
            payment_date_iso=payment_date,
            upgrade_from_plan=None,
        )
        s3_key, upload_err = upload_invoice_pdf(user_id, subscription_id, pdf_bytes)
        if upload_err:
            print(f"invoice regenerate upload: {upload_err}")
            return item
    except Exception as exc:
        print(f"invoice regenerate pdf build failed: {exc}")
        return item

    ts = now_iso()
    item["invoiceNumber"] = invoice_number
    item["invoiceGeneratedAt"] = ts
    item["invoiceS3Key"] = s3_key
    subscriptions_table.update_item(
        Key={"userId": user_id, "subscriptionId": subscription_id},
        UpdateExpression=(
            "SET invoiceNumber = :inv, invoiceGeneratedAt = :ts, invoiceS3Key = :key, updatedAt = :ts"
        ),
        ExpressionAttributeValues={
            ":inv": invoice_number,
            ":ts": ts,
            ":key": s3_key,
        },
    )
    return item


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
        result = subscriptions_table.query(
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


def handle_get_active_subscription(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })

    item = get_active_subscription_item(user_id)
    if not item:
        return response(200, {"success": True, "data": None, "message": "No active subscription"})

    return response(200, {
        "success": True,
        "data": subscription_to_payload(item),
    })


def sync_users_subscription(user_id: str, sub_payload: Dict[str, Any]) -> None:
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression=(
            "SET isPremium = :p, subscription = :s, updatedAt = :u"
        ),
        ExpressionAttributeValues={
            ":p": True,
            ":s": {
                "plan": sub_payload.get("planId"),
                "subscriptionId": sub_payload.get("subscriptionId"),
                "startedAt": sub_payload.get("startDate"),
                "expiresAt": sub_payload.get("endDate"),
                "enabledFeatures": sub_payload.get("enabledFeatures") or [],
            },
            ":u": now_iso(),
        },
    )


def razorpay_configured() -> bool:
    return bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)


def verify_razorpay_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if not RAZORPAY_KEY_SECRET:
        return False
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def create_razorpay_order(amount_paise: int, receipt: str, notes: Dict[str, str]) -> Dict[str, Any]:
    payload = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "notes": notes,
    }
    auth = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode("utf-8")).decode("utf-8")
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def find_item_by_razorpay_order_id(razorpay_order_id: str) -> Optional[Dict[str, Any]]:
    try:
        result = subscriptions_table.scan(
            FilterExpression="razorpayOrderId = :r",
            ExpressionAttributeValues={":r": razorpay_order_id},
        )
    except ClientError as e:
        print(f"scan UserSubscriptions by razorpayOrderId failed: {e}")
        raise
    items = result.get("Items") or []
    return items[0] if items else None


def build_subscription_item(
    user_id: str,
    plan_id: str,
    *,
    payment_id: Optional[str] = None,
    razorpay_order_id: Optional[str] = None,
    payment_status: str = "paid",
) -> Dict[str, Any]:
    cfg = PLAN_CONFIG[plan_id]
    start = now_iso()
    months = cfg.get("durationMonths")
    end_date: Optional[str] = None
    if months is not None:
        end_date = add_months_iso(start, int(months))

    subscription_id = str(uuid.uuid4())
    return {
        "userId": user_id,
        "subscriptionId": subscription_id,
        "planId": plan_id,
        "planName": cfg["planName"],
        "priceInr": Decimal(str(cfg["priceInr"])),
        "status": "active",
        "startDate": start,
        "endDate": end_date,
        "enabledFeatures": list(cfg["enabledFeatures"]),
        "paymentStatus": payment_status,
        "paymentId": payment_id,
        "razorpayOrderId": razorpay_order_id,
        "createdAt": start,
        "updatedAt": start,
    }


def activate_subscription_record(
    item: Dict[str, Any],
    *,
    upgrade_from_plan: Optional[str] = None,
) -> Dict[str, Any]:
    subscriptions_table.put_item(Item=item)
    try:
        item = issue_invoice_and_email(item, upgrade_from_plan=upgrade_from_plan)
    except Exception as exc:
        print(f"issue_invoice_and_email failed: {exc}")
    payload = subscription_to_payload(item)
    sync_users_subscription(item["userId"], payload)
    return payload


def validate_user_and_plan(user_id: str, plan_id: str) -> Optional[Dict[str, Any]]:
    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })
    if plan_id not in PLAN_CONFIG:
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_PLAN",
                "message": f"planId must be one of: {', '.join(PLAN_CONFIG.keys())}",
            },
        })
    try:
        user_resp = users_table.get_item(Key={"userId": user_id})
    except ClientError as e:
        print(f"get_item Users failed: {e}")
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not verify user"},
        })
    if "Item" not in user_resp:
        return response(404, {
            "success": False,
            "error": {"code": "USER_NOT_FOUND", "message": "User not found"},
        })
    return None


def handle_create_subscription_order(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    plan_id = (body.get("planId") or "").strip().lower()
    err = validate_user_and_plan(user_id, plan_id)
    if err:
        return err

    existing = get_active_subscription_item(user_id)
    if existing and not is_valid_upgrade(existing, plan_id):
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_UPGRADE",
                "message": "You are already on this plan or cannot downgrade. Visit /subscription to manage your plan.",
            },
        })

    cfg = PLAN_CONFIG[plan_id]
    amount_inr = int(cfg["priceInr"])
    amount_paise = amount_inr * 100
    internal_order_id = f"SUB_{uuid.uuid4().hex[:12].upper()}"
    timestamp = now_iso()

    if not razorpay_configured():
        return response(200, {
            "success": True,
            "orderId": internal_order_id,
            "razorpayOrderId": f"order_demo_{uuid.uuid4().hex[:12]}",
            "amount": amount_paise,
            "currency": "INR",
            "key": "rzp_test_demo",
            "name": "CodeXCareer",
            "description": f"{cfg['planName']} subscription",
            "planId": plan_id,
            "planName": cfg["planName"],
            "prefill": {
                "email": body.get("userEmail") or "",
                "contact": body.get("userPhone") or "",
            },
            "demoMode": True,
        })

    try:
        razorpay_order = create_razorpay_order(
            amount_paise,
            internal_order_id,
            {
                "userId": user_id,
                "planId": plan_id,
                "planName": cfg["planName"],
                "upgradeFromPlanId": existing.get("planId") if existing else "",
            },
        )
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"Razorpay API error: {e.code} - {error_body}")
        return response(500, {
            "success": False,
            "error": {"code": "PAYMENT_GATEWAY_ERROR", "message": "Could not create payment order"},
        })

    razorpay_order_id = razorpay_order.get("id")
    pending_item = {
        "userId": user_id,
        "subscriptionId": f"pending_{internal_order_id}",
        "planId": plan_id,
        "planName": cfg["planName"],
        "priceInr": Decimal(str(amount_inr)),
        "status": "pending_payment",
        "razorpayOrderId": razorpay_order_id,
        "internalOrderId": internal_order_id,
        "startDate": timestamp,
        "endDate": None,
        "enabledFeatures": list(cfg["enabledFeatures"]),
        "paymentStatus": "pending",
        "createdAt": timestamp,
        "updatedAt": timestamp,
    }
    subscriptions_table.put_item(Item=pending_item)

    return response(200, {
        "success": True,
        "orderId": internal_order_id,
        "razorpayOrderId": razorpay_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key": RAZORPAY_KEY_ID,
        "name": "CodeXCareer",
        "description": f"{cfg['planName']} subscription",
        "planId": plan_id,
        "planName": cfg["planName"],
        "prefill": {
            "email": body.get("userEmail") or "",
            "contact": body.get("userPhone") or "",
        },
    })


def handle_verify_subscription_payment(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    plan_id = (body.get("planId") or "").strip().lower()
    razorpay_payment_id = (body.get("razorpay_payment_id") or "").strip()
    razorpay_order_id = (body.get("razorpay_order_id") or "").strip()
    razorpay_signature = (body.get("razorpay_signature") or "").strip()

    if not all([user_id, plan_id, razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Missing payment verification fields"},
        })

    err = validate_user_and_plan(user_id, plan_id)
    if err:
        return err

    if razorpay_configured():
        if not verify_razorpay_payment_signature(
            razorpay_order_id, razorpay_payment_id, razorpay_signature
        ):
            return response(400, {
                "success": False,
                "error": {"code": "INVALID_SIGNATURE", "message": "Invalid payment signature"},
            })

    pending = find_item_by_razorpay_order_id(razorpay_order_id)
    if pending:
        if pending.get("userId") != user_id:
            return response(403, {
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Order does not belong to this user"},
            })
        if pending.get("planId") != plan_id:
            return response(400, {
                "success": False,
                "error": {"code": "PLAN_MISMATCH", "message": "Plan does not match payment order"},
            })
        if pending.get("status") == "active" and pending.get("paymentId") == razorpay_payment_id:
            payload = subscription_to_payload(pending)
            return response(200, {
                "success": True,
                "message": "Payment already processed",
                "data": payload,
            })

    existing = get_active_subscription_item(user_id)
    upgrade_from: Optional[str] = None
    if existing:
        if not is_valid_upgrade(existing, plan_id):
            payload = subscription_to_payload(existing)
            return response(200, {
                "success": True,
                "message": "You are already a premium user",
                "data": payload,
            })
        upgrade_from = str(existing.get("planName") or existing.get("planId") or "")

    try:
        item = build_subscription_item(
            user_id,
            plan_id,
            payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id,
            payment_status="paid",
        )
        if existing:
            deactivate_subscription(existing, reason="upgraded", replaced_by=item["subscriptionId"])
        payload = activate_subscription_record(item, upgrade_from_plan=upgrade_from)

        if pending and pending.get("subscriptionId", "").startswith("pending_"):
            subscriptions_table.update_item(
                Key={
                    "userId": pending["userId"],
                    "subscriptionId": pending["subscriptionId"],
                },
                UpdateExpression="SET #s = :s, paymentStatus = :ps, paymentId = :pid, updatedAt = :u",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":s": "completed",
                    ":ps": "paid",
                    ":pid": razorpay_payment_id,
                    ":u": now_iso(),
                },
            )
    except ClientError as e:
        print(f"verify subscription payment failed: {e}")
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not activate subscription"},
        })

    return response(200, {
        "success": True,
        "message": "Subscription activated successfully",
        "data": payload,
    })


def handle_create_subscription(body: Dict[str, Any]) -> Dict[str, Any]:
    """Dev-only stub when Razorpay is not configured on the Lambda."""
    if razorpay_configured():
        return response(400, {
            "success": False,
            "error": {
                "code": "PAYMENT_REQUIRED",
                "message": "Use create_subscription_order and verify_subscription_payment",
            },
        })

    user_id = (body.get("userId") or "").strip()
    plan_id = (body.get("planId") or "").strip().lower()

    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })
    if plan_id not in PLAN_CONFIG:
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_PLAN",
                "message": f"planId must be one of: {', '.join(PLAN_CONFIG.keys())}",
            },
        })

    # Verify user exists
    try:
        user_resp = users_table.get_item(Key={"userId": user_id})
    except ClientError as e:
        print(f"get_item Users failed: {e}")
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not verify user"},
        })

    if "Item" not in user_resp:
        return response(404, {
            "success": False,
            "error": {"code": "USER_NOT_FOUND", "message": "User not found"},
        })

    existing = get_active_subscription_item(user_id)
    if existing and not is_valid_upgrade(existing, plan_id):
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_UPGRADE",
                "message": "You are already on this plan or cannot downgrade.",
            },
        })

    upgrade_from: Optional[str] = None
    if existing:
        upgrade_from = str(existing.get("planName") or existing.get("planId") or "")

    cfg = PLAN_CONFIG[plan_id]
    start = now_iso()
    months = cfg.get("durationMonths")
    end_date: Optional[str] = None
    if months is not None:
        end_date = add_months_iso(start, int(months))

    subscription_id = str(uuid.uuid4())
    item = {
        "userId": user_id,
        "subscriptionId": subscription_id,
        "planId": plan_id,
        "planName": cfg["planName"],
        "priceInr": Decimal(str(cfg["priceInr"])),
        "status": "active",
        "startDate": start,
        "endDate": end_date,
        "enabledFeatures": list(cfg["enabledFeatures"]),
        "paymentStatus": "confirmed",
        "paymentId": body.get("paymentId"),
        "createdAt": start,
        "updatedAt": start,
    }

    try:
        if existing:
            deactivate_subscription(existing, reason="upgraded", replaced_by=subscription_id)
        subscriptions_table.put_item(Item=item)
        item = issue_invoice_and_email(item, upgrade_from_plan=upgrade_from)
        payload = subscription_to_payload(item)
        sync_users_subscription(user_id, payload)
    except ClientError as e:
        print(f"create subscription failed: {e}")
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not create subscription"},
        })

    return response(200, {
        "success": True,
        "message": "Subscription created successfully",
        "data": payload,
    })


def handle_get_feature_entitlements(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })

    feature_id = (body.get("featureId") or "").strip()
    try:
        if feature_id:
            ent = resolve_entitlement(user_id, feature_id)
            return response(200, {
                "success": True,
                "data": ent,
                "limit": ENTITLEMENT_FREE_USE_LIMIT,
            })
        entitlements = get_all_entitlements(user_id)
        return response(200, {
            "success": True,
            "data": entitlements,
            "limit": ENTITLEMENT_FREE_USE_LIMIT,
        })
    except ClientError as e:
        print(f"get_feature_entitlements failed: {e}")
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not load entitlements"},
        })


def handle_consume_feature_use(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    feature_id = (body.get("featureId") or "").strip()
    session_id = (body.get("sessionId") or "").strip() or None

    if not user_id or not feature_id:
        return response(400, {
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
        return response(500, {
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not consume feature use"},
        })

    if not ok:
        return response(403, {
            "success": False,
            "error": {
                "code": "TRIAL_EXHAUSTED",
                "message": err or "Free trial uses exhausted",
            },
            "data": ent,
        })

    return response(200, {
        "success": True,
        "message": "Feature use recorded",
        "data": ent,
    })


def handle_get_subscription_receipt(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    subscription_id = (body.get("subscriptionId") or "").strip()
    download = bool(body.get("download"))

    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "userId is required"},
        })

    active = get_active_subscription_item(user_id)
    if not active:
        return response(404, {
            "success": False,
            "error": {"code": "NO_ACTIVE_SUB", "message": "No active subscription"},
        })

    if subscription_id and active.get("subscriptionId") != subscription_id:
        return response(403, {
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "Receipt not available for this subscription"},
        })

    s3_key = active.get("invoiceS3Key")
    try:
        active = regenerate_invoice_pdf(dict(active))
        s3_key = active.get("invoiceS3Key") or s3_key
    except Exception as exc:
        print(f"get_subscription_receipt invoice regenerate failed: {exc}")

    if not s3_key:
        return response(404, {
            "success": False,
            "error": {
                "code": "NO_INVOICE",
                "message": (
                    "Invoice PDF is not available yet. "
                    "Ensure reportlab is bundled with the subscription Lambda and it has s3:PutObject "
                    "on project-bazaar-users-profile-images."
                ),
            },
        })

    contact = get_user_contact(user_id)
    receipt_filename = invoice_download_filename(contact["name"])
    url = get_invoice_presigned_url(
        s3_key,
        download=download,
        download_filename=receipt_filename,
    )
    if not url:
        return response(500, {
            "success": False,
            "error": {"code": "INVOICE_URL_ERROR", "message": "Could not generate invoice link"},
        })

    return response(200, {
        "success": True,
        "data": {
            "invoiceUrl": url,
            "invoiceNumber": active.get("invoiceNumber"),
            "planName": active.get("planName"),
            "planId": active.get("planId"),
            "priceInr": active.get("priceInr"),
            "paymentId": active.get("paymentId"),
            "startDate": active.get("startDate"),
        },
    })


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS" or event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return response(200, {"success": True})

    try:
        raw = event.get("body") or "{}"
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except json.JSONDecodeError:
        return response(400, {
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Request body must be valid JSON"},
        })

    action = (body.get("action") or "").strip().lower()

    try:
        if action == "get_active_subscription":
            return handle_get_active_subscription(body)
        if action == "create_subscription_order":
            return handle_create_subscription_order(body)
        if action == "verify_subscription_payment":
            return handle_verify_subscription_payment(body)
        if action == "create_subscription":
            return handle_create_subscription(body)
        if action == "get_feature_entitlements":
            return handle_get_feature_entitlements(body)
        if action == "consume_feature_use":
            return handle_consume_feature_use(body)
        if action == "get_subscription_receipt":
            return handle_get_subscription_receipt(body)
        return response(400, {
            "success": False,
            "error": {
                "code": "UNKNOWN_ACTION",
                "message": (
                    "Supported actions: get_active_subscription, create_subscription_order, "
                    "verify_subscription_payment, create_subscription, "
                    "get_feature_entitlements, consume_feature_use, get_subscription_receipt"
                ),
            },
        })
    except Exception as e:
        print(f"Unhandled error: {e}")
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": str(e)},
        })
