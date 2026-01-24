import json
import boto3
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
# Table structure: Partition Key = userId (String)
table_name = 'UserPlacementProgress'
table = dynamodb.Table(table_name)

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }

def get_progress(user_id):
    if not user_id:
        return response(400, {"success": False, "message": "User ID is required"})
    
    try:
        res = table.get_item(Key={'userId': user_id})
        if 'Item' in res:
            return response(200, {"success": True, "data": res['Item'].get('progress', {})})
        return response(200, {"success": True, "data": None})
    except Exception as e:
        print(f"Error getting progress: {e}")
        return response(500, {"success": False, "message": str(e)})

def update_progress(user_id, progress):
    if not user_id or progress is None:
        return response(400, {"success": False, "message": "User ID and progress data are required"})
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        table.put_item(
            Item={
                'userId': user_id,
                'progress': progress,
                'updatedAt': timestamp
            }
        )
        return response(200, {"success": True, "message": "Progress updated successfully"})
    except Exception as e:
        print(f"Error updating progress: {e}")
        return response(500, {"success": False, "message": str(e)})

def reset_progress(user_id):
    if not user_id:
        return response(400, {"success": False, "message": "User ID is required"})
    
    try:
        table.delete_item(Key={'userId': user_id})
        return response(200, {"success": True, "message": "Progress reset successfully"})
    except Exception as e:
        print(f"Error resetting progress: {e}")
        return response(500, {"success": False, "message": str(e)})

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'POST')
        if http_method == 'OPTIONS':
            return response(204, None)
        
        # Parse body
        body = {}
        if event.get('body'):
            body = json.loads(event['body'])
            
        action = body.get('action')
        user_id = body.get('userId')
        
        if action == 'get_progress':
            return get_progress(user_id)
        elif action == 'update_progress':
            return update_progress(user_id, body.get('progress'))
        elif action == 'reset_progress':
            return reset_progress(user_id)
        else:
            return response(400, {"success": False, "message": f"Invalid action: {action}"})
            
    except Exception as e:
        print(f"Lambda error: {e}")
        return response(500, {"success": False, "message": "Internal server error"})
