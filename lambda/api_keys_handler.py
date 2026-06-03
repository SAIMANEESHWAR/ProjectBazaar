import json
import boto3
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ApiKeyConfig')  # DynamoDB table for API key storage

# Response helper function
def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
        },
        'body': json.dumps(body)
    }

# ---------- GET API KEYS ----------
def get_api_keys(user_id):
    """
    Retrieve API key configuration for a user.
    Keys are stored encrypted and only partially revealed in response.
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "User ID is required"
            }
        })

    try:
        result = table.get_item(Key={"userId": user_id})
        
        if 'Item' not in result:
            return response(200, {
                "success": True,
                "data": {
                    "configured": False,
                    "config": {
                        "provider": "gemini",
                        "hasGeminiKey": False,
                        "hasGrokKey": False
                    }
                }
            })
        
        item = result['Item']
        
        # Return configuration without exposing full keys
        return response(200, {
            "success": True,
            "data": {
                "configured": True,
                "config": {
                    "provider": item.get("provider", "gemini"),
                    "hasGeminiKey": bool(item.get("geminiKey")),
                    "hasGrokKey": bool(item.get("grokKey")),
                    # Optionally return masked keys for display
                    "geminiKeyMasked": mask_key(item.get("geminiKey", "")),
                    "grokKeyMasked": mask_key(item.get("grokKey", ""))
                },
                "updatedAt": item.get("updatedAt")
            }
        })
        
    except Exception as e:
        print(f"Error getting API keys: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Failed to retrieve API key configuration"
            }
        })

# ---------- SAVE API KEYS ----------
def save_api_keys(user_id, config):
    """
    Save API key configuration for a user.
    Keys are stored securely in DynamoDB.
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "User ID is required"
            }
        })
    
    if not config:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Configuration is required"
            }
        })

    provider = config.get("provider", "gemini")
    gemini_key = config.get("geminiKey", "")
    grok_key = config.get("grokKey", "")

    # Validate provider
    if provider not in ["gemini", "grok"]:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid provider. Must be 'gemini' or 'grok'"
            }
        })

    # Validate at least one key is provided
    if not gemini_key and not grok_key:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "At least one API key is required"
            }
        })

    # Validate selected provider has a key
    if provider == "gemini" and not gemini_key:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Gemini API key is required when Gemini is selected as provider"
            }
        })
    
    if provider == "grok" and not grok_key:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Grok API key is required when Grok is selected as provider"
            }
        })

    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Store the configuration
        item = {
            "userId": user_id,
            "provider": provider,
            "updatedAt": timestamp
        }
        
        # Only store keys that are provided
        if gemini_key:
            item["geminiKey"] = gemini_key
        if grok_key:
            item["grokKey"] = grok_key

        table.put_item(Item=item)

        return response(200, {
            "success": True,
            "message": "API keys saved successfully",
            "data": {
                "provider": provider,
                "hasGeminiKey": bool(gemini_key),
                "hasGrokKey": bool(grok_key),
                "updatedAt": timestamp
            }
        })

    except Exception as e:
        print(f"Error saving API keys: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Failed to save API key configuration"
            }
        })

# ---------- DELETE API KEYS ----------
def delete_api_keys(user_id):
    """
    Delete API key configuration for a user.
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "User ID is required"
            }
        })

    try:
        table.delete_item(Key={"userId": user_id})
        
        return response(200, {
            "success": True,
            "message": "API keys deleted successfully"
        })

    except Exception as e:
        print(f"Error deleting API keys: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Failed to delete API key configuration"
            }
        })

# ---------- GET FULL KEYS (for AI generation) ----------
def get_full_api_keys(user_id):
    """
    Retrieve full API keys for a user (used internally for AI generation).
    This should be called only from backend services.
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "User ID is required"
            }
        })

    try:
        result = table.get_item(Key={"userId": user_id})
        
        if 'Item' not in result:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "No API keys configured for this user"
                }
            })
        
        item = result['Item']
        
        return response(200, {
            "success": True,
            "data": {
                "provider": item.get("provider", "gemini"),
                "geminiKey": item.get("geminiKey", ""),
                "grokKey": item.get("grokKey", "")
            }
        })
        
    except Exception as e:
        print(f"Error getting full API keys: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Failed to retrieve API keys"
            }
        })

