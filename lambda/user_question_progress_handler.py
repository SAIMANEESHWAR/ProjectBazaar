import json
import boto3
from datetime import datetime
import uuid

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
progress_table = dynamodb.Table('UserQuestionProgress')  # Per-question progress
submissions_table = dynamodb.Table('UserSubmissions')  # Submission history (optional)

# Response helper function
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


# ========================================
# GET USER PROGRESS FOR ALL QUESTIONS
# ========================================
def get_user_progress(user_id):
    """
    Get all question progress for a user.
    Returns: list of { questionId, status, isBookmarked, attempts, lastAttemptAt, solvedAt }
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID is required"}
        })
    
    try:
        result = progress_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id)
        )
        
        items = result.get('Items', [])
        
        # Calculate stats
        solved_count = len([i for i in items if i.get('status') == 'solved'])
        attempted_count = len([i for i in items if i.get('status') == 'attempted'])
        bookmarked_count = len([i for i in items if i.get('isBookmarked')])
        
        return response(200, {
            "success": True,
            "data": {
                "progress": items,
                "stats": {
                    "solved": solved_count,
                    "attempted": attempted_count,
                    "bookmarked": bookmarked_count,
                    "total": len(items)
                }
            }
        })
        
    except Exception as e:
        print(f"Error getting user progress: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to get progress"}
        })


# ========================================
# GET PROGRESS FOR A SINGLE QUESTION
# ========================================
def get_question_progress(user_id, question_id):
    """
    Get user's progress for a specific question.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    try:
        result = progress_table.get_item(
            Key={"userId": user_id, "questionId": question_id}
        )
        
        if 'Item' not in result:
            # Return default progress (unsolved)
            return response(200, {
                "success": True,
                "data": {
                    "questionId": question_id,
                    "status": "unsolved",
                    "isBookmarked": False,
                    "attempts": 0
                }
            })
        
        return response(200, {
            "success": True,
            "data": result['Item']
        })
        
    except Exception as e:
        print(f"Error getting question progress: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to get progress"}
        })


# ========================================
# UPDATE QUESTION STATUS (SOLVED/ATTEMPTED)
# ========================================
def update_question_status(user_id, question_id, new_status):
    """
    Update the status of a question for a user.
    Status can be: 'unsolved', 'attempted', 'solved'
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    if new_status not in ['unsolved', 'attempted', 'solved']:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Status must be 'unsolved', 'attempted', or 'solved'"}
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        update_expression = "SET #st = :status, updatedAt = :updatedAt"
        expression_values = {
            ':status': new_status,
            ':updatedAt': timestamp
        }
        expression_names = {'#st': 'status'}
        
        # If solved, set solvedAt timestamp
        if new_status == 'solved':
            update_expression += ", solvedAt = :solvedAt"
            expression_values[':solvedAt'] = timestamp
        
        # Increment attempts if not unsolved
        if new_status in ['attempted', 'solved']:
            update_expression += ", attempts = if_not_exists(attempts, :zero) + :one"
            expression_values[':zero'] = 0
            expression_values[':one'] = 1
            update_expression += ", lastAttemptAt = :lastAttemptAt"
            expression_values[':lastAttemptAt'] = timestamp
        
        result = progress_table.update_item(
            Key={"userId": user_id, "questionId": question_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        return response(200, {
            "success": True,
            "message": f"Status updated to {new_status}",
            "data": result['Attributes']
        })
        
    except Exception as e:
        print(f"Error updating status: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to update status"}
        })


# ========================================
# TOGGLE BOOKMARK
# ========================================
def toggle_bookmark(user_id, question_id):
    """
    Toggle bookmark status for a question.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Get current bookmark status
        result = progress_table.get_item(
            Key={"userId": user_id, "questionId": question_id}
        )
        
        current_bookmarked = False
        if 'Item' in result:
            current_bookmarked = result['Item'].get('isBookmarked', False)
        
        new_bookmarked = not current_bookmarked
        
        # Update bookmark status
        update_result = progress_table.update_item(
            Key={"userId": user_id, "questionId": question_id},
            UpdateExpression="SET isBookmarked = :bookmarked, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ':bookmarked': new_bookmarked,
                ':updatedAt': timestamp
            },
            ReturnValues='ALL_NEW'
        )
        
        return response(200, {
            "success": True,
            "message": f"Bookmark {'added' if new_bookmarked else 'removed'}",
            "data": {
                "isBookmarked": new_bookmarked,
                "questionId": question_id
            }
        })
        
    except Exception as e:
        print(f"Error toggling bookmark: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to toggle bookmark"}
        })


