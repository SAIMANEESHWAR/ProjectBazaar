# ATS Resume Scorer Lambda

Scores a resume (0–100) against a job description using an LLM.

## Modes

### A) BYOK Provider (ATS Scorer page)

**Request body (JSON):**

| Field | Required | Description |
|--------|-----------|-------------|
| `userId` | No | If present: saves **history** (`AtsScoreHistory`) and works with saved DynamoDB keys + BYOK. |
| `provider` | Yes | `gemini`, `openai`, `openrouter`, or `anthropic`. |
| `apiKey` | Yes* | Generic key field for selected provider. |
| `geminiApiKey` / `openaiApiKey` / `openrouterApiKey` / `anthropicApiKey` | Yes* | Provider-specific key fields (accepted as alternatives to `apiKey`). |
| `jobDescription` | Yes | Full JD text. |
| `resumeBase64` | Yes* | Base64 file bytes (no `data:` prefix). |
| `resumeFileName` | Recommended | e.g. `resume.pdf` or `cv.docx` (drives PDF vs DOCX parsing). |
| `resumeText` | Yes* | Plain text alternative to file upload. |
| `model` | No | Provider model id. Also accepts provider-specific model fields. |

\* Provide either `apiKey` or a provider-specific key field. Also provide either `resumeText` **or** `resumeBase64` + `resumeFileName`.

**Response:** `{ success: true, atsResult: { overallScore, breakdown, matchedKeywords, missingKeywords, feedback } }`  
Keyword lists are post-processed (stemming + synonyms) to reduce false “missing” flags. PDFs use PyPDF2 → PyMuPDF text; optional **Textract OCR** for scanned pages (see env below).

### B) Legacy (Resume Builder / Settings keys)

**Request body:** `userId`, `jobDescription`, and either `resumeText` or `resumeBase64` + `resumeFileName`.

Loads `llmApiKeys` from DynamoDB `Users` table and:
- if `provider` is provided (`openai` / `openrouter` / `gemini` / `claude` or `anthropic`), it uses that provider key;
- otherwise tries OpenAI → Claude → Gemini → OpenRouter.

Saved model ids per provider come from `llmModels` (e.g. `openrouter`: `openai/gpt-4o-mini`).

---

## DynamoDB tables (create in same region as Lambdas)

| Table | Partition key | Sort key | Purpose |
|--------|----------------|----------|---------|
| `AtsScoreHistory` | `userId` (String) | `reportId` (String) | Stores each successful ATS run (score, provider, keywords preview, timestamp). |

Settings Lambda action **`getAtsScoreHistory`**: `{ "action": "getAtsScoreHistory", "userId": "...", "limit": 20 }` reads recent rows for the UI.

## Environment variables

**ATS Lambda (`ats_resume_scorer`)**

| Variable | Default | Description |
|----------|---------|-------------|
| `ATS_HISTORY_TABLE` | `AtsScoreHistory` | History writes (skipped if table missing). |
| `ENABLE_TEXTRACT_OCR` | `0` | Set `1` to OCR scanned PDF pages via **Textract** (adds latency/cost). |
| `OCR_MAX_PDF_PAGES` | `3` | Max pages to send to Textract per resume. |
| `MIN_PDF_TEXT_CHARS` | `40` | If extracted text is shorter, try fallbacks / OCR. |
| `OPENROUTER_DEFAULT_MODEL` | `openai/gpt-4o-mini` | Model slug when none is passed for OpenRouter. |
| `OPENROUTER_HTTP_REFERER` | `https://projectbazaar.app` | Sent as `HTTP-Referer` (OpenRouter expects a site URL). |
| `ATS_RESUME_S3_BUCKET` | *(empty)* | If set, each history row uploads the resume file here and stores `resumeS3Bucket`, `resumeS3Key`, and `resumeFileUrl` (HTTPS object URL). |
| `ATS_RESUME_S3_PREFIX` | `ats-resume-history/` | S3 key prefix; objects are `…/{userId}/{reportId}_{filename}`. |
| *(behavior)* | | If the client sends **`resumeText` only** (e.g. Resume Builder), there is no PDF: the Lambda uploads **UTF-8 plain text** as **`resume-from-builder.txt`** when the bucket is set. File uploads still store the real **PDF/DOCX** bytes. |

**Settings Lambda (`Update_userdetails_in_settings`)**

| Variable | Description |
|----------|-------------|
| `ATS_HISTORY_TABLE` | Same name as ATS Lambda for `getAtsScoreHistory`. |
| `ATS_RESUME_DOWNLOAD_TTL` | Optional. Seconds for presigned `resumeDownloadUrl` on each history item (default `3600`, max `604800`). Requires `s3:GetObject` on the resume bucket. Presigned URLs include `ResponseContentDisposition: attachment` so PDFs download instead of opening inline in the browser. |
| `ATS_RESUME_S3_REGION` | Optional. If the resume bucket is **not** in `ap-south-2`, set this to that region so presigned URLs sign correctly (e.g. `us-east-1`). New history rows also store `resumeS3Region` from the ATS Lambda; older rows infer region from `resumeFileUrl` when possible. |

**History item fields:** `overallScore`, `matchedKeywords`, `missingKeywords`, `feedback` (critical-fix strings for history replay in the app), `jobDescriptionPreview`, `provider`, plus when S3 is enabled: `resumeS3Bucket`, `resumeS3Key`, `resumeS3Region` (optional), `resumeFileUrl`, `resume`. The app should use **`resumeDownloadUrl`** from `getAtsScoreHistory` (presigned) for downloads when the bucket is private.

