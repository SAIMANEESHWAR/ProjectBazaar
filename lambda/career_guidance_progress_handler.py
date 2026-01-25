import json
import boto3
from botocore.exceptions import ClientError
from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Any
import uuid

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
# Table names
USER_PROGRESS_TABLE = 'CareerGuidanceUserProgress'
CERTIFICATES_TABLE = 'CareerGuidanceCertificates'
ROADMAP_TABLE = 'Roadmaps'

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

# ============================================
# USER PROGRESS MANAGEMENT
# ============================================

def get_user_progress(user_id: str, category_id: str = None, duration: int = None) -> Dict[str, Any]:
    """Get user's roadmap progress for a specific category or all categories"""
    try:
        table = dynamodb.Table(USER_PROGRESS_TABLE)
        
        if category_id:
            # Get specific category progress
            db_response = table.get_item(
                Key={
                    'userId': user_id,
                    'categoryId': category_id
                }
            )
            progress = db_response.get('Item', None)
            
            if progress and duration:
                # Extract progress for specific duration
                durations_data = progress.get('durations', {})
                duration_progress = durations_data.get(str(duration))
                
                if duration_progress:
                    # Return progress with backward compatibility structure
                    return response(200, {
                        'success': True,
                        'progress': {
                            'userId': progress.get('userId'),
                            'userName': progress.get('userName'),
                            'categoryId': progress.get('categoryId'),
                            'categoryName': progress.get('categoryName'),
                            'duration': duration,
                            'weeksProgress': duration_progress.get('weeksProgress', []),
                            'overallProgress': duration_progress.get('overallProgress', 0),
                            'isRoadmapCompleted': duration_progress.get('isRoadmapCompleted', False),
                            'certificateId': duration_progress.get('certificateId'),
                            'updatedAt': duration_progress.get('updatedAt'),
                            'createdAt': progress.get('createdAt')
                        }
                    })
                else:
                    return response(200, {
                        'success': True,
                        'progress': None
                    })
            
            return response(200, {
                'success': True,
                'progress': progress
            })
        else:
            # Get all progress for user
            db_response = table.query(
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
            progress_list = db_response.get('Items', [])
            return response(200, {
                'success': True,
                'progressList': progress_list
            })
    except ClientError as e:
        return response(500, {
            'success': False,
            'error': f'Failed to get progress: {str(e)}'
        })

def save_user_progress(body: Dict[str, Any]) -> Dict[str, Any]:
    """Save or update user's roadmap progress - supports multiple durations per category"""
    try:
        user_id = body.get('userId')
        user_name = body.get('userName', '')
        category_id = body.get('categoryId')
        category_name = body.get('categoryName', '')
        duration = body.get('duration', 8)
        weeks_progress = body.get('weeksProgress', [])  # [{weekNumber, isCompleted, quizCompleted, quizScore}]
        
        if not user_id or not category_id:
            return response(400, {
                'success': False,
                'error': 'userId and categoryId are required'
            })
        
        table = dynamodb.Table(USER_PROGRESS_TABLE)
        
        # Check if progress exists
        existing = table.get_item(Key={'userId': user_id, 'categoryId': category_id})
        existing_item = existing.get('Item', {})
        
        now = datetime.utcnow().isoformat()
        
        # Get existing durations data or create new
        durations_data = existing_item.get('durations', {})
        
        # Calculate overall progress for this specific duration
        total_weeks = len(weeks_progress)
        completed_weeks = sum(1 for w in weeks_progress if w.get('isCompleted') and w.get('quizCompleted'))
        overall_progress = round((completed_weeks / total_weeks) * 100) if total_weeks > 0 else 0
        is_completed = completed_weeks == total_weeks
        
        # Update progress for this specific duration
        durations_data[str(duration)] = {
            'duration': duration,
            'weeksProgress': weeks_progress,
            'overallProgress': overall_progress,
            'isRoadmapCompleted': is_completed,
            'updatedAt': now,
            'startedAt': durations_data.get(str(duration), {}).get('startedAt', now)
        }
        
        # Create/update main item
        item = {
            'userId': user_id,
            'userName': user_name or existing_item.get('userName', ''),
            'categoryId': category_id,
            'categoryName': category_name,
            'durations': durations_data,  # Nested structure for each duration
            'updatedAt': now,
            'createdAt': existing_item.get('createdAt', now)
        }
        
        table.put_item(Item=item)
        
        return response(200, {
            'success': True,
            'message': 'Progress saved successfully',
            'progress': item,
            'currentDuration': durations_data[str(duration)]
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to save progress: {str(e)}'
        })

def mark_week_completed(body: Dict[str, Any]) -> Dict[str, Any]:
    """Mark a week as completed (for weeks without quiz) - supports multiple durations"""
    try:
        user_id = body.get('userId')
        user_name = body.get('userName', '')
        category_id = body.get('categoryId')
        week_number = body.get('weekNumber')
        duration = body.get('duration', 8)
        
        if not all([user_id, category_id, week_number]):
            return response(400, {
                'success': False,
                'error': 'userId, categoryId, and weekNumber are required'
            })
        
        table = dynamodb.Table(USER_PROGRESS_TABLE)
        
        # Get existing progress
        db_response = table.get_item(Key={'userId': user_id, 'categoryId': category_id})
        progress = db_response.get('Item')
        
        if not progress:
            return response(404, {
                'success': False,
                'error': 'Progress not found. Start the roadmap first.'
            })
        
        # Update userName if provided and not already set
        if user_name and not progress.get('userName'):
            progress['userName'] = user_name
        
        # Get durations data
        durations_data = progress.get('durations', {})
        duration_key = str(duration)
        
        if duration_key not in durations_data:
            durations_data[duration_key] = {
                'duration': duration,
                'weeksProgress': [],
                'startedAt': datetime.utcnow().isoformat()
            }
        
        # Update the specific week for this duration
        weeks_progress = durations_data[duration_key].get('weeksProgress', [])
        week_found = False
        
        for week in weeks_progress:
            if week.get('weekNumber') == week_number:
                week['isCompleted'] = True
                week['quizCompleted'] = True  # Mark quiz as completed too (no quiz = auto complete)
                week['completedAt'] = datetime.utcnow().isoformat()
                week_found = True
                break
        
        if not week_found:
            # Add new week progress
            weeks_progress.append({
                'weekNumber': week_number,
                'isCompleted': True,
                'quizCompleted': True,
                'completedAt': datetime.utcnow().isoformat()
            })
        
        # Save updated progress for this duration
        durations_data[duration_key]['weeksProgress'] = weeks_progress
        durations_data[duration_key]['updatedAt'] = datetime.utcnow().isoformat()
        
        # Recalculate overall progress for this duration
        total_weeks = len(weeks_progress)
        completed_weeks = sum(1 for w in weeks_progress if w.get('isCompleted') and w.get('quizCompleted'))
        durations_data[duration_key]['overallProgress'] = round((completed_weeks / total_weeks) * 100) if total_weeks > 0 else 0
        durations_data[duration_key]['isRoadmapCompleted'] = completed_weeks == total_weeks
        
        # Update main progress item
        progress['durations'] = durations_data
        progress['updatedAt'] = datetime.utcnow().isoformat()
        
        table.put_item(Item=progress)
        
        return response(200, {
            'success': True,
            'message': f'Week {week_number} marked as completed for {duration}-week program',
            'progress': progress,
            'currentDuration': durations_data[duration_key]
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to mark week completed: {str(e)}'
        })

# ============================================
# QUIZ VALIDATION
# ============================================

def validate_quiz(body: Dict[str, Any]) -> Dict[str, Any]:
    """Validate quiz answers against correct answers from roadmap data"""
    try:
        user_id = body.get('userId')
        user_name = body.get('userName', '')
        category_id = body.get('categoryId')
        week_number = body.get('weekNumber')
        user_answers = body.get('userAnswers', [])  # [{ questionIndex, selectedAnswer }]
        duration = body.get('duration', 8)
        
        if not all([user_id, category_id, week_number]):
            return response(400, {
                'success': False,
                'error': 'userId, categoryId, and weekNumber are required'
            })
        
        # Get roadmap data to validate answers
        roadmap_table = dynamodb.Table(ROADMAP_TABLE)
        roadmap_response = roadmap_table.get_item(Key={'categoryId': category_id})
        roadmap = roadmap_response.get('Item')
        
        if not roadmap:
            return response(404, {
                'success': False,
                'error': 'Roadmap not found'
            })
        
        # Get the specific program's weeks or fallback to global weeks
        programs = roadmap.get('programs', {})
        specific_program = programs.get(str(duration), {})
        weeks = specific_program.get('weeks', roadmap.get('weeks', []))
        
        # Find the specific week
        week_data = None
        for week in weeks:
            if week.get('weekNumber') == week_number:
                week_data = week
                break
        
        if not week_data:
            return response(404, {
                'success': False,
                'error': f'Week {week_number} not found in roadmap'
            })
        
        quiz_questions = week_data.get('quiz', [])
        
        if not quiz_questions:
            # No quiz for this week - auto pass
            return response(200, {
                'success': True,
                'hasQuiz': False,
                'score': 100,
                'passed': True,
                'feedback': 'No quiz for this week. You can proceed to the next week.',
                'correctAnswers': []
            })
        
        # Calculate score
        correct_count = 0
        results = []
        
        for i, question in enumerate(quiz_questions):
            correct_answer = question.get('correctAnswer', 0)
            user_answer = None
            
            # Find user's answer for this question
            for ua in user_answers:
                if ua.get('questionIndex') == i:
                    user_answer = ua.get('selectedAnswer')
                    break
            
            is_correct = user_answer == correct_answer
            if is_correct:
                correct_count += 1
            
            results.append({
                'questionIndex': i,
                'userAnswer': user_answer,
                'correctAnswer': correct_answer,
                'isCorrect': is_correct
            })
        
        score = round((correct_count / len(quiz_questions)) * 100) if quiz_questions else 100
        passed = score >= 70  # 70% passing threshold
        
        feedback = (
            f"Excellent work! You scored {score}%. You've mastered this week's content."
            if score >= 90 else
            f"Great job! You scored {score}%. You can proceed to the next week."
            if score >= 70 else
            f"You scored {score}%. Review the topics and try again. You need 70% to pass."
        )
        
        # Update user progress if passed - supports multiple durations
        if passed:
            progress_table = dynamodb.Table(USER_PROGRESS_TABLE)
            db_response = progress_table.get_item(Key={'userId': user_id, 'categoryId': category_id})
            existing_progress = db_response.get('Item', {})
            
            now = datetime.utcnow().isoformat()
            
            if not existing_progress:
                # Create new progress entry
                existing_progress = {
                    'userId': user_id,
                    'userName': user_name,
                    'categoryId': category_id,
                    'durations': {},
                    'createdAt': now
                }
            
            # Update userName if provided and not already set
            if user_name and not existing_progress.get('userName'):
                existing_progress['userName'] = user_name
            
            # Get durations data
            durations_data = existing_progress.get('durations', {})
            duration_key = str(duration)
            
            if duration_key not in durations_data:
                durations_data[duration_key] = {
                    'duration': duration,
                    'weeksProgress': [],
                    'startedAt': now
                }
            
            # Update the specific week for this duration
            weeks_progress = durations_data[duration_key].get('weeksProgress', [])
            week_found = False
            
            for week in weeks_progress:
                if week.get('weekNumber') == week_number:
                    week['isCompleted'] = True
                    week['quizCompleted'] = True
                    week['quizScore'] = score
                    week['completedAt'] = now
                    week_found = True
                    break
            
            if not week_found:
                weeks_progress.append({
                    'weekNumber': week_number,
                    'isCompleted': True,
                    'quizCompleted': True,
                    'quizScore': score,
                    'completedAt': now
                })
            
            # Update duration progress
            durations_data[duration_key]['weeksProgress'] = weeks_progress
            durations_data[duration_key]['updatedAt'] = now
            
            # Recalculate overall progress for this duration
            total_weeks = len(weeks_progress)
            completed_weeks = sum(1 for w in weeks_progress if w.get('isCompleted') and w.get('quizCompleted'))
            durations_data[duration_key]['overallProgress'] = round((completed_weeks / total_weeks) * 100) if total_weeks > 0 else 0
            durations_data[duration_key]['isRoadmapCompleted'] = completed_weeks == total_weeks
            
            # Update main progress
            existing_progress['durations'] = durations_data
            existing_progress['updatedAt'] = now
            
            progress_table.put_item(Item=existing_progress)
        
        return response(200, {
            'success': True,
            'hasQuiz': True,
            'score': score,
            'passed': passed,
            'feedback': feedback,
            'correctCount': correct_count,
            'totalQuestions': len(quiz_questions),
            'results': results
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to validate quiz: {str(e)}'
        })

def validate_final_exam(body: Dict[str, Any]) -> Dict[str, Any]:
    """Validate final exam answers"""
    try:
        user_id = body.get('userId')
        user_name = body.get('userName', 'Student')
        category_id = body.get('categoryId')
        category_name = body.get('categoryName', '')
        user_answers = body.get('userAnswers', [])  # Array of selected answer indices
        questions = body.get('questions', [])  # Array of question objects with correctAnswer
        
        if not all([user_id, category_id, user_answers]):
            return response(400, {
                'success': False,
                'error': 'userId, categoryId, and userAnswers are required'
            })
        
        # Calculate score
        correct_count = 0
        for i, answer in enumerate(user_answers):
            if i < len(questions) and answer == questions[i].get('correctAnswer'):
                correct_count += 1
        
        total_questions = len(questions)
        score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
        passed = score >= 80  # 80% passing threshold for final exam
        
        result = {
            'success': True,
            'score': score,
            'passed': passed,
            'correctCount': correct_count,
            'totalQuestions': total_questions,
            'feedback': (
                f"Congratulations! You scored {score}% and earned your certificate!"
                if passed else
                f"You scored {score}%. You need 80% to pass. Review and try again."
            )
        }
        
        # If passed, generate and save certificate
        if passed:
            certificate = generate_certificate({
                'userId': user_id,
                'userName': user_name,
                'categoryId': category_id,
                'categoryName': category_name,
                'score': score
            })
            result['certificate'] = certificate.get('certificate')
        
        # Update user progress
        progress_table = dynamodb.Table(USER_PROGRESS_TABLE)
        db_response = progress_table.get_item(Key={'userId': user_id, 'categoryId': category_id})
        progress = db_response.get('Item', {})
        
        if progress:
            progress['finalExamScore'] = score
            progress['finalExamPassed'] = passed
            progress['finalExamCompletedAt'] = datetime.utcnow().isoformat()
            progress['isRoadmapCompleted'] = passed
            progress['updatedAt'] = datetime.utcnow().isoformat()
            progress_table.put_item(Item=progress)
        
        return response(200, result)
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to validate final exam: {str(e)}'
        })

