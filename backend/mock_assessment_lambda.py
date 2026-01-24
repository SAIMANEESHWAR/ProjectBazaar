import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime, timedelta
import uuid
import math

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
test_results_table = dynamodb.Table('TestResults')
user_progress_table = dynamodb.Table('UserProgress')
leaderboard_table = dynamodb.Table('Leaderboard')
daily_challenges_table = dynamodb.Table('DailyChallenges')
daily_challenge_completions_table = dynamodb.Table('DailyChallengeCompletions')
study_resources_table = dynamodb.Table('StudyResources')
assessments_table = dynamodb.Table('Assessments')

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
# XP AND LEVEL CALCULATION
# ========================================
def calculate_xp(score, proctoring_data=None):
    """Calculate XP earned from test score, with penalties for violations."""
    base_xp = score * 2
    
    if proctoring_data:
        tab_switch_penalty = proctoring_data.get('tabSwitchCount', 0) * 10
        fullscreen_penalty = proctoring_data.get('fullScreenExitCount', 0) * 5
        copy_paste_penalty = proctoring_data.get('copyPasteAttempts', 0) * 2
        hints_penalty = proctoring_data.get('hintsUsed', 0) * 2
        
        total_penalty = tab_switch_penalty + fullscreen_penalty + copy_paste_penalty + hints_penalty
        xp_earned = max(0, base_xp - total_penalty)
    else:
        xp_earned = base_xp
    
    return int(xp_earned)


def calculate_level(total_xp):
    """Calculate user level based on total XP (exponential growth)."""
    if total_xp < 500:
        return 1
    elif total_xp < 1000:
        return 2
    elif total_xp < 2000:
        return 3
    elif total_xp < 3000:
        return 4
    elif total_xp < 5000:
        return 5
    else:
        # Level 6+: exponential growth
        level = 5
        xp_required = 5000
        while total_xp >= xp_required:
            level += 1
            xp_required = int(xp_required * 1.5)
        return level


def get_next_level_xp(level):
    """Get XP required for next level."""
    if level == 1:
        return 500
    elif level == 2:
        return 1000
    elif level == 3:
        return 2000
    elif level == 4:
        return 3000
    elif level == 5:
        return 5000
    else:
        # Level 6+: exponential growth
        xp = 5000
        for _ in range(5, level):
            xp = int(xp * 1.5)
        return int(xp * 1.5)


# ========================================
# BADGE SYSTEM
# ========================================
BADGE_DEFINITIONS = [
    {
        'id': 'first-test',
        'name': 'First Steps',
        'description': 'Complete your first assessment',
        'icon': '🎯',
        'requirement': 'Complete 1 test',
        'xpReward': 50,
        'check': lambda progress, test_result: progress.get('testsCompleted', 0) >= 1
    },
    {
        'id': 'streak-7',
        'name': 'Week Warrior',
        'description': 'Maintain a 7-day streak',
        'icon': '🔥',
        'requirement': '7 day streak',
        'xpReward': 100,
        'check': lambda progress, test_result: progress.get('streak', 0) >= 7
    },
    {
        'id': 'perfect-score',
        'name': 'Perfectionist',
        'description': 'Score 100% on any test',
        'icon': '💯',
        'requirement': '100% score',
        'xpReward': 200,
        'check': lambda progress, test_result: test_result and test_result.get('score', 0) == 100
    },
    {
        'id': 'java-master',
        'name': 'Java Master',
        'description': 'Complete all Java assessments with 80%+',
        'icon': '☕',
        'requirement': 'Master Java',
        'xpReward': 150,
        'check': lambda progress, test_result: False  # Complex logic - check test history
    },
    {
        'id': 'speed-demon',
        'name': 'Speed Demon',
        'description': 'Complete a test in under 5 minutes',
        'icon': '⚡',
        'requirement': 'Finish < 5 mins',
        'xpReward': 75,
        'check': lambda progress, test_result: test_result and test_result.get('duration', '') and '5' in test_result.get('duration', '')
    },
    {
        'id': 'streak-30',
        'name': 'Monthly Master',
        'description': 'Maintain a 30-day streak',
        'icon': '🏆',
        'requirement': '30 day streak',
        'xpReward': 300,
        'check': lambda progress, test_result: progress.get('streak', 0) >= 30
    },
    {
        'id': 'ten-tests',
        'name': 'Dedicated Learner',
        'description': 'Complete 10 assessments',
        'icon': '📚',
        'requirement': 'Complete 10 tests',
        'xpReward': 100,
        'check': lambda progress, test_result: progress.get('testsCompleted', 0) >= 10
    },
    {
        'id': 'all-topics',
        'name': 'Well Rounded',
        'description': 'Complete tests in 5 different categories',
        'icon': '🌟',
        'requirement': '5 categories',
        'xpReward': 150,
        'check': lambda progress, test_result: False  # Complex logic - check test history
    },
    {
        'id': 'night-owl',
        'name': 'Night Owl',
        'description': 'Complete a test after midnight',
        'icon': '🦉',
        'requirement': 'Test after 12 AM',
        'xpReward': 50,
        'check': lambda progress, test_result: False  # Check startTime hour
    },
    {
        'id': 'early-bird',
        'name': 'Early Bird',
        'description': 'Complete a test before 6 AM',
        'icon': '🐦',
        'requirement': 'Test before 6 AM',
        'xpReward': 50,
        'check': lambda progress, test_result: False  # Check startTime hour
    },
    {
        'id': 'company-ready',
        'name': 'Company Ready',
        'description': 'Complete 3 company-specific assessments',
        'icon': '💼',
        'requirement': '3 company tests',
        'xpReward': 200,
        'check': lambda progress, test_result: False  # Complex logic
    },
    {
        'id': 'daily-champ',
        'name': 'Daily Champion',
        'description': 'Complete 10 daily challenges',
        'icon': '📅',
        'requirement': '10 daily challenges',
        'xpReward': 150,
        'check': lambda progress, test_result: False  # Check daily challenge completions
    }
]


