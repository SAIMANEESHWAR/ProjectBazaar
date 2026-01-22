"""
Bid Request Projects Handler Lambda Function
Handles CRUD operations for bid request projects (job postings by buyers)

DynamoDB Table: BidRequestProjects
Primary Key: projectId (String)
GSI: buyerId-index (for querying projects by buyer)
GSI: status-index (for querying by status)

Actions:
- CREATE_PROJECT: Create a new bid request project (by buyer)
- GET_ALL_PROJECTS: Get all open bid request projects (for freelancers to browse)
- GET_PROJECT: Get a specific project by ID
- GET_PROJECTS_BY_BUYER: Get all projects posted by a specific buyer
- UPDATE_PROJECT: Update project details
- UPDATE_PROJECT_STATUS: Update project status (open/in_progress/completed/cancelled)
- DELETE_PROJECT: Delete a project
"""

import json
import boto3
import uuid
import traceback
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
bid_request_projects_table = dynamodb.Table('BidRequestProjects')
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


# ---------- CREATE PROJECT ----------
def handle_create_project(body):
    """Create a new bid request project (posted by buyer)"""
    required_fields = ['buyerId', 'buyerEmail', 'title', 'description', 'budgetMin', 'budgetMax', 'skills']
    
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
    
    # Create the project
    project_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    project_item = {
        'projectId': project_id,
        'buyerId': body['buyerId'],
        'buyerEmail': body['buyerEmail'],
        'buyerName': body.get('buyerName', body['buyerEmail'].split('@')[0]),
        'buyerProfilePicture': body.get('buyerProfilePicture'),
        'title': body['title'],
        'description': body['description'],
        'projectType': body.get('projectType', 'fixed'),  # 'fixed' or 'hourly'
        'budgetMin': Decimal(str(body['budgetMin'])),
        'budgetMax': Decimal(str(body['budgetMax'])),
        'currency': body.get('currency', 'USD'),
        'skills': body['skills'],  # List of required skills
        'category': body.get('category', 'General'),
        'attachments': body.get('attachments', []),  # URLs to any attachments
        'status': 'open',  # open, in_progress, completed, cancelled
        'bidsCount': 0,
        'createdAt': timestamp,
        'updatedAt': timestamp,
        'deadline': body.get('deadline'),  # Optional deadline
        'estimatedDuration': body.get('estimatedDuration'),  # e.g., "2-3 weeks"
    }
    
    try:
        bid_request_projects_table.put_item(Item=project_item)
        
        return response(201, {
            "success": True,
            "message": "Bid request project created successfully",
            "data": {
                "projectId": project_id,
                "status": "open",
                "createdAt": timestamp
            }
        })
    except Exception as e:
        print(f"Error creating bid request project: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to create bid request project"
            }
        })


# ---------- GET ALL PROJECTS (for freelancers to browse) ----------
def handle_get_all_projects(body):
    """Get all open bid request projects for freelancers to browse"""
    try:
        # Query for open projects
        scan_params = {
            'FilterExpression': Attr('status').eq('open')
        }
        
        # Optional: filter by category
        if body.get('category'):
            scan_params['FilterExpression'] = scan_params['FilterExpression'] & Attr('category').eq(body['category'])
        
        # Optional: filter by skills
        if body.get('skills') and len(body['skills']) > 0:
            for skill in body['skills']:
                scan_params['FilterExpression'] = scan_params['FilterExpression'] & Attr('skills').contains(skill)
        
        result = bid_request_projects_table.scan(**scan_params)
        projects = result.get('Items', [])
        
        # Sort by createdAt (newest first)
        projects.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Calculate time ago for each project
        for project in projects:
            project['postedTimeAgo'] = calculate_time_ago(project.get('createdAt', ''))
        
        return response(200, {
            "success": True,
            "data": {
                "projects": projects,
                "count": len(projects)
            }
        })
    except Exception as e:
        print(f"Error fetching bid request projects: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch bid request projects"
            }
        })


def calculate_time_ago(date_string):
    """Calculate human-readable time ago string"""
    if not date_string:
        return "Unknown"
    
    try:
        posted_date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        now = datetime.now(posted_date.tzinfo)
        diff = now - posted_date
        
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days > 1 else ''} ago"
        else:
            return posted_date.strftime("%m/%d/%Y")
    except:
        return "Unknown"


