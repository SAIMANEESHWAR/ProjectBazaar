# Freelancer Interactions & Reviews Setup Guide

This guide explains how to deploy the new Lambda function for handling Freelancer interactions (Messaging, Invitations, and Reviews).

## 1. DynamoDB Table Setup

Create a new DynamoDB table with the following configuration:

```
Table Name: FreelancerInteractions
Partition Key: interactionId (String)

Global Secondary Indexes (GSI):
1. senderId-index
   - Partition Key: senderId (String)
   - Sort Key: createdAt (String)
   
2. receiverId-index
   - Partition Key: receiverId (String)
   - Sort Key: createdAt (String)

3. targetId-index
   - Partition Key: targetId (String)  <-- Used for querying reviews for a freelancer
   - Sort Key: createdAt (String)
```

**Table Schema Overview:**
```json
{
  "interactionId": "string (PK)",
  "type": "string (message | invitation | review)",
  "senderId": "string (The buyer who sent the message/review)",
  "senderName": "string",
  "receiverId": "string (The freelancer receiving the message/invite)",
  "targetId": "string (The project ID for invites, or the Freelancer ID for reviews)",
  "content": "string (Message body or review comment)",
  "status": "string (unread | read | pending | accepted | declined)",
  "rating": "number (For reviews only, 1-5)",
  "createdAt": "string (ISO date)"
}
```

## 2. Deploy `freelancer_interactions_handler` Lambda

**Create Lambda Function:**
- Name: `freelancer_interactions_handler`
- Runtime: Python 3.9+
- Handler: `freelancer_interactions_handler.lambda_handler`
- Memory: 256 MB or 512 MB
- Timeout: 30 seconds

**Paste the code:**
Copy the code from `/lambda/freelancer_interactions_handler.py` into the Lambda code source editor.

**IAM Permissions Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/FreelancerInteractions",
        "arn:aws:dynamodb:*:*:table/FreelancerInteractions/index/*"
      ]
    }
  ]
}
```

**API Gateway Setup:**
- Create an HTTP API or REST API trigger for this Lambda.
- Route: POST `/freelancer-interactions`
- Enable CORS

---

## 3. Update Existing Lambda `freelancers_handler`

The existing `freelancers_handler` was modified in the codebase to automatically calculate average review ratings from the new `FreelancerInteractions` table instead of inferring it.

1. Go to your existing `freelancers_handler` Lambda in the AWS console.
2. Copy the updated code from `/lambda/freelancers_handler.py` and deploy it.
3. **IMPORTANT**: You must update the IAM role for `freelancers_handler` to allow it to read from the new table:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/FreelancerInteractions",
    "arn:aws:dynamodb:*:*:table/FreelancerInteractions/index/*"
  ]
}
```

---

## 4. Update Frontend Configuration

Once you deploy the new `freelancer_interactions_handler` and get its API Gateway URL, update the frontend file to point to it:

Modify `/services/freelancerInteractionsApi.ts`:
```typescript
const FREELANCER_INTERACTIONS_API_ENDPOINT = 'https://eprkn8kyxf.execute-api.ap-south-2.amazonaws.com/default/freelancer_interactions_handler';
```
