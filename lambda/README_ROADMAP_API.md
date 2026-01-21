# Roadmap Management API

## Setup Instructions

### 1. Create DynamoDB Table

Create **ONE** DynamoDB table in `ap-south-2` region:

#### Table: `CareerGuidanceRoadmaps`
- **Partition Key (Primary Key)**: `categoryId` (String)
- **No Sort Key Required** (Simple table structure)

**Table Structure:**
```
Partition Key: categoryId (String)
  - Example values: "ai-ml", "web-dev", "data-science", etc.
  - Must be unique for each category
  - Used to retrieve/update/delete entire roadmap
```

**Attributes Stored:**
- `categoryId` (String) - **PRIMARY KEY** - Category ID (e.g., "ai-ml")
- `categoryName` (String) - Category name (e.g., "AI/ML Engineer")
- `icon` (String) - Emoji icon (e.g., "🤖")
- `weeks` (List) - Array of week objects (complete roadmap data including quiz questions)
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp

**Note**: Categories are automatically created when you save a roadmap. The table stores everything in one place for easier management.

### 2. Deploy Lambda Function

1. Zip the `roadmap_management_handler.py` file
2. Create a Lambda function in AWS
3. Upload the zip file
4. Set handler to `roadmap_management_handler.lambda_handler`
5. Set runtime to Python 3.9 or later
6. Configure IAM role with DynamoDB permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem",
           "dynamodb:Scan",
           "dynamodb:Query",
           "dynamodb:BatchWriteItem"
         ],
         "Resource": [
           "arn:aws:dynamodb:ap-south-2:*:table/CareerGuidanceRoadmaps"
         ]
       }
     ]
   }
   ```

### 3. Create API Gateway

1. Create a new REST API
2. Create a POST method
3. Set integration to Lambda function
4. Enable CORS
5. Deploy API
6. Copy the API Gateway URL

### 4. Update Frontend

Update the `API_ENDPOINT` in `RoadmapManagementPage.tsx`:
```typescript
const API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL/roadmap-management';
```

## API Endpoints

### Categories

**List Categories** (extracted from roadmaps table)
```json
{
  "resource": "categories",
  "action": "list"
}
```

**Delete Category**
```json
{
  "resource": "categories",
  "action": "delete",
  "categoryId": "ai-ml"
}
```

**Note**: Categories are automatically created when you save a roadmap. No separate create action needed.

### Roadmaps

**Get Roadmap**
```json
{
  "resource": "roadmap",
  "action": "get",
  "categoryId": "ai-ml"
}
```

**Save Roadmap** (Complete form - saves everything including category info)
```json
{
  "resource": "roadmap",
  "action": "save",
  "categoryId": "ai-ml",
  "categoryName": "AI/ML Engineer",
  "icon": "🤖",
  "weeks": [
    {
      "weekNumber": 1,
      "mainTopics": ["Topic 1", "Topic 2"],
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "practicalTasks": ["Task 1", "Task 2"],
      "miniProject": "Project description",
      "resources": [
        {
          "type": "gfg",
          "title": "GeeksforGeeks Link",
          "url": "https://..."
        }
      ],
      "quiz": [
        {
          "question": "Question text?",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0
        }
      ]
    }
  ]
}
```

**Note**: When you save a roadmap, it automatically creates/updates the category. All data (weeks, resources, quiz questions) is stored in a single table for easy management.

**List All Roadmaps**
```json
{
  "resource": "roadmap",
  "action": "list"
}
```

## Response Format

All responses follow this format:
```json
{
  "success": true/false,
  "message": "Optional message",
  "data": { ... },
  "error": "Error message if failed"
}
```

