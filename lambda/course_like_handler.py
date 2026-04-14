import json
import boto3
from botocore.exceptions import ClientError
from decimal import Decimal
from boto3.dynamodb.conditions import Attr

REGION = "ap-south-2"
COURSES_TABLE = "Courses"
COURSE_LIKES_TABLE = "CourseLikes" # A table to keep track of user likes to prevent duplicate likes

dynamodb = boto3.resource('dynamodb', region_name=REGION)
courses_table = dynamodb.Table(COURSES_TABLE)
likes_table = dynamodb.Table(COURSE_LIKES_TABLE)

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }

def lambda_handler(event, context):
    try:
        # CORS preflight
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
        if http_method == 'OPTIONS':
            return response(204, "")

        body = json.loads(event.get('body', '{}'))
        course_id = body.get('courseId')
        user_id = body.get('userId')
        action = body.get('action') # 'toggle' or 'check'

        if not user_id:
            return response(400, {"success": False, "message": "userId is required"})
        
        if action != 'get_user_likes' and not course_id:
            return response(400, {"success": False, "message": "courseId is required for this action"})

        like_id = f"{user_id}#{course_id}"
        
        if action == 'check':
            # Just check if the user liked the course
            try:
                like_item = likes_table.get_item(Key={"likeId": like_id})
                is_liked = 'Item' in like_item
                return response(200, {"success": True, "isLiked": is_liked})
            except Exception as e:
                # If CourseLikes table doesn't exist yet, just assume not liked
                return response(200, {"success": True, "isLiked": False})
                
        elif action == 'toggle':
            # Toggle the like status
            is_liked = False
            try:
                # Try to get existing like
                try:
                    like_item = likes_table.get_item(Key={"likeId": like_id})
                    already_liked = 'Item' in like_item
                except Exception:
                    already_liked = False # Table might not exist, proceed to just increment/decrement
                
                # Update Courses table likesCount
                if already_liked:
                    # User already liked it, so unlike it
                    courses_table.update_item(
                        Key={"courseId": course_id},
                        UpdateExpression="SET likesCount = if_not_exists(likesCount, :start) - :val",
                        ExpressionAttributeValues={":val": Decimal(1), ":start": Decimal(1)},
                        ReturnValues="UPDATED_NEW"
                    )
                    try:
                        likes_table.delete_item(Key={"likeId": like_id})
                    except Exception:
                        pass
                    is_liked = False
                else:
                    # User hasn't liked it, so like it
                    courses_table.update_item(
                        Key={"courseId": course_id},
                        UpdateExpression="SET likesCount = if_not_exists(likesCount, :start) + :val",
                        ExpressionAttributeValues={":val": Decimal(1), ":start": Decimal(0)},
                        ReturnValues="UPDATED_NEW"
                    )
                    try:
                        likes_table.put_item(Item={"likeId": like_id, "userId": user_id, "courseId": course_id})
                    except Exception:
                        pass
                    is_liked = True

                # Get the updated course to return the new count
                course = courses_table.get_item(Key={"courseId": course_id}).get('Item', {})
                new_likes_count = int(course.get('likesCount', 0))

                return response(200, {
                    "success": True, 
                    "isLiked": is_liked,
                    "likesCount": new_likes_count
                })

            except ClientError as e:
                return response(500, {"success": False, "message": str(e)})

        elif action == 'get_user_likes':
            # Get all courses liked by this user
            try:
                # Using scan since we don't have a known GSI on userId, fine for small scale
                scan_response = likes_table.scan(
                    FilterExpression=Attr('userId').eq(user_id)
                )
                liked_courses = [item.get('courseId') for item in scan_response.get('Items', []) if item.get('courseId')]
                return response(200, {"success": True, "likedCourses": liked_courses})
            except Exception as e:
                # Table might not exist yet
                return response(200, {"success": True, "likedCourses": []})


        else:
            return response(400, {"success": False, "message": "Invalid action. Use 'check' or 'toggle'."})

    except Exception as e:
        return response(500, {"success": False, "message": "Internal server error", "error": str(e)})
