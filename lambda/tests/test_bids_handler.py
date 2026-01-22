"""
Test cases for Bids Handler Lambda Function
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
        self.items[Item.get('bidId')] = Item
        return {'ResponseMetadata': {'HTTPStatusCode': 200}}
    
    def get_item(self, Key):
        bid_id = Key.get('bidId')
        if bid_id in self.items:
            return {'Item': self.items[bid_id]}
        return {}
    
    def query(self, **kwargs):
        index = kwargs.get('IndexName', '')
        key_expr = kwargs.get('KeyConditionExpression', None)
        filter_expr = kwargs.get('FilterExpression', None)
        
        results = []
        for item in self.items.values():
            if 'projectId-index' in index:
                # Simulate projectId index query
                results.append(item)
            elif 'freelancerId-index' in index:
                # Simulate freelancerId index query
                results.append(item)
        
        return {'Items': results}
    
    def update_item(self, Key, **kwargs):
        bid_id = Key.get('bidId')
        if bid_id in self.items:
            return {'ResponseMetadata': {'HTTPStatusCode': 200}}
        raise Exception("Item not found")
    
    def delete_item(self, Key):
        bid_id = Key.get('bidId')
        if bid_id in self.items:
            del self.items[bid_id]
        return {'ResponseMetadata': {'HTTPStatusCode': 200}}


@pytest.fixture
def mock_dynamodb():
    """Fixture to mock DynamoDB tables"""
    mock_table = MockDynamoDBTable()
    with patch('bids_handler.bids_table', mock_table), \
         patch('bids_handler.users_table', MockDynamoDBTable()):
        yield mock_table


class TestCreateBid:
    """Tests for CREATE_BID action"""
    
    def test_create_bid_success(self, mock_dynamodb):
        """Should successfully create a new bid"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                'freelancerId': 'freelancer-456',
                'freelancerName': 'John Doe',
                'freelancerEmail': 'john@example.com',
                'bidAmount': 1000,
                'currency': 'INR',
                'deliveryTime': 7,
                'deliveryTimeUnit': 'days',
                'proposal': 'This is my detailed proposal for the project.'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
        assert body['success'] == True
        assert 'bidId' in body['data']
        assert body['data']['status'] == 'pending'
    
    def test_create_bid_missing_required_field(self, mock_dynamodb):
        """Should return error when required field is missing"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                # Missing freelancerId and other fields
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['success'] == False
        assert body['error']['code'] == 'VALIDATION_ERROR'
    
    def test_create_bid_empty_proposal(self, mock_dynamodb):
        """Should return error when proposal is empty"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                'freelancerId': 'freelancer-456',
                'freelancerName': 'John Doe',
                'freelancerEmail': 'john@example.com',
                'bidAmount': 1000,
                'deliveryTime': 7,
                'deliveryTimeUnit': 'days',
                'proposal': ''  # Empty proposal
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['success'] == False
    
    def test_create_bid_with_special_characters(self, mock_dynamodb):
        """Should handle special characters in proposal"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                'freelancerId': 'freelancer-456',
                'freelancerName': 'John <Script>',
                'freelancerEmail': 'john@example.com',
                'bidAmount': 1000,
                'deliveryTime': 7,
                'deliveryTimeUnit': 'days',
                'proposal': 'Special chars: <script>alert("xss")</script> & "quotes"'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
        assert body['success'] == True


class TestGetBidsByProject:
    """Tests for GET_BIDS_BY_PROJECT action"""
    
    def test_get_bids_by_project_success(self, mock_dynamodb):
        """Should return bids for a specific project"""
        from bids_handler import lambda_handler
        
        # First create a bid
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'projectId': 'project-123',
            'freelancerId': 'freelancer-1',
            'freelancerName': 'Test User',
            'freelancerEmail': 'test@example.com',
            'bidAmount': Decimal('1000'),
            'currency': 'INR',
            'deliveryTime': 7,
            'deliveryTimeUnit': 'days',
            'proposal': 'Test proposal',
            'status': 'pending',
            'submittedAt': '2024-01-01T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'GET_BIDS_BY_PROJECT',
                'projectId': 'project-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
        assert 'bids' in body['data']
    
    def test_get_bids_by_project_missing_id(self, mock_dynamodb):
        """Should return error when projectId is missing"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_BIDS_BY_PROJECT'
                # Missing projectId
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'VALIDATION_ERROR'


class TestGetBidsByFreelancer:
    """Tests for GET_BIDS_BY_FREELANCER action"""
    
    def test_get_bids_by_freelancer_success(self, mock_dynamodb):
        """Should return all bids by a freelancer"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'projectId': 'project-1',
            'freelancerId': 'freelancer-123',
            'freelancerName': 'Test User',
            'freelancerEmail': 'test@example.com',
            'bidAmount': Decimal('1000'),
            'currency': 'INR',
            'deliveryTime': 7,
            'deliveryTimeUnit': 'days',
            'proposal': 'Test proposal',
            'status': 'pending',
            'submittedAt': '2024-01-01T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'GET_BIDS_BY_FREELANCER',
                'freelancerId': 'freelancer-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_get_bids_by_freelancer_missing_id(self, mock_dynamodb):
        """Should return error when freelancerId is missing"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'GET_BIDS_BY_FREELANCER'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400


