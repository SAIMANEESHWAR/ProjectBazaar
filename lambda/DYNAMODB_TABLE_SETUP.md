# DynamoDB Table Setup for Roadmap Management

## Table Configuration

### Table Name
`CareerGuidanceRoadmaps`

### Region
`ap-south-2` (Asia Pacific - Mumbai)

## Primary Key Structure

### Partition Key (Primary Key)
- **Attribute Name**: `categoryId`
- **Type**: String
- **Description**: Unique identifier for each career category
- **Examples**: 
  - `"ai-ml"`
  - `"web-dev"`
  - `"data-science"`
  - `"devops"`
  - `"mobile-dev"`
  - `"cloud-engineer"`
  - `"cybersecurity"`
  - `"blockchain"`
  - `"ui-ux"`
  - `"fullstack"`

### Sort Key
- **Not Required** - This is a simple table with only a partition key

## Table Schema

```
Table: CareerGuidanceRoadmaps
├── Partition Key: categoryId (String)
│
└── Attributes:
    ├── categoryId (String) - PRIMARY KEY
    ├── categoryName (String)
    ├── icon (String)
    ├── weeks (List)
    │   └── Each week object contains:
    │       ├── weekNumber (Number)
    │       ├── mainTopics (List of Strings)
    │       ├── subtopics (List of Strings)
    │       ├── practicalTasks (List of Strings)
    │       ├── miniProject (String)
    │       ├── resources (List of Objects)
    │       │   └── Each resource contains:
    │       │       ├── type (String)
    │       │       ├── title (String)
    │       │       └── url (String)
    │       └── quiz (List of Objects)
    │           └── Each quiz question contains:
    │               ├── question (String)
    │               ├── options (List of 4 Strings)
    │               └── correctAnswer (Number)
    ├── createdAt (String)
    └── updatedAt (String)
```

## AWS Console Setup Steps

1. **Go to DynamoDB Console**
   - Navigate to AWS Console → DynamoDB
   - Select region: `ap-south-2`

2. **Create Table**
   - Click "Create table"
   - **Table name**: `CareerGuidanceRoadmaps`
   - **Partition key**: `categoryId` (Type: String)

3. **Table Settings**
   - **Table class**: Standard (or Standard-IA for cost savings)
   - **Capacity mode**: 
     - On-demand (recommended for variable traffic)
     - OR Provisioned (set read/write capacity units)

4. **Encryption**
   - Encryption at rest: AWS owned keys (default)
   - OR AWS managed keys (KMS) for enhanced security

5. **Tags** (Optional)
   - Add tags like: `Environment: Production`, `Project: CareerGuidance`

6. **Create Table**
   - Click "Create table"

## IAM Permissions Required

The Lambda function needs these DynamoDB permissions:

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
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-2:*:table/CareerGuidanceRoadmaps"
    }
  ]
}
```

## Data Access Patterns

### Get Roadmap by Category
- **Operation**: `GetItem`
- **Key**: `{ categoryId: "ai-ml" }`
- **Returns**: Complete roadmap with all weeks, resources, quiz questions

### List All Categories
- **Operation**: `Scan`
- **Returns**: All items, extract unique categories

### Save/Update Roadmap
- **Operation**: `PutItem`
- **Key**: `{ categoryId: "ai-ml" }`
- **Item**: Complete roadmap data

### Delete Roadmap
- **Operation**: `DeleteItem`
- **Key**: `{ categoryId: "ai-ml" }`

## Example Item Structure

```json
{
  "categoryId": "ai-ml",
  "categoryName": "AI/ML Engineer",
  "icon": "🤖",
  "weeks": [
    {
      "weekNumber": 1,
      "mainTopics": ["Python Fundamentals", "NumPy & Pandas"],
      "subtopics": ["Python Basics", "NumPy Arrays"],
      "practicalTasks": ["Install Python", "Practice NumPy"],
      "miniProject": "Build a data analysis script",
      "resources": [
        {
          "type": "gfg",
          "title": "Python Programming - GeeksforGeeks",
          "url": "https://www.geeksforgeeks.org/python-programming-language/"
        },
        {
          "type": "youtube",
          "title": "Python for Data Science - FreeCodeCamp",
          "url": "https://www.youtube.com/watch?v=LHBE6Q9XlzI"
        }
      ],
      "quiz": [
        {
          "question": "What is the primary purpose of NumPy?",
          "options": [
            "Numerical computing with arrays",
            "Web development",
            "Database management",
            "File system operations"
          ],
          "correctAnswer": 0
        }
      ]
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z"
}
```

## Important Notes

1. **Partition Key**: `categoryId` is the ONLY key needed
2. **No Sort Key**: This is a simple key-value structure
3. **Single Item per Category**: Each category has one roadmap item
4. **All Data in One Item**: Weeks, resources, quiz questions all stored together
5. **Scalability**: Can handle thousands of categories efficiently

