"""
Bids Handler Lambda Function
Handles CRUD operations for project bids/proposals

DynamoDB Table: Bids
Primary Key: bidId (String)
GSI: projectId-index (for querying bids by project)
GSI: freelancerId-index (for querying bids by freelancer)

Actions:
- CREATE_BID: Create a new bid/proposal
- GET_BIDS_BY_PROJECT: Get all bids for a specific project
- GET_BIDS_BY_FREELANCER: Get all bids by a specific freelancer
- GET_BID: Get a specific bid by ID
- UPDATE_BID_STATUS: Update bid status (accept/reject)
- DELETE_BID: Delete a bid
- CHECK_EXISTING_BID: Check if freelancer already bid on a project
"""

import json
import boto3
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
bids_table = dynamodb.Table('Bids')
users_table = dynamodb.Table('Users')

# Helper to convert Decimal to float for JSON serialization
def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj

# Response helper function
def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        'body': json.dumps(decimal_to_float(body))
    }


# ---------- CREATE BID ----------
def handle_create_bid(body):
    """Create a new bid/proposal for a project"""
    required_fields = ['projectId', 'freelancerId', 'freelancerName', 'freelancerEmail', 
                       'bidAmount', 'deliveryTime', 'deliveryTimeUnit', 'proposal']
    
    # Validate required fields
    for field in required_fields:
        if not body.get(field):
            return response(400, {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": f"Missing required field: {field}"
                }
            })
    
    project_id = body['projectId']
    freelancer_id = body['freelancerId']
    
    # Check if freelancer has already bid on this project
    existing_bid = check_existing_bid(freelancer_id, project_id)
    if existing_bid:
        return response(409, {
            "success": False,
            "error": {
                "code": "DUPLICATE_BID",
                "message": "You have already submitted a bid for this project"
            },
            "existingBid": existing_bid
        })
    
    # Create the bid
    bid_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    bid_item = {
        'bidId': bid_id,
        'projectId': project_id,
        'freelancerId': freelancer_id,
        'freelancerName': body['freelancerName'],
        'freelancerEmail': body['freelancerEmail'],
        'bidAmount': Decimal(str(body['bidAmount'])),
        'currency': body.get('currency', 'USD'),
        'deliveryTime': int(body['deliveryTime']),
        'deliveryTimeUnit': body['deliveryTimeUnit'],
        'proposal': body['proposal'],
        'status': 'pending',
        'submittedAt': timestamp,
        'updatedAt': timestamp
    }
    
    try:
        bids_table.put_item(Item=bid_item)
        
        return response(201, {
            "success": True,
            "message": "Bid submitted successfully",
            "data": {
                "bidId": bid_id,
                "projectId": project_id,
                "status": "pending",
                "submittedAt": timestamp
            }
        })
    except Exception as e:
        print(f"Error creating bid: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to submit bid"
            }
        })


# ---------- GET BIDS BY PROJECT ----------
def handle_get_bids_by_project(body):
    """Get all bids for a specific project"""
    project_id = body.get('projectId')
    
    if not project_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Project ID is required"
            }
        })
    
    try:
        # Query using GSI
        result = bids_table.query(
            IndexName='projectId-index',
            KeyConditionExpression=Key('projectId').eq(project_id)
        )
        
        bids = result.get('Items', [])
        
        # Sort by submission date (newest first)
        bids.sort(key=lambda x: x.get('submittedAt', ''), reverse=True)
        
        # Map to frontend format
        formatted_bids = []
        for bid in bids:
            formatted_bids.append({
                'id': bid['bidId'],
                'projectId': bid['projectId'],
                'freelancerId': bid['freelancerId'],
                'freelancerName': bid['freelancerName'],
                'freelancerEmail': bid['freelancerEmail'],
                'bidAmount': bid['bidAmount'],
                'currency': bid.get('currency', 'USD'),
                'deliveryTime': bid['deliveryTime'],
                'deliveryTimeUnit': bid['deliveryTimeUnit'],
                'proposal': bid['proposal'],
                'status': bid.get('status', 'pending'),
                'submittedAt': bid['submittedAt']
            })
        
        return response(200, {
            "success": True,
            "data": {
                "bids": formatted_bids,
                "count": len(formatted_bids)
            }
        })
    except Exception as e:
        print(f"Error fetching bids: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch bids"
            }
        })


