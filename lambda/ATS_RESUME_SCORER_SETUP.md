# ATS Resume Scorer Lambda

This Lambda scores a resume (0–100) against a job description for engineering/tech architect roles.

## Behavior

- **Input**: `userId`, `resumeText`, `jobDescription` (POST body).
- **Keys**: Loads the user's stored LLM API keys from the `Users` DynamoDB table (field `llmApiKeys`).
- **Scoring**: Uses OpenAI, Claude, or Gemini (first available) to:
  - Parse resume into sections (skills, experience, education, etc.)
  - Score with weights: Skills match 30%, Experience 25%, Education 15%, Formatting 15%, Achievements 10%, Location/soft 5%
  - Extract matched and missing JD keywords and return short feedback.
- **Output**: `{ success: true, atsResult: { overallScore, breakdown, matchedKeywords, missingKeywords, feedback } }`.

## Deployment

1. Create a Lambda in the same region as your `Users` table (e.g. `ap-south-2`).
2. Use Python 3.10+; no extra dependencies (uses only `boto3` and stdlib).
3. Attach a role with read access to the `Users` DynamoDB table.
4. Expose the Lambda via API Gateway (HTTP API or REST) with CORS.
5. Frontend uses this endpoint by default (override with `VITE_ATS_SCORER_ENDPOINT` if needed):
   - `https://b238hguu88.execute-api.ap-south-2.amazonaws.com/default/ats_resume_scorer`

## Related

- **Settings Lambda** (`update_userdetails_in_settings.py`): Handles `testLlmApiKey`, `getLlmKeysStatus`, and stores `llmApiKeys` in the same `Users` table.
- **Frontend**: Resume Builder shows a locked “ATS Score” until the user adds at least one API key in Settings.