# ---------- HELPER FUNCTIONS ----------
def mask_key(key):
    """Mask an API key for display, showing only first 4 and last 4 characters."""
    if not key or len(key) < 12:
        return ""
    return f"{key[:4]}{'*' * (len(key) - 8)}{key[-4:]}"

# ---------- LAMBDA HANDLER ----------
def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return response(200, {})
        
        # Parse request body
        body = {}
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        elif event.get('body'):
            body = event['body']
        
        # Get user ID from various sources
        # 1. From body
        user_id = body.get('userId')
        
        # 2. From query parameters
        if not user_id:
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('userId')
        
        # 3. From path parameters
        if not user_id:
            path_params = event.get('pathParameters') or {}
            user_id = path_params.get('userId')
        
        # 4. From Authorization header (if using JWT)
        # headers = event.get('headers') or {}
        # if headers.get('Authorization'):
        #     user_id = decode_jwt(headers['Authorization'])
        
        # Route to appropriate handler based on action
        action = body.get('action', '').lower()
        http_method = event.get('httpMethod', 'GET')
        
        if action == 'save' or http_method == 'POST':
            config = body.get('config', {})
            return save_api_keys(user_id, config)
        
        elif action == 'delete' or http_method == 'DELETE':
            return delete_api_keys(user_id)
        
        elif action == 'get_full':
            # This action should be restricted to backend services
            return get_full_api_keys(user_id)
        
        elif action == 'get' or http_method == 'GET':
            return get_api_keys(user_id)
        
        else:
            return response(400, {
                "success": False,
                "error": {
                    "code": "INVALID_ACTION",
                    "message": "Invalid action. Supported actions: get, save, delete, get_full"
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
        print(f"Error: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An error occurred processing your request"
            }
        })


"""
========================================
AWS SETUP INSTRUCTIONS
========================================

1. Create DynamoDB Table:
   - Table name: ApiKeyConfig
   - Partition key: userId (String)
   - Enable encryption at rest
   - Consider enabling point-in-time recovery for data safety

2. Create Lambda Function:
   - Runtime: Python 3.9+
   - Handler: api_keys_handler.lambda_handler
   - Memory: 128 MB (should be sufficient)
   - Timeout: 10 seconds
   - Environment variables: None required

3. IAM Role Permissions:
   The Lambda execution role needs the following permissions:
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "dynamodb:GetItem",
                   "dynamodb:PutItem",
                   "dynamodb:DeleteItem"
               ],
               "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ApiKeyConfig"
           },
           {
               "Effect": "Allow",
               "Action": [
                   "logs:CreateLogGroup",
                   "logs:CreateLogStream",
                   "logs:PutLogEvents"
               ],
               "Resource": "arn:aws:logs:*:*:*"
           }
       ]
   }

4. API Gateway Setup:
   - Create a REST API
   - Create resource: /api-keys
   - Create methods: GET, POST, DELETE, OPTIONS
   - Enable CORS
   - Deploy to a stage (e.g., 'prod')

5. Security Considerations:
   - Enable AWS KMS encryption for DynamoDB table
   - Consider using AWS Secrets Manager for additional security
   - Implement proper authentication (e.g. Google ID token / JWT authorizer)
   - Enable API Gateway throttling
   - Set up CloudWatch alarms for monitoring

6. Frontend Integration:
   Update the API_KEY_LAMBDA_ENDPOINT in CodingQuestionsManagementPage.tsx:
   const API_KEY_LAMBDA_ENDPOINT = 'https://your-api-id.execute-api.region.amazonaws.com/prod/api-keys';

========================================
"""