def check_badges(user_id, progress, test_result=None):
    """Check and award new badges based on progress and test result."""
    earned_badges = []
    
    # Get current badges
    current_badges = progress.get('badges', [])
    earned_badge_ids = [b.get('id') for b in current_badges if b.get('earned', False)]
    
    # Check each badge
    for badge_def in BADGE_DEFINITIONS:
        badge_id = badge_def['id']
        
        # Skip if already earned
        if badge_id in earned_badge_ids:
            continue
        
        # Check if badge should be awarded
        if badge_def['check'](progress, test_result):
            earned_badges.append({
                'id': badge_id,
                'name': badge_def['name'],
                'description': badge_def['description'],
                'icon': badge_def['icon'],
                'image': f'/badge_logo/{badge_id}.png',
                'earned': True,
                'earnedDate': datetime.utcnow().isoformat() + 'Z',
                'requirement': badge_def['requirement'],
                'xpReward': badge_def['xpReward']
            })
    
    return earned_badges


# ========================================
# STREAK CALCULATION
# ========================================
def update_streak(user_id, progress):
    """Update user streak based on last activity date."""
    now = datetime.utcnow()
    last_activity_str = progress.get('lastActivityDate')
    
    if not last_activity_str:
        # First activity
        return 1
    
    try:
        last_activity = datetime.fromisoformat(last_activity_str.replace('Z', '+00:00'))
        if last_activity.tzinfo:
            last_activity = last_activity.replace(tzinfo=None)
        
        # Check if within 24 hours
        time_diff = now - last_activity
        if time_diff <= timedelta(hours=24):
            # Increment streak
            current_streak = progress.get('streak', 0)
            return current_streak + 1
        else:
            # Reset streak
            return 1
    except Exception as e:
        print(f"Error updating streak: {str(e)}")
        return progress.get('streak', 0)


