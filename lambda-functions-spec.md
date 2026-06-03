# Lambda Functions Specification for CodeXCareer

## Overview
This document specifies the Lambda functions needed for authentication (Signup and Login) and the data structure for storing user information.

---

## 1. Signup Lambda Function

### Function Name
`projectBazaar-signup`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "email": "string (required, valid email format)",
  "phoneNumber": "string (required, format: +1234567890 or 1234567890)",
  "password": "string (required, min 8 characters)",
  "confirmPassword": "string (required, must match password)"
}
```

#### Validation Rules:
- **email**: Must be valid email format, unique in database
- **phoneNumber**: Required, should be normalized (remove spaces, dashes)
- **password**: Minimum 8 characters, should contain at least one letter and one number
- **confirmPassword**: Must exactly match password

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "string (UUID)",
    "email": "string",
    "role": "user",
    "token": "string (JWT token)",
    "expiresIn": 3600
  }
}
```

#### Error Response (400/409/500):
```json
{
  "success": false,
  "error": {
    "code": "string (error code)",
    "message": "string (error message)",
    "details": {} // optional additional error details
  }
}
```

### Data to Store in Database

#### User Table Structure:
```typescript
interface User {
  // Primary Identifiers
  userId: string;              // UUID, primary key
  email: string;                // Unique, indexed
  phoneNumber: string;          // Required, indexed
  
  // Authentication
  passwordHash: string;         // Hashed password (bcrypt/argon2)
  role: 'user' | 'admin';      // Default: 'user'
  
  // Profile Information (optional initially)
  fullName?: string;            // Can be updated later in settings
  profilePictureUrl?: string;   // Can be uploaded later
  linkedinUrl?: string;         // Optional social link
  githubUrl?: string;           // Optional social link
  
  // Account Status
  status: 'active' | 'inactive' | 'suspended';  // Default: 'active'
  
  // Premium & Credits
  isPremium: boolean;           // Default: false
  credits: number;              // Default: 0, 100 if premium
  
  // Notifications
  emailNotifications: boolean;  // Default: true
  pushNotifications: boolean;  // Default: false
  
  // Timestamps
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
  lastLoginAt?: string;        // ISO 8601 timestamp, updated on login
  
  // Statistics (initialized to 0)
  projectsCount: number;       // Default: 0 (for sellers)
  totalEarnings?: number;      // Default: 0 (for sellers)
  totalPurchases: number;      // Default: 0 (for buyers)
  rating?: number;             // Default: null (calculated for sellers)
}
```

### Lambda Function Logic:
1. Validate input parameters
2. Check if email already exists
3. Validate password strength
4. Hash password using bcrypt or argon2
5. Generate unique userId (UUID)
6. Create user record in database
7. Generate JWT token
8. Return success response with token

---

## 2. Login Lambda Function

### Function Name
`projectBazaar-login`

### HTTP Method
`POST`

### Request Parameters

#### Body (JSON):
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)",
  "rememberMe": "boolean (optional, default: false)"
}
```

#### Validation Rules:
- **email**: Must be valid email format
- **password**: Required
- **rememberMe**: Optional boolean, affects token expiration

### Response Structure

#### Success Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "string (UUID)",
    "email": "string",
    "role": "user" | "admin",
    "fullName": "string | null",
    "isPremium": boolean,
    "credits": number,
    "status": "active" | "inactive" | "suspended",
    "token": "string (JWT token)",
    "expiresIn": 3600 | 86400,  // 1 hour or 24 hours if rememberMe
    "profilePictureUrl": "string | null"
  }
}
```

