# Placement Preparation Management - Setup Guide

## Overview
This document explains the new Placement Preparation management system that allows admins to manage placement prep topics and resources through the admin dashboard.

## What Was Created

### 1. Backend Lambda Handler
**File:** `lambda/placement_prep_handler.py`

- Handles CRUD operations for placement prep topics
- Stores data in DynamoDB table `PlacementPrep`
- Supports actions: `list`, `put`, `delete`

### 2. Admin UI Component
**File:** `components/admin/PlacementPrepManagementPage.tsx`

- Full admin interface for managing placement topics
- Add/Edit/Delete topics
- Add/Edit/Delete resources for each topic
- Save all changes to backend

### 3. Frontend Integration
**File:** `components/CareerGuidancePage.tsx`

- Updated to fetch placement prep data from API
- Falls back to default data if API unavailable
- Displays dynamic placement topics in Placement Prep tab

### 4. Admin Dashboard Integration
- Added `placement-prep` view to `AdminDashboard.tsx`
- Added menu item to `AdminSidebar.tsx`
- Added routing in `AdminContent.tsx`

## Setup Instructions

### Step 1: Create DynamoDB Table

Create a DynamoDB table named `PlacementPrep` with:
- **Partition Key:** `id` (String)
- **Region:** `ap-south-2` (or your preferred region)

### Step 2: Deploy Lambda Function