# ---------- GET PROJECT BY ID ----------
def handle_get_project(body):
    """Get a specific bid request project by ID"""
    project_id = body.get('projectId')
    
    if not project_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required field: projectId"
            }
        })
    
    try:
        result = bid_request_projects_table.get_item(Key={'projectId': project_id})
        project = result.get('Item')
        
        if not project:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Project not found"
                }
            })
        
        project['postedTimeAgo'] = calculate_time_ago(project.get('createdAt', ''))
        
        return response(200, {
            "success": True,
            "data": {
                "project": project
            }
        })
    except Exception as e:
        print(f"Error fetching project: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch project"
            }
        })


# ---------- GET PROJECTS BY BUYER ----------
def handle_get_projects_by_buyer(body):
    """Get all bid request projects posted by a specific buyer"""
    buyer_id = body.get('buyerId')
    
    if not buyer_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required field: buyerId"
            }
        })
    
    try:
        projects = []
        
        # Try using GSI first, fall back to scan if GSI doesn't exist
        try:
            result = bid_request_projects_table.query(
                IndexName='buyerId-index',
                KeyConditionExpression=Key('buyerId').eq(buyer_id)
            )
            projects = result.get('Items', [])
        except Exception as gsi_error:
            # GSI might not exist, fall back to scan
            print(f"GSI query failed, falling back to scan: {str(gsi_error)}")
            result = bid_request_projects_table.scan(
                FilterExpression=Attr('buyerId').eq(buyer_id)
            )
            projects = result.get('Items', [])
        
        # Sort by createdAt (newest first)
        projects.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        for project in projects:
            project['postedTimeAgo'] = calculate_time_ago(project.get('createdAt', ''))
        
        return response(200, {
            "success": True,
            "data": {
                "projects": projects,
                "count": len(projects)
            }
        })
    except Exception as e:
        print(f"Error fetching buyer's projects: {str(e)}")
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": f"Failed to fetch buyer's projects: {str(e)}"
            }
        })


# ---------- UPDATE PROJECT ----------
def handle_update_project(body):
    """Update a bid request project"""
    project_id = body.get('projectId')
    buyer_id = body.get('buyerId')
    
    if not project_id or not buyer_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required fields: projectId and buyerId"
            }
        })
    
    try:
        # First, verify the project belongs to the buyer
        result = bid_request_projects_table.get_item(Key={'projectId': project_id})
        project = result.get('Item')
        
        if not project:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Project not found"
                }
            })
        
        if project['buyerId'] != buyer_id:
            return response(403, {
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You can only update your own projects"
                }
            })
        
        # Build update expression
        update_expressions = []
        expression_values = {}
        expression_names = {}
        
        allowed_fields = ['title', 'description', 'budgetMin', 'budgetMax', 'skills', 
                          'category', 'deadline', 'estimatedDuration', 'attachments']
        
        for field in allowed_fields:
            if field in body:
                update_expressions.append(f"#{field} = :{field}")
                expression_names[f"#{field}"] = field
                if field in ['budgetMin', 'budgetMax']:
                    expression_values[f":{field}"] = Decimal(str(body[field]))
                else:
                    expression_values[f":{field}"] = body[field]
        
        # Always update updatedAt
        update_expressions.append("#updatedAt = :updatedAt")
        expression_names["#updatedAt"] = "updatedAt"
        expression_values[":updatedAt"] = datetime.utcnow().isoformat() + "Z"
        
        if not update_expressions:
            return response(400, {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "No fields to update"
                }
            })
        
        bid_request_projects_table.update_item(
            Key={'projectId': project_id},
            UpdateExpression="SET " + ", ".join(update_expressions),
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
        
        return response(200, {
            "success": True,
            "message": "Project updated successfully"
        })
    except Exception as e:
        print(f"Error updating project: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to update project"
            }
        })


# ---------- UPDATE PROJECT STATUS ----------
def handle_update_project_status(body):
    """Update the status of a bid request project"""
    project_id = body.get('projectId')
    buyer_id = body.get('buyerId')
    new_status = body.get('status')
    
    valid_statuses = ['open', 'in_progress', 'completed', 'cancelled']
    
    if not project_id or not buyer_id or not new_status:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required fields: projectId, buyerId, and status"
            }
        })
    
    if new_status not in valid_statuses:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }
        })
    
    try:
        # Verify project ownership
        result = bid_request_projects_table.get_item(Key={'projectId': project_id})
        project = result.get('Item')
        
        if not project:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Project not found"
                }
            })
        
        if project['buyerId'] != buyer_id:
            return response(403, {
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You can only update your own projects"
                }
            })
        
        bid_request_projects_table.update_item(
            Key={'projectId': project_id},
            UpdateExpression="SET #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames={
                "#status": "status",
                "#updatedAt": "updatedAt"
            },
            ExpressionAttributeValues={
                ":status": new_status,
                ":updatedAt": datetime.utcnow().isoformat() + "Z"
            }
        )
        
        return response(200, {
            "success": True,
            "message": f"Project status updated to {new_status}"
        })
    except Exception as e:
        print(f"Error updating project status: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to update project status"
            }
        })


