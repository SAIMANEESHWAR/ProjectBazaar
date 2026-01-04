import json
import os
import hmac
import hashlib
import boto3
from datetime import datetime
from decimal import Decimal

# ---------- CONFIG ----------
WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

if not WEBHOOK_SECRET:
    raise ValueError("RAZORPAY_WEBHOOK_SECRET environment variable is not set")

dynamodb = boto3.resource("dynamodb")
orders_table = dynamodb.Table("Orders")
users_table = dynamodb.Table("Users")
projects_table = dynamodb.Table("Projects")


# ---------- HELPER FUNCTIONS ----------
def create_response(status_code, body, error=None):
    """Create standardized Lambda response"""
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
        },
        "body": json.dumps(response_body, default=str)
    }


def verify_razorpay_signature(payload, received_signature):
    """
    Verify Razorpay webhook signature.
    Razorpay uses HMAC SHA256 and sends signature as hex string.
    """
    if not received_signature:
        return False
    
    # Create expected signature
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_signature, received_signature)


def find_order_by_razorpay_order_id(razorpay_order_id):
    """
    Find order by razorpayOrderId.
    Uses scan as fallback (consider adding GSI on razorpayOrderId for better performance).
    """
    try:
        # Try to scan for the order
        response = orders_table.scan(
            FilterExpression="razorpayOrderId = :r",
            ExpressionAttributeValues={":r": razorpay_order_id}
        )
        
        items = response.get("Items", [])
        if not items:
            return None
        
        # Should only be one order with this razorpayOrderId
        return items[0]
    except Exception as e:
        print(f"Error finding order: {str(e)}")
        return None


def clear_user_cart(user_id, project_ids):
    """
    Remove purchased projects from user's cart.
    """
    try:
        # Get current cart
        user_response = users_table.get_item(Key={"userId": user_id})
        if "Item" not in user_response:
            print(f"User {user_id} not found")
            return False
        
        cart = user_response["Item"].get("cart", [])
        if not cart:
            # Cart already empty or doesn't exist
            return True
        
        # Filter out purchased project IDs
        # Cart items can be strings (projectIds) or objects with projectId field
        new_cart = []
        purchased_set = set(project_ids)
        
        for item in cart:
            if isinstance(item, str):
                if item not in purchased_set:
                    new_cart.append(item)
            elif isinstance(item, dict):
                project_id = item.get("projectId") or item.get("id")
                if project_id and project_id not in purchased_set:
                    new_cart.append(item)
        
        # Update cart
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET cart = :new_cart",
            ExpressionAttributeValues={":new_cart": new_cart}
        )
        
        return True
    except Exception as e:
        print(f"Error clearing cart for user {user_id}: {str(e)}")
        return False


# ---------- HANDLER ----------
def lambda_handler(event, context):
    """
    Handle Razorpay payment webhooks.
    Verifies signature and processes payment.captured or payment.failed events.
    """
    try:
        # Get payload and headers
        # API Gateway might stringify the body, so handle both cases
        if isinstance(event.get("body"), str):
            payload = event["body"]
        else:
            payload = json.dumps(event.get("body", {}))
        
        headers = event.get("headers", {})
        # Headers might be lowercase in API Gateway
        received_signature = headers.get("X-Razorpay-Signature") or headers.get("x-razorpay-signature")
        
        # 1️⃣ Verify Webhook Signature
        if not verify_razorpay_signature(payload, received_signature):
            print("Invalid webhook signature")
            return create_response(
                400,
                {},
                error="Invalid webhook signature"
            )
        
        # Parse payload
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as e:
            print(f"Invalid JSON payload: {str(e)}")
            return create_response(
                400,
                {},
                error="Invalid JSON payload"
            )
        
        event_type = data.get("event")
        
        # Handle different event types
        if event_type == "payment.captured":
            payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
            if payment_entity:
                return handle_success(payment_entity)
            else:
                return create_response(400, {}, error="Missing payment entity in payload")
        
        elif event_type == "payment.failed":
            payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
            if payment_entity:
                return handle_failure(payment_entity)
            else:
                return create_response(400, {}, error="Missing payment entity in payload")
        
        else:
            # Unknown event type - return 200 to acknowledge receipt
            print(f"Unknown event type: {event_type}")
            return create_response(200, {"message": f"Event {event_type} acknowledged but not processed"})
    
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(
            500,
            {},
            error=f"Internal server error: {str(e)}"
        )


