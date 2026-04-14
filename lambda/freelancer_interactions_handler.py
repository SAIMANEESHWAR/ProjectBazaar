"""
Freelancer Interactions Handler Lambda Function
Handles messaging, invitations, and reviews between buyers and freelancers.

DynamoDB Table: FreelancerInteractions
Primary Key: interactionId (String)
GSI: senderId-index (Partition: senderId, Sort: createdAt)
GSI: receiverId-index (Partition: receiverId, Sort: createdAt)
GSI: targetId-index (Partition: targetId, Sort: createdAt) - used for reviews

Actions:
- SEND_MESSAGE: Send a contact message
- SEND_INVITATION: Send an invitation to bid
- ADD_REVIEW: Add a review for a freelancer
- GET_USER_INTERACTIONS: Get messages and invites for a user
- GET_FREELANCER_REVIEWS: Get reviews for a specific freelancer
"""

import json
import boto3
import uuid
import os
import urllib.request
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
interactions_table = dynamodb.Table('FreelancerInteractions')
users_table = dynamodb.Table('Users')

def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj

def sanitize_string(value):
    if not isinstance(value, str):
        return value
    import re
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r'\son\w+\s*=', ' ', value, flags=re.IGNORECASE)
    return value[:10000]

# CORS headers
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400'
}

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(decimal_to_float(body))
    }

def notify_socket_server(user_id, event, data):
    """Notify the socket server about an event for a specific user. 404 from server is non-fatal (e.g. Render cold start)."""
    socket_url = (os.environ.get('SOCKET_SERVER_URL') or 'https://projectbazaarsocketserver.onrender.com').rstrip('/')
    try:
        payload = json.dumps({
            "userId": user_id,
            "event": event,
            "data": data
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{socket_url}/notify",
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=2) as res:
            print(f"Socket server notified: {res.read().decode()}")
    except Exception as e:
        print(f"Failed to notify socket server: {str(e)}")

# ---------- SEND MESSAGE ----------
def handle_send_message(body):
    required_fields = ['senderId', 'receiverId', 'message']
    
    for field in required_fields:
        if not body.get(field):
            return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Missing field: {field}"}})
            
    sender_id = body['senderId']
    receiver_id = body['receiverId']
    message = str(body['message']).strip()
    
    if len(message) < 1 or len(message) > 5000:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Message must be between 1 and 5000 characters"}})

    interaction_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    item = {
        'interactionId': interaction_id,
        'type': 'message',
        'senderId': sender_id,
        'receiverId': receiver_id,
        'content': sanitize_string(message),
        'status': 'unread',
        'createdAt': timestamp
    }
    
    try:
        interactions_table.put_item(Item=item)
        
        # Notify recipient via socket server
        notify_socket_server(receiver_id, 'new_message', {
            "senderId": sender_id,
            "message": item['content'],
            "interactionId": interaction_id,
            "timestamp": timestamp
        })
        
        return response(201, {
            "success": True, 
            "message": "Message sent successfully",
            "data": item
        })
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to send message"}})

# ---------- SEND INVITATION ----------
def handle_send_invitation(body):
    required_fields = ['senderId', 'receiverId', 'projectId', 'message']
    
    for field in required_fields:
        if not body.get(field):
            return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Missing field: {field}"}})
            
    interaction_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    item = {
        'interactionId': interaction_id,
        'type': 'invitation',
        'senderId': body['senderId'],
        'receiverId': body['receiverId'],
        'targetId': body['projectId'],  # the project they are invited to
        'content': sanitize_string(body['message']),
        'status': 'pending',
        'createdAt': timestamp
    }
    
    try:
        interactions_table.put_item(Item=item)
        
        # Notify freelancer via socket server
        notify_socket_server(item['receiverId'], 'new_invitation', {
            "senderId": item['senderId'],
            "projectId": item['targetId'],
            "message": item['content'],
            "interactionId": interaction_id,
            "timestamp": timestamp
        })
        
        return response(201, {
            "success": True, 
            "message": "Invitation sent successfully",
            "data": item
        })
    except Exception as e:
        print(f"Error sending invite: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to send invitation"}})


