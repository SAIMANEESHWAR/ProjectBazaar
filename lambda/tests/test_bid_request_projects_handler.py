"""
Test cases for Bid Request Projects Handler Lambda Function
Covers all CRUD operations and edge cases
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from decimal import Decimal
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class MockDynamoDBTable:
    """Mock DynamoDB table for testing"""
    def __init__(self):
        self.items = {}
    
    def put_item(self, Item):
        self.items[Item.get('projectId')] = Item
        return {'ResponseMetadata': {'HTTPStatusCode': 200}}
    
    def get_item(self, Key):
        project_id = Key.get('projectId')
        if project_id in self.items:
            return {'Item': self.items[project_id]}
        return {}
    
    def scan(self, **kwargs):
        return {'Items': list(self.items.values())}
    
    def query(self, **kwargs):
        return {'Items': list(self.items.values())}
    
    def update_item(self, Key, **kwargs):
        project_id = Key.get('projectId')
        if project_id in self.items:
            return {'ResponseMetadata': {'HTTPStatusCode': 200}}
        raise Exception("Item not found")
    
    def delete_item(self, Key):
        project_id = Key.get('projectId')
        if project_id in self.items:
            del self.items[project_id]
        return {'ResponseMetadata': {'HTTPStatusCode': 200}}


@pytest.fixture
def mock_dynamodb():
    """Fixture to mock DynamoDB tables"""
    mock_table = MockDynamoDBTable()
    with patch('bid_request_projects_handler.bid_request_projects_table', mock_table), \
         patch('bid_request_projects_handler.users_table', MockDynamoDBTable()):
        yield mock_table


class TestCreateProject:
    """Tests for CREATE_PROJECT action"""
    
    def test_create_project_success(self, mock_dynamodb):
        """Should successfully create a new bid request project"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'buyerName': 'John Buyer',
                'title': 'React Dashboard Development',
                'description': 'Build a comprehensive admin dashboard with charts and tables.',
                'projectType': 'fixed',
                'budgetMin': 5000,
                'budgetMax': 10000,
                'currency': 'INR',
                'skills': ['React', 'TypeScript', 'TailwindCSS'],
                'category': 'Web Development',
                'deadline': '2024-06-30',
                'estimatedDuration': '2-3 weeks'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
        assert body['success'] == True
        assert 'projectId' in body['data']
    
    def test_create_project_missing_required_fields(self, mock_dynamodb):
        """Should return error when required fields are missing"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123'
                # Missing other required fields
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'VALIDATION_ERROR'
    
    def test_create_project_fixed_type(self, mock_dynamodb):
        """Should create fixed price project"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'title': 'Fixed Price Project',
                'description': 'A fixed price project',
                'projectType': 'fixed',
                'budgetMin': 1000,
                'budgetMax': 5000,
                'skills': ['JavaScript']
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
        assert body['success'] == True
    
    def test_create_project_hourly_type(self, mock_dynamodb):
        """Should create hourly rate project"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'title': 'Hourly Rate Project',
                'description': 'An hourly rate project',
                'projectType': 'hourly',
                'budgetMin': 25,
                'budgetMax': 50,
                'skills': ['Python']
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201


class TestGetAllProjects:
    """Tests for GET_ALL_PROJECTS action"""
    
    def test_get_all_projects_success(self, mock_dynamodb):
        """Should return all open projects"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-1'] = {
            'projectId': 'project-1',
            'buyerId': 'buyer-1',
            'title': 'Test Project',
            'status': 'open',
            'createdAt': '2024-01-01T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'GET_ALL_PROJECTS'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
        assert 'projects' in body['data']
    
    def test_get_all_projects_empty(self, mock_dynamodb):
        """Should return empty list when no projects exist"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_ALL_PROJECTS'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['data']['count'] == 0


class TestGetProject:
    """Tests for GET_PROJECT action"""
    
    def test_get_project_success(self, mock_dynamodb):
        """Should return project details"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-1',
            'title': 'Test Project',
            'description': 'Test description',
            'status': 'open',
            'createdAt': '2024-01-01T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'GET_PROJECT',
                'projectId': 'project-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['data']['project']['projectId'] == 'project-123'
    
    def test_get_project_not_found(self, mock_dynamodb):
        """Should return 404 for non-existent project"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_PROJECT',
                'projectId': 'non-existent'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 404
        assert body['error']['code'] == 'NOT_FOUND'
    
    def test_get_project_missing_id(self, mock_dynamodb):
        """Should return error when projectId is missing"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_PROJECT'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400


class TestGetProjectsByBuyer:
    """Tests for GET_PROJECTS_BY_BUYER action"""
    
    def test_get_projects_by_buyer_success(self, mock_dynamodb):
        """Should return all projects by a buyer"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-1'] = {
            'projectId': 'project-1',
            'buyerId': 'buyer-123',
            'title': 'Project 1',
            'status': 'open',
            'createdAt': '2024-01-01T00:00:00Z'
        }
        mock_dynamodb.items['project-2'] = {
            'projectId': 'project-2',
            'buyerId': 'buyer-123',
            'title': 'Project 2',
            'status': 'in_progress',
            'createdAt': '2024-01-02T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'GET_PROJECTS_BY_BUYER',
                'buyerId': 'buyer-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_get_projects_by_buyer_missing_id(self, mock_dynamodb):
        """Should return error when buyerId is missing"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_PROJECTS_BY_BUYER'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400