## IAM (recommended)

**ATS Lambda**

- `dynamodb:GetItem` on `Users`
- `dynamodb:PutItem` on `AtsScoreHistory`
- `s3:PutObject` on `arn:aws:s3:::<ATS_RESUME_S3_BUCKET>/<ATS_RESUME_S3_PREFIX>*` (if `ATS_RESUME_S3_BUCKET` is set)
- `textract:DetectDocumentText` (if `ENABLE_TEXTRACT_OCR=1`)

**Settings Lambda**

- `dynamodb:Query` on `AtsScoreHistory` for `getAtsScoreHistory`
- `s3:GetObject` on the same resume bucket/prefix (for presigned download URLs in `getAtsScoreHistory`)

---

## Deployment (BYOK + PDF/DOCX)

1. Runtime: **Python 3.11+** (recommended).
2. Install dependencies into the deployment package (the `.py` file alone is **not** enough; without `PyPDF2` / `PyMuPDF` you will see `No module named 'PyPDF2'` or `'fitz'` when uploading a PDF).

   **Option A — script (macOS, Linux, Windows):**

   ```bash
   cd lambda
   python build_ats_zip.py
   ```

   On non-Linux machines the script requests **manylinux** wheels so the zip runs on **Lambda x86_64** (Python 3.11). For **arm64** Lambdas, set `LAMBDA_ZIP_PLATFORM=manylinux2014_aarch64` (and matching runtime) before running the script.

   **Option B — manual:**

   ```bash
   pip install -r ats_resume_scorer_requirements.txt -t package/
   cd package && zip -r ../ats_resume_scorer.zip . && cd ..
   zip ats_resume_scorer.zip ats_resume_scorer.py
   ```

3. Upload `ats_resume_scorer.zip` to Lambda (or attach a layer built from the same requirements).
4. **IAM:** Grant DynamoDB/Textract as in the table above. Without `AtsScoreHistory`, history writes are skipped (logs will note missing resource).
5. **API Gateway:** POST + OPTIONS, CORS `Access-Control-Allow-Origin: *` (or your domain).
6. **Timeout:** At least **60–90 s** (Gemini + PDF often need 15–45s). **The default 3 s causes API Gateway "Internal Server Error".**
7. **Payload size:** API Gateway ~6 MB limit; keep resumes under ~4 MB.

### If you see "Internal Server Error" (after raising Lambda timeout)

**HTTP API + Lambda waits at most ~30 seconds.** Your Lambda may be set to 60–90s, but **API Gateway HTTP API** still stops the client around **30s**. PDF parse + Gemini often needs **35–60s**, so the gateway returns an error even when Lambda is still running.

**Fix (pick one):**

1. **Lambda function URL (recommended)**  
   - Lambda → **Configuration** → **Function URL** → **Create**.  
   - Auth: **NONE** (or IAM if you lock it down).  
   - **Configure CORS:** allow your site origin (or `*` for testing), **POST**, header **Content-Type**.  
   - Copy URL: `https://xxxx.lambda-url.ap-south-2.on.aws/`  
   - Point the app at it: `VITE_ATS_SCORER_ENDPOINT=https://xxxx.lambda-url.../`  
   - For local dev, point the Vite proxy `target` in `vite.config.ts` to that host and `rewrite` to `/` (same as replacing the `execute-api` target).

2. **Stay on API Gateway** — keep resume/JD **short**, redeploy the trimmed prompt Lambda build, and retest; heavy PDFs may still fail intermittently.

### Other checks

1. Lambda → **Monitor** → **CloudWatch logs**: real Python error, **`Task timed out`**, or success **after** the client already failed (API Gateway limit).
2. **General configuration:** **Timeout: 1 min+**, **Memory: 512 MB+** still helps once the client can wait long enough (Function URL).

### Security notes

- User LLM keys appear in the **API Gateway/Lambda request payload**. Do not enable full request logging in production for this route, or redact bodies.
- In BYOK mode, keys are **not** copied into `Users` by this Lambda. If the client sends `userId`, **history** may still be written (no secrets stored there).
- Saved keys in `Users.llmApiKeys` are stored **as submitted** (plaintext in DynamoDB); restrict table access via IAM.

**If you previously enabled KMS:** re-save each provider key from Settings or the ATS page so DynamoDB holds real keys again (remove any `LLM_KEYS_KMS_KEY_ID` env vars from Lambdas).

---

## Frontend

- Default endpoint: `VITE_ATS_SCORER_ENDPOINT` or  
  `https://8ysn1do8kb.execute-api.ap-south-2.amazonaws.com/default/ats_scorer_handler`
- Service: `services/atsService.ts` → `analyzeAtsWithProvider()`
- UI: `components/ATSScorer.tsx`
- **Local dev (`npm run dev`):** requests go through **`/dev-api/ats-scorer`** (Vite proxy in `vite.config.ts`) so the browser does not hit CORS. Restart the dev server after changing the proxy target.
- **Production:** the app calls the real `execute-api` URL; configure API Gateway **CORS** to allow your site origin (e.g. `https://yourdomain.com`).

After deploying a new zip, update the proxy `target` / default URL if your API URL changes.
