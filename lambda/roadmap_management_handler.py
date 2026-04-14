import json
import boto3
from botocore.exceptions import ClientError
from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Any

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
ROADMAP_TABLE = 'Roadmaps'  # Single table for all roadmap data

def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create API Gateway response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '3600'
        },
        'body': json.dumps(body, default=decimal_default)
    }

def decimal_default(obj):
    """Convert Decimal to int/float for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def handle_list_categories():
    """List all categories from roadmaps table"""
    try:
        table = dynamodb.Table(ROADMAP_TABLE)
        scan_response = table.scan()
        items = scan_response.get('Items', [])
        
        # Extract unique categories
        categories = []
        seen_ids = set()
        for item in items:
            cat_id = item.get('categoryId')
            if cat_id and cat_id not in seen_ids:
                categories.append({
                    'id': cat_id,
                    'name': item.get('categoryName', cat_id),
                    'icon': item.get('icon', '📚'),
                    'createdAt': item.get('createdAt', ''),
                    'updatedAt': item.get('updatedAt', '')
                })
                seen_ids.add(cat_id)
        
        # Sort by name
        categories.sort(key=lambda x: x.get('name', ''))
        
        return response(200, {
            'success': True,
            'categories': categories
        })
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'ResourceNotFoundException':
            # Table doesn't exist - return empty list
            return response(200, {
                'success': True,
                'categories': []
            })
        else:
            return response(500, {
                'success': False,
                'error': str(e)
            })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': str(e)
        })

def handle_delete_category(category_id: str):
    """Delete a category roadmap"""
    try:
        table = dynamodb.Table(ROADMAP_TABLE)
        table.delete_item(Key={'categoryId': category_id})
        
        return response(200, {
            'success': True,
            'message': 'Category deleted successfully'
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': str(e)
        })

def handle_get_roadmap(category_id: str, duration: str = None):
    """Get complete roadmap for a category - returns all data including category, weeks, resources, and quiz questions.
    If duration is provided, it returns the specific weeks for that program duration from the 'programs' map.
    """
    try:
        table = dynamodb.Table(ROADMAP_TABLE)
        db_response = table.get_item(Key={'categoryId': category_id})
        
        if 'Item' in db_response:
            roadmap = db_response['Item']
            
            # If a specific duration is requested, swap the top-level 'weeks' with that program's weeks
            if duration:
                programs = roadmap.get('programs', {})
                specific_program = programs.get(str(duration), {})
                duration_weeks = specific_program.get('weeks', [])
                
                # Fallback: If requested duration is 8 and specific slot is empty, use global weeks
                if not duration_weeks and str(duration) == '8':
                    duration_weeks = roadmap.get('weeks', [])
                
                roadmap['weeks'] = duration_weeks
                roadmap['selectedDuration'] = duration
            
            # Sort weeks by weekNumber
            if 'weeks' in roadmap and isinstance(roadmap['weeks'], list):
                roadmap['weeks'].sort(key=lambda x: x.get('weekNumber', 0))
            
            # Ensure all fields are present
            if 'icon' not in roadmap:
                roadmap['icon'] = '📚'
            if 'weeks' not in roadmap:
                roadmap['weeks'] = []
            if 'programs' not in roadmap:
                roadmap['programs'] = {}
            
            return response(200, {
                'success': True,
                'roadmap': roadmap
            })
        else:
            # Return empty roadmap structure
            return response(200, {
                'success': True,
                'roadmap': {
                    'categoryId': category_id,
                    'categoryName': '',
                    'icon': '📚',
                    'weeks': [],
                    'programs': {},
                    'createdAt': datetime.utcnow().isoformat(),
                    'updatedAt': datetime.utcnow().isoformat()
                }
            })
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'ResourceNotFoundException':
            # Table doesn't exist or item doesn't exist - return empty roadmap
            return response(200, {
                'success': True,
                'roadmap': {
                    'categoryId': category_id,
                    'categoryName': '',
                    'icon': '📚',
                    'weeks': [],
                    'createdAt': datetime.utcnow().isoformat(),
                    'updatedAt': datetime.utcnow().isoformat()
                }
            })
        else:
            return response(500, {
                'success': False,
                'error': f'Failed to get roadmap: {str(e)}'
            })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to get roadmap: {str(e)}'
        })

def handle_save_roadmap(event_body: Dict):
    """Save or update complete roadmap for a category.
    Supports duration-specific roadmaps via 'programDuration' and 'weeks'.
    """
    try:
        category_id = (event_body.get('categoryId') or '').strip()
        category_name = (event_body.get('categoryName') or '').strip()
        icon = (event_body.get('icon') or '📚').strip()
        weeks = event_body.get('weeks', [])
        program_duration = event_body.get('programDuration') # e.g., "8", "4", "3"
        
        
        if not category_id:
            return response(400, {
                'success': False,
                'error': 'Category ID is required'
            })
        
        if not category_name:
            return response(400, {
                'success': False,
                'error': 'Category name is required'
            })
        
        # Validate and normalize weeks - ensure all data is properly stored
        normalized_weeks = []
        for week in weeks:
            # Validate week structure - must have at least main topics
            if not week.get('mainTopics') or len(week.get('mainTopics', [])) == 0:
                continue  # Skip invalid weeks
            
            # Normalize week data
            normalized_week = {
                'weekNumber': int(week.get('weekNumber', 0)),
                'mainTopics': [str(t).strip() for t in week.get('mainTopics', []) if str(t).strip()],
                'subtopics': [str(s).strip() for s in week.get('subtopics', []) if str(s).strip()],
                'practicalTasks': [str(t).strip() for t in week.get('practicalTasks', []) if str(t).strip()],
                'miniProject': str(week.get('miniProject', '')).strip(),
                'roadmap': str(week.get('roadmap', '')).strip(),
                'resources': [],
                'quiz': []
            }
            
            # Validate and normalize resources
            if week.get('resources'):
                for res in week.get('resources', []):
                    if res.get('type') and res.get('title') and res.get('url'):
                        normalized_week['resources'].append({
                            'type': str(res.get('type', '')).strip(),
                            'title': str(res.get('title', '')).strip(),
                            'url': str(res.get('url', '')).strip()
                        })
            
            # Validate and normalize quiz questions - ensure all questions, options, and correct answers are stored
            if week.get('quiz'):
                for q in week.get('quiz', []):
                    question_text = str(q.get('question', '')).strip()
                    options = q.get('options', [])
                    correct_answer = q.get('correctAnswer', 0)
                    
                    # Validate quiz question structure
                    if question_text and isinstance(options, list) and len(options) >= 2:
                        # Ensure exactly 4 options (pad with empty strings if needed)
                        normalized_options = [str(o).strip() for o in options[:4]]
                        while len(normalized_options) < 4:
                            normalized_options.append('')
                        
                        # Ensure correctAnswer is valid index
                        correct_idx = int(correct_answer)
                        if correct_idx < 0 or correct_idx >= len(normalized_options):
                            correct_idx = 0
                        
                        normalized_week['quiz'].append({
                            'question': question_text,
                            'options': normalized_options,
                            'correctAnswer': correct_idx
                        })
            
            normalized_weeks.append(normalized_week)
        
        # Sort weeks by weekNumber
        normalized_weeks.sort(key=lambda x: x.get('weekNumber', 0))
        
        # Get existing item
        table = dynamodb.Table(ROADMAP_TABLE)
        try:
            existing_response = table.get_item(Key={'categoryId': category_id})
            existing_item = existing_response.get('Item', {})
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'ResourceNotFoundException':
                existing_item = {}
            else:
                raise
        except:
            existing_item = {}

        # Update the specific program if duration provided
        programs = existing_item.get('programs', {})
        if program_duration:
            # Get existing weeks for this program duration
            existing_program = programs.get(str(program_duration), {})
            existing_weeks = existing_program.get('weeks', [])
            
            # Merge weeks by weekNumber - update existing or add new
            # Create a map of existing weeks by weekNumber
            existing_weeks_map = {w.get('weekNumber'): w for w in existing_weeks}
            
            # Update or add normalized weeks
            for new_week in normalized_weeks:
                week_num = new_week.get('weekNumber')
                existing_weeks_map[week_num] = new_week
            
            # Convert back to sorted list
            merged_weeks = list(existing_weeks_map.values())
            merged_weeks.sort(key=lambda x: x.get('weekNumber', 0))
            
            programs[str(program_duration)] = {
                'weeks': merged_weeks,
                'updatedAt': datetime.utcnow().isoformat()
            }
        
        # Determine what to use for top-level 'weeks'
        # Only update global weeks if: no duration specified, OR duration is 8
        existing_global_weeks = existing_item.get('weeks', [])
        
        if not program_duration or str(program_duration) == '8':
            # Merge with existing global weeks by weekNumber
            existing_global_map = {w.get('weekNumber'): w for w in existing_global_weeks}
            for new_week in normalized_weeks:
                week_num = new_week.get('weekNumber')
                existing_global_map[week_num] = new_week
            global_weeks = list(existing_global_map.values())
            global_weeks.sort(key=lambda x: x.get('weekNumber', 0))
        else:
            # Preserve existing global weeks for non-8 duration saves
            global_weeks = existing_global_weeks
        
        # Prepare item with all data
        item = {
            'categoryId': category_id,
            'categoryName': category_name,
            'icon': icon,
            'weeks': global_weeks,
            'programs': programs,
            'updatedAt': datetime.utcnow().isoformat(),
            'createdAt': existing_item.get('createdAt', datetime.utcnow().isoformat())
        }
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        return response(200, {
            'success': True,
            'message': 'Roadmap saved successfully with all data (category, weeks, resources, quiz questions)',
            'roadmap': item
        })
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'ResourceNotFoundException':
            return response(500, {
                'success': False,
                'error': f'DynamoDB table "{ROADMAP_TABLE}" does not exist. Please create the table first.'
            })
        else:
            return response(500, {
                'success': False,
                'error': f'Failed to save roadmap: {str(e)}'
            })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to save roadmap: {str(e)}'
        })

def handle_list_all_roadmaps():
    """List all roadmaps"""
    try:
        table = dynamodb.Table(ROADMAP_TABLE)
        scan_response = table.scan()
        roadmaps = scan_response.get('Items', [])
        
        # Sort weeks for each roadmap
        for roadmap in roadmaps:
            if 'weeks' in roadmap:
                roadmap['weeks'].sort(key=lambda x: x.get('weekNumber', 0))
        
        return response(200, {
            'success': True,
            'roadmaps': roadmaps
        })
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'ResourceNotFoundException':
            # Table doesn't exist - return empty list
            return response(200, {
                'success': True,
                'roadmaps': []
            })
        else:
            return response(500, {
                'success': False,
                'error': str(e)
            })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': str(e)
        })

def lambda_handler(event, context):
    """
    Main Lambda handler - handles all CRUD operations for roadmaps
    
    Supported operations:
    - GET: List categories, get roadmap, list all roadmaps
    - SAVE: Create/update roadmap (stores category, weeks, resources, quiz questions)
    - DELETE: Delete category/roadmap
    
    Request format:
    {
        "resource": "categories" | "roadmap",
        "action": "list" | "get" | "save" | "delete",
        "categoryId": "...",  // for get/delete
        // For save:
        "categoryId": "...",
        "categoryName": "...",
        "icon": "...",
        "weeks": [...]
    }
    """
    try:
        # Handle CORS preflight
        http_method = (
            event.get('httpMethod') or 
            event.get('requestContext', {}).get('http', {}).get('method') or
            'POST'
        )
        
        if http_method == 'OPTIONS':
            return response(200, {'message': 'OK'})
        
        # Parse request body
        body = {}
        if isinstance(event.get('body'), str):
            try:
                body = json.loads(event.get('body', '{}'))
            except:
                body = {}
        elif event.get('body'):
            body = event.get('body')
        
        # Get action and resource
        action = body.get('action', '').lower()
        resource = body.get('resource', '').lower()
        
        # Route requests based on resource and action
        
        # ========== CATEGORIES OPERATIONS ==========
        if resource == 'categories':
            if action == 'list':
                return handle_list_categories()
            elif action == 'delete':
                category_id = body.get('categoryId')
                if category_id:
                    return handle_delete_category(category_id)
                return response(400, {'success': False, 'error': 'Category ID required for delete'})
            else:
                return response(400, {'success': False, 'error': f'Invalid action for categories: {action}'})
        
        # ========== ROADMAP OPERATIONS ==========
        elif resource == 'roadmap':
            if action == 'get':
                category_id = body.get('categoryId')
                duration = body.get('duration')
                if category_id:
                    return handle_get_roadmap(category_id, duration)
                return response(400, {'success': False, 'error': 'Category ID required for get'})
            
            elif action == 'save' or action == 'create' or action == 'update':
                # Save/update roadmap - stores everything
                return handle_save_roadmap(body)
            
            elif action == 'list':
                return handle_list_all_roadmaps()
            
            elif action == 'delete':
                category_id = body.get('categoryId')
                if category_id:
                    return handle_delete_category(category_id)
                return response(400, {'success': False, 'error': 'Category ID required for delete'})
            
            else:
                return response(400, {'success': False, 'error': f'Invalid action for roadmap: {action}'})
        
        # Invalid resource
        return response(400, {
            'success': False,
            'error': f'Invalid resource: {resource}. Use "categories" or "roadmap"'
        })
    
    except json.JSONDecodeError as e:
        return response(400, {
            'success': False,
            'error': f'Invalid JSON in request body: {str(e)}'
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Internal server error: {str(e)}'
        })