# ========================================
# SUBMIT TEST RESULT
# ========================================
def submit_test_result(body):
    """Submit a test result and update user progress."""
    try:
        # Validate required fields
        user_id = body.get('userId')
        if not user_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "userId is required"}
            })
        
        assessment_id = body.get('assessmentId')
        assessment_title = body.get('assessmentTitle')
        score = body.get('score', 0)
        total_questions = body.get('totalQuestions', 0)
        attempted = body.get('attempted', 0)
        solved = body.get('solved', 0)
        duration = body.get('duration', '')
        start_time = body.get('startTime')
        
        if not assessment_id or not assessment_title or not start_time:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "Missing required fields"}
            })
        
        # Generate test result ID
        test_result_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Calculate XP
        proctoring_data = body.get('proctoringData', {})
        xp_earned = calculate_xp(score, proctoring_data)
        
        # Get current user progress
        try:
            progress_result = user_progress_table.get_item(Key={'userId': user_id})
            if 'Item' in progress_result:
                progress = progress_result['Item']
            else:
                # Initialize new progress
                progress = {
                    'userId': user_id,
                    'level': 1,
                    'currentXP': 0,
                    'nextLevelXP': 500,
                    'totalXP': 0,
                    'streak': 0,
                    'testsCompleted': 0,
                    'avgScore': 0,
                    'badges': [],
                    'lastActivityDate': None,
                    'updatedAt': timestamp
                }
        except Exception as e:
            print(f"Error getting user progress: {str(e)}")
            progress = {
                'userId': user_id,
                'level': 1,
                'currentXP': 0,
                'nextLevelXP': 500,
                'totalXP': 0,
                'streak': 0,
                'testsCompleted': 0,
                'avgScore': 0,
                'badges': [],
                'lastActivityDate': None,
                'updatedAt': timestamp
            }
        
        # Update streak
        new_streak = update_streak(user_id, progress)
        progress['streak'] = new_streak
        progress['lastActivityDate'] = timestamp
        
        # Update XP and level
        old_total_xp = progress.get('totalXP', 0)
        new_total_xp = old_total_xp + xp_earned
        progress['totalXP'] = new_total_xp
        
        old_level = progress.get('level', 1)
        new_level = calculate_level(new_total_xp)
        progress['level'] = new_level
        progress['nextLevelXP'] = get_next_level_xp(new_level)
        progress['currentXP'] = new_total_xp - sum([get_next_level_xp(l) for l in range(1, new_level)])
        
        # Update test statistics
        tests_completed = progress.get('testsCompleted', 0) + 1
        progress['testsCompleted'] = tests_completed
        
        # Update average score
        old_avg = progress.get('avgScore', 0)
        new_avg = ((old_avg * (tests_completed - 1)) + score) / tests_completed
        progress['avgScore'] = round(new_avg, 2)
        
        # Check for badges
        test_result_data = {
            'score': score,
            'assessmentId': assessment_id,
            'duration': duration,
            'startTime': start_time
        }
        new_badges = check_badges(user_id, progress, test_result_data)
        
        # Add new badges to progress
        if new_badges:
            current_badges = progress.get('badges', [])
            # Update existing badges or add new ones
            for new_badge in new_badges:
                badge_id = new_badge['id']
                # Check if badge already exists
                badge_exists = False
                for i, badge in enumerate(current_badges):
                    if badge.get('id') == badge_id:
                        current_badges[i] = new_badge
                        badge_exists = True
                        break
                if not badge_exists:
                    current_badges.append(new_badge)
            progress['badges'] = current_badges
        
        # Save test result
        test_result_item = {
            'userId': user_id,
            'testResultId': test_result_id,
            'assessmentId': assessment_id,
            'assessmentTitle': assessment_title,
            'score': score,
            'totalQuestions': total_questions,
            'attempted': attempted,
            'solved': solved,
            'duration': duration,
            'startTime': start_time,
            'difficulty': body.get('difficulty'),
            'testMode': body.get('testMode'),
            'xpEarned': xp_earned,
            'questionResults': body.get('questionResults', []),
            'proctoringData': proctoring_data,
            'createdAt': timestamp
        }
        
        test_results_table.put_item(Item=test_result_item)
        
        # Update user progress
        progress['updatedAt'] = timestamp
        user_progress_table.put_item(Item=progress)
        
        # Update leaderboard
        update_leaderboard(user_id, progress)
        
        # Prepare response
        level_up = new_level > old_level
        badges_earned_ids = [b['id'] for b in new_badges]
        
        return response(200, {
            "success": True,
            "message": "Test result submitted successfully",
            "data": {
                "testResultId": test_result_id,
                "xpEarned": xp_earned,
                "badgesEarned": badges_earned_ids,
                "levelUp": level_up,
                "newLevel": new_level if level_up else None,
                "streakUpdated": new_streak > progress.get('streak', 0),
                "currentStreak": new_streak
            }
        })
        
    except Exception as e:
        print(f"Error submitting test result: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to submit test result"}
        })


# ========================================
# UPDATE LEADERBOARD
# ========================================
def update_leaderboard(user_id, progress):
    """Update leaderboard entries for user."""
    try:
        # Get user name (you might need to fetch from Users table)
        user_name = f"User {user_id[:8]}"  # Placeholder
        avatar = "👤"  # Placeholder
        
        xp = progress.get('totalXP', 0)
        tests_completed = progress.get('testsCompleted', 0)
        avg_score = progress.get('avgScore', 0)
        badges_count = len([b for b in progress.get('badges', []) if b.get('earned', False)])
        level = progress.get('level', 1)
        
        # Update for 'all' timeframe
        leaderboard_item = {
            'timeframe': 'all',
            'userId': user_id,
            'name': user_name,
            'avatar': avatar,
            'xp': xp,
            'testsCompleted': tests_completed,
            'avgScore': round(avg_score, 2),
            'badges': badges_count,
            'level': level,
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Note: Rank will be calculated when querying
        leaderboard_table.put_item(Item=leaderboard_item)
        
    except Exception as e:
        print(f"Error updating leaderboard: {str(e)}")
        # Don't fail the request if leaderboard update fails


# ========================================
# GET TEST HISTORY
# ========================================
def get_test_history(body):
    """Get test history for a user."""
    try:
        user_id = body.get('userId')
        if not user_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "userId is required"}
            })
        
        limit = body.get('limit', 50)
        offset = body.get('offset', 0)
        assessment_id = body.get('assessmentId')
        
        # Query test results
        if assessment_id:
            # Query by assessment ID using GSI
            result = test_results_table.query(
                IndexName='assessmentId-index',
                KeyConditionExpression=Key('assessmentId').eq(assessment_id),
                FilterExpression=Attr('userId').eq(user_id),
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
        else:
            # Query by user ID
            result = test_results_table.query(
                KeyConditionExpression=Key('userId').eq(user_id),
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
        
        items = result.get('Items', [])
        
        # Format results
        test_history = []
        for item in items[offset:offset+limit]:
            percentage = round((item.get('score', 0) / item.get('totalQuestions', 1)) * 100, 2)
            test_history.append({
                'testResultId': item.get('testResultId'),
                'assessmentId': item.get('assessmentId'),
                'assessmentTitle': item.get('assessmentTitle'),
                'score': item.get('score'),
                'totalQuestions': item.get('totalQuestions'),
                'attempted': item.get('attempted'),
                'solved': item.get('solved'),
                'duration': item.get('duration'),
                'startTime': item.get('startTime'),
                'percentage': percentage
            })
        
        return response(200, {
            "success": True,
            "data": {
                "testHistory": test_history,
                "total": len(items),
                "limit": limit,
                "offset": offset
            }
        })
        
    except Exception as e:
        print(f"Error getting test history: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get test history"}
        })


