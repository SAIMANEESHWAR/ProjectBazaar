import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

# Response helper function
def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler to fetch hackathons using Firecrawl API via HTTP requests
    """
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return response(200, {})
        
        # Get API key from environment variable
        api_key = os.environ.get('FIRECRAWL_API_KEY', 'your-api-key')
        
        if api_key == 'your-api-key':
            return response(400, {
                'success': False,
                'error': {
                    'code': 'MISSING_API_KEY',
                    'message': 'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.'
                }
            })
        
        # Prepare the prompt and schema for extraction
        prompt = """Extract active and upcoming hackathons from the specified primary platforms (unstop.com, devfolio.co, skillenza.com, techgig.com, hackathons.io, hackerearth.com) and secondary global platforms (devpost.com, mlh.io, taikai.network, hackathon.com, angelhack.com). Prioritize India-based platforms and events eligible for Indian participants. For each hackathon, crawl listing cards and detail pages to extract: name, platform, organizer_details, official_url, status (upcoming/live), mode (online/offline/hybrid), location, registration_dates (start_date, end_date), event_dates (start_date, end_date), duration, eligibility, beginner_friendly, team_size, participant_count, prize_pool_details, tags_themes (array of objects with value field), and media_urls (array of objects with value field). Exclude blogs, ads, jobs, quizzes, and hiring challenges. Follow pagination and return data in a nested JSON format with hackathons array."""
        
        # Define the schema for extraction
        schema = {
            "type": "object",
            "properties": {
                "hackathons": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "platform": {"type": "string"},
                            "organizer_details": {"type": "string"},
                            "official_url": {"type": "string"},
                            "status": {"type": "string"},
                            "mode": {"type": "string"},
                            "location": {"type": "string"},
                            "registration_dates": {
                                "type": "object",
                                "properties": {
                                    "start_date": {"type": ["string", "null"]},
                                    "end_date": {"type": ["string", "null"]}
                                }
                            },
                            "event_dates": {
                                "type": "object",
                                "properties": {
                                    "start_date": {"type": ["string", "null"]},
                                    "end_date": {"type": ["string", "null"]}
                                }
                            },
                            "duration": {"type": ["string", "null"]},
                            "eligibility": {"type": ["string", "null"]},
                            "beginner_friendly": {"type": ["boolean", "null"]},
                            "team_size": {"type": ["string", "null"]},
                            "participant_count": {"type": ["number", "null"]},
                            "prize_pool_details": {"type": ["string", "null"]},
                            "tags_themes": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "value": {"type": "string"}
                                    }
                                }
                            },
                            "media_urls": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "value": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        # Get URLs to crawl from query parameters or use default
        query_params = event.get('queryStringParameters') or {}
        if isinstance(event.get('body'), str):
            body_data = json.loads(event.get('body', '{}'))
        else:
            body_data = event.get('body', {})
        
        urls_input = query_params.get('urls') or body_data.get('urls') or ''
        
        # Default hackathon platform URLs
        default_urls = [
            'https://unstop.com/hackathons',
            'https://devfolio.co/hackathons',
            'https://skillenza.com/hackathons',
            'https://techgig.com/hackathons',
            'https://hackathons.io',
            'https://hackerearth.com/hackathons',
            'https://devpost.com/hackathons',
            'https://mlh.io/seasons',
            'https://taikai.network/hackathons',
            'https://hackathon.com',
            'https://angelhack.com/events'
        ]
        
        urls_list = urls_input.split(',') if urls_input else default_urls
        urls_list = [url.strip() for url in urls_list if url.strip()]
        
        # Initialize hackathons list
        hackathons = []
        
        # Try using Firecrawl SDK first (if available), otherwise use HTTP
        try:
            # Check if Firecrawl SDK is available
            from firecrawl import FirecrawlApp
            from pydantic import BaseModel, Field
            from typing import List
            
            # Use SDK approach
            app = FirecrawlApp(api_key=api_key)
            
            class ExtractSchema(BaseModel):
                hackathons: List[dict] = Field(default_factory=list)
            
            result = app.agent(
                schema=ExtractSchema,
                prompt=prompt,
                urls=urls_list if isinstance(urls_list, list) else [urls_list] if isinstance(urls_list, str) else []
            )
            
            # Extract hackathons from result
            if result and isinstance(result, dict):
                hackathons = result.get('hackathons', [])
            elif isinstance(result, list):
                hackathons = result
                
        except ImportError:
            # Fallback to HTTP approach if SDK not available
            print("Firecrawl SDK not available, using HTTP approach")
            firecrawl_api_url = 'https://api.firecrawl.dev/v1/agent'
            
            payload = {
                'prompt': prompt,
                'schema': schema,
                'urls': urls_list
            }
            
            # Make HTTP request to Firecrawl API
            req = urllib.request.Request(
                firecrawl_api_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req, timeout=300) as http_response:
                    result_data = json.loads(http_response.read().decode('utf-8'))
                    
                    # Extract hackathons from result
                    if result_data and isinstance(result_data, dict):
                        data = result_data.get('data', {})
                        if isinstance(data, dict):
                            hackathons = data.get('hackathons', [])
                        elif isinstance(data, list):
                            hackathons = data
                    elif isinstance(result_data, list):
                        hackathons = result_data
                        
            except urllib.error.HTTPError as http_error:
                error_body = http_error.read().decode('utf-8') if http_error.fp else 'No error details'
                print(f"Firecrawl HTTP Error: {http_error.code} - {error_body}")
                return response(http_error.code, {
                    'success': False,
                    'error': {
                        'code': 'FIRECRAWL_API_ERROR',
                        'message': f'Firecrawl API returned error {http_error.code}: {error_body}'
                    }
                })
        except Exception as firecrawl_error:
            # Handle other errors from SDK or API calls
            print(f"Firecrawl API Error: {str(firecrawl_error)}")
            import traceback
            traceback.print_exc()
            return response(500, {
                'success': False,
                'error': {
                    'code': 'FIRECRAWL_API_ERROR',
                    'message': f'Error calling Firecrawl API: {str(firecrawl_error)}'
                }
            })
        
        # Return success response with extracted hackathons
        return response(200, {
            'success': True,
            'message': 'Hackathons fetched successfully',
            'data': {
                'hackathons': hackathons,
                'count': len(hackathons)
            }
        })
            
    except Exception as e:
        print(f"Lambda Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {
            'success': False,
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': f'An error occurred: {str(e)}'
            }
        })