# ---------- ADD REVIEW ----------
def handle_add_review(body):
    required_fields = ['reviewerId', 'reviewerName', 'freelancerId', 'rating']
    
    for field in required_fields:
        if not body.get(field):
            return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Missing field: {field}"}})
            
    rating = float(body['rating'])
    if rating < 1 or rating > 5:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Rating must be between 1 and 5"}})
        
    comment = sanitize_string(body.get('comment', ''))
    
    # Check if a review from this user to this freelancer already exists
    try:
        existing = interactions_table.query(
            IndexName='senderId-index',
            KeyConditionExpression=Key('senderId').eq(body['reviewerId']),
            FilterExpression=Attr('type').eq('review') & Attr('targetId').eq(body['freelancerId'])
        )
        if existing.get('Items'):
            return response(409, {"success": False, "error": {"code": "DUPLICATE_REVIEW", "message": "You have already reviewed this freelancer"}})
    except Exception as e:
        pass # Ignore errors on check and proceed

    interaction_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    item = {
        'interactionId': interaction_id,
        'type': 'review',
        'senderId': body['reviewerId'],
        'senderName': body['reviewerName'],
        'senderImage': body.get('reviewerProfileImage', ''),
        'targetId': body['freelancerId'], # freelancer being reviewed
        'rating': Decimal(str(rating)),
        'content': comment,
        'createdAt': timestamp
    }
    
    try:
        interactions_table.put_item(Item=item)
        return response(201, {
            "success": True, 
            "message": "Review added successfully",
            "data": item
        })
    except Exception as e:
        print(f"Error adding review: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to add review"}})


# ---------- GET FREELANCER REVIEWS ----------
def handle_get_freelancer_reviews(body):
    freelancer_id = body.get('freelancerId')
    if not freelancer_id:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Freelancer ID required"}})
        
    try:
        # If targetId-index does not exist yet, we must scan and filter.
        # Ideally, you create the targetId-index for performance.
        try:
             result = interactions_table.query(
                IndexName='targetId-index',
                KeyConditionExpression=Key('targetId').eq(freelancer_id),
                FilterExpression=Attr('type').eq('review')
            )
        except Exception:
            # Fallback to scan if index not created
             result = interactions_table.scan(
                FilterExpression=Attr('targetId').eq(freelancer_id) & Attr('type').eq('review')
            )
            
        reviews = result.get('Items', [])
        reviews.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Calculate fresh stats
        total_rating = sum(float(r.get('rating', 0)) for r in reviews)
        avg_rating = total_rating / len(reviews) if reviews else 0
        
        return response(200, {
            "success": True,
            "data": {
                "reviews": reviews,
                "count": len(reviews),
                "averageRating": round(avg_rating, 1)
            }
        })
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to fetch reviews"}})

# ---------- GET SENT INTERACTIONS (messages/invitations sent by user) ----------
def handle_get_sent_interactions(body):
    user_id = body.get('userId')
    if not user_id:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "User ID required"}})
    try:
        try:
            result = interactions_table.query(
                IndexName='senderId-index',
                KeyConditionExpression=Key('senderId').eq(user_id)
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationException' and 'senderId-index' in str(e.response.get('Error', {}).get('Message', '')):
                # Fallback when senderId-index GSI does not exist: scan by senderId
                result = interactions_table.scan(
                    FilterExpression=Attr('senderId').eq(user_id)
                )
                # Handle pagination for scan
                items = result.get('Items', [])
                while 'LastEvaluatedKey' in result:
                    result = interactions_table.scan(
                        FilterExpression=Attr('senderId').eq(user_id),
                        ExclusiveStartKey=result['LastEvaluatedKey']
                    )
                    items.extend(result.get('Items', []))
                result = {'Items': items}
            else:
                raise
        interactions = result.get('Items', [])
        interactions.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return response(200, {
            "success": True,
            "data": {
                "interactions": interactions,
                "count": len(interactions)
            }
        })
    except Exception as e:
        print(f"Error fetching sent interactions: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to fetch sent interactions"}})