# ========================================
# GET USER PROGRESS
# ========================================
def get_user_progress(body):
    """Get user progress including XP, level, badges, etc."""
    try:
        user_id = body.get('userId')
        if not user_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "userId is required"}
            })
        
        # Get user progress
        result = user_progress_table.get_item(Key={'userId': user_id})
        
        if 'Item' not in result:
            # Return default progress
            default_progress = {
                "level": 1,
                "currentXP": 0,
                "nextLevelXP": 500,
                "totalXP": 0,
                "streak": 0,
                "lastActivityDate": None,
                "testsCompleted": 0,
                "avgScore": 0,
                "badges": []
            }
            return response(200, {
                "success": True,
                "data": default_progress
            })
        
        progress = result['Item']
        
        # Format badges (ensure all badge definitions are included)
        badges = progress.get('badges', [])
        badge_dict = {b.get('id'): b for b in badges}
        
        # Add all badge definitions, marking earned ones
        formatted_badges = []
        for badge_def in BADGE_DEFINITIONS:
            badge_id = badge_def['id']
            if badge_id in badge_dict:
                formatted_badges.append(badge_dict[badge_id])
            else:
                formatted_badges.append({
                    'id': badge_id,
                    'name': badge_def['name'],
                    'description': badge_def['description'],
                    'icon': badge_def['icon'],
                    'image': f'/badge_logo/{badge_id}.png',
                    'earned': False,
                    'requirement': badge_def['requirement'],
                    'xpReward': badge_def['xpReward']
                })
        
        return response(200, {
            "success": True,
            "data": {
                "level": progress.get('level', 1),
                "currentXP": progress.get('currentXP', 0),
                "nextLevelXP": progress.get('nextLevelXP', 500),
                "totalXP": progress.get('totalXP', 0),
                "streak": progress.get('streak', 0),
                "lastActivityDate": progress.get('lastActivityDate'),
                "testsCompleted": progress.get('testsCompleted', 0),
                "avgScore": progress.get('avgScore', 0),
                "badges": formatted_badges
            }
        })
        
    except Exception as e:
        print(f"Error getting user progress: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get user progress"}
        })


# ========================================
# GET LEADERBOARD
# ========================================
def get_leaderboard(body):
    """Get leaderboard entries."""
    try:
        limit = body.get('limit', 100)
        offset = body.get('offset', 0)
        timeframe = body.get('timeframe', 'all')
        user_id = body.get('userId')  # Optional, to get user's rank
        
        # Query leaderboard
        result = leaderboard_table.query(
            KeyConditionExpression=Key('timeframe').eq(timeframe),
            ScanIndexForward=False,  # Highest XP first
            Limit=limit + offset
        )
        
        items = result.get('Items', [])
        
        # Sort by XP (descending)
        items.sort(key=lambda x: x.get('xp', 0), reverse=True)
        
        # Assign ranks
        leaderboard = []
        user_rank = None
        
        for i, item in enumerate(items[offset:offset+limit], start=offset+1):
            entry = {
                'rank': i,
                'userId': item.get('userId'),
                'name': item.get('name', 'User'),
                'avatar': item.get('avatar', '👤'),
                'xp': item.get('xp', 0),
                'testsCompleted': item.get('testsCompleted', 0),
                'avgScore': item.get('avgScore', 0),
                'badges': item.get('badges', 0),
                'level': item.get('level', 1)
            }
            leaderboard.append(entry)
            
            # Check if this is the requested user
            if user_id and item.get('userId') == user_id:
                user_rank = i
        
        # If user not in current page, find their rank
        if user_id and user_rank is None:
            for i, item in enumerate(items, start=1):
                if item.get('userId') == user_id:
                    user_rank = i
                    break
        
        response_data = {
            "leaderboard": leaderboard,
            "total": len(items)
        }
        
        if user_rank is not None:
            response_data["userRank"] = user_rank
        
        return response(200, {
            "success": True,
            "data": response_data
        })
        
    except Exception as e:
        print(f"Error getting leaderboard: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get leaderboard"}
        })


