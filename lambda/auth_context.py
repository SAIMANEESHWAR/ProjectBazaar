"""Helpers for reading authenticated identity from API Gateway authorizer context."""

from typing import Any, Dict, Optional


def _claims_from_event(event: Dict[str, Any]) -> Dict[str, Any]:
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}

    # HTTP API v2 (JWT authorizer): authorizer.jwt.claims
    jwt_block = authorizer.get("jwt") or {}
    claims = jwt_block.get("claims")
    if isinstance(claims, dict):
        return claims

    # REST API (Cognito User Pool authorizer): authorizer.claims (strings)
    rest_claims = authorizer.get("claims")
    if isinstance(rest_claims, dict):
        return rest_claims

    return {}


def get_authenticated_user_id(event: Dict[str, Any]) -> Optional[str]:
    """Cognito `sub` (always the federated id when present)."""
    claims = _claims_from_event(event)
    sub = claims.get("sub")
    if isinstance(sub, str) and sub.strip():
        return sub.strip()
    user_id = claims.get("custom:userId") or claims.get("username")
    if isinstance(user_id, str) and user_id.strip():
        return user_id.strip()
    return None


def get_canonical_app_user_id(event: Dict[str, Any]) -> Optional[str]:
    """
    App/DynamoDB user id: prefer `custom:userId` (linked legacy account), else `sub`
    (OTP-only users keyed by Cognito sub in Users table).
    """
    claims = _claims_from_event(event)
    custom = claims.get("custom:userId")
    if isinstance(custom, str) and custom.strip():
        return custom.strip()
    sub = claims.get("sub")
    if isinstance(sub, str) and sub.strip():
        return sub.strip()
    return None


def get_authenticated_email(event: Dict[str, Any]) -> Optional[str]:
    claims = _claims_from_event(event)
    email = claims.get("email")
    if isinstance(email, str) and email.strip():
        return email.strip().lower()
    return None


def merge_body_with_cognito_identity(event: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    """Attach DynamoDB-safe user id + email when API Gateway provides JWT claims."""
    canonical = get_canonical_app_user_id(event)
    if canonical and not body.get("userId"):
        body["userId"] = canonical
    email = get_authenticated_email(event)
    if email:
        body["userEmail"] = body.get("userEmail") or email
    return body


def enforce_body_field(body: Dict[str, Any], field: str, uid: Optional[str]) -> Optional[str]:
    """If uid is present, force field to match uid. Returns error message or None."""
    if not uid:
        return None
    current = body.get(field)
    if current is not None and str(current) and str(current) != uid:
        return f"{field} does not match authenticated user"
    body[field] = uid
    return None
