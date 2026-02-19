"""
ATS Resume Scorer Lambda.
Input: userId, resumeText, jobDescription.
Loads user's LLM API keys from DynamoDB, calls OpenAI/Claude/Gemini to score resume 0-100
for engineering/tech architect roles with weighted breakdown and keyword match.
"""

import json
import boto3
import urllib.request
import urllib.error

USERS_TABLE = "Users"
dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table(USERS_TABLE)

# Weights for engineering/tech architect ATS (must sum to 100)
WEIGHTS = {
    "skillsMatch": 30,
    "experience": 25,
    "education": 15,
    "formatting": 15,
    "achievements": 10,
    "locationAndSoft": 5,
}


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(body),
    }


def get_user_llm_keys(user_id):
    try:
        r = users_table.get_item(Key={"userId": user_id})
        item = r.get("Item")
        if not item:
            return None
        keys = item.get("llmApiKeys") or {}
        if isinstance(keys, dict):
            return {k: (v or "").strip() for k, v in keys.items() if (v or "").strip()}
        return None
    except Exception as e:
        print(f"get_user_llm_keys error: {e}")
        return None


def _call_openai(api_key, prompt):
    data = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are an ATS (Applicant Tracking System) scorer for engineering and tech architect roles. Respond only with valid JSON, no markdown or extra text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    text = (out.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    return text.strip()


def _call_claude(api_key, prompt):
    data = json.dumps({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 2000,
        "messages": [
            {"role": "user", "content": prompt},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=data,
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    for block in (out.get("content") or []):
        if block.get("type") == "text":
            return (block.get("text") or "").strip()
    return ""


def _call_gemini(api_key, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    data = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2000},
    }).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    for part in (out.get("candidates") or [{}])[0].get("content", {}).get("parts") or []:
        if "text" in part:
            return part["text"].strip()
    return ""


def build_ats_prompt(resume_text, job_description):
    w = WEIGHTS
    return f"""You are an ATS (Applicant Tracking System) scorer for engineering and tech architect roles.

TASK:
1. Parse the resume into sections: skills, experience, education, achievements, formatting/clarity, and any location/soft skills.
2. Compare the resume to the job description. Extract important keywords from the JD (e.g. AWS, Agile, Python, system design).
3. Score the resume from 0 to 100 using EXACTLY these weights (they sum to 100):
   - Skills match (keyword match + depth): {w['skillsMatch']}%
   - Experience (relevance, years, impact): {w['experience']}%
   - Education (relevance to role): {w['education']}%
   - Formatting (clarity, structure, readability): {w['formatting']}%
   - Achievements (quantified results, leadership): {w['achievements']}%
   - Location/soft (if mentioned in JD) and soft skills: {w['locationAndSoft']}%

4. List matched keywords from the JD that appear in the resume.
5. List important JD keywords that are missing or weak in the resume.
6. Give 2-4 short, actionable feedback sentences.

Respond with ONLY a single JSON object (no markdown, no code block), with these exact keys:
- "overallScore": number 0-100
- "breakdown": object with keys "skillsMatch", "experience", "education", "formatting", "achievements", "locationAndSoft" (each a number 0-100)
- "matchedKeywords": array of strings
- "missingKeywords": array of strings
- "feedback": array of strings (2-4 short sentences)

RESUME:
{resume_text[:12000]}

JOB DESCRIPTION:
{job_description[:8000]}
"""


def parse_llm_json(raw):
    s = (raw or "").strip()
    # Remove markdown code block if present
    if s.startswith("```"):
        lines = s.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines)
    return json.loads(s)


def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {})

        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        user_id = (body.get("userId") or "").strip()
        resume_text = (body.get("resumeText") or "").strip()
        job_description = (body.get("jobDescription") or "").strip()

        if not user_id:
            return response(400, {"success": False, "message": "userId is required"})
        if not resume_text:
            return response(400, {"success": False, "message": "resumeText is required"})
        if not job_description:
            return response(400, {"success": False, "message": "jobDescription is required"})

        keys = get_user_llm_keys(user_id)
        if not keys:
            return response(403, {"success": False, "message": "No LLM API key found. Add at least one key in Settings to use ATS Score."})

        prompt = build_ats_prompt(resume_text, job_description)
        raw = None
        for provider in ("openai", "claude", "gemini"):
            api_key = keys.get(provider)
            if not api_key:
                continue
            try:
                if provider == "openai":
                    raw = _call_openai(api_key, prompt)
                elif provider == "claude":
                    sys_prompt = "You are an ATS scorer for engineering roles. Respond only with valid JSON, no markdown."
                    full_prompt = f"{sys_prompt}\n\n{prompt}"
                    raw = _call_claude(api_key, full_prompt)
                else:
                    raw = _call_gemini(api_key, prompt)
                if raw:
                    break
            except Exception as e:
                print(f"ATS {provider} error: {e}")
                continue

        if not raw:
            return response(500, {"success": False, "message": "Could not get ATS score from any configured LLM. Check your API keys in Settings."})

        result = parse_llm_json(raw)
        # Normalize keys
        result.setdefault("overallScore", 0)
        result.setdefault("breakdown", {})
        result.setdefault("matchedKeywords", [])
        result.setdefault("missingKeywords", [])
        result.setdefault("feedback", [])

        return response(200, {"success": True, "atsResult": result})

    except json.JSONDecodeError as e:
        print(f"ATS JSON parse error: {e}")
        return response(500, {"success": False, "message": "Invalid response from scorer. Please try again."})
    except Exception as e:
        print(f"ATS Lambda error: {e}")
        return response(500, {"success": False, "message": str(e)})