# ========================================
# GET DAILY CHALLENGE
# ========================================
def get_daily_challenge(body):
    """Get daily challenge for a specific date."""
    try:
        user_id = body.get('userId')
        date_str = body.get('date')
        
        if not date_str:
            # Use today's date
            date_str = datetime.utcnow().strftime('%Y-%m-%d')
        
        # Get challenge for date
        result = daily_challenges_table.query(
            KeyConditionExpression=Key('date').eq(date_str)
        )
        
        items = result.get('Items', [])
        
        if not items:
            # Return default challenge (you might want to create one)
            return response(404, {
                "success": False,
                "error": {"code": "CHALLENGE_NOT_FOUND", "message": "No challenge found for this date"}
            })
        
        challenge = items[0]  # Get first challenge for the date
        
        # Check if user completed it
        completed = False
        if user_id:
            try:
                completion_result = daily_challenge_completions_table.get_item(
                    Key={
                        'userId': user_id,
                        'challengeId': challenge.get('challengeId')
                    }
                )
                completed = 'Item' in completion_result
            except:
                pass
        
        return response(200, {
            "success": True,
            "data": {
                "id": challenge.get('challengeId'),
                "title": challenge.get('title'),
                "topic": challenge.get('topic'),
                "difficulty": challenge.get('difficulty'),
                "xpReward": challenge.get('xpReward'),
                "timeLimit": challenge.get('timeLimit'),
                "completed": completed,
                "expiresAt": challenge.get('expiresAt'),
                "assessmentId": challenge.get('assessmentId')
            }
        })
        
    except Exception as e:
        print(f"Error getting daily challenge: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get daily challenge"}
        })


# ========================================
# COMPLETE DAILY CHALLENGE
# ========================================
def complete_daily_challenge(body):
    """Mark daily challenge as completed."""
    try:
        user_id = body.get('userId')
        challenge_id = body.get('challengeId')
        score = body.get('score', 0)
        
        if not user_id or not challenge_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "userId and challengeId are required"}
            })
        
        # Check if already completed
        try:
            existing = daily_challenge_completions_table.get_item(
                Key={
                    'userId': user_id,
                    'challengeId': challenge_id
                }
            )
            if 'Item' in existing:
                return response(409, {
                    "success": False,
                    "error": {"code": "CHALLENGE_ALREADY_COMPLETED", "message": "Challenge already completed"}
                })
        except:
            pass
        
        # Get challenge details
        # You might need to scan or maintain a challenge lookup
        # For now, assume challenge exists
        
        # Calculate XP (minimum 70% to earn full XP)
        if score >= 70:
            xp_earned = 50  # Full XP reward
        else:
            xp_earned = int(50 * (score / 70))  # Proportional XP
        
        # Save completion
        timestamp = datetime.utcnow().isoformat() + 'Z'
        completion_item = {
            'userId': user_id,
            'challengeId': challenge_id,
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'score': score,
            'xpEarned': xp_earned,
            'completedAt': timestamp
        }
        daily_challenge_completions_table.put_item(Item=completion_item)
        
        # Update user progress (similar to test submission)
        # This is simplified - you might want to reuse the progress update logic
        try:
            progress_result = user_progress_table.get_item(Key={'userId': user_id})
            if 'Item' in progress_result:
                progress = progress_result['Item']
                progress['totalXP'] = progress.get('totalXP', 0) + xp_earned
                progress['updatedAt'] = timestamp
                user_progress_table.put_item(Item=progress)
        except:
            pass
        
        return response(200, {
            "success": True,
            "message": "Daily challenge completed",
            "data": {
                "xpEarned": xp_earned,
                "badgesEarned": [],  # Check for daily challenge badges
                "streakUpdated": False
            }
        })
        
    except Exception as e:
        print(f"Error completing daily challenge: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to complete daily challenge"}
        })


