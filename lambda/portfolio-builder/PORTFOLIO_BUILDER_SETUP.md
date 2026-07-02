# Portfolio Builder v2 — Setup

AI-powered portfolio generation: pick a template → upload resume → LLM polishes content → preview → deploy to Vercel.

## Folder layout

```
lambda/portfolio-builder/
  handler.py           # API router
  resume_extract.py    # PDF/DOCX text extraction
  llm_enrich.py        # Uses Users.llmApiKeys + atsActiveProvider
  vercel_deploy.py     # Vercel deployment
  history.py           # portfolio-history DynamoDB
  templates/           # aurora, slate, momentum HTML generators
  requirements.txt
  template.yaml        # SAM deploy
```

Shared (parent `lambda/`): `feature_entitlement.py` for trial gating.

## API actions (POST JSON body)

| action | description |
|--------|-------------|
| `getTemplates` | List 3 curated templates with previewHtml |
| `generateFromResume` | `{ userId, templateId, fileName, fileType, fileContent }` |
| `previewPortfolio` | `{ templateId, portfolioData }` |
| `deployPortfolio` | `{ userId, userEmail, templateId, portfolioData, fileName? }` |
| `getPortfolioHistory` | `{ userId }` |
| `deletePortfolio` | `{ userId, portfolioId }` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VERCEL_TOKEN` | Vercel API token for real deploys (optional; placeholder URL if unset) |
| `DYNAMODB_TABLE` | `portfolio-history` |
| `USERS_TABLE` | `Users` (for llmApiKeys) |
| `SUBSCRIPTIONS_TABLE` | `UserSubscriptions` (entitlements) |
| `AWS_REGION` | e.g. `ap-south-2` |

## Deploy with SAM

From `lambda/portfolio-builder/`:

```bash
# Package PDF libs into a layer or vendor into the zip
pip install -r requirements.txt -t package/
cp -r templates package/
cp handler.py resume_extract.py llm_enrich.py vercel_deploy.py history.py package/
cp ../feature_entitlement.py package/

cd package && zip -r ../portfolio-builder.zip . && cd ..

# Or SAM:
sam build
sam deploy --guided \
  --parameter-overrides VercelToken=YOUR_VERCEL_TOKEN
```

Copy the `HttpApiUrl` output to frontend:

```
VITE_PORTFOLIO_BUILDER_ENDPOINT=https://XXXX.execute-api.ap-south-2.amazonaws.com/default
```

## Frontend

- `services/portfolioBuilderService.ts` — API client
- `components/BuildPortfolioPage.tsx` — template-first stepper UI
- Dev proxy: `/dev-api/portfolio-builder` in `vite.config.ts`

## LLM keys

Users must save an API key in **Settings → AI & LLM API keys** and set **ATS active provider**. The Lambda loads keys from DynamoDB; keys are never sent from the browser for generation.

## PDF extraction (required for resume upload)

Most PDFs (including `full_stack_developer.pdf`) need **PyPDF2** or **pdfminer.six** on Lambda.
Copy-paste of `.py` files alone is **not enough**.

**Option A — copy shared extractor (recommended if ATS Lambda already reads PDFs):**

1. Upload `lambda/resume_text_extract.py` into your portfolio Lambda (same folder as `handler.py`).
2. Attach the **same Lambda Layer** you use for ATS scorer (if any).

**Option B — bundle dependencies into a zip (Linux-compatible):**

```bash
cd lambda/portfolio-builder
pip install PyPDF2 pdfminer.six pdfplumber -t package/ --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.12
# copy all .py files + templates/ + feature_entitlement.py into package/
cd package && zip -r ../portfolio-builder.zip . 
```

Upload `portfolio-builder.zip` in Lambda → Upload from → .zip file.

**Option C — quick test:** save resume as **DOCX** in Word/Google Docs — works without PDF libs.

## Templates

| id | style |
|----|-------|
| `editorial` | Bold award-style (seyi.dev inspired) |
| `aurora` | Dark dev / gradient |
| `slate` | Minimal serif |
| `momentum` | Bold creative |

Legacy `generate_portfolio.py` is unchanged; new deployments use this handler only.
