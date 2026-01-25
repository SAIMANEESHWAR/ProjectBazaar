import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
discussions_table = dynamodb.Table('CodingQuestionsDiscussions')
votes_table = dynamodb.Table('CodingQuestionsDiscussionVotes')

# Helper to convert Decimal to int/float for JSON serialization
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def create_response(status_code, body):
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def get_discussions(event):
    """Get all discussions for a question"""
    query_params = event.get('queryStringParameters', {}) or {}
    question_id = query_params.get('questionId')
    user_id = query_params.get('userId')  # Optional - to check if user has voted
    
    if not question_id:
        return create_response(400, {'success': False, 'error': 'questionId is required'})
    
    try:
        # Query discussions for the question (top-level comments only)
        response = discussions_table.query(
            IndexName='QuestionIndex',
            KeyConditionExpression=Key('questionId').eq(question_id),
            FilterExpression='attribute_not_exists(parentCommentId) OR parentCommentId = :empty',
            ExpressionAttributeValues={':empty': ''},
            ScanIndexForward=False  # Newest first
        )
        
        discussions = response.get('Items', [])
        
        # If user_id provided, check their votes
        if user_id and discussions:
            comment_ids = [d['commentId'] for d in discussions]
            
            # Batch get user's votes
            for discussion in discussions:
                try:
                    vote_response = votes_table.get_item(
                        Key={
                            'commentId': discussion['commentId'],
                            'oderId': user_id
                        }
                    )
                    vote = vote_response.get('Item')
                    if vote:
                        discussion['hasUpvoted'] = vote.get('voteType') == 'upvote'
                        discussion['hasDownvoted'] = vote.get('voteType') == 'downvote'
                    else:
                        discussion['hasUpvoted'] = False
                        discussion['hasDownvoted'] = False
                except:
                    discussion['hasUpvoted'] = False
                    discussion['hasDownvoted'] = False
        
        return create_response(200, {
            'success': True,
            'data': {
                'discussions': discussions,
                'count': len(discussions)
            }
        })
        
    except Exception as e:
        print(f"Error getting discussions: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

def add_comment(event):
    """Add a new comment or reply"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        question_id = body.get('questionId')
        user_id = body.get('userId')
        user_name = body.get('userName')
        content = body.get('content')
        parent_comment_id = body.get('parentCommentId', '')  # Empty for top-level comments
        user_avatar = body.get('userAvatar', '')
        
        # Validate required fields
        if not all([question_id, user_id, user_name, content]):
            return create_response(400, {
                'success': False,
                'error': 'questionId, userId, userName, and content are required'
            })
        
        # Create comment
        comment_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        comment = {
            'commentId': comment_id,
            'questionId': question_id,
            'userId': user_id,
            'userName': user_name,
            'userAvatar': user_avatar,
            'content': content,
            'parentCommentId': parent_comment_id,
            'upvotes': 0,
            'downvotes': 0,
            'repliesCount': 0,
            'createdAt': timestamp,
            'updatedAt': timestamp
        }
        
        # Save to DynamoDB
        discussions_table.put_item(Item=comment)
        
        # If this is a reply, increment parent's reply count
        if parent_comment_id:
            discussions_table.update_item(
                Key={'commentId': parent_comment_id},
                UpdateExpression='SET repliesCount = if_not_exists(repliesCount, :zero) + :inc',
                ExpressionAttributeValues={':inc': 1, ':zero': 0}
            )
        
        return create_response(201, {
            'success': True,
            'data': comment,
            'message': 'Comment added successfully'
        })
        
    except json.JSONDecodeError:
        return create_response(400, {'success': False, 'error': 'Invalid JSON body'})
    except Exception as e:
        print(f"Error adding comment: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

def vote_comment(event):
    """Upvote or downvote a comment"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        comment_id = body.get('commentId')
        user_id = body.get('userId')
        vote_type = body.get('voteType')  # 'upvote', 'downvote', or 'remove'
        
        if not all([comment_id, user_id, vote_type]):
            return create_response(400, {
                'success': False,
                'error': 'commentId, userId, and voteType are required'
            })
        
        if vote_type not in ['upvote', 'downvote', 'remove']:
            return create_response(400, {
                'success': False,
                'error': 'voteType must be upvote, downvote, or remove'
            })
        
        # Check for existing vote
        vote_key = {'commentId': comment_id, 'oderId': user_id}
        existing_vote_response = votes_table.get_item(Key=vote_key)
        existing_vote = existing_vote_response.get('Item')
        
        # Calculate vote changes
        upvote_change = 0
        downvote_change = 0
        
        if existing_vote:
            old_vote_type = existing_vote.get('voteType')
            
            if vote_type == 'remove':
                # Remove the vote
                votes_table.delete_item(Key=vote_key)
                if old_vote_type == 'upvote':
                    upvote_change = -1
                elif old_vote_type == 'downvote':
                    downvote_change = -1
            elif vote_type != old_vote_type:
                # Change vote type
                votes_table.put_item(Item={
                    'commentId': comment_id,
                    'oderId': user_id,
                    'voteType': vote_type,
                    'createdAt': datetime.utcnow().isoformat() + 'Z'
                })
                if old_vote_type == 'upvote':
                    upvote_change = -1
                elif old_vote_type == 'downvote':
                    downvote_change = -1
                if vote_type == 'upvote':
                    upvote_change += 1
                elif vote_type == 'downvote':
                    downvote_change += 1
            # If same vote type, do nothing
        else:
            if vote_type != 'remove':
                # Add new vote
                votes_table.put_item(Item={
                    'commentId': comment_id,
                    'oderId': user_id,
                    'voteType': vote_type,
                    'createdAt': datetime.utcnow().isoformat() + 'Z'
                })
                if vote_type == 'upvote':
                    upvote_change = 1
                elif vote_type == 'downvote':
                    downvote_change = 1
        
        # Update comment vote counts
        update_expression_parts = []
        expression_values = {}
        
        if upvote_change != 0:
            update_expression_parts.append('upvotes = if_not_exists(upvotes, :zero) + :upvote_change')
            expression_values[':upvote_change'] = upvote_change
            expression_values[':zero'] = 0
        
        if downvote_change != 0:
            update_expression_parts.append('downvotes = if_not_exists(downvotes, :zero2) + :downvote_change')
            expression_values[':downvote_change'] = downvote_change
            expression_values[':zero2'] = 0
        
        if update_expression_parts:
            discussions_table.update_item(
                Key={'commentId': comment_id},
                UpdateExpression='SET ' + ', '.join(update_expression_parts),
                ExpressionAttributeValues=expression_values
            )
        
        # Get updated comment
        updated_comment = discussions_table.get_item(Key={'commentId': comment_id}).get('Item', {})
        
        return create_response(200, {
            'success': True,
            'data': {
                'commentId': comment_id,
                'upvotes': updated_comment.get('upvotes', 0),
                'downvotes': updated_comment.get('downvotes', 0),
                'hasUpvoted': vote_type == 'upvote',
                'hasDownvoted': vote_type == 'downvote'
            },
            'message': 'Vote recorded successfully'
        })
        
    except json.JSONDecodeError:
        return create_response(400, {'success': False, 'error': 'Invalid JSON body'})
    except Exception as e:
        print(f"Error voting on comment: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

def get_replies(event):
    """Get replies for a comment"""
    query_params = event.get('queryStringParameters', {}) or {}
    parent_comment_id = query_params.get('parentCommentId')
    user_id = query_params.get('userId')
    
    if not parent_comment_id:
        return create_response(400, {'success': False, 'error': 'parentCommentId is required'})
    
    try:
        # Query replies for the parent comment
        response = discussions_table.query(
            IndexName='ParentCommentIndex',
            KeyConditionExpression=Key('parentCommentId').eq(parent_comment_id),
            ScanIndexForward=True  # Oldest first for replies
        )
        
        replies = response.get('Items', [])
        
        # If user_id provided, check their votes
        if user_id and replies:
            for reply in replies:
                try:
                    vote_response = votes_table.get_item(
                        Key={
                            'commentId': reply['commentId'],
                            'oderId': user_id
                        }
                    )
                    vote = vote_response.get('Item')
                    if vote:
                        reply['hasUpvoted'] = vote.get('voteType') == 'upvote'
                        reply['hasDownvoted'] = vote.get('voteType') == 'downvote'
                    else:
                        reply['hasUpvoted'] = False
                        reply['hasDownvoted'] = False
                except:
                    reply['hasUpvoted'] = False
                    reply['hasDownvoted'] = False
        
        return create_response(200, {
            'success': True,
            'data': {
                'replies': replies,
                'count': len(replies)
            }
        })
        
    except Exception as e:
        print(f"Error getting replies: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

def delete_comment(event):
    """Delete a comment (only by the author)"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        comment_id = body.get('commentId')
        user_id = body.get('userId')
        
        if not all([comment_id, user_id]):
            return create_response(400, {
                'success': False,
                'error': 'commentId and userId are required'
            })
        
        # Get the comment first to verify ownership
        comment_response = discussions_table.get_item(Key={'commentId': comment_id})
        comment = comment_response.get('Item')
        
        if not comment:
            return create_response(404, {'success': False, 'error': 'Comment not found'})
        
        if comment.get('userId') != user_id:
            return create_response(403, {'success': False, 'error': 'You can only delete your own comments'})
        
        # Delete the comment
        discussions_table.delete_item(Key={'commentId': comment_id})
        
        # If this was a reply, decrement parent's reply count
        parent_comment_id = comment.get('parentCommentId')
        if parent_comment_id:
            discussions_table.update_item(
                Key={'commentId': parent_comment_id},
                UpdateExpression='SET repliesCount = repliesCount - :dec',
                ExpressionAttributeValues={':dec': 1},
                ConditionExpression='repliesCount > :zero',
                ExpressionAttributeValues={':dec': 1, ':zero': 0}
            )
        
        return create_response(200, {
            'success': True,
            'message': 'Comment deleted successfully'
        })
        
    except json.JSONDecodeError:
        return create_response(400, {'success': False, 'error': 'Invalid JSON body'})
    except Exception as e:
        print(f"Error deleting comment: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

def lambda_handler(event, context):
    """Main Lambda handler"""
    print(f"Received event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    # Handle CORS preflight
    if http_method == 'OPTIONS':
        return create_response(200, {'message': 'CORS OK'})
    
    # Route based on method and action
    try:
        body = {}
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except:
                pass
        
        action = body.get('action', '')
        query_params = event.get('queryStringParameters', {}) or {}
        
        # GET requests
        if http_method == 'GET':
            if query_params.get('parentCommentId'):
                return get_replies(event)
            else:
                return get_discussions(event)
        
        # POST requests
        elif http_method == 'POST':
            if action == 'add_comment':
                return add_comment(event)
            elif action == 'vote':
                return vote_comment(event)
            elif action == 'delete':
                return delete_comment(event)
            elif action == 'get_replies':
                # Allow POST for getting replies too
                event['queryStringParameters'] = event.get('queryStringParameters', {}) or {}
                event['queryStringParameters']['parentCommentId'] = body.get('parentCommentId')
                event['queryStringParameters']['userId'] = body.get('userId')
                return get_replies(event)
            else:
                # Default POST is add_comment
                return add_comment(event)
        
        else:
            return create_response(405, {'success': False, 'error': 'Method not allowed'})
            
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'success': False, 'error': str(e)})