# ========================================
# GET STUDY RESOURCES
# ========================================
def get_study_resources(body):
    """Get study resources, optionally filtered by topic or type."""
    try:
        topic = body.get('topic')
        resource_type = body.get('type')
        limit = body.get('limit', 20)
        
        # Query resources
        if topic:
            # Query by topic using GSI
            result = study_resources_table.query(
                IndexName='topic-index',
                KeyConditionExpression=Key('topic').eq(topic),
                Limit=limit
            )
        else:
            # Scan all resources
            result = study_resources_table.scan(Limit=limit)
        
        items = result.get('Items', [])
        
        # Filter by type if specified
        if resource_type:
            items = [item for item in items if item.get('type') == resource_type]
        
        # Format resources
        resources = []
        for item in items[:limit]:
            resources.append({
                'id': item.get('resourceId'),
                'title': item.get('title'),
                'type': item.get('type'),
                'topic': item.get('topic'),
                'duration': item.get('duration'),
                'url': item.get('url')
            })
        
        return response(200, {
            "success": True,
            "data": {
                "resources": resources,
                "count": len(resources)
            }
        })
        
    except Exception as e:
        print(f"Error getting study resources: {str(e)}")
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get study resources"}
        })


# ========================================
# ASSESSMENT MANAGEMENT
# ========================================
def create_assessment(body):
    """Create a new assessment."""
    try:
        # Required fields
        assessment_id = body.get('id') or str(uuid.uuid4())
        title = body.get('title')
        
        if not title:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "title is required"}
            })
        
        # Check if assessment already exists
        try:
            existing = assessments_table.get_item(Key={'id': assessment_id})
            if 'Item' in existing:
                return response(409, {
                    "success": False,
                    "error": {"code": "ASSESSMENT_EXISTS", "message": f"Assessment with id '{assessment_id}' already exists"}
                })
        except Exception:
            pass  # Table might not exist yet, continue
        
        # Prepare assessment data
        now = datetime.utcnow().isoformat()
        assessment_data = {
            'id': assessment_id,
            'title': title,
            'logo': body.get('logo', ''),
            'time': body.get('time', '30 Minutes'),
            'objective': body.get('objective', 0),
            'programming': body.get('programming', 0),
            'registrations': body.get('registrations', 0),
            'category': body.get('category', 'technical'),
            'popular': body.get('popular', False),
            'difficulty': body.get('difficulty', 'medium'),
            'difficulties': body.get('difficulties', [body.get('difficulty', 'medium')]),
            'company': body.get('company'),
            'xpReward': body.get('xpReward', 100),
            'status': body.get('status', 'draft'),
            'createdAt': now,
            'updatedAt': now,
            'questions': body.get('questions', [])
        }
        
        # Save to DynamoDB
        assessments_table.put_item(Item=assessment_data)
        
        return response(200, {
            "success": True,
            "message": "Assessment created successfully",
            "data": {
                "assessment": assessment_data
            }
        })
        
    except Exception as e:
        print(f"Error creating assessment: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to create assessment"}
        })


def update_assessment(body):
    """Update an existing assessment."""
    try:
        assessment_id = body.get('id')
        
        if not assessment_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "id is required"}
            })
        
        # Get existing assessment
        try:
            existing = assessments_table.get_item(Key={'id': assessment_id})
            if 'Item' not in existing:
                return response(404, {
                    "success": False,
                    "error": {"code": "ASSESSMENT_NOT_FOUND", "message": f"Assessment with id '{assessment_id}' not found"}
                })
            existing_data = existing['Item']
        except Exception as e:
            return response(404, {
                "success": False,
                "error": {"code": "ASSESSMENT_NOT_FOUND", "message": f"Assessment with id '{assessment_id}' not found"}
            })
        
        # Update fields (preserve existing if not provided)
        now = datetime.utcnow().isoformat()
        updated_data = {
            'id': assessment_id,
            'title': body.get('title', existing_data.get('title')),
            'logo': body.get('logo', existing_data.get('logo', '')),
            'time': body.get('time', existing_data.get('time', '30 Minutes')),
            'objective': body.get('objective', existing_data.get('objective', 0)),
            'programming': body.get('programming', existing_data.get('programming', 0)),
            'registrations': body.get('registrations', existing_data.get('registrations', 0)),
            'category': body.get('category', existing_data.get('category', 'technical')),
            'popular': body.get('popular', existing_data.get('popular', False)),
            'difficulty': body.get('difficulty', existing_data.get('difficulty', 'medium')),
            'difficulties': body.get('difficulties', existing_data.get('difficulties', [existing_data.get('difficulty', 'medium')])),
            'company': body.get('company', existing_data.get('company')),
            'xpReward': body.get('xpReward', existing_data.get('xpReward', 100)),
            'status': body.get('status', existing_data.get('status', 'draft')),
            'createdAt': existing_data.get('createdAt', now),
            'updatedAt': now,
            'questions': body.get('questions', existing_data.get('questions', []))
        }
        
        # Save to DynamoDB
        assessments_table.put_item(Item=updated_data)
        
        return response(200, {
            "success": True,
            "message": "Assessment updated successfully",
            "data": {
                "assessment": updated_data
            }
        })
        
    except Exception as e:
        print(f"Error updating assessment: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to update assessment"}
        })


