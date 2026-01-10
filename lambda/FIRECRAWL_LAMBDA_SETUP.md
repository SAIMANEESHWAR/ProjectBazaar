# Firecrawl Hackathons Lambda Setup Guide

## Overview
This Lambda function fetches hackathons from multiple platforms using Firecrawl API and displays them in the buyer dashboard.

## Prerequisites
1. AWS Lambda function created
2. Firecrawl API key (get it from https://firecrawl.dev)
3. Python 3.9+ runtime

## Setup Instructions

### 1. Install Dependencies
The Lambda function uses standard library only (no external dependencies required for HTTP approach). However, if you want to use the Firecrawl SDK instead:

```bash
pip install firecrawl-py pydantic -t .
```

### 2. Deploy Lambda Function
1. Zip the `fetch_hackathons.py` file (and dependencies if using SDK)
2. Upload to AWS Lambda
3. Set the following environment variables:
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key

### 3. Configure Lambda Settings
- Runtime: Python 3.9 or higher
- Handler: `fetch_hackathons.lambda_handler`
- Timeout: 300 seconds (5 minutes) - Firecrawl can take time to crawl multiple sites
- Memory: 512 MB or higher
- Create API Gateway endpoint for the Lambda

### 4. Update Frontend Endpoint
After deploying the Lambda and creating the API Gateway endpoint, update the endpoint URL in:
`ProjectBazaar/services/buyerApi.ts`

Replace `YOUR_LAMBDA_ENDPOINT_URL_HERE` with your actual API Gateway URL.

### 5. CORS Configuration
Ensure your API Gateway has CORS enabled for your frontend domain, or use the wildcard `*` for development.

## Alternative: Using Firecrawl SDK
If you prefer to use the Firecrawl Python SDK (requires bundling dependencies):

```python
from firecrawl import FirecrawlApp
from pydantic import BaseModel, Field
from typing import List

app = FirecrawlApp(api_key=os.environ.get('FIRECRAWL_API_KEY'))

class ExtractSchema(BaseModel):
    hackathons: List[dict] = Field(default_factory=list)

result = app.agent(
    schema=ExtractSchema,
    prompt="Your extraction prompt here",
)
```

## Testing
Test the Lambda function with:
```json
{
  "httpMethod": "GET",
  "queryStringParameters": null
}
```

Or use the API Gateway test feature in AWS Console.

## Response Format
The Lambda returns:
```json
{
  "success": true,
  "message": "Hackathons fetched successfully",
  "data": {
    "hackathons": [...],
    "count": 62
  }
}
```

## Troubleshooting
1. **Timeout errors**: Increase Lambda timeout to 5 minutes
2. **Memory errors**: Increase Lambda memory allocation
3. **API key errors**: Verify FIRECRAWL_API_KEY environment variable is set correctly
4. **CORS errors**: Ensure API Gateway CORS is configured correctly

