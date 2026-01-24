import json
import uuid
import boto3
import traceback
from datetime import datetime
from decimal import Decimal
from botocore.config import Config

# ================= CONFIG =================
PROJECTS_TABLE = "Projects"
USERS_TABLE = "Users"
NOTIFICATIONS_TABLE = "Notifications"

S3_BUCKET = "projectbazaar-assets"
S3_REGION = "ap-south-2"

NOTIFICATION_QUEUE_URL = (
    "https://sqs.ap-south-2.amazonaws.com/290917471042/notification-fanout-queue"
)

# ================= AWS =================
dynamodb = boto3.resource("dynamodb", region_name=S3_REGION)

projects_table = dynamodb.Table(PROJECTS_TABLE)
users_table = dynamodb.Table(USERS_TABLE)
notifications_table = dynamodb.Table(NOTIFICATIONS_TABLE)

sqs = boto3.client("sqs", region_name=S3_REGION)

s3 = boto3.client(
    "s3",
    region_name=S3_REGION,
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"}
    )
)

# ================= HELPERS =================
def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }


def now_iso():
    return datetime.utcnow().isoformat()


def to_decimal(value):
    return Decimal(str(value))


# ================= NOTIFICATION =================
def create_project_notification(project_title, seller_id):
    notification_id = f"notif-{uuid.uuid4()}"
    created_at = int(datetime.utcnow().timestamp())

    notification_item = {
        "notificationId": notification_id,
        "title": "New Project Uploaded",
        "message": f"{project_title} has been uploaded and is under review.",
        "type": "PROJECT_UPLOAD",
        "target": "user",  # change to ALL if required
        "createdBy": seller_id,
        "createdAt": created_at
    }

    # Save global notification
    notifications_table.put_item(Item=notification_item)

    # Push to SQS for fan-out
    sqs.send_message(
        QueueUrl=NOTIFICATION_QUEUE_URL,
        MessageBody=json.dumps({
            "notificationId": notification_id,
            "target": "user"
        })
    )


# ================= HANDLER =================
def lambda_handler(event, context):
    try:
        # ================= CORS =================
        if event.get("httpMethod") == "OPTIONS":
            return response(200, "")

        body = json.loads(event.get("body", "{}"))

        # ================= ACTION 1: PRESIGNED URL =================
        if body.get("action") == "getPresignedUrl":
            seller_id = body.get("sellerId")
            file_name = body.get("fileName")
            file_type = body.get("fileType")

            if not seller_id or not file_name or not file_type:
                return response(400, {
                    "success": False,
                    "message": "sellerId, fileName and fileType are required"
                })

            key = f"projects/{seller_id}/{uuid.uuid4()}-{file_name}"

            upload_url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": S3_BUCKET,
                    "Key": key
                },
                ExpiresIn=900
            )

            file_url = (
                f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"
            )

            return response(200, {
                "success": True,
                "uploadUrl": upload_url,
                "fileUrl": file_url
            })

        # ================= ACTION 2: CREATE PROJECT =================
        seller_id = body.get("sellerId")
        seller_email = body.get("sellerEmail")

        if not seller_id or not seller_email:
            return response(400, {
                "success": False,
                "message": "sellerId and sellerEmail are required"
            })

        # Validate user
        user = users_table.get_item(Key={"userId": seller_id})
        if "Item" not in user:
            return response(404, {
                "success": False,
                "message": "User not found"
            })

        # Check if this is a draft save
        is_draft = body.get("isDraft", False)
        
        # For drafts, images are optional; for submission, at least one image is required
        image_urls = body.get("imageUrls", [])
        if not is_draft and not image_urls:
            return response(400, {
                "success": False,
                "message": "At least one image is required"
            })

        # For drafts, price is optional; for submission, price is required
        price_value = body.get("price")
        if not is_draft and price_value is None:
            return response(400, {
                "success": False,
                "message": "price is required"
            })

        # Check if updating existing draft
        project_id = body.get("projectId")  # If provided, update existing project
        if project_id:
            # Verify project exists and belongs to seller
            existing_project = projects_table.get_item(Key={"projectId": project_id})
            if "Item" not in existing_project:
                return response(404, {
                    "success": False,
                    "message": "Project not found"
                })
            
            existing_item = existing_project["Item"]
            if existing_item.get("sellerId") != seller_id:
                return response(403, {
                    "success": False,
                    "message": "You don't have permission to update this project"
                })
            
            # Only allow updating drafts
            if existing_item.get("status") != "draft":
                return response(400, {
                    "success": False,
                    "message": "Only draft projects can be updated"
                })
        else:
            # Create new project
            project_id = str(uuid.uuid4())

        timestamp = now_iso()

        resources = {
            "pptUrl": body.get("pptUrl"),
            "documentationUrl": body.get("documentationUrl"),
            "executionVideoUrl": body.get("executionVideoUrl"),
            "researchPaperUrl": body.get("researchPaperUrl"),
            "customResources": body.get("customResources", [])
        }
        resources = {k: v for k, v in resources.items() if v}

        # Determine status and adminApprovalStatus based on is_draft
        if is_draft:
            project_status = "draft"
            admin_approval_status = None  # Drafts don't need admin approval
        else:
            project_status = "pending"
            admin_approval_status = "pending"

        project_item = {
            "projectId": project_id,
            "sellerId": seller_id,
            "sellerEmail": seller_email,
            "title": body.get("title", "").strip(),
            "category": body.get("category", "Uncategorized"),
            "description": body.get("description", ""),
            "tags": [t.strip() for t in body.get("tags", "").split(",") if t.strip()] if body.get("tags") else [],
            "price": to_decimal(price_value) if price_value is not None else Decimal("0"),
            "originalPrice": (
                to_decimal(body["originalPrice"])
                if body.get("originalPrice") else None
            ),
            "currency": "USD",
            "githubUrl": body.get("githubUrl"),
            "youtubeVideoUrl": body.get("youtubeVideoUrl"),
            "images": image_urls if image_urls else [],
            "thumbnailUrl": body.get("thumbnailUrl") or (image_urls[0] if image_urls else None),
            "resources": resources if resources else None,
            "adminApprovalStatus": admin_approval_status,
            "status": project_status,
            "likesCount": 0,
            "purchasesCount": 0,
            "viewsCount": 0,
            "totalRevenue": Decimal("0"),
            "uploadedAt": timestamp,
            "updatedAt": timestamp
        }

        project_item = {k: v for k, v in project_item.items() if v is not None}

        # Save project
        projects_table.put_item(Item=project_item)

        # 🔔 CREATE NOTIFICATION only for submitted projects (not drafts)
        if not is_draft:
            create_project_notification(
                project_title=project_item["title"],
                seller_id=seller_id
            )

        return response(201, {
            "success": True,
            "message": "Project saved as draft" if is_draft else "Project uploaded successfully",
            "projectId": project_id,
            "isDraft": is_draft
        })

    except Exception as e:
        traceback.print_exc()
        return response(500, {
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        })