def delete_assessment(body):
    """Delete an assessment."""
    try:
        assessment_id = body.get('assessmentId') or body.get('id')
        
        if not assessment_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "assessmentId is required"}
            })
        
        # Check if assessment exists
        try:
            existing = assessments_table.get_item(Key={'id': assessment_id})
            if 'Item' not in existing:
                return response(404, {
                    "success": False,
                    "error": {"code": "ASSESSMENT_NOT_FOUND", "message": f"Assessment with id '{assessment_id}' not found"}
                })
        except Exception:
            return response(404, {
                "success": False,
                "error": {"code": "ASSESSMENT_NOT_FOUND", "message": f"Assessment with id '{assessment_id}' not found"}
            })
        
        # Delete from DynamoDB
        assessments_table.delete_item(Key={'id': assessment_id})
        
        return response(200, {
            "success": True,
            "message": "Assessment deleted successfully"
        })
        
    except Exception as e:
        print(f"Error deleting assessment: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to delete assessment"}
        })


def list_assessments(body):
    """List all assessments, optionally filtered by category or status."""
    try:
        category = body.get('category')
        status = body.get('status')
        limit = body.get('limit', 100)
        
        # Scan assessments table
        if category or status:
            # Use filter expression
            filter_expr = None
            if category and status:
                filter_expr = Attr('category').eq(category) & Attr('status').eq(status)
            elif category:
                filter_expr = Attr('category').eq(category)
            elif status:
                filter_expr = Attr('status').eq(status)
            
            result = assessments_table.scan(
                FilterExpression=filter_expr,
                Limit=limit
            )
        else:
            result = assessments_table.scan(Limit=limit)
        
        items = result.get('Items', [])
        
        # Format assessments
        assessments = []
        for item in items:
            assessments.append({
                'id': item.get('id'),
                'title': item.get('title'),
                'logo': item.get('logo', ''),
                'time': item.get('time', '30 Minutes'),
                'objective': item.get('objective', 0),
                'programming': item.get('programming', 0),
                'registrations': item.get('registrations', 0),
                'category': item.get('category', 'technical'),
                'popular': item.get('popular', False),
                'difficulty': item.get('difficulty', 'medium'),
                'difficulties': item.get('difficulties', [item.get('difficulty', 'medium')]),
                'company': item.get('company'),
                'xpReward': item.get('xpReward', 100),
                'status': item.get('status', 'draft'),
                'createdAt': item.get('createdAt'),
                'updatedAt': item.get('updatedAt'),
                'questions': item.get('questions', [])
            })
        
        return response(200, {
            "success": True,
            "data": {
                "assessments": assessments,
                "count": len(assessments)
            }
        })
        
    except Exception as e:
        print(f"Error listing assessments: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to list assessments"}
        })



# ========================================
# GET QUESTIONS (Frontend Helper)
# ========================================
def get_questions(body):
    """Get questions for a specific assessment."""
    try:
        assessment_id = body.get('assessmentId') or body.get('id')
        
        if not assessment_id:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "assessmentId is required"}
            })
            
        # Get assessment
        try:
            result = assessments_table.get_item(Key={'id': assessment_id})
            if 'Item' not in result:
                return response(404, {
                    "success": False,
                    "error": {"code": "ASSESSMENT_NOT_FOUND", "message": "Assessment not found"}
                })
            
            assessment = result['Item']
            return response(200, {
                "success": True,
                "data": assessment.get('questions', [])
            })
            
        except Exception as e:
            return response(500, {
                "success": False,
                "error": {"code": "DB_ERROR", "message": str(e)}
            })
            
    except Exception as e:
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to get questions"}
        })


# ========================================
# MAIN LAMBDA HANDLER
# ========================================
def lambda_handler(event, context):
    """Main Lambda handler function."""
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return response(200, {})
        
        # Parse request body
        body = {}
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                return response(400, {
                    "success": False,
                    "error": {"code": "INVALID_JSON", "message": "Invalid JSON in request body"}
                })
        
        # Get action from body or path
        action = body.get('action') or event.get('pathParameters', {}).get('action')
        
        if not action:
            return response(400, {
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "action is required"}
            })
        
        # Route to appropriate handler
        if action == 'submit_test_result':
            return submit_test_result(body)
        elif action == 'get_questions':  # Added for frontend compatibility
            return get_questions(body)
        elif action == 'get_test_history':
            return get_test_history(body)
        elif action == 'get_user_progress':
            return get_user_progress(body)
        elif action == 'get_leaderboard':
            return get_leaderboard(body)
        elif action == 'get_daily_challenge':
            return get_daily_challenge(body)
        elif action == 'complete_daily_challenge':
            return complete_daily_challenge(body)
        elif action == 'get_study_resources':
            return get_study_resources(body)
        elif action == 'create_assessment':
            return create_assessment(body)
        elif action == 'update_assessment':
            return update_assessment(body)
        elif action == 'delete_assessment':
            return delete_assessment(body)
        elif action == 'list_assessments':
            return list_assessments(body)
        else:
            return response(400, {
                "success": False,
                "error": {"code": "INVALID_ACTION", "message": f"Unknown action: {action}"}
            })
            
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An error occurred"}
        })


