# Lambda Functions Specification for Mock Assessment System

## Overview
This document specifies the Lambda functions needed for the Mock Assessment feature, including test submission, progress tracking, leaderboard, badges, and daily challenges.

---

## 1. Submit Test Result Lambda Function

### Function Name
`projectBazaar-submitTestResult`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "userId": "string (required, UUID)",
  "assessmentId": "string (required)",
  "assessmentTitle": "string (required)",
  "score": "number (required, 0-100)",
  "totalQuestions": "number (required)",
  "attempted": "number (required)",
  "solved": "number (required)",
  "duration": "string (required, e.g., '30 mins')",
  "startTime": "string (required, ISO 8601)",
  "difficulty": "string (optional, 'easy' | 'medium' | 'hard')",
  "testMode": "string (optional, 'timed' | 'practice')",
  "questionResults": [
    {
      "questionId": "number",
      "topic": "string",
      "isCorrect": "boolean",
      "userAnswer": "number",
      "correctAnswer": "number"
    }
  ],
  "proctoringData": {
    "tabSwitchCount": "number (optional)",
    "fullScreenExitCount": "number (optional)",
    "copyPasteAttempts": "number (optional)",
    "hintsUsed": "number (optional)"
  }
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "message": "Test result submitted successfully",
  "data": {
    "testResultId": "string (UUID)",
    "xpEarned": "number",
    "badgesEarned": ["string"],
    "levelUp": "boolean",
    "newLevel": "number (if levelUp is true)",
    "streakUpdated": "boolean",
    "currentStreak": "number"
  }
}
```

### Lambda Function Logic:
1. Validate input parameters
2. Calculate XP earned (base score * 2, minus penalties for violations)
3. Save test result to database
4. Update user progress (XP, level, streak)
5. Check and award badges
6. Update leaderboard
7. Return success response with XP and badges earned

---

## 2. Get Test History Lambda Function

### Function Name
`projectBazaar-getTestHistory`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "userId": "string (required, UUID)",
  "limit": "number (optional, default: 50)",
  "offset": "number (optional, default: 0)",
  "assessmentId": "string (optional, filter by assessment)"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "testHistory": [
      {
        "testResultId": "string",
        "assessmentId": "string",
        "assessmentTitle": "string",
        "score": "number",
        "totalQuestions": "number",
        "attempted": "number",
        "solved": "number",
        "duration": "string",
        "startTime": "string",
        "percentage": "number"
      }
    ],
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

---

## 3. Get User Progress Lambda Function

### Function Name
`projectBazaar-getUserProgress`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "userId": "string (required, UUID)"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "level": "number",
    "currentXP": "number",
    "nextLevelXP": "number",
    "totalXP": "number",
    "streak": "number",
    "lastActivityDate": "string (ISO 8601)",
    "testsCompleted": "number",
    "avgScore": "number",
    "badges": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "icon": "string",
        "image": "string (optional)",
        "earned": "boolean",
        "earnedDate": "string (optional, ISO 8601)",
        "requirement": "string",
        "xpReward": "number"
      }
    ]
  }
}
```

---

## 4. Get Leaderboard Lambda Function

### Function Name
`projectBazaar-getLeaderboard`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "limit": "number (optional, default: 100)",
  "offset": "number (optional, default: 0)",
  "timeframe": "string (optional, 'all' | 'weekly' | 'monthly', default: 'all')"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": "number",
        "userId": "string",
        "name": "string",
        "avatar": "string",
        "xp": "number",
        "testsCompleted": "number",
        "avgScore": "number",
        "badges": "number",
        "level": "number"
      }
    ],
    "userRank": "number (optional, if userId provided)",
    "total": "number"
  }
}
```

---

## 5. Get Daily Challenge Lambda Function

### Function Name
`projectBazaar-getDailyChallenge`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "userId": "string (optional, UUID)",
  "date": "string (optional, ISO 8601 date, default: today)"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "topic": "string",
    "difficulty": "string ('easy' | 'medium' | 'hard')",
    "xpReward": "number",
    "timeLimit": "number (seconds)",
    "completed": "boolean",
    "expiresAt": "string (ISO 8601)",
    "assessmentId": "string (optional)"
  }
}
```

---

## 6. Update Daily Challenge Completion Lambda Function