1. Create a new Lambda function in AWS
2. Upload `lambda/placement_prep_handler.py`
3. Set runtime to Python 3.9 or higher
4. Add IAM role with DynamoDB permissions:
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
           "dynamodb:BatchWriteItem"
         ],
         "Resource": "arn:aws:dynamodb:ap-south-2:*:table/PlacementPrep"
       }
     ]
   }
   ```

### Step 3: Create API Gateway Endpoint

1. Create a new REST API in API Gateway
2. Create a POST method
3. Connect it to your Lambda function
4. Enable CORS
5. Deploy the API
6. Copy the API Gateway URL

### Step 4: Update API Endpoints

Update the API endpoint URL in two files:

## System design media uploads

The Preparation Mode system design flow supports three media fields on `PrepSystemDesign` rows:

- `diagramData` for interactive diagrams
- `diagramUrl` for URL-based diagram fallback
- `additionalImageUrls` for uploaded supporting images

### Required frontend environment variables

- `VITE_PREP_ADMIN_ENDPOINT`: prep admin Lambda/API Gateway endpoint
- `VITE_PREP_USER_ENDPOINT`: prep user Lambda/API Gateway endpoint
- `VITE_PREP_SD_MEDIA_BUCKET`: S3 bucket name for system design media uploads

If `VITE_PREP_SD_MEDIA_BUCKET` is not set, the frontend defaults to `projectbazaar-prep-notes`.

### Required Lambda configuration

`lambda/prep_admin_handler.py` expects:

- `S3_BUCKET` to point at the media bucket
- `AWS_REGION` / `REGION` to match the deployed bucket region

The Lambda IAM role must allow:

- `s3:PutObject`
- `s3:GetObject`

for the `system-design/*` key prefix in the configured bucket.

### Upload flow

1. The admin UI requests `get_sd_media_upload_url` from the prep admin API.
2. The Lambda validates the content type against the supported image allowlist.
3. The frontend uploads the file directly to the presigned S3 URL.
4. The returned `publicUrl` is saved in `diagramUrl` or `additionalImageUrls` through the admin CRUD flow.

Supported content types:

- `image/png`
- `image/jpeg`
- `image/gif`
- `image/webp`
- `image/svg+xml`

### Migration workflow

Before enabling the updated candidate and admin experiences in production, run the system design media backfill:

```bash
npx tsx scripts/migrations/001_backfill_system_design_media.ts --apply
```

If you need to revert the explicit media fields:

```bash
npx tsx scripts/migrations/001_rollback_system_design_media.ts --apply
```

1. **`components/admin/PlacementPrepManagementPage.tsx`**
   ```typescript
   const API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-south-2.amazonaws.com/default/placement_prep_handler';
   ```
   Replace `YOUR_API_GATEWAY_URL` with your actual API Gateway URL.

2. **`components/CareerGuidancePage.tsx`**
   ```typescript
   const PLACEMENT_PREP_API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-south-2.amazonaws.com/default/placement_prep_handler';
   ```
   Replace `YOUR_API_GATEWAY_URL` with your actual API Gateway URL.

### Step 5: Test the System

1. **Admin Dashboard:**
   - Navigate to Admin Dashboard
   - Click on "Placement Prep" in the sidebar
   - Add a new topic
   - Add resources to the topic
   - Click "Save All Changes"

2. **Buyer Dashboard:**
   - Navigate to Career Guidance Hub
   - Click on "Placement Prep" tab
   - Verify that topics and resources are displayed correctly

## Data Structure

### PlacementTopic Interface
```typescript
interface PlacementTopic {
    id?: string;                    // Auto-generated by backend
    title: string;                   // e.g., "Data Structures & Algorithms"
    importance: 'Critical' | 'Important' | 'Good to Know';
    timeNeeded: string;              // e.g., "3-4 months"
    resources: PlacementResource[];  // Array of resources
    createdAt?: string;              // Auto-generated by backend
    updatedAt?: string;              // Auto-generated by backend
}
```

### PlacementResource Interface
```typescript
interface PlacementResource {
    name: string;    // e.g., "LeetCode"
    url: string;     // e.g., "https://leetcode.com"
    type: string;    // e.g., "Practice", "Video", "GitHub"
}
```

## API Endpoints

### List All Topics
```http
POST /default/placement_prep_handler
Content-Type: application/json

{
  "action": "list"
}
```

**Response:**
```json
{
  "success": true,
  "topics": [
    {
      "id": "uuid",
      "title": "Data Structures & Algorithms",
      "importance": "Critical",
      "timeNeeded": "3-4 months",
      "resources": [...],
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00"
    }
  ]
}
```

### Save/Update Topics
```http
POST /default/placement_prep_handler
Content-Type: application/json

{
  "action": "put",
  "topics": [
    {
      "id": "uuid",  // Optional, will be generated if not provided
      "title": "Data Structures & Algorithms",
      "importance": "Critical",
      "timeNeeded": "3-4 months",
      "resources": [
        {
          "name": "LeetCode",
          "url": "https://leetcode.com",
          "type": "Practice"
        }
      ]
    }
  ]
}
```

### Delete Topic
```http
POST /default/placement_prep_handler
Content-Type: application/json

{
  "action": "delete",
  "id": "topic-uuid"
}
```

## Features

### Admin Dashboard Features:
- ✅ Add new placement topics
- ✅ Edit existing topics
- ✅ Delete topics
- ✅ Add resources to topics
- ✅ Edit resources
- ✅ Delete resources
- ✅ Save all changes to backend
- ✅ Refresh data from backend
- ✅ Error handling and success messages

### Buyer Dashboard Features:
- ✅ Display placement topics from API
- ✅ Expandable topic cards
- ✅ Resource links
- ✅ Importance indicators
- ✅ Time needed information
- ✅ Fallback to default data if API unavailable

## Troubleshooting

### Issue: API returns 500 error
- Check Lambda function logs in CloudWatch
- Verify DynamoDB table exists and has correct permissions
- Ensure Lambda IAM role has DynamoDB access

### Issue: CORS errors
- Verify CORS headers are set in API Gateway
- Check Lambda response includes CORS headers

### Issue: Data not saving
- Check Lambda function logs
- Verify DynamoDB table name matches in Lambda code
- Ensure API Gateway is connected to correct Lambda function

### Issue: Data not loading in buyer dashboard
- Check browser console for errors
- Verify API endpoint URL is correct
- Check network tab for API response

## Next Steps (Optional Enhancements)

1. **Timeline Management:** Add ability to manage placement timeline in admin
2. **Quick Links:** Add ability to manage quick links in admin
3. **Analytics:** Track which topics/resources are most viewed
4. **User Progress:** Track user progress through placement prep topics
5. **Notifications:** Notify users about new placement prep resources

## Notes

- The system includes fallback to default data if API is unavailable
- All data is stored in DynamoDB for scalability
- The admin UI provides a user-friendly interface for managing content
- The buyer dashboard automatically fetches the latest data on load