# ============================================
# CERTIFICATE MANAGEMENT
# ============================================

def generate_certificate(body: Dict[str, Any]) -> Dict[str, Any]:
    """Generate and save certificate with comprehensive details - unique per category+duration"""
    try:
        user_id = body.get('userId')
        user_name = body.get('userName', 'Student')
        category_id = body.get('categoryId')
        category_name = body.get('categoryName', '')
        score = body.get('score', 0)
        duration = body.get('duration', 8)
        
        if not all([user_id, category_id]):
            return response(400, {
                'success': False,
                'error': 'userId and categoryId are required'
            })
        
        # Get user progress to calculate comprehensive stats
        progress_table = dynamodb.Table(USER_PROGRESS_TABLE)
        db_response = progress_table.get_item(Key={'userId': user_id, 'categoryId': category_id})
        progress = db_response.get('Item', {})
        
        # Get duration-specific progress
        durations_data = progress.get('durations', {})
        duration_progress = durations_data.get(str(duration), {})
        weeks_progress = duration_progress.get('weeksProgress', [])
        
        # CHECK IF CERTIFICATE ALREADY EXISTS - Don't generate duplicate
        existing_cert_id = duration_progress.get('certificateId')
        if existing_cert_id:
            # Certificate already exists, retrieve and return it
            cert_table = dynamodb.Table(CERTIFICATES_TABLE)
            cert_response = cert_table.get_item(Key={'certificateId': existing_cert_id})
            existing_certificate = cert_response.get('Item')
            
            if existing_certificate:
                return {
                    'success': True,
                    'message': 'Certificate already exists',
                    'certificate': existing_certificate,
                    'alreadyExists': True
                }
        
        total_weeks = len(weeks_progress) if weeks_progress else duration
        completed_weeks = sum(1 for w in weeks_progress if w.get('quizCompleted'))
        
        # Calculate average quiz score
        quiz_scores = [w.get('quizScore', 100) for w in weeks_progress if w.get('quizCompleted') and w.get('quizScore') is not None]
        avg_score = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else score
        
        # Calculate total accuracy (same as avg score for quizzes)
        accuracy = avg_score
        
        certificate_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        certificate = {
            'certificateId': certificate_id,
            'userId': user_id,
            'userName': user_name,
            'categoryId': category_id,
            'categoryName': category_name,
            'duration': duration,  # Include duration to make certificate unique
            'score': avg_score,
            'accuracy': accuracy,
            'totalWeeks': total_weeks,
            'completedWeeks': completed_weeks,
            'issuedAt': now.isoformat(),
            'issuedDate': now.strftime('%B %d, %Y'),
            'verificationCode': f'CG-{certificate_id[:8].upper()}',
            'status': 'Passed'
        }
        
        # Save to certificates table
        table = dynamodb.Table(CERTIFICATES_TABLE)
        table.put_item(Item=certificate)
        
        # Also update user progress for this specific duration
        if progress and str(duration) in durations_data:
            durations_data[str(duration)]['certificateId'] = certificate_id
            durations_data[str(duration)]['certificateIssuedAt'] = now.isoformat()
            durations_data[str(duration)]['isRoadmapCompleted'] = True
            durations_data[str(duration)]['finalScore'] = avg_score
            durations_data[str(duration)]['updatedAt'] = now.isoformat()
            
            progress['durations'] = durations_data
            progress['updatedAt'] = now.isoformat()
            progress_table.put_item(Item=progress)
        
        return {
            'success': True,
            'message': f'Certificate generated successfully for {duration}-week {category_name} program',
            'certificate': certificate
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to generate certificate: {str(e)}'
        }