# ---------- SUCCESS HANDLER ----------
def handle_success(payment):
    """
    Handle payment.captured event.
    Updates order status, creates purchases, updates counters, and clears cart.
    """
    try:
        razorpay_order_id = payment.get("order_id")
        if not razorpay_order_id:
            return create_response(400, {}, error="Missing order_id in payment")
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # 2️⃣ Find Order by razorpayOrderId
        order = find_order_by_razorpay_order_id(razorpay_order_id)
        if not order:
            print(f"Order not found for razorpayOrderId: {razorpay_order_id}")
            return create_response(404, {}, error=f"Order not found for razorpayOrderId: {razorpay_order_id}")
        
        order_id = order.get("orderId")
        if not order_id:
            return create_response(400, {}, error="Order missing orderId")
        
        # 8️⃣ Idempotency Check - Skip if already SUCCESS
        current_status = order.get("status")
        if current_status == "SUCCESS":
            print(f"Order {order_id} already processed (SUCCESS). Skipping.")
            return create_response(200, {"message": "Order already processed", "orderId": order_id})
        
        user_id = order.get("userId")
        project_ids = order.get("projectIds", [])
        
        if not user_id:
            return create_response(400, {}, error="Order missing userId")
        
        if not project_ids:
            return create_response(400, {}, error="Order missing projectIds")
        
        # 3️⃣ Update Order Status to SUCCESS
        try:
            orders_table.update_item(
                Key={"orderId": order_id},
                UpdateExpression="SET #s = :s, updatedAt = :u",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":s": "SUCCESS",
                    ":u": timestamp
                }
            )
            print(f"Order {order_id} status updated to SUCCESS")
        except Exception as e:
            print(f"Error updating order status: {str(e)}")
            return create_response(500, {}, error=f"Failed to update order status: {str(e)}")
        
        # Process each project in the order
        total_purchase_amount = 0
        
        for project_id in project_ids:
            try:
                # Get project details
                project_response = projects_table.get_item(Key={"projectId": project_id})
                if "Item" not in project_response:
                    print(f"Project {project_id} not found, skipping")
                    continue
                
                project = project_response["Item"]
                price = float(project.get("price", 0))
                seller_id = project.get("sellerId")
                
                if not seller_id:
                    print(f"Project {project_id} missing sellerId, skipping")
                    continue
                
                total_purchase_amount += price
                
                # 6️⃣ Add Purchase to Buyer's purchases array
                purchase_item = {
                    "projectId": project_id,
                    "priceAtPurchase": price,
                    "purchasedAt": timestamp,
                    "paymentId": payment.get("id"),
                    "orderStatus": "SUCCESS"
                }
                
                try:
                    users_table.update_item(
                        Key={"userId": user_id},
                        UpdateExpression="""
                            SET purchases = list_append(if_not_exists(purchases, :e), :p),
                                totalPurchases = if_not_exists(totalPurchases, :z) + :i,
                                totalSpent = if_not_exists(totalSpent, :z) + :amt
                        """,
                        ExpressionAttributeValues={
                            ":e": [],
                            ":p": [purchase_item],
                            ":i": 1,
                            ":amt": price,
                            ":z": 0
                        }
                    )
                    print(f"Purchase added for user {user_id}, project {project_id}")
                except Exception as e:
                    print(f"Error adding purchase for project {project_id}: {str(e)}")
                    # Continue processing other projects
                
                # 7️⃣ Increment Project Purchase Count
                try:
                    projects_table.update_item(
                        Key={"projectId": project_id},
                        UpdateExpression="SET purchasesCount = if_not_exists(purchasesCount, :z) + :i",
                        ExpressionAttributeValues={":i": 1, ":z": 0}
                    )
                    print(f"Purchase count incremented for project {project_id}")
                except Exception as e:
                    print(f"Error incrementing purchase count for project {project_id}: {str(e)}")
                
                # 7️⃣ Update Seller Earnings (85% of price)
                seller_earning = price * 0.85
                try:
                    users_table.update_item(
                        Key={"userId": seller_id},
                        UpdateExpression="SET totalEarnings = if_not_exists(totalEarnings, :z) + :e",
                        ExpressionAttributeValues={
                            ":e": seller_earning,
                            ":z": 0
                        }
                    )
                    print(f"Earnings updated for seller {seller_id}: +{seller_earning}")
                except Exception as e:
                    print(f"Error updating seller earnings for {seller_id}: {str(e)}")
            
            except Exception as e:
                print(f"Error processing project {project_id}: {str(e)}")
                # Continue with next project
                continue
        
        # 9️⃣ Clear Cart (Remove purchased items)
        cart_cleared = clear_user_cart(user_id, project_ids)
        if cart_cleared:
            print(f"Cart cleared for user {user_id}")
        else:
            print(f"Warning: Could not clear cart for user {user_id}")
        
        return create_response(
            200,
            {
                "message": "Payment processed successfully",
                "orderId": order_id,
                "projectsProcessed": len(project_ids),
                "totalAmount": total_purchase_amount
            }
        )
    
    except Exception as e:
        print(f"Error in handle_success: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {}, error=f"Error processing payment: {str(e)}")


# ---------- FAILURE HANDLER ----------
def handle_failure(payment):
    """
    Handle payment.failed event.
    Updates order status to FAILED.
    """
    try:
        razorpay_order_id = payment.get("order_id")
        if not razorpay_order_id:
            return create_response(400, {}, error="Missing order_id in payment")
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Find Order by razorpayOrderId
        order = find_order_by_razorpay_order_id(razorpay_order_id)
        if not order:
            print(f"Order not found for razorpayOrderId: {razorpay_order_id}")
            return create_response(404, {}, error=f"Order not found for razorpayOrderId: {razorpay_order_id}")
        
        order_id = order.get("orderId")
        if not order_id:
            return create_response(400, {}, error="Order missing orderId")
        
        # Idempotency Check - Skip if already FAILED or SUCCESS
        current_status = order.get("status")
        if current_status in ["FAILED", "SUCCESS"]:
            print(f"Order {order_id} already has status {current_status}. Skipping.")
            return create_response(200, {
                "message": f"Order already has status {current_status}",
                "orderId": order_id
            })
        
        # Update Order Status to FAILED
        try:
            orders_table.update_item(
                Key={"orderId": order_id},
                UpdateExpression="SET #s = :s, updatedAt = :u",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":s": "FAILED",
                    ":u": timestamp
                }
            )
            print(f"Order {order_id} status updated to FAILED")
        except Exception as e:
            print(f"Error updating order status to FAILED: {str(e)}")
            return create_response(500, {}, error=f"Failed to update order status: {str(e)}")
        
        return create_response(
            200,
            {
                "message": "Payment failure processed",
                "orderId": order_id
            }
        )
    
    except Exception as e:
        print(f"Error in handle_failure: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {}, error=f"Error processing payment failure: {str(e)}")

