# Live Mock Interview API (Results save / list)

API: `https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com/default/LiveMockinterview`

Frontend: `services/liveMockInterviewApi.ts`  
Lambda: `live_mock_interview_handler.py`

## Question generation (Settings Lambda — required)

**Start Interview** calls `invokeLiveInterviewLlm` on **Update_userdetails_in_settings** (not LiveMockinterview).

| | |
|--|--|
| **API** | `https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings` |
| **Handler** | `update_userdetails_in_settings.py` → `handle_invoke_live_interview_llm` |
| **Action** | `POST` body `{ "action": "invokeLiveInterviewLlm", "invokeMode": "generateQuestions", ... }` |

### Fix "Start Interview" timeout (CloudWatch: `Status: timeout`, Duration: 3000 ms)

The default Lambda timeout is **3 seconds**. OpenRouter/Groq calls often need **10–45 seconds**, especially with Job Hunt JD + resume prefill.

1. AWS Console → **Lambda** → **Update_userdetails_in_settings**
2. **Configuration** → **General configuration** → **Edit**
3. Set **Timeout** to **90 seconds** (minimum **60**)
4. Set **Memory** to **256 MB** or higher (optional, helps cold starts)
5. Redeploy `update_userdetails_in_settings.py` (latest zip with `invokeLiveInterviewLlm`)

After deploy, CloudWatch should show `invokeLiveInterviewLlm start` log lines and `invokeLiveInterviewLlm success` instead of 3000 ms timeouts.

**HTTP API note:** API Gateway HTTP API may cut off around **30 s**. Question generation usually finishes under that; evaluation at end of interview can be heavier—if evaluate times out, use a Lambda Function URL (same pattern as ATS in `ATS_RESUME_SCORER_SETUP.md`).

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