class TestUpdateBidStatus:
    """Tests for UPDATE_BID_STATUS action"""
    
    def test_update_bid_status_accepted(self, mock_dynamodb):
        """Should update bid status to accepted"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'projectId': 'project-1',
            'freelancerId': 'freelancer-1',
            'status': 'pending'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_BID_STATUS',
                'bidId': 'bid-1',
                'status': 'accepted'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
        assert body['data']['status'] == 'accepted'
    
    def test_update_bid_status_rejected(self, mock_dynamodb):
        """Should update bid status to rejected"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'status': 'pending'
        }
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_BID_STATUS',
                'bidId': 'bid-1',
                'status': 'rejected'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['data']['status'] == 'rejected'
    
    def test_update_bid_status_invalid(self, mock_dynamodb):
        """Should reject invalid status values"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_BID_STATUS',
                'bidId': 'bid-1',
                'status': 'invalid_status'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'VALIDATION_ERROR'
    
    def test_update_bid_status_missing_fields(self, mock_dynamodb):
        """Should return error when required fields are missing"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'UPDATE_BID_STATUS',
                'bidId': 'bid-1'
                # Missing status
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400


class TestDeleteBid:
    """Tests for DELETE_BID action"""
    
    def test_delete_bid_success(self, mock_dynamodb):
        """Should successfully delete a bid"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'freelancerId': 'freelancer-123'
        }
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_BID',
                'bidId': 'bid-1',
                'freelancerId': 'freelancer-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_delete_bid_not_found(self, mock_dynamodb):
        """Should return error for non-existent bid"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_BID',
                'bidId': 'non-existent'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 404
        assert body['error']['code'] == 'NOT_FOUND'
    
    def test_delete_bid_unauthorized(self, mock_dynamodb):
        """Should prevent deleting another user's bid"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'freelancerId': 'freelancer-123'
        }
        
        event = {
            'body': json.dumps({
                'action': 'DELETE_BID',
                'bidId': 'bid-1',
                'freelancerId': 'different-freelancer'  # Wrong freelancer
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 403
        assert body['error']['code'] == 'FORBIDDEN'


class TestCheckExistingBid:
    """Tests for CHECK_EXISTING_BID action"""
    
    def test_check_existing_bid_found(self, mock_dynamodb):
        """Should return hasBid=True when bid exists"""
        from bids_handler import lambda_handler
        
        mock_dynamodb.items['bid-1'] = {
            'bidId': 'bid-1',
            'projectId': 'project-123',
            'freelancerId': 'freelancer-456',
            'bidAmount': Decimal('1000'),
            'status': 'pending',
            'submittedAt': '2024-01-01T00:00:00Z'
        }
        
        event = {
            'body': json.dumps({
                'action': 'CHECK_EXISTING_BID',
                'freelancerId': 'freelancer-456',
                'projectId': 'project-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['success'] == True
    
    def test_check_existing_bid_not_found(self, mock_dynamodb):
        """Should return hasBid=False when no bid exists"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CHECK_EXISTING_BID',
                'freelancerId': 'new-freelancer',
                'projectId': 'project-123'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 200
        assert body['data']['hasBid'] == False


class TestCORSAndErrorHandling:
    """Tests for CORS and error handling"""
    
    def test_options_request(self, mock_dynamodb):
        """Should handle OPTIONS request for CORS"""
        from bids_handler import lambda_handler
        
        event = {
            'httpMethod': 'OPTIONS'
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 200
        assert 'Access-Control-Allow-Origin' in response['headers']
        assert response['headers']['Access-Control-Allow-Origin'] == '*'
    
    def test_invalid_json(self, mock_dynamodb):
        """Should handle invalid JSON in request body"""
        from bids_handler import lambda_handler
        
        event = {
            'body': 'invalid json {'
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_JSON'
    
    def test_invalid_action(self, mock_dynamodb):
        """Should return error for invalid action"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'INVALID_ACTION'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_ACTION'


class TestEdgeCases:
    """Tests for edge cases and boundary conditions"""
    
    def test_large_bid_amount(self, mock_dynamodb):
        """Should handle very large bid amounts"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                'freelancerId': 'freelancer-456',
                'freelancerName': 'John Doe',
                'freelancerEmail': 'john@example.com',
                'bidAmount': 9999999.99,
                'deliveryTime': 7,
                'deliveryTimeUnit': 'days',
                'proposal': 'Large bid proposal'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_unicode_content(self, mock_dynamodb):
        """Should handle unicode content"""
        from bids_handler import lambda_handler
        
        event = {
            'body': json.dumps({
                'action': 'CREATE_BID',
                'projectId': 'project-123',
                'freelancerId': 'freelancer-456',
                'freelancerName': '田中太郎',
                'freelancerEmail': 'tanaka@example.com',
                'bidAmount': 1000,
                'deliveryTime': 7,
                'deliveryTimeUnit': 'days',
                'proposal': '日本語の提案です。これはテストです。'
            })
        }
        
        response = lambda_handler(event, {})
        body = json.loads(response['body'])
        
        assert response['statusCode'] == 201
    
    def test_all_delivery_time_units(self, mock_dynamodb):
        """Should accept all valid delivery time units"""
        from bids_handler import lambda_handler
        
        units = ['hours', 'days', 'weeks', 'months']
        
        for unit in units:
            event = {
                'body': json.dumps({
                    'action': 'CREATE_BID',
                    'projectId': f'project-{unit}',
                    'freelancerId': f'freelancer-{unit}',
                    'freelancerName': 'Test User',
                    'freelancerEmail': 'test@example.com',
                    'bidAmount': 1000,
                    'deliveryTime': 7,
                    'deliveryTimeUnit': unit,
                    'proposal': f'Proposal for {unit}'
                })
            }
            
            response = lambda_handler(event, {})
            assert response['statusCode'] == 201, f"Failed for unit: {unit}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