def get_user_certificates(user_id: str) -> Dict[str, Any]:
    """Get all certificates for a user"""
    try:
        table = dynamodb.Table(CERTIFICATES_TABLE)
        
        # Scan with filter (consider adding GSI for better performance)
        db_response = table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        certificates = db_response.get('Items', [])
        # Sort by issued date (newest first)
        certificates.sort(key=lambda x: x.get('issuedAt', ''), reverse=True)
        
        return response(200, {
            'success': True,
            'certificates': certificates
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to get certificates: {str(e)}'
        })

def verify_certificate(certificate_id: str) -> Dict[str, Any]:
    """Verify a certificate by ID"""
    try:
        table = dynamodb.Table(CERTIFICATES_TABLE)
        db_response = table.get_item(Key={'certificateId': certificate_id})
        
        certificate = db_response.get('Item')
        
        if certificate:
            return response(200, {
                'success': True,
                'valid': True,
                'certificate': certificate
            })
        else:
            return response(404, {
                'success': False,
                'valid': False,
                'error': 'Certificate not found'
            })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to verify certificate: {str(e)}'
        })

# ============================================
# GET COMPLETED COURSE DETAILS
# ============================================

def get_completed_course_details(body: Dict[str, Any]) -> Dict[str, Any]:
    """Get all details for a completed course including questions, answers, and certificate"""
    try:
        user_id = body.get('userId')
        category_id = body.get('categoryId')
        duration = body.get('duration', 8)
        
        if not all([user_id, category_id]):
            return response(400, {
                'success': False,
                'error': 'userId and categoryId are required'
            })
        
        # Get user progress
        progress_table = dynamodb.Table(USER_PROGRESS_TABLE)
        db_response = progress_table.get_item(Key={'userId': user_id, 'categoryId': category_id})
        progress = db_response.get('Item')
        
        if not progress:
            return response(404, {
                'success': False,
                'error': 'No progress found'
            })
        
        # Get duration-specific data
        durations_data = progress.get('durations', {})
        duration_progress = durations_data.get(str(duration))
        
        if not duration_progress:
            return response(404, {
                'success': False,
                'error': f'No progress found for {duration}-week program'
            })
        
        # Get certificate if exists
        certificate = None
        cert_id = duration_progress.get('certificateId')
        if cert_id:
            cert_table = dynamodb.Table(CERTIFICATES_TABLE)
            cert_response = cert_table.get_item(Key={'certificateId': cert_id})
            certificate = cert_response.get('Item')
        
        # Get roadmap data to include quiz questions
        roadmap_table = dynamodb.Table(ROADMAP_TABLE)
        roadmap_response = roadmap_table.get_item(Key={'categoryId': category_id})
        roadmap = roadmap_response.get('Item')
        
        # Get weeks with quiz questions
        weeks_with_quizzes = []
        if roadmap:
            programs = roadmap.get('programs', {})
            specific_program = programs.get(str(duration), {})
            weeks = specific_program.get('weeks', roadmap.get('weeks', []))
            
            for week_progress in duration_progress.get('weeksProgress', []):
                week_number = week_progress.get('weekNumber')
                
                # Find matching week in roadmap
                week_data = next((w for w in weeks if w.get('weekNumber') == week_number), None)
                
                if week_data:
                    week_detail = {
                        'weekNumber': week_number,
                        'isCompleted': week_progress.get('isCompleted'),
                        'quizCompleted': week_progress.get('quizCompleted'),
                        'quizScore': week_progress.get('quizScore'),
                        'completedAt': week_progress.get('completedAt'),
                        'mainTopics': week_data.get('mainTopics', []),
                        'miniProject': week_data.get('miniProject'),
                        'quiz': week_data.get('quiz', [])  # Include questions with correct answers
                    }
                    weeks_with_quizzes.append(week_detail)
        
        return response(200, {
            'success': True,
            'courseDetails': {
                'userId': user_id,
                'userName': progress.get('userName'),
                'categoryId': category_id,
                'categoryName': progress.get('categoryName'),
                'duration': duration,
                'isCompleted': duration_progress.get('isRoadmapCompleted', False),
                'overallProgress': duration_progress.get('overallProgress', 0),
                'finalScore': duration_progress.get('finalScore'),
                'weeksDetails': weeks_with_quizzes,
                'certificate': certificate
            }
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to get course details: {str(e)}'
        })

