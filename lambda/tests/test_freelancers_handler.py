"""
Unit Tests for Freelancers Handler Lambda Function
Tests all CRUD operations and edge cases
"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal

# Import the handler module
import sys
sys.path.insert(0, '..')
from freelancers_handler import (
    lambda_handler,
    handle_get_all_freelancers,
    handle_get_freelancer_by_id,
    handle_get_top_freelancers,
    handle_search_freelancers,
    format_freelancer,
    get_seller_stats,
    decimal_to_float,
    response
)


class TestDecimalToFloat:
    """Test the decimal_to_float helper function"""

    def test_convert_decimal(self):
        result = decimal_to_float(Decimal('10.5'))
        assert result == 10.5
        assert isinstance(result, float)

    def test_convert_nested_dict(self):
        data = {
            'price': Decimal('99.99'),
            'quantity': Decimal('5')
        }
        result = decimal_to_float(data)
        assert result['price'] == 99.99
        assert result['quantity'] == 5.0

    def test_convert_nested_list(self):
        data = [Decimal('1.1'), Decimal('2.2'), Decimal('3.3')]
        result = decimal_to_float(data)
        assert result == [1.1, 2.2, 3.3]

    def test_convert_mixed_data(self):
        data = {
            'items': [
                {'price': Decimal('10.5')},
                {'price': Decimal('20.5')}
            ],
            'total': Decimal('31.0')
        }
        result = decimal_to_float(data)
        assert result['items'][0]['price'] == 10.5
        assert result['total'] == 31.0

    def test_non_decimal_values_unchanged(self):
        data = {'name': 'Test', 'count': 5, 'active': True}
        result = decimal_to_float(data)
        assert result == data


class TestResponseHelper:
    """Test the response helper function"""

    def test_response_structure(self):
        result = response(200, {'success': True})
        assert result['statusCode'] == 200
        assert 'headers' in result
        assert 'body' in result

    def test_cors_headers(self):
        result = response(200, {})
        headers = result['headers']
        assert headers['Access-Control-Allow-Origin'] == '*'
        assert 'Content-Type' in headers

    def test_body_is_json_string(self):
        result = response(200, {'key': 'value'})
        body = json.loads(result['body'])
        assert body['key'] == 'value'


class TestFormatFreelancer:
    """Test the format_freelancer helper function"""

    def test_basic_formatting(self):
        user = {
            'userId': 'user-123',
            'fullName': 'John Doe',
            'email': 'john@example.com',
            'skills': ['Python', 'JavaScript'],
            'country': 'India',
            'city': 'Mumbai',
            'hourlyRate': 50,
            'currency': 'USD'
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {
                'projectsCount': 10,
                'totalSales': 5,
                'totalRevenue': 1000,
                'totalViews': 500,
                'totalLikes': 50
            }
            
            result = format_freelancer(user, include_stats=True)
            
            assert result['id'] == 'user-123'
            assert result['name'] == 'John Doe'
            assert 'Python' in result['skills']
            assert result['location']['country'] == 'India'

    def test_generate_avatar_when_missing(self):
        user = {
            'userId': 'user-456',
            'fullName': 'Jane Doe',
            'email': 'jane@example.com',
            'skills': []
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            result = format_freelancer(user, include_stats=False)
            
            assert 'dicebear' in result['profileImage']

    def test_skills_as_string_conversion(self):
        user = {
            'userId': 'user-789',
            'fullName': 'Test User',
            'skills': 'Python, JavaScript, React'
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            result = format_freelancer(user, include_stats=False)
            
            assert isinstance(result['skills'], list)
            assert 'Python' in result['skills']

    def test_skills_limited_to_10(self):
        user = {
            'userId': 'user-skills',
            'fullName': 'Many Skills',
            'skills': ['Skill' + str(i) for i in range(15)]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            result = format_freelancer(user, include_stats=False)
            
            assert len(result['skills']) == 10

    def test_default_values(self):
        user = {
            'userId': 'minimal-user',
            'email': 'minimal@example.com'
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            result = format_freelancer(user, include_stats=False)
            
            assert result['location']['country'] == 'India'  # Default
            assert result['hourlyRate'] == 20  # Default
            assert result['currency'] == 'USD'  # Default


class TestGetAllFreelancers:
    """Test GET_ALL_FREELANCERS action"""

    @patch('freelancers_handler.users_table')
    def test_get_all_freelancers_success(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'freelancer-1',
                    'fullName': 'Alice',
                    'email': 'alice@example.com',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['Python'],
                    'hourlyRate': 30
                },
                {
                    'userId': 'freelancer-2',
                    'fullName': 'Bob',
                    'email': 'bob@example.com',
                    'role': 'freelancer',
                    'status': 'active',
                    'skills': ['JavaScript'],
                    'hourlyRate': 25
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {
                'projectsCount': 5,
                'totalSales': 3,
                'totalRevenue': 500,
                'totalViews': 100,
                'totalLikes': 10
            }
            
            result = handle_get_all_freelancers({'limit': 10, 'offset': 0})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['success'] == True
            assert len(body['data']['freelancers']) == 2

    @patch('freelancers_handler.users_table')
    def test_get_all_freelancers_pagination(self, mock_users_table):
        # Create 15 freelancers
        items = [
            {
                'userId': f'freelancer-{i}',
                'fullName': f'Freelancer {i}',
                'email': f'f{i}@example.com',
                'role': 'seller',
                'status': 'active',
                'skills': ['Skill'],
                'hourlyRate': 20
            }
            for i in range(15)
        ]
        
        mock_users_table.scan.return_value = {'Items': items}
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            # Request first 10
            result = handle_get_all_freelancers({'limit': 10, 'offset': 0})
            body = json.loads(result['body'])
            
            assert body['data']['count'] == 10
            assert body['data']['totalCount'] == 15
            assert body['data']['hasMore'] == True

    @patch('freelancers_handler.users_table')
    def test_get_all_freelancers_empty(self, mock_users_table):
        mock_users_table.scan.return_value = {'Items': []}
        
        result = handle_get_all_freelancers({'limit': 10, 'offset': 0})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 200
        assert body['data']['freelancers'] == []
        assert body['data']['totalCount'] == 0

    @patch('freelancers_handler.users_table')
    def test_get_all_freelancers_error(self, mock_users_table):
        mock_users_table.scan.side_effect = Exception('Database error')
        
        result = handle_get_all_freelancers({'limit': 10, 'offset': 0})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 500
        assert body['success'] == False
        assert body['error']['code'] == 'DATABASE_ERROR'


class TestGetFreelancerById:
    """Test GET_FREELANCER_BY_ID action"""

    @patch('freelancers_handler.projects_table')
    @patch('freelancers_handler.users_table')
    def test_get_freelancer_by_id_success(self, mock_users_table, mock_projects_table):
        mock_users_table.get_item.return_value = {
            'Item': {
                'userId': 'freelancer-123',
                'fullName': 'Test Freelancer',
                'email': 'test@example.com',
                'role': 'seller',
                'status': 'active',
                'skills': ['Python', 'Django'],
                'hourlyRate': 50
            }
        }
        
        mock_projects_table.scan.return_value = {
            'Items': [
                {
                    'projectId': 'proj-1',
                    'title': 'Test Project',
                    'description': 'A test project',
                    'price': 100,
                    'sellerId': 'freelancer-123',
                    'adminApprovalStatus': 'approved'
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {
                'projectsCount': 1,
                'totalSales': 5,
                'totalRevenue': 500
            }
            
            result = handle_get_freelancer_by_id({'freelancerId': 'freelancer-123'})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['success'] == True
            assert body['data']['id'] == 'freelancer-123'
            assert len(body['data']['projects']) > 0

    def test_get_freelancer_by_id_missing_id(self):
        result = handle_get_freelancer_by_id({})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 400
        assert body['error']['code'] == 'VALIDATION_ERROR'

    @patch('freelancers_handler.users_table')
    def test_get_freelancer_by_id_not_found(self, mock_users_table):
        mock_users_table.get_item.return_value = {}
        
        result = handle_get_freelancer_by_id({'freelancerId': 'non-existent'})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 404
        assert body['error']['code'] == 'NOT_FOUND'

    @patch('freelancers_handler.users_table')
    def test_get_freelancer_by_id_error(self, mock_users_table):
        mock_users_table.get_item.side_effect = Exception('Database error')
        
        result = handle_get_freelancer_by_id({'freelancerId': 'error-freelancer'})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 500
        assert body['error']['code'] == 'DATABASE_ERROR'


class TestGetTopFreelancers:
    """Test GET_TOP_FREELANCERS action"""

    @patch('freelancers_handler.users_table')
    def test_get_top_freelancers_success(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'top-1',
                    'fullName': 'Top Freelancer 1',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['Python']
                },
                {
                    'userId': 'top-2',
                    'fullName': 'Top Freelancer 2',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['JavaScript']
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.side_effect = [
                {'projectsCount': 10, 'totalSales': 50, 'totalRevenue': 5000, 'totalViews': 1000, 'totalLikes': 100},
                {'projectsCount': 5, 'totalSales': 30, 'totalRevenue': 3000, 'totalViews': 500, 'totalLikes': 50}
            ]
            
            result = handle_get_top_freelancers({'limit': 6})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['success'] == True
            assert len(body['data']['freelancers']) <= 6

    @patch('freelancers_handler.users_table')
    def test_get_top_freelancers_with_custom_limit(self, mock_users_table):
        items = [
            {
                'userId': f'top-{i}',
                'fullName': f'Freelancer {i}',
                'role': 'seller',
                'status': 'active',
                'skills': []
            }
            for i in range(10)
        ]
        
        mock_users_table.scan.return_value = {'Items': items}
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_get_top_freelancers({'limit': 3})
            body = json.loads(result['body'])
            
            assert len(body['data']['freelancers']) == 3

    @patch('freelancers_handler.users_table')
    def test_get_top_freelancers_error(self, mock_users_table):
        mock_users_table.scan.side_effect = Exception('Database error')
        
        result = handle_get_top_freelancers({'limit': 6})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 500
        assert body['error']['code'] == 'DATABASE_ERROR'


class TestSearchFreelancers:
    """Test SEARCH_FREELANCERS action"""

    @patch('freelancers_handler.users_table')
    def test_search_by_query(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'search-1',
                    'fullName': 'React Developer',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['React', 'JavaScript']
                },
                {
                    'userId': 'search-2',
                    'fullName': 'Python Developer',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['Python', 'Django']
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_search_freelancers({'query': 'react'})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            # Should find React Developer
            assert any('React' in f['name'] or 'React' in str(f['skills']) 
                      for f in body['data']['freelancers'])

    @patch('freelancers_handler.users_table')
    def test_search_by_skills(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'skill-match',
                    'fullName': 'TypeScript Expert',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['TypeScript', 'React']
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_search_freelancers({'skills': ['TypeScript']})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200

    @patch('freelancers_handler.users_table')
    def test_search_by_country(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'india-dev',
                    'fullName': 'Indian Developer',
                    'role': 'seller',
                    'status': 'active',
                    'country': 'India',
                    'skills': []
                },
                {
                    'userId': 'usa-dev',
                    'fullName': 'USA Developer',
                    'role': 'seller',
                    'status': 'active',
                    'country': 'USA',
                    'skills': []
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_search_freelancers({'country': 'India'})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            # All results should be from India
            for f in body['data']['freelancers']:
                assert f['location']['country'] == 'India'

    @patch('freelancers_handler.users_table')
    def test_search_by_hourly_rate_range(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'cheap-dev',
                    'fullName': 'Budget Developer',
                    'role': 'seller',
                    'status': 'active',
                    'hourlyRate': 15,
                    'skills': []
                },
                {
                    'userId': 'mid-dev',
                    'fullName': 'Mid Developer',
                    'role': 'seller',
                    'status': 'active',
                    'hourlyRate': 50,
                    'skills': []
                },
                {
                    'userId': 'expensive-dev',
                    'fullName': 'Premium Developer',
                    'role': 'seller',
                    'status': 'active',
                    'hourlyRate': 150,
                    'skills': []
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_search_freelancers({'minHourlyRate': 30, 'maxHourlyRate': 100})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            # Should only include mid-dev
            for f in body['data']['freelancers']:
                assert f['hourlyRate'] >= 30
                assert f['hourlyRate'] <= 100

    @patch('freelancers_handler.users_table')
    def test_search_with_pagination(self, mock_users_table):
        items = [
            {
                'userId': f'search-{i}',
                'fullName': f'Developer {i}',
                'role': 'seller',
                'status': 'active',
                'skills': ['Common Skill']
            }
            for i in range(20)
        ]
        
        mock_users_table.scan.return_value = {'Items': items}
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_search_freelancers({'query': 'developer', 'limit': 10, 'offset': 0})
            body = json.loads(result['body'])
            
            assert body['data']['count'] == 10
            assert body['data']['totalCount'] == 20
            assert body['data']['hasMore'] == True

    @patch('freelancers_handler.users_table')
    def test_search_no_results(self, mock_users_table):
        mock_users_table.scan.return_value = {'Items': []}
        
        result = handle_search_freelancers({'query': 'nonexistent'})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 200
        assert body['data']['freelancers'] == []
        assert body['data']['totalCount'] == 0

    @patch('freelancers_handler.users_table')
    def test_search_error(self, mock_users_table):
        mock_users_table.scan.side_effect = Exception('Database error')
        
        result = handle_search_freelancers({'query': 'test'})
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 500
        assert body['error']['code'] == 'DATABASE_ERROR'


class TestLambdaHandler:
    """Test the main lambda_handler function"""

    def test_cors_preflight(self):
        event = {'httpMethod': 'OPTIONS'}
        result = lambda_handler(event, None)
        
        assert result['statusCode'] == 200
        assert result['headers']['Access-Control-Allow-Origin'] == '*'

    def test_invalid_action(self):
        event = {
            'body': json.dumps({'action': 'INVALID_ACTION'})
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_ACTION'

    def test_invalid_json(self):
        event = {
            'body': 'invalid json {'
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 400
        assert body['error']['code'] == 'INVALID_JSON'

    @patch('freelancers_handler.users_table')
    def test_get_request_default_action(self, mock_users_table):
        mock_users_table.scan.return_value = {'Items': []}
        
        event = {
            'httpMethod': 'GET',
            'queryStringParameters': {'limit': '10'}
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 200
        # Should default to GET_ALL_FREELANCERS
        assert body['success'] == True

    def test_body_as_dict(self):
        """Test when body is already parsed as dict"""
        event = {
            'body': {'action': 'INVALID'}
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        assert result['statusCode'] == 400

    def test_internal_error_handling(self):
        """Test general exception handling"""
        event = {
            'body': None  # Will cause error when parsing
        }
        # Should not raise but return error response
        result = lambda_handler(event, None)
        # Even with None body, should handle gracefully


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    @patch('freelancers_handler.users_table')
    def test_freelancer_with_unicode_name(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'unicode-user',
                    'fullName': '田中太郎 المطور',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['日本語']
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_get_all_freelancers({'limit': 10})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['data']['freelancers'][0]['name'] == '田中太郎 المطور'

    @patch('freelancers_handler.users_table')
    def test_freelancer_with_empty_skills(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'no-skills',
                    'fullName': 'No Skills User',
                    'role': 'seller',
                    'status': 'active',
                    'skills': []
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_get_all_freelancers({'limit': 10})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['data']['freelancers'][0]['skills'] == []

    @patch('freelancers_handler.users_table')
    def test_search_with_special_characters(self, mock_users_table):
        mock_users_table.scan.return_value = {'Items': []}
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            # Should not crash with special characters
            result = handle_search_freelancers({
                'query': "C++ <script>alert('xss')</script>"
            })
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200

    @patch('freelancers_handler.users_table')
    def test_very_large_offset(self, mock_users_table):
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'user-1',
                    'fullName': 'User 1',
                    'role': 'seller',
                    'status': 'active',
                    'skills': []
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            result = handle_get_all_freelancers({'limit': 10, 'offset': 999999})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200
            assert body['data']['freelancers'] == []

    @patch('freelancers_handler.projects_table')
    def test_get_seller_stats_error_handling(self, mock_projects_table):
        mock_projects_table.scan.side_effect = Exception('Error')
        
        stats = get_seller_stats('user-123')
        
        # Should return default values
        assert stats['projectsCount'] == 0
        assert stats['totalSales'] == 0

    @patch('freelancers_handler.users_table')
    def test_skills_filter_as_string(self, mock_users_table):
        """Test that skills filter handles string input"""
        mock_users_table.scan.return_value = {
            'Items': [
                {
                    'userId': 'skill-user',
                    'fullName': 'Skill User',
                    'role': 'seller',
                    'status': 'active',
                    'skills': ['React', 'TypeScript']
                }
            ]
        }
        
        with patch('freelancers_handler.get_seller_stats') as mock_stats:
            mock_stats.return_value = {}
            
            # Skills as comma-separated string
            result = handle_search_freelancers({'skills': 'React, TypeScript'})
            body = json.loads(result['body'])
            
            assert result['statusCode'] == 200

    @patch('freelancers_handler.users_table')
    def test_concurrent_request_handling(self, mock_users_table):
        """Test that multiple requests can be handled"""
        mock_users_table.scan.return_value = {'Items': []}
        
        # Simulate multiple requests
        results = []
        for i in range(5):
            event = {
                'body': json.dumps({'action': 'GET_ALL_FREELANCERS'})
            }
            results.append(lambda_handler(event, None))
        
        for result in results:
            assert result['statusCode'] == 200


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
