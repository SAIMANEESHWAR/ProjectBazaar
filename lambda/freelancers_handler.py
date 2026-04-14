"""
Freelancers Handler Lambda Function
Fetches users who are sellers/freelancers from the Users table

DynamoDB Table: Users
Filters users with role = 'seller' or 'freelancer' or who have uploaded projects

Actions:
- GET_ALL_FREELANCERS: Get all freelancers with pagination
- GET_FREELANCER_BY_ID: Get a specific freelancer's profile
- GET_TOP_FREELANCERS: Get top-rated freelancers (for homepage)
- SEARCH_FREELANCERS: Search freelancers by skills, name, location
"""

import json
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
projects_table = dynamodb.Table('Projects')
interactions_table = dynamodb.Table('FreelancerInteractions')

# Helper to convert Decimal to float for JSON serialization
def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj

# CORS headers for cross-origin requests
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400'
}

# Response helper function
def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(decimal_to_float(body))
    }


def get_seller_stats(seller_id):
    """Get stats for a seller (projects sold, earnings, etc.)"""
    try:
        # Query projects by this seller
        result = projects_table.scan(
            FilterExpression=Attr('sellerId').eq(seller_id)
        )
        
        projects = result.get('Items', [])
        
        total_sales = 0
        total_revenue = 0
        total_views = 0
        total_likes = 0
        
        for project in projects:
            purchases = project.get('purchasesCount', 0) or 0
            price = project.get('price', 0) or 0
            views = project.get('viewsCount', 0) or 0
            likes = project.get('likesCount', 0) or 0
            
            total_sales += purchases
            total_revenue += purchases * float(price)
            total_views += views
            total_likes += likes
        
        return {
            'projectsCount': len(projects),
            'totalSales': total_sales,
            'totalRevenue': total_revenue,
            'totalViews': total_views,
            'totalLikes': total_likes
        }
    except Exception as e:
        print(f"Error getting seller stats: {str(e)}")
        return {
            'projectsCount': 0,
            'totalSales': 0,
            'totalRevenue': 0,
            'totalViews': 0,
            'totalLikes': 0
        }

def get_freelancer_reviews_stats(freelancer_id):
    """Get real review statistics for a freelancer from the interactions table"""
    try:
        try:
            result = interactions_table.query(
                IndexName='targetId-index',
                KeyConditionExpression=Key('targetId').eq(freelancer_id),
                FilterExpression=Attr('type').eq('review')
            )
        except Exception:
            result = interactions_table.scan(
                FilterExpression=Attr('targetId').eq(freelancer_id) & Attr('type').eq('review')
            )
            
        reviews = result.get('Items', [])
        
        if not reviews:
            return {'count': 0, 'averageRating': 0}
            
        total_rating = sum(float(r.get('rating', 0)) for r in reviews)
        return {
            'count': len(reviews),
            'averageRating': total_rating / len(reviews)
        }
    except Exception as e:
        print(f"Error getting freelancer reviews: {str(e)}")
        return {'count': 0, 'averageRating': 0}


def format_freelancer(user, include_stats=True):
    """Format user data to freelancer profile format"""
    # Generate profile image URL if not exists
    profile_image = user.get('profileImage') or user.get('profileImageUrl')
    if not profile_image:
        # Generate avatar using DiceBear or similar
        name = user.get('fullName', user.get('email', 'User'))
        profile_image = f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.replace(' ', '')}"
    
    # Parse skills from string if needed
    skills = user.get('skills', [])
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(',') if s.strip()]
    
    # Get location info
    location_data = user.get('location')
    if isinstance(location_data, dict):
        location = {
            'country': location_data.get('country', user.get('country', 'India')),
            'city': location_data.get('city', user.get('city', ''))
        }
    elif isinstance(location_data, str) and location_data.strip():
        # If location is a string, we try to split or just use it as is
        # For simplicity and browse page compatibility, we'll put it in 'city' or 'country'
        parts = [p.strip() for p in location_data.split(',')]
        if len(parts) >= 2:
            location = {'city': parts[0], 'country': parts[1]}
        else:
            location = {'city': location_data, 'country': user.get('country', 'India')}
    else:
        location = {
            'country': user.get('country', 'India'),
            'city': user.get('city', '')
        }
    
    # Calculate success rate based on completed projects
    stats = {}
    if include_stats:
        stats = get_seller_stats(user.get('userId'))
    
    # Calculate metrics
    total_projects = stats.get('projectsCount', 0)
    total_sales = stats.get('totalSales', 0)
    
    # Success rate calculation (projects with at least 1 sale / total projects)
    success_rate = 90  # Default base rate
    if total_projects > 0:
        successful_projects = min(total_sales, total_projects)
        success_rate = min(99, 85 + (successful_projects / total_projects) * 14)
    
    # Get actual reviews
    review_stats = get_freelancer_reviews_stats(user.get('userId'))
    
    return {
        'id': user.get('userId'),
        'profileImage': profile_image,
        'name': user.get('fullName', user.get('email', '').split('@')[0]),
        'username': user.get('username', user.get('email', '').split('@')[0].lower()),
        'email': user.get('email'),
        'isVerified': user.get('isVerified', user.get('isPremium', False)),
        'rating': round(review_stats['averageRating'], 1) if review_stats['count'] > 0 else 0,
        'reviewsCount': review_stats['count'],
        'successRate': round(success_rate),
        'hourlyRate': user.get('hourlyRate', user.get('hourly_rate', 20)),
        'currency': user.get('currency', 'USD'),
        'location': location,
        'skills': skills[:10],  # Limit to 10 skills
        'bio': user.get('bio', ''),
        'projectsSold': stats.get('totalSales', 0),
        'totalEarnings': stats.get('totalRevenue', 0),
        'projectsCount': total_projects,
        'joinedAt': user.get('createdAt', user.get('joinedAt', '')),
        'lastActiveAt': user.get('lastLoginAt', '')
    }