# ---------- DELETE PROJECT ----------
def handle_delete_project(body):
    """Delete a bid request project"""
    project_id = body.get('projectId')
    buyer_id = body.get('buyerId')
    
    if not project_id or not buyer_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required fields: projectId and buyerId"
            }
        })
    
    try:
        # Verify project ownership
        result = bid_request_projects_table.get_item(Key={'projectId': project_id})
        project = result.get('Item')
        
        if not project:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Project not found"
                }
            })
        
        if project['buyerId'] != buyer_id:
            return response(403, {
                "success": False,
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You can only delete your own projects"
                }
            })
        
        bid_request_projects_table.delete_item(Key={'projectId': project_id})
        
        return response(200, {
            "success": True,
            "message": "Project deleted successfully"
        })
    except Exception as e:
        print(f"Error deleting project: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to delete project"
            }
        })


# ---------- INCREMENT BIDS COUNT ----------
def handle_increment_bids_count(body):
    """Increment the bids count for a project (called when a new bid is placed)"""
    project_id = body.get('projectId')
    
    if not project_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required field: projectId"
            }
        })
    
    try:
        bid_request_projects_table.update_item(
            Key={'projectId': project_id},
            UpdateExpression="SET bidsCount = bidsCount + :inc",
            ExpressionAttributeValues={":inc": 1}
        )
        
        return response(200, {
            "success": True,
            "message": "Bids count incremented"
        })
    except Exception as e:
        print(f"Error incrementing bids count: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to increment bids count"
            }
        })


# ---------- DECREMENT BIDS COUNT ----------
def handle_decrement_bids_count(body):
    """Decrement the bids count for a project (called when a bid is withdrawn/deleted)"""
    project_id = body.get('projectId')
    
    if not project_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required field: projectId"
            }
        })
    
    try:
        # Use conditional expression to ensure count doesn't go below 0
        bid_request_projects_table.update_item(
            Key={'projectId': project_id},
            UpdateExpression="SET bidsCount = if_not_exists(bidsCount, :zero) - :dec",
            ConditionExpression="bidsCount > :zero",
            ExpressionAttributeValues={
                ":dec": 1,
                ":zero": 0
            }
        )
        
        return response(200, {
            "success": True,
            "message": "Bids count decremented"
        })
    except bid_request_projects_table.meta.client.exceptions.ConditionalCheckFailedException:
        # Bid count is already 0, just return success
        return response(200, {
            "success": True,
            "message": "Bids count already at zero"
        })
    except Exception as e:
        print(f"Error decrementing bids count: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to decrement bids count"
            }
        })


# ---------- MAIN HANDLER ----------
def lambda_handler(event, context):
    """Main Lambda handler"""
    print(f"Received event: {json.dumps(event)}")
    
    # Handle OPTIONS request for CORS preflight
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
        body = {}
        if event.get('body'):
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        # Get action from body or query params
        action = body.get('action') or event.get('queryStringParameters', {}).get('action', '')
        
        # Route to appropriate handler
        handlers = {
            'CREATE_PROJECT': handle_create_project,
            'GET_ALL_PROJECTS': handle_get_all_projects,
            'GET_PROJECT': handle_get_project,
            'GET_PROJECTS_BY_BUYER': handle_get_projects_by_buyer,
            'UPDATE_PROJECT': handle_update_project,
            'UPDATE_PROJECT_STATUS': handle_update_project_status,
            'DELETE_PROJECT': handle_delete_project,
            'INCREMENT_BIDS_COUNT': handle_increment_bids_count,
            'DECREMENT_BIDS_COUNT': handle_decrement_bids_count,
        }
        
        handler = handlers.get(action)
        
        if handler:
            return handler(body)
        else:
            return response(400, {
                "success": False,
                "error": {
                    "code": "INVALID_ACTION",
                    "message": f"Unknown action: {action}. Valid actions: {', '.join(handlers.keys())}"
                }
            })
    
    except json.JSONDecodeError:
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_JSON",
                "message": "Invalid JSON in request body"
            }
        })
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        })
