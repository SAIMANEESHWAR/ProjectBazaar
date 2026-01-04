import json
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')  # Replace with your actual table name

# Response helper function
def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }

# ---------- LOGIN ----------
def handle_login(body):
    email = body.get("email", "").lower().strip()
    password = body.get("password")

    if not email or not password:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Email and password required"
            }
        })

    result = table.scan(
        FilterExpression=Key("email").eq(email)
    )

    if result["Count"] == 0:
        return response(404, {
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        })

    user = result["Items"][0]

    # ---------- STATUS CHECK ----------
    status = user.get("status", "active")

    if status == "blocked":
        blocked_until = user.get("accountLockedUntil") or user.get("blockedUntil")
        
        # Format the message with date if available
        if blocked_until:
            try:
                # Parse the date and format it nicely
                blocked_date = datetime.fromisoformat(blocked_until.replace('Z', '+00:00'))
                formatted_date = blocked_date.strftime("%B %d, %Y at %I:%M %p")
                message = f"Admin has disabled your account. Your account is disabled until {formatted_date}. Please contact support for more information."
            except:
                # If date parsing fails, use the raw date
                message = f"Admin has disabled your account. Your account is disabled until {blocked_until}. Please contact support for more information."
        else:
            message = "Admin has disabled your account. Please contact support for more information."
        
        return response(403, {
            "success": False,
            "error": {
                "code": "ACCOUNT_BLOCKED",
                "message": message,
                "blockedUntil": blocked_until
            }
        })

    if status == "deleted":
        deleted_until = user.get("accountLockedUntil") or user.get("deletedUntil")
        
        # Format the message with date if available
        if deleted_until:
            try:
                # Parse the date and format it nicely
                deleted_date = datetime.fromisoformat(deleted_until.replace('Z', '+00:00'))
                formatted_date = deleted_date.strftime("%B %d, %Y at %I:%M %p")
                message = f"Admin has deleted your account. Your account is deleted until {formatted_date}. Please contact support for more information."
            except:
                # If date parsing fails, use the raw date
                message = f"Admin has deleted your account. Your account is deleted until {deleted_until}. Please contact support for more information."
        else:
            message = "Admin has deleted your account. Please contact support for more information."
        
        return response(403, {
            "success": False,
            "error": {
                "code": "ACCOUNT_DELETED",
                "message": message,
                "deletedUntil": deleted_until
            }
        })

    # ---------- PASSWORD CHECK ----------
    if password != user["passwordHash"]:
        return response(401, {
            "success": False,
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid credentials"
            }
        })

    # ---------- UPDATE LOGIN META ----------
    table.update_item(
        Key={"userId": user["userId"]},
        UpdateExpression="""
            SET lastLoginAt = :l,
                loginCount = if_not_exists(loginCount, :z) + :o
        """,
        ExpressionAttributeValues={
            ":l": datetime.utcnow().isoformat() + "Z",
            ":z": 0,
            ":o": 1
        }
    )

    return response(200, {
        "success": True,
        "message": "Login successful",
        "data": {
            "userId": user["userId"],
            "email": user["email"],
            "role": user["role"],
            "credits": user["credits"],
            "status": user["status"]
        }
    })

# Lambda handler
def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return response(200, {})
        
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Route to appropriate handler based on action
        action = body.get('action', '').lower()
        
        if action == 'login':
            return handle_login(body)
        else:
            return response(400, {
                "success": False,
                "error": {
                    "code": "INVALID_ACTION",
                    "message": "Invalid action. Supported actions: login"
                }
            })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An error occurred processing your request"
            }
        })
