# Fix My Resume — separate Lambda

This feature lives in **its own Lambda** (`fix_resume_handler`), not in the ATS scorer. The ATS Lambda only scores; this one parses the résumé, injects missing keywords, optionally builds a PDF, and can upload to S3.

---

## What you need to do (step by step)

### 1) Build the deployment zip

On your machine (Python 3.11+ recommended, same as Lambda):

```bash
cd lambda
python build_fix_resume_zip.py
```

This creates **`lambda/fix_resume_lambda.zip`** (dependencies + `fix_resume_handler.py` + `resume_*.py` + `templates/resume_fix_template.tex`).

On Windows/macOS, the script uses Linux wheels (`manylinux`) so the package runs on AWS Lambda.

---

### 2) Create a new Lambda in AWS

1. Open **AWS Console → Lambda → Create function**.
2. Name it e.g. **`fix_resume_handler`** (or any name you like).
3. Runtime: **Python 3.11** (or match your ATS Lambda).
4. Architecture: **x86_64** (unless you know you use arm64).
5. Upload **`fix_resume_lambda.zip`** as the deployment package (or publish to S3 for large zips).

---

### 3) Set the handler

In Lambda **Configuration → Runtime settings → Edit**:

- Handler: **`fix_resume_handler.lambda_handler`**

---

### 4) IAM permissions

Attach a role that allows:

- **Basic Lambda execution** (CloudWatch Logs).
- **S3** (optional): if you set `ATS_RESUME_S3_BUCKET`, the function uploads fixed PDFs. Use the same bucket as ATS or a dedicated one; grant `s3:PutObject` on the prefix you use.
- **Textract** (optional): only if you set `ENABLE_TEXTRACT_OCR=1` in **this** Lambda’s environment (same as ATS scorer).

---

### 5) Environment variables (optional)

| Variable | Purpose |
|----------|---------|
| `ATS_RESUME_S3_BUCKET` | If set, uploaded fixed PDFs go here (HTTPS URL returned when public-read or you add presigning later). |
| `ATS_FIXED_RESUME_PREFIX` | S3 key prefix (default `ats-fixed-resume/`). |
| `ENABLE_TEXTRACT_OCR` | `1` for scanned PDFs (needs Textract on the role). |
| `OCR_MAX_PDF_PAGES` | Max pages for OCR (default `3`). |
| `MIN_PDF_TEXT_CHARS` | Threshold before trying fitz/OCR (default `40`). |

---

### 6) Hook up API Gateway (or Function URL)

Expose **POST** to your frontend:

- **API Gateway HTTP API** (or REST): create a route (e.g. `POST /fix-resume` or use the default stage path).
- Integration: your new Lambda.
- Enable **CORS** if the browser calls the API directly (or use a Vite proxy in dev).

Note the **invoke URL**, e.g.  
`https://xxxxxxxx.execute-api.ap-south-2.amazonaws.com/default/fix_resume_handler`

---

### 7) Point the web app at the new URL

**Production / preview builds**

Create or edit `.env.production` (or your host’s env):

```env
VITE_FIX_RESUME_ENDPOINT=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/default/fix_resume_handler
```

Rebuild the frontend (`npm run build`).  
If this variable is **missing**, the app **falls back to the ATS scorer URL**, which no longer runs Fix My Resume — so set `VITE_FIX_RESUME_ENDPOINT` after you deploy this Lambda.

**Local development (`npm run dev`)**

`vite.config.ts` proxies **`/dev-api/fix-resume`** to the same API host as ATS and rewrites to **`/default/fix_resume_handler`**.  
If your API uses a different path, change the `rewrite` line in `vite.config.ts` to match your stage and integration.

---

### 8) Redeploy the ATS Lambda (if you use the shared zip script)

The ATS scorer zip **no longer** includes Fix My Resume. Rebuild it so it picks up **`resume_text_extract.py`**:

```bash
cd lambda
python build_ats_zip.py
```

Upload **`ats_resume_scorer.zip`** to your **existing** ATS Lambda.

---

## Request / response (Fix Lambda)

**POST** JSON body:

- `resumeBase64` + `resumeFileName` **or** `resumeText`
- `missingKeywords`: `string[]`
- `userId` (optional, for S3 key prefix)
- Optional LLM polish: `useLlmEnhance`, `provider`, `apiKey`, `model` (OpenAI / OpenRouter only)

**Success:** `addedKeywords`, `previewText`, `pdfUrl` and/or `pdfBase64`, `pdfAvailable`, optional `pdfNote`, or `pdfError`. The full structured `improvedResume` object is **omitted by default** (it can be huge and cause API Gateway **502 Internal Server Error**). Set env **`FIX_RESUME_RETURN_IMPROVED_JSON=1`** only if you need it.

---

## PDF note

Standard Lambda has no `pdflatex`. The deployment zip includes **fpdf2** (text-only PDF, **no Pillow/PIL**). If `ENABLE_LATEX_PDF=1` and TeX is installed, LaTeX PDF is used first. For LaTeX-only workflows, use a container or layer with TeX.

---

## If the app shows “Internal Server Error” (502)

1. **Lambda timeout:** set **60–120 seconds** (default 3s will fail on cold start + PDF).
2. **Memory:** use at least **512 MB** (1024 MB if still flaky).
3. **Architecture:** the zip from `build_fix_resume_zip.py` targets **x86_64**. The function must be **x86_64**, not **arm64**, unless you rebuild for `manylinux2014_aarch64` / `arm64`.
4. **Redeploy the latest zip** so it includes **fpdf2** (`fix_resume_requirements.txt`) and this repo’s handler code. Remove any Lambda **layer** that ships a broken `PIL` package.
5. **CloudWatch Logs** for the function — the real error is always there even when API Gateway only says “Internal Server Error”.
6. **Oversized JSON response** — the API no longer returns `improvedResume` by default; if you enabled `FIX_RESUME_RETURN_IMPROVED_JSON=1` and errors returned, turn it off.
