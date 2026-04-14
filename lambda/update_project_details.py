import json
import boto3
import traceback
from decimal import Decimal, InvalidOperation
from datetime import datetime
from botocore.exceptions import ClientError

# ================== CONFIG ==================
PROJECTS_TABLE = "Projects"

ALLOWED_CATEGORIES = {
    "Web Development",
    "Mobile App",
    "Data Science",
    "UI/UX Design",
    "Game Development",
    "DevOps"
}

OWNER_EDITABLE_FIELDS = {
    "title", "description", "category", "tags", "features",
    "price", "originalPrice",
    "youtubeVideoUrl", "documentationUrl"
}

PUBLIC_COUNTER_FIELDS = {
    "likesCount", "viewsCount", "purchasesCount", "totalRatings",
    "wishlistCount", "cartCount"  # Added wishlist and cart counters
}

IMMUTABLE_FIELDS = {
    "projectId", "sellerId", "sellerEmail",
    "adminApprovalStatus", "status",
    "totalRevenue", "totalEarnings",
    "uploadedAt"
}

# ================== AWS ==================
dynamodb = boto3.resource("dynamodb")
projects_table = dynamodb.Table(PROJECTS_TABLE)

# ================== HELPERS ==================
def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Max-Age": "3600"
        },
        "body": json.dumps(body) if body else ""
    }


def now_iso():
    return datetime.utcnow().isoformat()


def safe_decimal(val, field):
    try:
        return Decimal(str(val))
    except (InvalidOperation, TypeError):
        raise ValueError(f"Invalid decimal for {field}")


# ================== DELETE HANDLER ==================
def handle_delete_project(project_id, seller_id):
    """Delete a seller project"""
    if not project_id or not seller_id:
        return response(400, {
            "success": False,
            "message": "projectId and sellerId are required for deletion"
        })
    
    # Fetch project to verify ownership
    proj_resp = projects_table.get_item(Key={"projectId": project_id})
    
    if "Item" not in proj_resp:
        return response(404, {
            "success": False,
            "message": "Project not found"
        })
    
    project = proj_resp["Item"]
    
    # Verify ownership
    if project["sellerId"] != seller_id:
        return response(403, {
            "success": False,
            "message": "Not authorized to delete this project"
        })
    
    # Delete the project
    projects_table.delete_item(Key={"projectId": project_id})
    
    return response(200, {
        "success": True,
        "message": "Project deleted successfully"
    })


# ================== HANDLER ==================
def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
        if http_method == 'OPTIONS':
            return {
                "statusCode": 204,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
                    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
                    "Access-Control-Max-Age": "3600"
                },
                "body": ""
            }
        
        # Parse request body
        try:
            body_str = event.get("body", "{}")
            if isinstance(body_str, str):
                body = json.loads(body_str)
            else:
                body = body_str if body_str else {}
        except json.JSONDecodeError:
            return response(400, {
                "success": False,
                "message": "Invalid JSON in request body"
            })

        # Check for delete action
        action = body.get("action")
        if action == "DELETE_PROJECT":
            return handle_delete_project(body.get("projectId"), body.get("sellerId"))

        project_id = body.get("projectId")
        seller_id = body.get("sellerId")  # required only for owner updates
        updates = body.get("updates", {})
        increments = body.get("increments", {})

        if not project_id:
            return response(400, {
                "success": False,
                "message": "projectId is required"
            })

        # ---------- FETCH PROJECT ----------
        proj_resp = projects_table.get_item(
            Key={"projectId": project_id}
        )

        if "Item" not in proj_resp:
            return response(404, {
                "success": False,
                "message": "Project not found"
            })

        project = proj_resp["Item"]

        update_expr = []
        expr_attr_names = {}
        expr_attr_values = {}

        # ======================================================
        # OWNER-ONLY FIELD UPDATES
        # ======================================================
        if updates:
            if not seller_id:
                return response(403, {
                    "success": False,
                    "message": "sellerId required for updating project details"
                })

            if project["sellerId"] != seller_id:
                return response(403, {
                    "success": False,
                    "message": "Not authorized to edit this project"
                })

            for field, value in updates.items():
                if field in IMMUTABLE_FIELDS:
                    continue

                if field not in OWNER_EDITABLE_FIELDS:
                    continue

                if field == "category" and value not in ALLOWED_CATEGORIES:
                    return response(400, {
                        "success": False,
                        "message": "Invalid category"
                    })

                if field in {"price", "originalPrice"}:
                    value = safe_decimal(value, field)

                expr_attr_names[f"#{field}"] = field
                expr_attr_values[f":{field}"] = value
                update_expr.append(f"#{field} = :{field}")

        # ======================================================
        # PUBLIC COUNTER INCREMENTS (including wishlist and cart)
        # ======================================================
        for field, delta in increments.items():
            if field not in PUBLIC_COUNTER_FIELDS:
                continue

            # Allow both positive and negative increments
            # Positive = add to wishlist/cart, Negative = remove from wishlist/cart
            delta = int(delta)

            expr_attr_names[f"#{field}"] = field
            expr_attr_values[f":inc_{field}"] = Decimal(delta)
            expr_attr_values[f":zero_{field}"] = Decimal(0)

            update_expr.append(
                f"#{field} = if_not_exists(#{field}, :zero_{field}) + :inc_{field}"
            )

        if not update_expr:
            return response(400, {
                "success": False,
                "message": "No valid updates provided"
            })

        # ---------- UPDATED TIMESTAMP ----------
        expr_attr_names["#updatedAt"] = "updatedAt"
        expr_attr_values[":updatedAt"] = now_iso()
        update_expr.append("#updatedAt = :updatedAt")

        # ---------- EXECUTE UPDATE ----------
        projects_table.update_item(
            Key={"projectId": project_id},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )

        return response(200, {
            "success": True,
            "message": "Project updated successfully"
        })

    except ClientError as e:
        traceback.print_exc()
        return response(500, {
            "success": False,
            "message": f"AWS error: {str(e)}"
        })

    except Exception as e:
        traceback.print_exc()
        return response(500, {
            "success": False,
            "message": f"Server error: {str(e)}"
        })