# ========================================
# TOGGLE LIKE
# ========================================
def toggle_like(user_id, question_id):
    """
    Toggle like status for a question. 
    Also removes dislike if it exists.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Get current status
        result = progress_table.get_item(
            Key={"userId": user_id, "questionId": question_id}
        )
        
        current_liked = False
        if 'Item' in result:
            current_liked = result['Item'].get('isLiked', False)
        
        new_liked = not current_liked
        
        # Update like status, and ensure dislike is false if we are liking
        update_expr = "SET isLiked = :liked, updatedAt = :updatedAt"
        expr_values = {
            ':liked': new_liked,
            ':updatedAt': timestamp
        }
        
        if new_liked:
            update_expr += ", isDisliked = :disliked"
            expr_values[':disliked'] = False
            
        progress_table.update_item(
            Key={"userId": user_id, "questionId": question_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )
        
        # We also need to update the actual question's like/dislike counts
        # This is a bit complex since it's in another table, but we'll try our best
        try:
            questions_table = dynamodb.Table('CodingQuestions')
            
            # If we liked, increment likes. If we unliked, decrement likes.
            if new_liked:
                questions_table.update_item(
                    Key={"questionId": question_id},
                    UpdateExpression="SET likes = if_not_exists(likes, :zero) + :one",
                    ExpressionAttributeValues={":zero": 0, ":one": 1}
                )
                # If they previously disliked it, we should decrement dislikes
                # We assume they did if 'isDisliked' was true, but we don't have that info easily.
                # Let's simplify and just let the frontend handle the exact counts, or do it securely here.
                if 'Item' in result and result['Item'].get('isDisliked', False):
                    questions_table.update_item(
                        Key={"questionId": question_id},
                        UpdateExpression="SET dislikes = if_not_exists(dislikes, :zero) - :one",
                        ExpressionAttributeValues={":zero": 0, ":one": 1}
                    )
            else:
                questions_table.update_item(
                    Key={"questionId": question_id},
                    UpdateExpression="SET likes = if_not_exists(likes, :start) - :one",
                    ExpressionAttributeValues={":start": 1, ":one": 1}
                )
        except Exception as e:
            print(f"Error updating question counts: {str(e)}")
            # Non-fatal, return success anyway
        
        return response(200, {
            "success": True,
            "message": f"Like {'added' if new_liked else 'removed'}",
            "data": {
                "isLiked": new_liked,
                "isDisliked": False if new_liked else result.get('Item', {}).get('isDisliked', False),
                "questionId": question_id
            }
        })
        
    except Exception as e:
        print(f"Error toggling like: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to toggle like"}
        })


# ========================================
# TOGGLE DISLIKE
# ========================================
def toggle_dislike(user_id, question_id):
    """
    Toggle dislike status for a question.
    Also removes like if it exists.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Get current status
        result = progress_table.get_item(
            Key={"userId": user_id, "questionId": question_id}
        )
        
        current_disliked = False
        if 'Item' in result:
            current_disliked = result['Item'].get('isDisliked', False)
        
        new_disliked = not current_disliked
        
        # Update dislike status, and ensure like is false if we are disliking
        update_expr = "SET isDisliked = :disliked, updatedAt = :updatedAt"
        expr_values = {
            ':disliked': new_disliked,
            ':updatedAt': timestamp
        }
        
        if new_disliked:
            update_expr += ", isLiked = :liked"
            expr_values[':liked'] = False
            
        progress_table.update_item(
            Key={"userId": user_id, "questionId": question_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values
        )
        
        # Update counts
        try:
            questions_table = dynamodb.Table('CodingQuestions')
            
            if new_disliked:
                questions_table.update_item(
                    Key={"questionId": question_id},
                    UpdateExpression="SET dislikes = if_not_exists(dislikes, :zero) + :one",
                    ExpressionAttributeValues={":zero": 0, ":one": 1}
                )
                if 'Item' in result and result['Item'].get('isLiked', False):
                    questions_table.update_item(
                        Key={"questionId": question_id},
                        UpdateExpression="SET likes = if_not_exists(likes, :start) - :one",
                        ExpressionAttributeValues={":start": 1, ":one": 1}
                    )
            else:
                questions_table.update_item(
                    Key={"questionId": question_id},
                    UpdateExpression="SET dislikes = if_not_exists(dislikes, :start) - :one",
                    ExpressionAttributeValues={":start": 1, ":one": 1}
                )
        except Exception as e:
            print(f"Error updating question counts: {str(e)}")
        
        return response(200, {
            "success": True,
            "message": f"Dislike {'added' if new_disliked else 'removed'}",
            "data": {
                "isDisliked": new_disliked,
                "isLiked": False if new_disliked else result.get('Item', {}).get('isLiked', False),
                "questionId": question_id
            }
        })
        
    except Exception as e:
        print(f"Error toggling dislike: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to toggle dislike"}
        })