# ---------- GET BIDS BY FREELANCER ----------
def handle_get_bids_by_freelancer(body):
    """Get all bids submitted by a specific freelancer"""
    freelancer_id = body.get('freelancerId')
    
    if not freelancer_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Freelancer ID is required"
            }
        })
    
    try:
        # Query using GSI
        result = bids_table.query(
            IndexName='freelancerId-index',
            KeyConditionExpression=Key('freelancerId').eq(freelancer_id)
        )
        
        bids = result.get('Items', [])
        
        # Sort by submission date (newest first)
        bids.sort(key=lambda x: x.get('submittedAt', ''), reverse=True)
        
        # Map to frontend format
        formatted_bids = []
        for bid in bids:
            formatted_bids.append({
                'id': bid['bidId'],
                'projectId': bid['projectId'],
                'freelancerId': bid['freelancerId'],
                'freelancerName': bid['freelancerName'],
                'freelancerEmail': bid['freelancerEmail'],
                'bidAmount': bid['bidAmount'],
                'currency': bid.get('currency', 'USD'),
                'deliveryTime': bid['deliveryTime'],
                'deliveryTimeUnit': bid['deliveryTimeUnit'],
                'proposal': bid['proposal'],
                'status': bid.get('status', 'pending'),
                'submittedAt': bid['submittedAt']
            })
        
        return response(200, {
            "success": True,
            "data": {
                "bids": formatted_bids,
                "count": len(formatted_bids)
            }
        })
    except Exception as e:
        print(f"Error fetching freelancer bids: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch bids"
            }
        })


# ---------- GET SINGLE BID ----------
def handle_get_bid(body):
    """Get a specific bid by ID"""
    bid_id = body.get('bidId')
    
    if not bid_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Bid ID is required"
            }
        })
    
    try:
        result = bids_table.get_item(Key={'bidId': bid_id})
        
        if 'Item' not in result:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Bid not found"
                }
            })
        
        bid = result['Item']
        
        return response(200, {
            "success": True,
            "data": {
                'id': bid['bidId'],
                'projectId': bid['projectId'],
                'freelancerId': bid['freelancerId'],
                'freelancerName': bid['freelancerName'],
                'freelancerEmail': bid['freelancerEmail'],
                'bidAmount': bid['bidAmount'],
                'currency': bid.get('currency', 'USD'),
                'deliveryTime': bid['deliveryTime'],
                'deliveryTimeUnit': bid['deliveryTimeUnit'],
                'proposal': bid['proposal'],
                'status': bid.get('status', 'pending'),
                'submittedAt': bid['submittedAt']
            }
        })
    except Exception as e:
        print(f"Error fetching bid: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch bid"
            }
        })


# ---------- UPDATE BID STATUS ----------
def handle_update_bid_status(body):
    """Update bid status (accept/reject) - Only project owner can do this"""
    bid_id = body.get('bidId')
    new_status = body.get('status')
    project_owner_id = body.get('projectOwnerId')  # For authorization
    
    if not bid_id or not new_status:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Bid ID and status are required"
            }
        })
    
    if new_status not in ['pending', 'accepted', 'rejected']:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Status must be: pending, accepted, or rejected"
            }
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        bids_table.update_item(
            Key={'bidId': bid_id},
            UpdateExpression="SET #status = :s, updatedAt = :u",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':s': new_status,
                ':u': timestamp
            }
        )
        
        return response(200, {
            "success": True,
            "message": f"Bid status updated to {new_status}",
            "data": {
                "bidId": bid_id,
                "status": new_status,
                "updatedAt": timestamp
            }
        })
    except Exception as e:
        print(f"Error updating bid status: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to update bid status"
            }
        })