#### Error Response (401/403/404/500):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS" | "ACCOUNT_SUSPENDED" | "ACCOUNT_INACTIVE" | "USER_NOT_FOUND",
    "message": "string (error message)"
  }
}
```

### Lambda Function Logic:
1. Validate input parameters
2. Find user by email in database
3. If user not found, return error
4. Check if account is active (not suspended/inactive)
5. Verify password hash matches
6. Update `lastLoginAt` timestamp
7. Generate JWT token (expires in 1 hour or 24 hours if rememberMe)
8. Return user data and token

---

## 3. Database Schema (DynamoDB Example)

### Table: `Users`

#### Primary Key:
- **Partition Key**: `userId` (String)
- **Global Secondary Index (GSI)**: `email-index`
  - Partition Key: `email` (String)

#### Attributes:
```json
{
  "userId": "string (UUID)",
  "email": "string (unique)",
  "phoneNumber": "string",
  "passwordHash": "string",
  "role": "string (user|admin)",
  "fullName": "string (optional)",
  "profilePictureUrl": "string (optional)",
  "linkedinUrl": "string (optional)",
  "githubUrl": "string (optional)",
  "status": "string (active|inactive|suspended)",
  "isPremium": "boolean",
  "credits": "number",
  "emailNotifications": "boolean",
  "pushNotifications": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "lastLoginAt": "string (ISO 8601, optional)",
  "projectsCount": "number",
  "totalEarnings": "number (optional)",
  "totalPurchases": "number",
  "rating": "number (optional)"
}
```

---

## 4. JWT Token Payload

### Token Structure:
```json
{
  "userId": "string (UUID)",
  "email": "string",
  "role": "user" | "admin",
  "iat": number,  // Issued at timestamp
  "exp": number   // Expiration timestamp
}
```

### Token Expiration:
- **Default**: 1 hour (3600 seconds)
- **With rememberMe**: 24 hours (86400 seconds)

---

## 5. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `USER_NOT_FOUND` | 404 | User with email does not exist |
| `ACCOUNT_SUSPENDED` | 403 | Account has been suspended |
| `ACCOUNT_INACTIVE` | 403 | Account is inactive |
| `PASSWORD_TOO_WEAK` | 400 | Password does not meet requirements |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## 6. Security Considerations

1. **Password Hashing**: Use bcrypt (cost factor 10-12) or argon2
2. **JWT Secret**: Store in AWS Secrets Manager or environment variables
3. **Rate Limiting**: Implement rate limiting to prevent brute force attacks
4. **Email Verification**: Consider adding email verification step
5. **Password Reset**: Plan for password reset functionality
6. **CORS**: Configure CORS properly for frontend domain
7. **Input Sanitization**: Sanitize all user inputs
8. **HTTPS Only**: Enforce HTTPS for all API calls

---

## 7. Example Lambda Function Implementation (Node.js/TypeScript)

### Signup Function:
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, phoneNumber, password, confirmPassword } = JSON.parse(event.body || '{}');
    
    // Validation
    if (!email || !phoneNumber || !password || !confirmPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'All fields are required' }
        })
      };
    }
    
    if (password !== confirmPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Passwords do not match' }
        })
      };
    }
    
    // Check if user exists
    // ... database check ...
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const user = {
      userId,
      email,
      phoneNumber,
      passwordHash,
      role: 'user',
      status: 'active',
      isPremium: false,
      credits: 0,
      emailNotifications: true,
      pushNotifications: false,
      projectsCount: 0,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to database
    // ... database save ...
    
    // Generate token
    const token = jwt.sign(
      { userId, email, role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        data: {
          userId,
          email,
          role: 'user',
          token,
          expiresIn: 3600
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' }
      })
    };
  }
};
```

### Login Function:
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password, rememberMe } = JSON.parse(event.body || '{}');
    
    // Validation
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
        })
      };
    }
    
    // Find user in database
    // const user = await getUserByEmail(email);
    // if (!user) {
    //   return { statusCode: 404, ... };
    // }
    
    // Check account status
    // if (user.status === 'suspended') { ... }
    
    // Verify password
    // const isValid = await bcrypt.compare(password, user.passwordHash);
    // if (!isValid) { ... }
    
    // Update last login
    // await updateLastLogin(userId);
    
    // Generate token
    const expiresIn = rememberMe ? 86400 : 3600; // 24h or 1h
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn }
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        data: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          fullName: user.fullName || null,
          isPremium: user.isPremium,
          credits: user.credits,
          status: user.status,
          token,
          expiresIn,
          profilePictureUrl: user.profilePictureUrl || null
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An error occurred' }
      })
    };
  }
};
```

---