# ========================================
# RECORD SUBMISSION
# ========================================
def record_submission(user_id, question_id, submission_data):
    """
    Record a code submission for a question.
    Stores in UserSubmissions table if available, otherwise stores in UserQuestionProgress.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    try:
        timestamp = datetime.utcnow().isoformat() + "Z"
        submission_id = str(uuid.uuid4())
        
        submission = {
            "submissionId": submission_id,
            "userId": user_id,
            "questionId": question_id,
            "code": submission_data.get('code', ''),
            "language": submission_data.get('language', 'python'),
            "passed": submission_data.get('passed', False),
            "testsPassed": submission_data.get('testsPassed', 0),
            "testsTotal": submission_data.get('testsTotal', 0),
            "runtime": submission_data.get('runtime'),
            "memory": submission_data.get('memory'),
            "submittedAt": timestamp
        }
        
        # Try to save to UserSubmissions table
        try:
            submissions_table.put_item(Item=submission)
            print(f"Submission saved to UserSubmissions: {submission_id}")
        except Exception as sub_error:
            print(f"UserSubmissions table error (might not exist): {str(sub_error)}")
            # Fallback: Store submission history in UserQuestionProgress as JSON array
            try:
                # Get existing progress
                progress_result = progress_table.get_item(
                    Key={'userId': user_id, 'questionId': question_id}
                )
                existing = progress_result.get('Item', {})
                existing_submissions = existing.get('submissions', [])
                
                # Add new submission (keep last 20)
                submission_for_progress = {
                    "submissionId": submission_id,
                    "passed": submission_data.get('passed', False),
                    "runtime": submission_data.get('runtime'),
                    "memory": submission_data.get('memory'),
                    "language": submission_data.get('language', 'python'),
                    "submittedAt": timestamp
                }
                existing_submissions.insert(0, submission_for_progress)
                existing_submissions = existing_submissions[:20]  # Keep only last 20
                
                # Update progress with submissions array
                progress_table.update_item(
                    Key={'userId': user_id, 'questionId': question_id},
                    UpdateExpression='SET submissions = :subs, updatedAt = :ts',
                    ExpressionAttributeValues={
                        ':subs': existing_submissions,
                        ':ts': timestamp
                    }
                )
                print(f"Submission saved to UserQuestionProgress (fallback): {submission_id}")
            except Exception as fallback_error:
                print(f"Fallback storage also failed: {str(fallback_error)}")
        
        # Update question status based on submission result
        if submission_data.get('passed'):
            update_question_status(user_id, question_id, 'solved')
        else:
            update_question_status(user_id, question_id, 'attempted')
        
        return response(201, {
            "success": True,
            "message": "Submission recorded",
            "data": {
                "submissionId": submission_id,
                "passed": submission_data.get('passed', False)
            }
        })
        
    except Exception as e:
        print(f"Error recording submission: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to record submission"}
        })


# ========================================
# GET USER SUBMISSIONS FOR A QUESTION
# ========================================
def get_submissions(user_id, question_id):
    """
    Get all submissions for a user on a specific question.
    Tries UserSubmissions table first, falls back to UserQuestionProgress.submissions array.
    """
    if not user_id or not question_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID and Question ID are required"}
        })
    
    submissions = []
    
    # Try to get from UserSubmissions table first
    try:
        result = submissions_table.query(
            IndexName='userId-questionId-index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id) & 
                                   boto3.dynamodb.conditions.Key('questionId').eq(question_id),
            ScanIndexForward=False  # Most recent first
        )
        submissions = result.get('Items', [])
        print(f"Found {len(submissions)} submissions in UserSubmissions table")
    except Exception as e:
        print(f"UserSubmissions table query failed (might not exist or no GSI): {str(e)}")
    
    # If no submissions found, try fallback from UserQuestionProgress
    if not submissions:
        try:
            progress_result = progress_table.get_item(
                Key={'userId': user_id, 'questionId': question_id}
            )
            item = progress_result.get('Item', {})
            fallback_submissions = item.get('submissions', [])
            if fallback_submissions:
                submissions = fallback_submissions
                print(f"Found {len(submissions)} submissions in UserQuestionProgress (fallback)")
        except Exception as fallback_error:
            print(f"Fallback query also failed: {str(fallback_error)}")
    
    return response(200, {
        "success": True,
        "data": {
            "submissions": submissions,
            "count": len(submissions)
        }
    })


# ========================================
# GET USER STATISTICS
# ========================================
def get_user_stats(user_id):
    """
    Get overall statistics for a user.
    """
    if not user_id:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "User ID is required"}
        })
    
    try:
        # Get all progress items
        result = progress_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(user_id)
        )
        
        items = result.get('Items', [])
        
        # Calculate statistics
        solved = [i for i in items if i.get('status') == 'solved']
        attempted = [i for i in items if i.get('status') == 'attempted']
        
        # Count by difficulty (would need to join with questions table in production)
        stats = {
            "totalSolved": len(solved),
            "totalAttempted": len(attempted),
            "totalBookmarked": len([i for i in items if i.get('isBookmarked')]),
            "totalAttempts": sum(i.get('attempts', 0) for i in items),
            "streak": calculate_streak(solved),  # Days streak
            "recentActivity": get_recent_activity(items)
        }
        
        return response(200, {
            "success": True,
            "data": stats
        })
        
    except Exception as e:
        print(f"Error getting user stats: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "Failed to get statistics"}
        })


def calculate_streak(solved_items):
    """Calculate consecutive days streak."""
    if not solved_items:
        return 0
    
    # Get unique solved dates
    dates = set()
    for item in solved_items:
        if item.get('solvedAt'):
            try:
                date_str = item['solvedAt'].split('T')[0]
                dates.add(date_str)
            except:
                pass
    
    if not dates:
        return 0
    
    # Sort dates and count consecutive days from today
    sorted_dates = sorted(dates, reverse=True)
    today = datetime.utcnow().strftime('%Y-%m-%d')
    
    streak = 0
    current_date = datetime.strptime(today, '%Y-%m-%d')
    
    for date_str in sorted_dates:
        check_date = current_date.strftime('%Y-%m-%d')
        if date_str == check_date:
            streak += 1
            current_date = current_date.replace(day=current_date.day - 1)
        else:
            break
    
    return streak


def get_recent_activity(items):
    """Get recent activity summary."""
    # Sort by update time
    sorted_items = sorted(
        [i for i in items if i.get('updatedAt')],
        key=lambda x: x.get('updatedAt', ''),
        reverse=True
    )
    
    return sorted_items[:10]  # Return last 10 activities


# ========================================
# LAMBDA HANDLER
# ========================================
def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        http_method = (
            event.get('httpMethod') or 
            event.get('requestContext', {}).get('http', {}).get('method') or
            'GET'
        )
        
        if http_method == 'OPTIONS':
            return response(200, {})
        
        # Parse request body
        body = {}
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        elif event.get('body'):
            body = event['body']
        
        # Get parameters
        query_params = event.get('queryStringParameters') or {}
        
        user_id = body.get('userId') or query_params.get('userId')
        question_id = body.get('questionId') or query_params.get('questionId')
        action = body.get('action', '').lower() or query_params.get('action', '').lower()
        
        print(f"Action: {action}, User: {user_id}, Question: {question_id}")
        
        # Route based on action
        
        # Get all progress for user
        if action == 'get_progress' or (http_method == 'GET' and not question_id):
            return get_user_progress(user_id)
        
        # Get progress for specific question
        if action == 'get_question_progress' or (http_method == 'GET' and question_id):
            return get_question_progress(user_id, question_id)
        
        # Update question status
        if action == 'update_status':
            new_status = body.get('status')
            return update_question_status(user_id, question_id, new_status)
        
        # Mark as solved
        if action == 'mark_solved':
            return update_question_status(user_id, question_id, 'solved')
        
        # Mark as attempted
        if action == 'mark_attempted':
            return update_question_status(user_id, question_id, 'attempted')
        
        # Toggle bookmark
        if action == 'toggle_bookmark':
            return toggle_bookmark(user_id, question_id)
            
        # Toggle like
        if action == 'toggle_like':
            return toggle_like(user_id, question_id)
            
        # Toggle dislike
        if action == 'toggle_dislike':
            return toggle_dislike(user_id, question_id)
        
        # Record submission
        if action == 'submit':
            return record_submission(user_id, question_id, body)
        
        # Get submissions
        if action == 'get_submissions':
            return get_submissions(user_id, question_id)
        
        # Get user statistics
        if action == 'get_stats':
            return get_user_stats(user_id)
        
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_ACTION",
                "message": f"Invalid action: {action}. Supported: get_progress, get_question_progress, update_status, mark_solved, mark_attempted, toggle_bookmark, submit, get_submissions, get_stats"
            }
        })
            
    except json.JSONDecodeError:
        return response(400, {
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Invalid JSON in request body"}
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An error occurred"}
        })


"""
========================================
AWS SETUP INSTRUCTIONS
========================================