# ---------- GET ALL FREELANCERS ----------
def handle_get_all_freelancers(body):
    """Get all freelancers with optional pagination"""
    limit = int(body.get('limit', 50))
    offset = int(body.get('offset', 0))
    include_all = body.get('includeAll', True)  # Default to True to get all users
    
    try:
        # Scan users table - get ALL users without strict filters
        # This ensures real users show up in the browse page
        
        if include_all:
            # Enforce isFreelancer=True OR role in ['seller', 'freelancer']
            result = users_table.scan(
                FilterExpression=Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer'])
            )
        else:
            # Filter for sellers/freelancers only
            result = users_table.scan(
                FilterExpression=Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer'])
            )
        
        users = result.get('Items', [])
        
        # Handle pagination with last_evaluated_key for large datasets
        while 'LastEvaluatedKey' in result:
            if include_all:
                result = users_table.scan(
                    FilterExpression=Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer']),
                    ExclusiveStartKey=result['LastEvaluatedKey']
                )
            else:
                result = users_table.scan(
                    FilterExpression=Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer']),
                    ExclusiveStartKey=result['LastEvaluatedKey']
                )
            users.extend(result.get('Items', []))
        
        # Filter out blocked/deleted users
        users = [u for u in users if u.get('status', 'active') not in ['blocked', 'deleted']]
        
        # Format freelancers
        freelancers = [format_freelancer(user) for user in users]
        
        # Calculate max hourly rate for dynamic filters
        max_rate = max([f['hourlyRate'] for f in freelancers]) if freelancers else 500
        
        # Sort by rating and success rate
        freelancers.sort(key=lambda x: (x['rating'], x['successRate']), reverse=True)
        
        # Apply pagination
        total_count = len(freelancers)
        paginated_freelancers = freelancers[offset:offset + limit]
        
        return response(200, {
            "success": True,
            "data": {
                "freelancers": paginated_freelancers,
                "count": len(paginated_freelancers),
                "totalCount": total_count,
                "maxHourlyRate": max_rate,
                "hasMore": offset + limit < total_count
            }
        })
    except Exception as e:
        print(f"Error fetching freelancers: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch freelancers"
            }
        })


# ---------- GET FREELANCER BY ID ----------
def handle_get_freelancer_by_id(body):
    """Get a specific freelancer's detailed profile"""
    freelancer_id = body.get('freelancerId') or body.get('userId')
    
    if not freelancer_id:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Freelancer ID is required"
            }
        })
    
    try:
        result = users_table.get_item(Key={'userId': freelancer_id})
        
        if 'Item' not in result:
            return response(404, {
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Freelancer not found"
                }
            })
        
        user = result['Item']
        freelancer = format_freelancer(user, include_stats=True)
        
        # Get seller's projects
        projects_result = projects_table.scan(
            FilterExpression=Attr('sellerId').eq(freelancer_id) & 
                           Attr('adminApprovalStatus').eq('approved')
        )
        
        projects = projects_result.get('Items', [])
        
        # Format projects for display
        formatted_projects = []
        for p in projects[:10]:  # Limit to 10 recent projects
            formatted_projects.append({
                'id': p.get('projectId'),
                'title': p.get('title'),
                'description': p.get('description', '')[:200],
                'price': p.get('price', 0),
                'thumbnailUrl': p.get('thumbnailUrl'),
                'category': p.get('category'),
                'purchasesCount': p.get('purchasesCount', 0),
                'likesCount': p.get('likesCount', 0)
            })
        
        freelancer['projects'] = formatted_projects
        
        return response(200, {
            "success": True,
            "data": freelancer
        })
    except Exception as e:
        print(f"Error fetching freelancer: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch freelancer profile"
            }
        })