### Function Name
`projectBazaar-completeDailyChallenge`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "userId": "string (required, UUID)",
  "challengeId": "string (required)",
  "score": "number (required, 0-100)"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "message": "Daily challenge completed",
  "data": {
    "xpEarned": "number",
    "badgesEarned": ["string"],
    "streakUpdated": "boolean"
  }
}
```

---

## 7. Get Study Resources Lambda Function

### Function Name
`projectBazaar-getStudyResources`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "topic": "string (optional, filter by topic)",
  "type": "string (optional, 'video' | 'article' | 'flashcard' | 'practice')",
  "limit": "number (optional, default: 20)"
}
```

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "string",
        "title": "string",
        "type": "string",
        "topic": "string",
        "duration": "string",
        "url": "string (optional)"
      }
    ],
    "count": "number"
  }
}
```

---

## Database Schema (DynamoDB)

### Table 1: `TestResults`

#### Primary Key:
- **Partition Key**: `userId` (String)
- **Sort Key**: `testResultId` (String, UUID)

#### Global Secondary Indexes:
- **GSI1**: `assessmentId-index`
  - Partition Key: `assessmentId` (String)
  - Sort Key: `startTime` (String, ISO 8601)
- **GSI2**: `startTime-index`
  - Partition Key: `userId` (String)
  - Sort Key: `startTime` (String, ISO 8601)

#### Attributes:
```json
{
  "userId": "string",
  "testResultId": "string (UUID)",
  "assessmentId": "string",
  "assessmentTitle": "string",
  "score": "number",
  "totalQuestions": "number",
  "attempted": "number",
  "solved": "number",
  "duration": "string",
  "startTime": "string (ISO 8601)",
  "difficulty": "string",
  "testMode": "string",
  "xpEarned": "number",
  "questionResults": "array",
  "proctoringData": "object",
  "createdAt": "string (ISO 8601)"
}
```

### Table 2: `UserProgress`

#### Primary Key:
- **Partition Key**: `userId` (String)

#### Attributes:
```json
{
  "userId": "string",
  "level": "number",
  "currentXP": "number",
  "nextLevelXP": "number",
  "totalXP": "number",
  "streak": "number",
  "lastActivityDate": "string (ISO 8601)",
  "testsCompleted": "number",
  "avgScore": "number",
  "badges": "array",
  "updatedAt": "string (ISO 8601)"
}
```

### Table 3: `Leaderboard`

#### Primary Key:
- **Partition Key**: `timeframe` (String, e.g., "all", "weekly", "monthly")
- **Sort Key**: `rank` (Number)

#### Global Secondary Index:
- **GSI1**: `userId-index`
  - Partition Key: `userId` (String)
  - Sort Key: `xp` (Number)

#### Attributes:
```json
{
  "timeframe": "string",
  "rank": "number",
  "userId": "string",
  "name": "string",
  "avatar": "string",
  "xp": "number",
  "testsCompleted": "number",
  "avgScore": "number",
  "badges": "number",
  "level": "number",
  "updatedAt": "string (ISO 8601)"
}
```

### Table 4: `DailyChallenges`

#### Primary Key:
- **Partition Key**: `date` (String, YYYY-MM-DD)
- **Sort Key**: `challengeId` (String, UUID)

#### Global Secondary Index:
- **GSI1**: `userId-completed-index`
  - Partition Key: `userId` (String)
  - Sort Key: `completed` (Boolean)

#### Attributes:
```json
{
  "date": "string (YYYY-MM-DD)",
  "challengeId": "string (UUID)",
  "title": "string",
  "topic": "string",
  "difficulty": "string",
  "xpReward": "number",
  "timeLimit": "number",
  "expiresAt": "string (ISO 8601)",
  "assessmentId": "string",
  "createdAt": "string (ISO 8601)"
}
```

### Table 5: `DailyChallengeCompletions`

#### Primary Key:
- **Partition Key**: `userId` (String)
- **Sort Key**: `challengeId` (String)

#### Attributes:
```json
{
  "userId": "string",
  "challengeId": "string",
  "date": "string (YYYY-MM-DD)",
  "score": "number",
  "xpEarned": "number",
  "completedAt": "string (ISO 8601)"
}
```

### Table 6: `StudyResources`

#### Primary Key:
- **Partition Key**: `resourceId` (String, UUID)

#### Global Secondary Index:
- **GSI1**: `topic-index`
  - Partition Key: `topic` (String)
  - Sort Key: `createdAt` (String)

#### Attributes:
```json
{
  "resourceId": "string (UUID)",
  "title": "string",
  "type": "string",
  "topic": "string",
  "duration": "string",
  "url": "string",
  "createdAt": "string (ISO 8601)"
}
```

---

## Badge System

### Badge Definitions:
```typescript
const BADGE_DEFINITIONS = [
  {
    id: 'first-test',
    name: 'First Steps',
    requirement: 'Complete 1 test',
    xpReward: 50,
    check: (progress) => progress.testsCompleted >= 1
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    requirement: '7 day streak',
    xpReward: 100,
    check: (progress) => progress.streak >= 7
  },
  {
    id: 'perfect-score',
    name: 'Perfectionist',
    requirement: '100% score',
    xpReward: 200,
    check: (testResult) => testResult.score === 100
  },
  {
    id: 'ten-tests',
    name: 'Dedicated Learner',
    requirement: 'Complete 10 tests',
    xpReward: 100,
    check: (progress) => progress.testsCompleted >= 10
  },
  // ... more badges
];
```

---

## XP and Level Calculation

### XP Calculation:
- Base XP = score * 2
- Penalty for violations:
  - Tab switch: -10 XP per violation
  - Fullscreen exit: -5 XP per violation
  - Copy/paste attempt: -2 XP per attempt
  - Hints used: -2 XP per hint
- Minimum XP: 0

### Level Calculation:
- Level 1: 0-500 XP
- Level 2: 501-1000 XP
- Level 3: 1001-2000 XP
- Level 4: 2001-3000 XP
- Level 5: 3001-5000 XP
- ... (exponential growth)

### Streak Calculation:
- Increment streak if test completed within 24 hours of last activity
- Reset streak if more than 24 hours passed
- Update `lastActivityDate` on each test completion

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `TEST_RESULT_NOT_FOUND` | 404 | Test result not found |
| `CHALLENGE_NOT_FOUND` | 404 | Daily challenge not found |
| `CHALLENGE_ALREADY_COMPLETED` | 409 | Challenge already completed |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Security Considerations

1. **Authentication**: Verify JWT token in Authorization header
2. **Authorization**: Ensure userId matches token userId
3. **Input Validation**: Validate all input parameters
4. **Rate Limiting**: Prevent abuse of API endpoints
5. **Data Sanitization**: Sanitize all user inputs
6. **CORS**: Configure CORS for frontend domain