1. Create DynamoDB Tables:

   Table 1: UserQuestionProgress
   - Partition Key: userId (String)
   - Sort Key: questionId (String)
   
   Table 2: UserSubmissions (Optional, for detailed submission history)
   - Partition Key: submissionId (String)
   - GSI: userId-questionId-index
     - Partition Key: userId (String)
     - Sort Key: questionId (String)

2. Create Lambda Function:
   - Function name: user-question-progress-service
   - Runtime: Python 3.9+
   - Handler: user_question_progress_handler.lambda_handler
   - Memory: 256 MB
   - Timeout: 30 seconds

3. IAM Role Permissions:
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "dynamodb:GetItem",
                   "dynamodb:PutItem",
                   "dynamodb:UpdateItem",
                   "dynamodb:Query",
                   "dynamodb:Scan"
               ],
               "Resource": [
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/UserQuestionProgress",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/UserSubmissions",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/UserSubmissions/index/*"
               ]
           }
       ]
   }

4. API Endpoints:

   POST /user-progress
   Body: { "action": "get_progress", "userId": "user123" }
   
   POST /user-progress
   Body: { "action": "update_status", "userId": "user123", "questionId": "q1", "status": "solved" }
   
   POST /user-progress
   Body: { "action": "toggle_bookmark", "userId": "user123", "questionId": "q1" }
   
   POST /user-progress
   Body: { "action": "submit", "userId": "user123", "questionId": "q1", "code": "...", "passed": true }

========================================
DATA SCHEMA
========================================

 UserQuestionProgress:
{
    "userId": "user123",           // Partition Key
    "questionId": "q1",            // Sort Key
    "status": "solved",            // unsolved, attempted, solved
    "isBookmarked": true,
    "isLiked": true,               // New field
    "isDisliked": false,           // New field
    "attempts": 5,
    "lastAttemptAt": "2025-01-20T10:30:00Z",
    "solvedAt": "2025-01-20T10:35:00Z",
    "updatedAt": "2025-01-20T10:35:00Z"
}

UserSubmissions:
{
    "submissionId": "uuid",        // Partition Key
    "userId": "user123",
    "questionId": "q1",
    "code": "def solution()...",
    "language": "python",
    "passed": true,
    "testsPassed": 5,
    "testsTotal": 5,
    "runtime": "45ms",
    "memory": "16MB",
    "submittedAt": "2025-01-20T10:35:00Z"
}

========================================
"""