# ============================================
# CHECK IF WEEK HAS QUIZ
# ============================================

def check_week_has_quiz(body: Dict[str, Any]) -> Dict[str, Any]:
    """Check if a specific week has quiz questions"""
    try:
        category_id = body.get('categoryId')
        week_number = body.get('weekNumber')
        duration = body.get('duration', 8)
        
        if not all([category_id, week_number]):
            return response(400, {
                'success': False,
                'error': 'categoryId and weekNumber are required'
            })
        
        # Get roadmap data
        roadmap_table = dynamodb.Table(ROADMAP_TABLE)
        roadmap_response = roadmap_table.get_item(Key={'categoryId': category_id})
        roadmap = roadmap_response.get('Item')
        
        if not roadmap:
            return response(404, {
                'success': False,
                'error': 'Roadmap not found'
            })
        
        # Get the specific program's weeks or fallback to global weeks
        programs = roadmap.get('programs', {})
        specific_program = programs.get(str(duration), {})
        weeks = specific_program.get('weeks', roadmap.get('weeks', []))
        
        # Find the specific week
        week_data = None
        for week in weeks:
            if week.get('weekNumber') == week_number:
                week_data = week
                break
        
        if not week_data:
            return response(404, {
                'success': False,
                'error': f'Week {week_number} not found in roadmap'
            })
        
        quiz_questions = week_data.get('quiz', [])
        has_quiz = len(quiz_questions) > 0
        
        return response(200, {
            'success': True,
            'hasQuiz': has_quiz,
            'quizQuestionCount': len(quiz_questions)
        })
    except Exception as e:
        return response(500, {
            'success': False,
            'error': f'Failed to check quiz: {str(e)}'
        })

