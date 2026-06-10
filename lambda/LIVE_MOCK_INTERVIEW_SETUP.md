# Live Mock Interview API (Results save / list)

API: `https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com/default/LiveMockinterview`

Frontend: `services/liveMockInterviewApi.ts`  
Lambda: `live_mock_interview_handler.py`

## Deploy Lambda

```bash
cd lambda
python build_live_mock_interview_zip.py
```

Upload `live_mock_interview.zip` to the **LiveMockinterview** Lambda.

- **Handler:** `live_mock_interview_handler.lambda_handler`
- **Runtime:** Python 3.11+
- **Package must include:** `live_mock_interview_handler.py` and `feature_entitlement.py`

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LIVE_MOCK_INTERVIEW_TABLE` | `LiveMockInterviewResults` | DynamoDB table name |
| `REGION` | `ap-south-2` | Used by `feature_entitlement` on POST |

### IAM

Lambda role needs `dynamodb:PutItem`, `dynamodb:Scan` on the results table, plus tables used by `feature_entitlement` for trial consume on POST.

## DynamoDB table

Create table **LiveMockInterviewResults** (or set `LIVE_MOCK_INTERVIEW_TABLE`):

- **Partition key:** `interviewId` (String)
- Optional GSI on `userId` for production (handler currently scans + filters)

## API Gateway CORS

HTTP API → **CORS** → allow:

- **Origins:** `https://codexcareer.com`, `http://localhost:5173`
- **Methods:** `GET`, `POST`, `OPTIONS`
- **Headers:** `content-type`, `authorization`, `x-user-id`

Ensure **OPTIONS** returns **200** (not 500). If OPTIONS fails, the browser shows a **CORS error** even when GET/POST would work.

Routes:

- `GET /default/LiveMockinterview?userId=...` → list results
- `POST /default/LiveMockinterview` → save result (JSON body)

## Local dev (localhost)

Vite proxies `/dev-api/live-mock-interview` → API Gateway (see `vite.config.ts`). Restart `npm run dev` after pulling.

Override URL: `VITE_LIVE_INTERVIEW_DB_API_URL` in `.env.local`.

## Verify

```bash
curl -s "https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com/default/LiveMockinterview?userId=TEST" | jq .
```

Expected: `{"success": true, "data": []}` (or a list).  
If you see `{"message":"Internal Server Error"}`, redeploy the Lambda zip or create the DynamoDB table.
