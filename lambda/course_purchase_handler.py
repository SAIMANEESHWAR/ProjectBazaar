"""
Lambda Function: Course Purchase Handler with Razorpay Integration
-----------------------------------------------------------------
1. Create Razorpay order for course purchase
2. Handle payment webhook for course purchases
3. Store purchase details in DynamoDB
4. Update course purchase count
"""

import json
import os
import hmac
import hashlib
import boto3
import uuid
import urllib.request
import urllib.error
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional

# =========================
# CONFIG
# =========================
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")
courses_table = dynamodb.Table("Courses")
course_orders_table = dynamodb.Table("CourseOrders")


# =========================
# HELPER FUNCTIONS
# =========================
def create_response(status_code: int, body: Dict[str, Any], error: str = None) -> Dict[str, Any]:
    """Create standardized Lambda response with CORS headers"""
    response_body = {"success": status_code == 200}
    if error:
        response_body["error"] = error
    else:
        response_body.update(body)
    
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,X-Razorpay-Signature",
            "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
        },
        "body": json.dumps(response_body, default=str)
    }


def decimal_to_float(obj):
    """Convert Decimal objects to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj


# =========================
# LAMBDA HANDLER
# =========================
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for course purchase operations.
    Supports:
    - CREATE_COURSE_ORDER: Create Razorpay order for course purchase
    - COURSE_PAYMENT_WEBHOOK: Handle Razorpay webhook for course payment
    - GET_PURCHASED_COURSES: Get user's purchased courses
    """
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return create_response(200, {"ok": True})
    
    try:
        # Parse request body
        body = event
        if "body" in event:
            if isinstance(event["body"], str):
                try:
                    body = json.loads(event["body"])
                except json.JSONDecodeError:
                    return create_response(400, {}, error="Invalid JSON in request body")
            elif isinstance(event["body"], dict):
                body = event["body"]
        
        action = body.get("action", "")
        print(f"Received action: {action}")
        
        # Route to appropriate handler
        if action == "CREATE_COURSE_ORDER":
            return create_course_order(body)
        elif action == "COURSE_PAYMENT_WEBHOOK":
            return handle_course_webhook(event, body)
        elif action == "GET_PURCHASED_COURSES":
            return get_purchased_courses(body)
        elif action == "ENROLL_FREE_COURSE":
            return enroll_free_course(body)
        else:
            return create_response(400, {}, error=f"Invalid action: {action}")
    
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {}, error=f"Internal server error: {str(e)}")