class TestUpdateProjectStatus:
    """Tests for UPDATE_PROJECT_STATUS action"""
    
    def test_update_status_to_in_progress(self, mock_dynamodb):
        """Should update project status to in_progress"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456',
            'status': 'open'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_PROJECT_STATUS',
                'projectId': 'project-123',
                'buyerId': 'buyer-456',
                'status': 'in_progress'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_update_status_to_completed(self, mock_dynamodb):
        """Should update project status to completed"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456',
            'status': 'in_progress'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_PROJECT_STATUS',
                'projectId': 'project-123',
                'buyerId': 'buyer-456',
                'status': 'completed'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
    
    def test_update_status_to_cancelled(self, mock_dynamodb):
        """Should update project status to cancelled"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456',
            'status': 'open'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_PROJECT_STATUS',
                'projectId': 'project-123',
                'buyerId': 'buyer-456',
                'status': 'cancelled'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
    
    def test_update_status_invalid(self, mock_dynamodb):
        """Should reject invalid status"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_PROJECT_STATUS',
                'projectId': 'project-123',
                'buyerId': 'buyer-456',
                'status': 'invalid_status'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
    
    def test_update_status_unauthorized(self, mock_dynamodb):
        """Should prevent non-owner from updating status"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456',
            'status': 'open'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_PROJECT_STATUS',
                'projectId': 'project-123',
                'buyerId': 'different-buyer',  # Wrong buyer
                'status': 'completed'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 403
        assert body['error']['code'] == 'FORBIDDEN'


class TestDeleteProject:
    """Tests for DELETE_PROJECT action"""
    
    def test_delete_project_success(self, mock_dynamodb):
        """Should successfully delete a project"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456'
        }
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_PROJECT',
                'projectId': 'project-123',
                'buyerId': 'buyer-456'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_delete_project_not_found(self, mock_dynamodb):
        """Should return 404 for non-existent project"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_PROJECT',
                'projectId': 'non-existent',
                'buyerId': 'buyer-456'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 404
    
    def test_delete_project_unauthorized(self, mock_dynamodb):
        """Should prevent non-owner from deleting"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'buyerId': 'buyer-456'
        }
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_PROJECT',
                'projectId': 'project-123',
                'buyerId': 'different-buyer'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 403


class TestIncrementBidsCount:
    """Tests for INCREMENT_BIDS_COUNT action"""
    
    def test_increment_bids_count_success(self, mock_dynamodb):
        """Should increment bids count"""
        from bid_request_projects_handler import lambda_handler
        
        mock_dynamodb.items['project-123'] = {
            'projectId': 'project-123',
            'bidsCount': 5
        }
        
        event = {
            'body': json.dumps({
                'action': 'INCREMENT_BIDS_COUNT',
                'projectId': 'project-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_increment_bids_count_missing_id(self, mock_dynamodb):
        """Should return error when projectId is missing"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'INCREMENT_BIDS_COUNT'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400


class TestEdgeCases:
    """Tests for edge cases"""
    
    def test_special_characters_in_title(self, mock_dynamodb):
        """Should handle special characters"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'title': 'Project with "quotes" & <brackets>',
                'description': 'Description with <script>alert("xss")</script>',
                'budgetMin': 1000,
                'budgetMax': 5000,
                'skills': ['C++', 'C#', '.NET']
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_unicode_content(self, mock_dynamodb):
        """Should handle unicode content"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'buyerName': '田中太郎',
                'title': 'プロジェクト - 项目',
                'description': '日本語の説明、中文描述',
                'budgetMin': 1000,
                'budgetMax': 5000,
                'skills': ['JavaScript']
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_large_budget_values(self, mock_dynamodb):
        """Should handle large budget values"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'title': 'Enterprise Project',
                'description': 'Large enterprise project',
                'budgetMin': 1000000,
                'budgetMax': 9999999,
                'skills': ['Enterprise']
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_many_skills(self, mock_dynamodb):
        """Should handle many skills"""
        from bid_request_projects_handler import lambda_handler
        
        skills = [f'Skill{i}' for i in range(50)]
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_PROJECT',
                'buyerId': 'buyer-123',
                'buyerEmail': 'buyer@example.com',
                'title': 'Multi-skill Project',
                'description': 'Project requiring many skills',
                'budgetMin': 1000,
                'budgetMax': 5000,
                'skills': skills
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_options_request(self, mock_dynamodb):
        """Should handle CORS preflight"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'httpMethod': 'OPTIONS'
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 200
        assert 'Access-Control-Allow-Origin' in response['headers']
    
    def test_invalid_json(self, mock_dynamodb):
        """Should handle invalid JSON"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': 'invalid json {'
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_JSON'
    
    def test_invalid_action(self, mock_dynamodb):
        """Should return error for invalid action"""
        from bid_request_projects_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'INVALID_ACTION'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_ACTION'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