# ============================================
# MAIN LAMBDA HANDLER
# ============================================

def lambda_handler(event, context):
    """
    Main Lambda handler - handles all career guidance progress operations
    
    Supported actions:
    - get_progress: Get user's roadmap progress
    - save_progress: Save/update user's progress
    - mark_week_completed: Mark a week as completed (no quiz)
    - validate_quiz: Validate weekly quiz answers
    - validate_final_exam: Validate final exam and generate certificate
    - get_certificates: Get user's certificates
    - verify_certificate: Verify a certificate
    - check_week_has_quiz: Check if week has quiz questions
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
        
        # Get action
        action = body.get('action', '').lower()
        
        # Route requests based on action
        if action == 'get_progress':
            user_id = body.get('userId')
            category_id = body.get('categoryId')
            duration = body.get('duration')
            if not user_id:
                return response(400, {'success': False, 'error': 'userId is required'})
            return get_user_progress(user_id, category_id, duration)
        
        elif action == 'save_progress':
            return save_user_progress(body)
        
        elif action == 'mark_week_completed':
            return mark_week_completed(body)
        
        elif action == 'validate_quiz':
            return validate_quiz(body)
        
        elif action == 'validate_final_exam':
            return validate_final_exam(body)
        
        elif action == 'get_certificates':
            user_id = body.get('userId')
            if not user_id:
                return response(400, {'success': False, 'error': 'userId is required'})
            return get_user_certificates(user_id)
        
        elif action == 'verify_certificate':
            certificate_id = body.get('certificateId')
            if not certificate_id:
                return response(400, {'success': False, 'error': 'certificateId is required'})
            return verify_certificate(certificate_id)
        
        elif action == 'check_week_has_quiz':
            return check_week_has_quiz(body)
        
        elif action == 'get_completed_course_details':
            return get_completed_course_details(body)
        
        elif action == 'generate_certificate':
            # Direct certificate generation (when all weeks completed)
            result = generate_certificate(body)
            if isinstance(result, dict) and 'statusCode' not in result:
                return response(200, result)
            return result
        
        else:
            return response(400, {
                'success': False,
                'error': f'Invalid action: {action}. Valid actions: get_progress, save_progress, mark_week_completed, validate_quiz, validate_final_exam, get_certificates, verify_certificate, check_week_has_quiz, get_completed_course_details, generate_certificate'
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