# ---------- GET TOP FREELANCERS ----------
def handle_get_top_freelancers(body):
    """Get top-rated freelancers for homepage display"""
    limit = int(body.get('limit', 6))
    
    try:
        # Get all active users who could be freelancers
        result = users_table.scan(
            FilterExpression=(Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer'])) & (
                Attr('status').eq('active') | 
                Attr('status').not_exists()
            )
        )
        
        users = result.get('Items', [])
        
        # Format and calculate stats
        freelancers = []
        for user in users:
            freelancer = format_freelancer(user, include_stats=True)
            # Calculate a score for ranking
            freelancer['score'] = (
                freelancer['rating'] * 20 +
                min(freelancer['projectsSold'], 100) +
                (freelancer['successRate'] / 10)
            )
            freelancers.append(freelancer)
        
        # Sort by score (combination of rating, sales, and success rate)
        freelancers.sort(key=lambda x: x['score'], reverse=True)
        
        # Get top N
        top_freelancers = freelancers[:limit]
        
        # Remove internal score field
        for f in top_freelancers:
            f.pop('score', None)
        
        return response(200, {
            "success": True,
            "data": {
                "freelancers": top_freelancers,
                "count": len(top_freelancers)
            }
        })
    except Exception as e:
        print(f"Error fetching top freelancers: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to fetch top freelancers"
            }
        })


# ---------- SEARCH FREELANCERS ----------
def handle_search_freelancers(body):
    """Search freelancers by various criteria"""
    query = body.get('query', '').lower()
    skills_filter = body.get('skills', [])
    country_filter = body.get('country', '')
    min_rate = body.get('minHourlyRate', 0)
    max_rate = body.get('maxHourlyRate', 1000)
    limit = int(body.get('limit', 50))
    offset = int(body.get('offset', 0))
    
    try:
        # Get all potential freelancers
        result = users_table.scan(
            FilterExpression=(Attr('isFreelancer').eq(True) | Attr('isFreelancer').eq('true') | Attr('role').is_in(['seller', 'freelancer'])) & (
                Attr('status').eq('active') | 
                Attr('status').not_exists()
            )
        )
        
        users = result.get('Items', [])
        
        # Format freelancers
        freelancers = [format_freelancer(user) for user in users]
        
        # Calculate max hourly rate for dynamic filters (from all potential freelancers, not just filtered)
        max_rate = max([f['hourlyRate'] for f in freelancers]) if freelancers else 500
        
        # Apply filters
        filtered = []
        for f in freelancers:
            # Search query filter (name, username, skills)
            if query:
                name_match = query in f['name'].lower()
                username_match = query in f['username'].lower()
                skills_match = any(query in skill.lower() for skill in f['skills'])
                location_match = query in f['location'].get('city', '').lower() or query in f['location'].get('country', '').lower()
                
                if not (name_match or username_match or skills_match or location_match):
                    continue
            
            # Skills filter
            if skills_filter:
                if isinstance(skills_filter, str):
                    skills_filter = [s.strip() for s in skills_filter.split(',')]
                freelancer_skills_lower = [s.lower() for s in f['skills']]
                if not any(skill.lower() in freelancer_skills_lower for skill in skills_filter):
                    continue
            
            # Country filter
            if country_filter and f['location'].get('country', '').lower() != country_filter.lower():
                continue
            
            # Hourly rate filter
            hourly_rate = f['hourlyRate']
            if hourly_rate < min_rate or hourly_rate > max_rate:
                continue
            
            filtered.append(f)
        
        # Sort by relevance (rating + success rate)
        filtered.sort(key=lambda x: (x['rating'], x['successRate']), reverse=True)
        
        # Apply pagination
        total_count = len(filtered)
        paginated = filtered[offset:offset + limit]
        
        return response(200, {
            "success": True,
            "data": {
                "freelancers": paginated,
                "count": len(paginated),
                "totalCount": total_count,
                "maxHourlyRate": max_rate,
                "hasMore": offset + limit < total_count
            }
        })
    except Exception as e:
        print(f"Error searching freelancers: {str(e)}")
        return response(500, {
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Failed to search freelancers"
            }
        })


# ---------- SEED FREELANCERS (REMOVED) ----------
def handle_seed_freelancers(body):
    """Seed functionality removed for production."""
    return response(400, {
        "success": False,
        "error": {
            "code": "NOT_SUPPORTED",
            "message": "Seeding freelancers is no longer supported"
        }
    })


# ---------- LAMBDA HANDLER ----------
def lambda_handler(event, context):
    """Main Lambda handler - routes requests to appropriate functions"""
    try:
        # Handle CORS preflight OPTIONS request
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': ''
            }
        
        # Parse request body
        body = {}
        if event.get('body'):
            if isinstance(event.get('body'), str):
                body_str = event['body'].strip()
                if body_str:
                    body = json.loads(body_str)
            else:
                body = event.get('body', {})
        
        # For GET requests with query parameters
        if event.get('httpMethod') == 'GET':
            query_params = event.get('queryStringParameters') or {}
            body = {**body, **query_params}
            
            # Default action for GET is to get all freelancers
            if not body.get('action'):
                body['action'] = 'GET_ALL_FREELANCERS'
        
        # Route to appropriate handler based on action
        action = body.get('action', '').upper()
        
        action_handlers = {
            'GET_ALL_FREELANCERS': handle_get_all_freelancers,
            'GET_FREELANCER_BY_ID': handle_get_freelancer_by_id,
            'GET_TOP_FREELANCERS': handle_get_top_freelancers,
            'SEARCH_FREELANCERS': handle_search_freelancers,
            'SEED_FREELANCERS': handle_seed_freelancers,
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
