import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
from botocore.config import Config

# ---------- CONFIG ----------
USERS_TABLE = "Users"
S3_BUCKET = "project-bazaar-users-profile-images"
S3_REGION = "ap-south-2"

# ---------- AWS ----------
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)
s3 = boto3.client(
    "s3",
    region_name=S3_REGION,
    endpoint_url=f"https://s3.{S3_REGION}.amazonaws.com",
    config=Config(
        s3={'addressing_style': 'virtual'},
        signature_version='s3v4'
    )
)

# ---------- JSON HELPER ----------
def decimal_to_native(obj):
    """Convert DynamoDB Decimal types to native Python types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

# ---------- RESPONSE ----------
def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(decimal_to_native(body))
    }

# ---------- S3 HELPERS ----------
def is_s3_url(url):
    return isinstance(url, str) and S3_BUCKET in url

def extract_s3_key(url):
    """Extract S3 key from URL - handles both regional and global formats"""
    try:
        # Try regional format
        if f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/" in url:
            return url.split(f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/")[1]
        # Try global format
        if f"{S3_BUCKET}.s3.amazonaws.com/" in url:
            return url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[1]
        return None
    except Exception as e:
        print(f"extract_s3_key error: {e}")
        return None

def delete_s3_object(image_url):
    try:
        if not is_s3_url(image_url):
            return
        key = extract_s3_key(image_url)
        if key:
            s3.delete_object(Bucket=S3_BUCKET, Key=key)
            print(f"Deleted old image: {key}")
    except Exception as e:
        print(f"S3 delete failed: {e}")

# ---------- ACTION: PRESIGNED URL ----------
def handle_presigned_url(body):
    user_id = body.get("userId")
    file_name = body.get("fileName")
    file_type = body.get("fileType")

    if not user_id or not file_name or not file_type:
        return response(400, {
            "success": False,
            "message": "userId, fileName and fileType are required"
        })

    ext = file_name.split(".")[-1]
    key = f"profile-images/{user_id}/{uuid.uuid4()}.{ext}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": key,
            "ContentType": file_type
        },
        ExpiresIn=300
    )

    file_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"

    return response(200, {
        "success": True,
        "uploadUrl": upload_url,
        "fileUrl": file_url
    })

# ---------- ACTION: UPDATE SETTINGS ----------
def handle_update_settings(body):
    print("Received updateSettings body:", json.dumps(body))
    
    user_id = body.get("userId")

    if not user_id:
        return response(400, {
            "success": False,
            "message": "userId is required"
        })

    # Updated allowed_fields to include integration and freelancer profile fields
    allowed_fields = [
        "fullName",
        "phoneNumber",
        "profilePictureUrl",
        "linkedinUrl",
        "githubUrl",
        "emailNotifications",
        "pushNotifications",
        # Integration data fields
        "githubData",
        "driveData",
        "freelancerData",
        "freelancerUrl",
        # Become a Freelancer (skills, projects)
        "isFreelancer",
        "skills",
        "freelancerProjects",
    ]

    updates = {k: v for k, v in body.items() if k in allowed_fields}
    print("Updates to apply:", json.dumps(updates))

    if not updates:
        return response(400, {
            "success": False,
            "message": "No valid fields to update"
        })

    try:
        existing = table.get_item(Key={"userId": user_id})
    except Exception as e:
        print(f"DynamoDB get_item error: {e}")
        return response(500, {
            "success": False,
            "message": f"Database error: {str(e)}"
        })

    if "Item" not in existing:
        return response(404, {
            "success": False,
            "message": "User not found"
        })

    current_user = existing["Item"]

    # Delete old image if replaced (don't let this crash the update)
    if "profilePictureUrl" in updates:
        try:
            old_url = current_user.get("profilePictureUrl")
            new_url = updates["profilePictureUrl"]
            if old_url and old_url != new_url:
                delete_s3_object(old_url)
        except Exception as e:
            print(f"Old image cleanup failed (non-fatal): {e}")

    updates["updatedAt"] = datetime.utcnow().isoformat()

    update_expr = []
    expr_attr_values = {}
    expr_attr_names = {}

    for k, v in updates.items():
        expr_attr_names[f"#{k}"] = k
        # Handle None/null values - DynamoDB doesn't support None, use empty dict/list or remove attribute
        if v is None:
            # For disconnect operations, we want to remove the attribute
            # Use REMOVE expression instead of SET
            continue
        expr_attr_values[f":{k}"] = v
        update_expr.append(f"#{k} = :{k}")

    # Handle fields that should be removed (set to None)
    remove_expr = []
    for k, v in updates.items():
        if v is None:
            remove_expr.append(f"#{k}")
            expr_attr_names[f"#{k}"] = k

    try:
        # Build update expression
        update_parts = []
        if update_expr:
            update_parts.append(f"SET {', '.join(update_expr)}")
        if remove_expr:
            update_parts.append(f"REMOVE {', '.join(remove_expr)}")
        
        update_expression = " ".join(update_parts)
        
        update_params = {
            "Key": {"userId": user_id},
            "UpdateExpression": update_expression,
            "ExpressionAttributeNames": expr_attr_names,
            "ReturnValues": "ALL_NEW"
        }
        
        if expr_attr_values:
            update_params["ExpressionAttributeValues"] = expr_attr_values
        
        result = table.update_item(**update_params)
        print("Update successful")
    except Exception as e:
        print(f"DynamoDB update_item error: {e}")
        return response(500, {
            "success": False,
            "message": f"Database update error: {str(e)}"
        })

    return response(200, {
        "success": True,
        "message": "Settings updated successfully",
        "data": result["Attributes"]
    })

# ---------- ENTRY ----------
def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {})

        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        action = body.get("action")

        if action == "getPresignedUrl":
            return handle_presigned_url(body)

        if action == "updateSettings":
            return handle_update_settings(body)

        return response(400, {
            "success": False,
            "message": "Invalid action"
        })

    except Exception as e:
        print(f"Lambda handler ERROR: {e}")
        return response(500, {
            "success": False,
            "message": f"Internal server error: {str(e)}"
        })
