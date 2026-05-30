# UserSubscriptions — AWS setup

## 1. DynamoDB table: `UserSubscriptions`

| Key | Attribute | Type |
|-----|-----------|------|
| Partition key | `userId` | String |
| Sort key | `subscriptionId` | String |

**Optional GSI** `status-createdAt-index` (not required for v1):
- PK: `userId`, SK: `createdAt` — for listing history

Billing: on-demand is fine for launch.

## 2. Lambda

- **Name:** `subscription-handler` (or your choice)
- **Runtime:** Python 3.11+
- **Handler:** `subscription_handler.lambda_handler`
- **Timeout:** 30s
- **Memory:** 256 MB

**Environment variables:**

| Variable | Example |
|----------|---------|
| `REGION` | `ap-south-2` |
| `USERS_TABLE` | `Users` |
| `SUBSCRIPTIONS_TABLE` | `UserSubscriptions` |
| `ALLOWED_ORIGIN` | `https://codexcareer.com` or `http://localhost:5173` for dev |
| `RAZORPAY_KEY_ID` | Same as course purchase Lambda (`rzp_test_*` or `rzp_live_*`) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key (server-side only) |
| `SUBSCRIPTION_TEST_PRICE` | Optional. Set to `1` to charge ₹1 at Razorpay for all plans (testing only) |

**IAM permissions** (attach to role `UserSubscriptions_handler-role-*`):

Replace `290917471042` with your account ID if different.

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
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-2:290917471042:table/Users",
        "arn:aws:dynamodb:ap-south-2:290917471042:table/UserSubscriptions",
        "arn:aws:dynamodb:ap-south-2:290917471042:table/UserSubscriptions/index/*"
      ]
    }
  ]
}
```

**Common deploy error:** `AccessDeniedException ... dynamodb:Query on UserSubscriptions` means the Lambda role is missing `dynamodb:Query` on the `UserSubscriptions` table. Add the policy above and redeploy is not required—IAM updates apply immediately.

**Frontend URL** (`.env.local`):

```
VITE_SUBSCRIPTION_API_URL=https://rnu2gfl2z1.execute-api.ap-south-2.amazonaws.com/default/UserSubscriptions_handler
```

Deploy `lambda/subscription_handler.py` as the function code (zip with only this file unless you add shared libs).

## 3. API Gateway

- **Method:** `POST`
- **Integration:** Lambda proxy
- **CORS:** Enable OPTIONS + POST; allow `Content-Type`, `Authorization`
- **Route example:** `/subscription` or `/default/subscription`

**Request body examples:**

```json
{ "action": "get_active_subscription", "userId": "USER_UUID" }
```

```json
{ "action": "create_subscription_order", "userId": "USER_UUID", "planId": "yearly", "userEmail": "user@example.com" }
```

```json
{
  "action": "verify_subscription_payment",
  "userId": "USER_UUID",
  "planId": "yearly",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "signature_xxx"
}
```

```json
{ "action": "create_subscription", "userId": "USER_UUID", "planId": "yearly" }
```

`create_subscription` is **dev-only** when Razorpay keys are not set on Lambda. Production checkout uses `create_subscription_order` → Razorpay → `verify_subscription_payment`.

`planId`: `monthly` | `yearly` | `lifetime`

## 4. Frontend env

After you create the API, add to `.env.local`:

```
VITE_SUBSCRIPTION_API_URL=https://YOUR_API_ID.execute-api.ap-south-2.amazonaws.com/default/subscription
```

Restart `npm run dev`.