# ---------- GET CONVERSATION (all messages between two users) ----------
def handle_get_conversation(body):
    user_id = body.get('userId')
    other_user_id = body.get('otherUserId')
    if not user_id or not other_user_id:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "userId and otherUserId required"}})
    try:
        # Messages received from other user (we are receiver) - uses receiverId-index which exists
        received = interactions_table.query(
            IndexName='receiverId-index',
            KeyConditionExpression=Key('receiverId').eq(user_id),
            FilterExpression=Attr('senderId').eq(other_user_id) & Attr('type').eq('message')
        )
        sent_items = []
        try:
            sent = interactions_table.query(
                IndexName='senderId-index',
                KeyConditionExpression=Key('senderId').eq(user_id),
                FilterExpression=Attr('receiverId').eq(other_user_id) & Attr('type').eq('message')
            )
            sent_items = sent.get('Items', []) or []
        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationException' and 'senderId-index' in str(e.response.get('Error', {}).get('Message', '')):
                # Fallback when senderId-index does not exist: scan for (senderId=user_id, receiverId=other_user_id, type=message)
                result = interactions_table.scan(
                    FilterExpression=Attr('senderId').eq(user_id) & Attr('receiverId').eq(other_user_id) & Attr('type').eq('message')
                )
                sent_items = result.get('Items', [])
                while result.get('LastEvaluatedKey'):
                    result = interactions_table.scan(
                        FilterExpression=Attr('senderId').eq(user_id) & Attr('receiverId').eq(other_user_id) & Attr('type').eq('message'),
                        ExclusiveStartKey=result['LastEvaluatedKey']
                    )
                    sent_items.extend(result.get('Items', []))
            else:
                raise
        messages = (received.get('Items', []) or []) + sent_items
        messages.sort(key=lambda x: x.get('createdAt', ''))
        return response(200, {
            "success": True,
            "data": {
                "messages": messages,
                "count": len(messages)
            }
        })
    except Exception as e:
        print(f"Error fetching conversation: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to fetch conversation"}})


# ---------- GET USER INTERACTIONS ----------
def handle_get_user_interactions(body):
    user_id = body.get('userId')
    if not user_id:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "User ID required"}})
        
    try:
        # Get things sent TO the user
        result = interactions_table.query(
            IndexName='receiverId-index',
            KeyConditionExpression=Key('receiverId').eq(user_id)
        )
        interactions = result.get('Items', [])
        interactions.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return response(200, {
            "success": True,
            "data": {
                "interactions": interactions,
                "count": len(interactions)
            }
        })
    except Exception as e:
        print(f"Error fetching interactions: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to fetch interactions"}})


# ---------- UPDATE INTERACTION STATUS ----------
def handle_update_interaction_status(body):
    interaction_id = body.get('interactionId')
    status = body.get('status')
    
    if not interaction_id or not status:
        return response(400, {"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Interaction ID and status required"}})
        
    try:
        updated = interactions_table.update_item(
            Key={'interactionId': interaction_id},
            UpdateExpression="set #s = :s",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': status},
            ReturnValues="UPDATED_NEW"
        )
        
        return response(200, {
            "success": True,
            "message": "Status updated successfully",
            "data": updated.get('Attributes')
        })
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
             return response(404, {"success": False, "error": {"code": "NOT_FOUND", "message": "Interaction not found"}})
        print(f"Error updating interaction: {str(e)}")
        return response(500, {"success": False, "error": {"code": "DATABASE_ERROR", "message": "Failed to update status"}})


def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method.upper() == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "CORS preflight"})
        }
        
    try:
        body = {}
        if event.get('body'):
            if isinstance(event.get('body'), str):
                body = json.loads(event['body'])
            else:
                body = event.get('body')
                
        if event.get('httpMethod') == 'GET':
            query_params = event.get('queryStringParameters') or {}
            body = {**body, **query_params}
            
        action = body.get('action', '').upper()
        
        handlers = {
            'SEND_MESSAGE': handle_send_message,
            'SEND_INVITATION': handle_send_invitation,
            'ADD_REVIEW': handle_add_review,
            'GET_FREELANCER_REVIEWS': handle_get_freelancer_reviews,
            'GET_USER_INTERACTIONS': handle_get_user_interactions,
            'GET_SENT_INTERACTIONS': handle_get_sent_interactions,
            'GET_CONVERSATION': handle_get_conversation,
            'UPDATE_INTERACTION_STATUS': handle_update_interaction_status
        }
        
        if handler := handlers.get(action):
            return handler(body)
            
        return response(400, {"success": False, "error": {"code": "INVALID_ACTION", "message": f"Action {action} not supported"}})
        
    except json.JSONDecodeError:
        return response(400, {"success": False, "error": {"code": "INVALID_JSON", "message": "Invalid JSON mapping"}})
    except Exception as e:
        print(f"System Error: {str(e)}")
        return response(500, {"success": False, "error": {"code": "INTERNAL_ERROR", "message": "System fault"}})
