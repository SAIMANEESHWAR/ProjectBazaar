"""DynamoDB portfolio history (reuses portfolio-history table)."""

import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

try:
    import boto3
    from boto3.dynamodb.conditions import Key

    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-south-2"))
    PORTFOLIO_TABLE = dynamodb.Table(os.environ.get("DYNAMODB_TABLE", "portfolio-history"))
    DYNAMODB_ENABLED = True
except ImportError:
    DYNAMODB_ENABLED = False
    PORTFOLIO_TABLE = None


def _convert_decimals(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_decimals(i) for i in obj]
    return obj


def save_portfolio_to_history(
    portfolio_id: str,
    user_id: str,
    user_email: str,
    portfolio_data: Dict[str, Any],
    template_id: str,
    live_url: str,
    file_name: str,
) -> Optional[Dict[str, Any]]:
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        print("DynamoDB not enabled, skipping history save")
        return None

    try:
        personal = portfolio_data.get("personal", {}) or {}
        name = personal.get("name", "Untitled Portfolio")
        title = personal.get("title", "")
        timestamp = datetime.utcnow().isoformat() + "Z"
        skills = portfolio_data.get("skills", {}) or {}

        item = {
            "userId": user_id,
            "portfolioId": portfolio_id,
            "userEmail": user_email,
            "name": name,
            "title": title,
            "templateId": template_id,
            "liveUrl": live_url,
            "fileName": file_name,
            "createdAt": timestamp,
            "updatedAt": timestamp,
            "summary": {
                "skillCount": sum(len(v) for v in skills.values() if isinstance(v, list)),
                "experienceCount": len(portfolio_data.get("experience", []) or []),
                "projectCount": len(portfolio_data.get("projects", []) or []),
                "educationCount": len(portfolio_data.get("education", []) or []),
            },
        }
        PORTFOLIO_TABLE.put_item(Item=item)
        print(f"Saved portfolio {portfolio_id} for user {user_id}")
        return item
    except Exception as e:
        print(f"Error saving to DynamoDB: {e}")
        return None


def get_portfolio_history(user_id: str) -> List[Dict[str, Any]]:
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        return []

    try:
        response = PORTFOLIO_TABLE.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ScanIndexForward=False,
        )
        return [_convert_decimals(item) for item in response.get("Items", [])]
    except Exception as e:
        print(f"Error querying DynamoDB: {e}")
        return []


def delete_portfolio_from_history(user_id: str, portfolio_id: str) -> bool:
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        return False

    try:
        PORTFOLIO_TABLE.delete_item(Key={"userId": user_id, "portfolioId": portfolio_id})
        return True
    except Exception as e:
        print(f"Error deleting from DynamoDB: {e}")
        return False