# =========================
# CREATE COURSE ORDER
# =========================
def create_course_order(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a Razorpay order for course purchase.
    
    Request body:
    {
        "action": "CREATE_COURSE_ORDER",
        "userId": "user123",
        "courseId": "course123",
        "amount": 999,  // Amount in INR
        "currency": "INR"
    }
    """
    try:
        user_id = body.get("userId")
        course_id = body.get("courseId")
        amount = body.get("amount", 0)
        # IMPORTANT: Force INR currency for Razorpay
        # USD/other currencies ONLY support Cards
        # INR enables: UPI, Wallets, Netbanking, Cards, EMI, Pay Later
        currency = "INR"  # Always use INR regardless of input
        
        if not user_id:
            return create_response(400, {}, error="userId is required")
        if not course_id:
            return create_response(400, {}, error="courseId is required")
        if not amount or amount <= 0:
            return create_response(400, {}, error="Valid amount is required")
        
        # Verify course exists and get details
        course_response = courses_table.get_item(Key={"courseId": course_id})
        if "Item" not in course_response:
            return create_response(404, {}, error="Course not found")
        
        course = course_response["Item"]
        course_title = course.get("title", "Course Purchase")
        
        # Check if user already purchased this course
        user_response = users_table.get_item(Key={"userId": user_id})
        if "Item" in user_response:
            purchased_courses = user_response["Item"].get("purchasedCourses", [])
            for pc in purchased_courses:
                if isinstance(pc, dict) and pc.get("courseId") == course_id:
                    return create_response(400, {}, error="You have already purchased this course")
                elif isinstance(pc, str) and pc == course_id:
                    return create_response(400, {}, error="You have already purchased this course")
        
        # Generate internal order ID
        order_id = f"COURSE_ORDER_{uuid.uuid4().hex[:12].upper()}"
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Amount in paise (Razorpay expects amount in smallest currency unit)
        amount_in_paise = int(float(amount) * 100)
        
        # Create Razorpay Order
        if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
            # Demo mode - return mock order
            return create_response(200, {
                "orderId": order_id,
                "razorpayOrderId": f"order_demo_{uuid.uuid4().hex[:12]}",
                "amount": amount_in_paise,
                "currency": currency,
                "key": "rzp_test_demo",
                "name": "ProjectBazaar Courses",
                "description": f"Purchase: {course_title}",
                "courseId": course_id,
                "courseTitle": course_title,
                "prefill": {
                    "email": body.get("userEmail", ""),
                    "contact": body.get("userPhone", "")
                }
            })
        
        # Create Razorpay order via API
        razorpay_url = "https://api.razorpay.com/v1/orders"
        razorpay_payload = {
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": order_id,
            "notes": {
                "courseId": course_id,
                "userId": user_id,
                "courseTitle": course_title
            }
        }
        
        # Basic auth for Razorpay
        auth_string = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}"
        auth_bytes = auth_string.encode("utf-8")
        import base64
        auth_header = base64.b64encode(auth_bytes).decode("utf-8")
        
        req = urllib.request.Request(
            razorpay_url,
            data=json.dumps(razorpay_payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {auth_header}"
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            razorpay_order = json.loads(response.read().decode("utf-8"))
        
        razorpay_order_id = razorpay_order.get("id")
        
        # Store order in DynamoDB
        order_item = {
            "CourseOrderId": order_id,  # Primary key matches DynamoDB table
            "orderId": order_id,
            "razorpayOrderId": razorpay_order_id,
            "userId": user_id,
            "courseId": course_id,
            "courseTitle": course_title,
            "amount": Decimal(str(amount)),
            "amountInPaise": amount_in_paise,
            "currency": currency,
            "status": "PENDING",
            "createdAt": timestamp,
            "updatedAt": timestamp
        }
        
        course_orders_table.put_item(Item=order_item)
        print(f"Course order created: {order_id}, Razorpay: {razorpay_order_id}")
        
        return create_response(200, {
            "orderId": order_id,
            "razorpayOrderId": razorpay_order_id,
            "amount": amount_in_paise,
            "currency": currency,
            "key": RAZORPAY_KEY_ID,
            "name": "ProjectBazaar Courses",
            "description": f"Purchase: {course_title}",
            "courseId": course_id,
            "courseTitle": course_title,
            "prefill": {
                "email": body.get("userEmail", ""),
                "contact": body.get("userPhone", "")
            }
        })
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"Razorpay API error: {e.code} - {error_body}")
        return create_response(500, {}, error=f"Payment gateway error: {error_body}")
    except Exception as e:
        print(f"Error creating course order: {str(e)}")
        return create_response(500, {}, error=str(e))


# =========================
# ENROLL FREE COURSE
# =========================
def enroll_free_course(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enroll user in a free course.
    
    Request body:
    {
        "action": "ENROLL_FREE_COURSE",
        "userId": "user123",
        "courseId": "course123"
    }
    """
    try:
        user_id = body.get("userId")
        course_id = body.get("courseId")
        
        if not user_id:
            return create_response(400, {}, error="userId is required")
        if not course_id:
            return create_response(400, {}, error="courseId is required")
        
        # Verify course exists and is free
        course_response = courses_table.get_item(Key={"courseId": course_id})
        if "Item" not in course_response:
            return create_response(404, {}, error="Course not found")
        
        course = course_response["Item"]
        if not course.get("isFree") and Decimal(str(course.get("price", 0))) > 0:
            return create_response(400, {}, error="This course is not free")
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Check if already enrolled
        user_response = users_table.get_item(Key={"userId": user_id})
        if "Item" in user_response:
            purchased_courses = user_response["Item"].get("purchasedCourses", [])
            for pc in purchased_courses:
                if isinstance(pc, dict) and pc.get("courseId") == course_id:
                    return create_response(400, {}, error="You are already enrolled in this course")
        
        # Add course to user's purchased courses
        purchase_item = {
            "courseId": course_id,
            "courseTitle": course.get("title", ""),
            "priceAtPurchase": Decimal("0"),  # Use Decimal for DynamoDB
            "purchasedAt": timestamp,
            "paymentId": "FREE_ENROLLMENT",
            "orderStatus": "SUCCESS"
        }
        
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="""
                SET purchasedCourses = list_append(if_not_exists(purchasedCourses, :empty), :course),
                    totalCoursePurchases = if_not_exists(totalCoursePurchases, :zero) + :one
            """,
            ExpressionAttributeValues={
                ":empty": [],
                ":course": [purchase_item],
                ":zero": Decimal("0"),
                ":one": Decimal("1")
            }
        )
        
        # Increment course purchase count
        courses_table.update_item(
            Key={"courseId": course_id},
            UpdateExpression="SET purchasesCount = if_not_exists(purchasesCount, :zero) + :one",
            ExpressionAttributeValues={":zero": Decimal("0"), ":one": Decimal("1")}
        )
        
        print(f"User {user_id} enrolled in free course {course_id}")
        
        return create_response(200, {
            "message": "Successfully enrolled in course",
            "courseId": course_id,
            "courseTitle": course.get("title", "")
        })
    
    except Exception as e:
        print(f"Error enrolling in free course: {str(e)}")
        return create_response(500, {}, error=str(e))