# ---------- DELETE BID ----------
def handle_delete_bid(body):
    """Delete a bid - Only the freelancer who submitted can delete"""
    bid_id = body.get('bidId')
    freelancer_id = body.get('freelancerId')  # For authorization
    
    if not bid_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Bid ID is required"
            }
        })
    
    try:
        # First check if bid exists and belongs to the freelancer
        result = bids_table.get_item(Key={'bidId': bid_id})
        
        if 'Item' not in result:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Bid not found"
                }
            })
        
        bid = result['Item']
        
        # Authorization check
        if freelancer_id and bid['freelancerId'] != freelancer_id:
            return response(403, {
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You can only delete your own bids"
                }
            })
        
        # Delete the bid
        bids_table.delete_item(Key={'bidId': bid_id})
        
        return response(200, {
            "success": True,
            "message": "Bid deleted successfully"
        })
    except Exception as e:
        print(f"Error deleting bid: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to delete bid"
            }
        })


# ---------- CHECK EXISTING BID ----------
def check_existing_bid(freelancer_id, project_id):
    """Helper function to check if freelancer already bid on a project"""
    try:
        result = bids_table.query(
            IndexName='freelancerId-index',
            KeyConditionExpression=Key('freelancerId').eq(freelancer_id),
            FilterExpression=Attr('projectId').eq(project_id)
        )
        
        if result.get('Items'):
            return result['Items'][0]
        return None
    except Exception as e:
        print(f"Error checking existing bid: {str(e)}")
        return None


def handle_check_existing_bid(body):
    """API handler to check if freelancer already bid on a project"""
    freelancer_id = body.get('freelancerId')
    project_id = body.get('projectId')
    
    if not freelancer_id or not project_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Freelancer ID and Project ID are required"
            }
        })
    
    existing_bid = check_existing_bid(freelancer_id, project_id)
    
    if existing_bid:
        return response(200, {
            "success": True,
            "data": {
                "hasBid": True,
                "bid": {
                    'id': existing_bid['bidId'],
                    'projectId': existing_bid['projectId'],
                    'freelancerId': existing_bid['freelancerId'],
                    'bidAmount': existing_bid['bidAmount'],
                    'status': existing_bid.get('status', 'pending'),
                    'submittedAt': existing_bid['submittedAt']
                }
            }
        })
    
    return response(200, {
        "success": True,
        "data": {
            "hasBid": False,
            "bid": None
        }
    })


# ---------- LAMBDA HANDLER ----------
def lambda_handler(event, context):
    """Main Lambda handler - routes requests to appropriate functions"""
    print(f"Received event: {json.dumps(event)}")
    
    # Handle CORS preflight request
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method.upper() == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Max-Age': '86400'
            },
            'body': json.dumps({"message": "CORS preflight"})
        }
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # For GET requests with query parameters
        if event.get('httpMethod') == 'GET':
            query_params = event.get('queryStringParameters') or {}
            body = {**body, **query_params}
        
        # Route to appropriate handler based on action
        action = body.get('action', '').upper()
        
        action_handlers = {
            'CREATE_BID': handle_create_bid,
            'GET_BIDS_BY_PROJECT': handle_get_bids_by_project,
            'GET_BIDS_BY_FREELANCER': handle_get_bids_by_freelancer,
            'GET_BID': handle_get_bid,
            'UPDATE_BID_STATUS': handle_update_bid_status,
            'DELETE_BID': handle_delete_bid,
            'CHECK_EXISTING_BID': handle_check_existing_bid,
        }
        
        handler = action_handlers.get(action)
        
        if handler:
            return handler(body)
        else:
            return response(400, {
                "success": False,
                "error": {
                    "code": "INVALID_ACTION",
                    "message": f"Invalid action: {action}. Supported actions: {', '.join(action_handlers.keys())}"
                }
            })
            
    except json.JSONDecodeError as e:
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_JSON",
                "message": "Invalid JSON in request body"
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