"""
========================================
AWS SETUP INSTRUCTIONS
========================================

1. Create DynamoDB Tables:

   Table 1: TestResults
   - Partition Key: userId (String)
   - Sort Key: testResultId (String)
   - GSI1: assessmentId-index
     - Partition Key: assessmentId (String)
     - Sort Key: startTime (String)
   - GSI2: startTime-index
     - Partition Key: userId (String)
     - Sort Key: startTime (String)
   
   Table 2: UserProgress
   - Partition Key: userId (String)
   
   Table 3: Leaderboard
   - Partition Key: timeframe (String)
   - Sort Key: rank (Number)
   - GSI1: userId-index
     - Partition Key: userId (String)
     - Sort Key: xp (Number)
   
   Table 4: DailyChallenges
   - Partition Key: date (String, YYYY-MM-DD)
   - Sort Key: challengeId (String)
   
   Table 5: DailyChallengeCompletions
   - Partition Key: userId (String)
   - Sort Key: challengeId (String)
   
   Table 6: StudyResources
   - Partition Key: resourceId (String)
   - GSI1: topic-index
     - Partition Key: topic (String)
     - Sort Key: createdAt (String)
   
   Table 7: Assessments
   - Partition Key: id (String)
   - GSI1: category-index (optional)
     - Partition Key: category (String)
   - GSI2: status-index (optional)
     - Partition Key: status (String)

2. Create Lambda Function:
   - Function name: mock-assessment-handler
   - Runtime: Python 3.9+
   - Handler: mock_assessment_handler.lambda_handler
   - Memory: 512 MB
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
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/TestResults",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/TestResults/index/*",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/UserProgress",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Leaderboard",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Leaderboard/index/*",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/DailyChallenges",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/DailyChallengeCompletions",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/StudyResources",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/StudyResources/index/*",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Assessments",
                   "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Assessments/index/*"
               ]
           }
       ]
   }

4. API Gateway Integration:
   - Create REST API or HTTP API
   - Create resource: /mock-assessment
   - Create method: POST
   - Integration: Lambda Function (mock-assessment-handler)
   - Enable CORS

5. Example API Calls:

   POST /mock-assessment
   Body: {
     "action": "submit_test_result",
     "userId": "user123",
     "assessmentId": "java",
     "assessmentTitle": "Java",
     "score": 85,
     "totalQuestions": 15,
     "attempted": 15,
     "solved": 13,
     "duration": "30 mins",
     "startTime": "2025-01-20T10:30:00Z",
     "questionResults": [...],
     "proctoringData": {
       "tabSwitchCount": 0,
       "fullScreenExitCount": 0,
       "copyPasteAttempts": 0,
       "hintsUsed": 0
     }
   }
   
   POST /mock-assessment
   Body: {
     "action": "get_test_history",
     "userId": "user123",
     "limit": 50,
     "offset": 0
   }
   
   POST /mock-assessment
   Body: {
     "action": "get_user_progress",
     "userId": "user123"
   }
   
   POST /mock-assessment
   Body: {
     "action": "get_leaderboard",
     "limit": 100,
     "timeframe": "all"
   }
   
   POST /mock-assessment
   Body: {
     "action": "get_daily_challenge",
     "userId": "user123",
     "date": "2025-01-20"
   }
   
   POST /mock-assessment
   Body: {
     "action": "complete_daily_challenge",
     "userId": "user123",
     "challengeId": "daily-2025-01-20",
     "score": 85
   }
   
   POST /mock-assessment
   Body: {
     "action": "get_study_resources",
     "topic": "Java",
     "type": "video",
     "limit": 20
   }
   
   POST /mock-assessment
   Body: {
     "action": "create_assessment",
     "id": "java",
     "title": "Java",
     "logo": "/mock_assessments_logo/java.png",
     "time": "30 Minutes",
     "objective": 15,
     "programming": 0,
     "category": "language",
     "difficulties": ["easy", "medium"],
     "status": "published",
     "questions": [...]
   }
   
   POST /mock-assessment
   Body: {
     "action": "update_assessment",
     "id": "java",
     "title": "Java Advanced",
     "status": "published"
   }
   
   POST /mock-assessment
   Body: {
     "action": "delete_assessment",
     "assessmentId": "java"
   }
   
   POST /mock-assessment
   Body: {
     "action": "list_assessments",
     "category": "language",
     "status": "published",
     "limit": 50
   }

========================================
"""