# =========================
# HANDLE COURSE WEBHOOK
# =========================
def handle_course_webhook(event: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle Razorpay webhook for course payment.
    Called after successful payment verification on frontend.
    
    Request body:
    {
        "action": "COURSE_PAYMENT_WEBHOOK",
        "razorpay_payment_id": "pay_xxx",
        "razorpay_order_id": "order_xxx",
        "razorpay_signature": "xxx",
        "userId": "user123",
        "courseId": "course123"
    }
    """
    try:
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_order_id = body.get("razorpay_order_id")
        razorpay_signature = body.get("razorpay_signature")
        user_id = body.get("userId")
        course_id = body.get("courseId")
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id, course_id]):
            return create_response(400, {}, error="Missing required payment verification fields")
        
        # Verify Razorpay signature
        if RAZORPAY_KEY_SECRET:
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            expected_signature = hmac.new(
                RAZORPAY_KEY_SECRET.encode("utf-8"),
                message.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(expected_signature, razorpay_signature):
                return create_response(400, {}, error="Invalid payment signature")
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Find the order
        order = find_order_by_razorpay_order_id(razorpay_order_id)
        if not order:
            return create_response(404, {}, error="Order not found")
        
        order_id = order.get("orderId")
        
        # Check idempotency - if already processed, return success
        if order.get("status") == "SUCCESS":
            return create_response(200, {
                "message": "Payment already processed",
                "orderId": order_id,
                "courseId": course_id
            })
        
        # Get course details
        course_response = courses_table.get_item(Key={"courseId": course_id})
        course = course_response.get("Item", {})
        course_title = course.get("title", "")
        price = Decimal(str(order.get("amount", 0)))
        
        # Update order status
        course_orders_table.update_item(
            Key={"CourseOrderId": order_id},
            UpdateExpression="""
                SET #status = :status, 
                    razorpayPaymentId = :paymentId,
                    updatedAt = :timestamp
            """,
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": "SUCCESS",
                ":paymentId": razorpay_payment_id,
                ":timestamp": timestamp
            }
        )
        
        # Add course to user's purchased courses
        purchase_item = {
            "courseId": course_id,
            "courseTitle": course_title,
            "priceAtPurchase": price,
            "purchasedAt": timestamp,
            "paymentId": razorpay_payment_id,
            "orderId": order_id,
            "orderStatus": "SUCCESS"
        }
        
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="""
                SET purchasedCourses = list_append(if_not_exists(purchasedCourses, :empty), :course),
                    totalCoursePurchases = if_not_exists(totalCoursePurchases, :zero) + :one,
                    totalCourseSpent = if_not_exists(totalCourseSpent, :zero) + :amount
            """,
            ExpressionAttributeValues={
                ":empty": [],
                ":course": [purchase_item],
                ":zero": Decimal("0"),
                ":one": Decimal("1"),
                ":amount": price  # Already a Decimal
            }
        )
        
        # Increment course purchase count
        courses_table.update_item(
            Key={"courseId": course_id},
            UpdateExpression="SET purchasesCount = if_not_exists(purchasesCount, :zero) + :one",
            ExpressionAttributeValues={":zero": Decimal("0"), ":one": Decimal("1")}
        )
        
        print(f"Course purchase completed: User {user_id}, Course {course_id}, Payment {razorpay_payment_id}")
        
        return create_response(200, {
            "message": "Course purchase successful",
            "orderId": order_id,
            "courseId": course_id,
            "courseTitle": course_title,
            "paymentId": razorpay_payment_id
        })
    
    except Exception as e:
        print(f"Error handling course webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {}, error=str(e))


# =========================
# GET PURCHASED COURSES
# =========================
def get_purchased_courses(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get all courses purchased by a user.
    
    Request body:
    {
        "action": "GET_PURCHASED_COURSES",
        "userId": "user123"
    }
    """
    try:
        user_id = body.get("userId")
        
        if not user_id:
            return create_response(400, {}, error="userId is required")
        
        # Get user's purchased courses
        user_response = users_table.get_item(Key={"userId": user_id})
        
        if "Item" not in user_response:
            return create_response(200, {
                "purchasedCourses": [],
                "count": 0
            })
        
        user = user_response["Item"]
        purchased_courses_raw = user.get("purchasedCourses", [])
        
        # Fetch full course details for each purchased course
        purchased_courses = []
        for purchase in purchased_courses_raw:
            course_id = purchase.get("courseId") if isinstance(purchase, dict) else purchase
            
            if course_id:
                course_response = courses_table.get_item(Key={"courseId": course_id})
                if "Item" in course_response:
                    course = decimal_to_float(course_response["Item"])
                    # Add purchase metadata
                    if isinstance(purchase, dict):
                        course["purchasedAt"] = purchase.get("purchasedAt")
                        course["priceAtPurchase"] = purchase.get("priceAtPurchase", 0)
                        course["paymentId"] = purchase.get("paymentId")
                    purchased_courses.append(course)
        
        return create_response(200, {
            "purchasedCourses": purchased_courses,
            "count": len(purchased_courses)
        })
    
    except Exception as e:
        print(f"Error getting purchased courses: {str(e)}")
        return create_response(500, {}, error=str(e))


# =========================
# HELPER: Find Order
# =========================
def find_order_by_razorpay_order_id(razorpay_order_id: str) -> Optional[Dict[str, Any]]:
    """Find course order by Razorpay order ID"""
    try:
        response = course_orders_table.scan(
            FilterExpression="razorpayOrderId = :r",
            ExpressionAttributeValues={":r": razorpay_order_id}
        )
        items = response.get("Items", [])
        return items[0] if items else None
    except Exception as e:
        print(f"Error finding order: {str(e)}")
        return None

