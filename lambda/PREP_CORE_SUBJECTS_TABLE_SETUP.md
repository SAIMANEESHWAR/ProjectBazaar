# PrepCoreSubjects DynamoDB Table Setup

## Table

| Setting | Value |
|--------|--------|
| **Table name** | `PrepCoreSubjects` |
| **Region** | `ap-south-2` |
| **Partition key** | `id` (String) |
| **Sort key** | None |

Create the table in AWS Console → DynamoDB → Create table, matching other prep content tables (`PrepFundamentals`, `PrepSystemDesign`, etc.).

Both **subject cards** and **concepts** live in this single table, distinguished by `contentKind`.

## Subject category item (`contentKind: "category"`)

Admin-managed subject cards (DBMS, OS, CN, etc.):

```json
{
  "id": "csc-a1b2c3d4",
  "title": "DBMS",
  "description": "Learn DBMS Basics to Advanced",
  "subject": "dbms",
  "slug": "dbms",
  "contentKind": "category",
  "thumbnailUrl": "",
  "displayOrder": 10,
  "createdAt": "2026-05-30T00:00:00Z",
  "updatedAt": "2026-05-30T00:00:00Z"
}
```

## Concept item (`contentKind: "concept"`)

Topic-grouped concepts under a subject:

```json
{
  "id": "cs-a1b2c3d4",
  "title": "Normalization",
  "description": "Learn 1NF through BCNF",
  "subject": "dbms",
  "section": "DBMS",
  "contentKind": "concept",
  "difficulty": "Medium",
  "topics": ["Normalization", "Keys"],
  "content": "<p>Rich HTML content…</p>",
  "thumbnailUrl": "",
  "displayOrder": 1,
  "createdAt": "2026-05-30T00:00:00Z",
  "updatedAt": "2026-05-30T00:00:00Z"
}
```

The concept `subject` field must match the category `slug` / `subject`.

## Lambda integration

Content type **`core_subjects`** maps to `PrepCoreSubjects`.

Filter by kind when listing:

- `contentKind=category` — subject cards
- `contentKind=concept` — topic-grouped concepts
- `subject=dbms` — concepts (or categories) for one subject

- **Admin:** `prep_admin_handler` — CRUD via `list_content`, `put_content_single`, `delete_content`
- **User:** `prep_user_handler` — read via `list_content`

### IAM

Grant both Lambda execution roles:

```json
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
  "Resource": "arn:aws:dynamodb:ap-south-2:*:table/PrepCoreSubjects"
}
```

## Deploy

After creating the table and updating IAM:

1. Redeploy `prep_admin_handler` and `prep_user_handler` with the updated code.
2. In Admin → Prep Content → **Core Subjects**, add subjects, then add concepts under each.
3. The user **Core Subjects** page reads categories and concepts from the user Lambda automatically.
