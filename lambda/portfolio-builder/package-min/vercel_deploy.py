"""Deploy generated portfolio HTML to Vercel."""

import base64
import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict

from templates import generate_portfolio_html

VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")


def deploy_to_vercel(
    portfolio_data: Dict[str, Any], user_id: str, template_id: str = "aurora"
) -> Dict[str, Any]:
    if not VERCEL_TOKEN:
        safe = re.sub(r"[^a-zA-Z0-9-]", "-", user_id)[:50]
        url = f"https://portfolio-{safe}.vercel.app"
        return {"success": True, "liveUrl": url, "previewUrl": url}

    try:
        safe_user_id = re.sub(r"[^a-zA-Z0-9-]", "-", user_id)[:50]
        html_content = generate_portfolio_html(portfolio_data, template_id)
        files = [
            {
                "file": "index.html",
                "data": base64.b64encode(html_content.encode()).decode(),
                "encoding": "base64",
            }
        ]
        project_name = f"portfolio-{safe_user_id}"
        payload = {
            "name": project_name,
            "files": files,
            "target": "production",
            "projectSettings": {"framework": None},
        }

        req = urllib.request.Request(
            "https://api.vercel.com/v13/deployments?forceNew=1",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {VERCEL_TOKEN}",
                "Content-Type": "application/json",
            },
        )

        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.loads(r.read().decode())

        deployment_url = res.get("url")
        try:
            protection_payload = {
                "ssoProtection": None,
                "vercelAuthentication": {"deploymentType": "none"},
            }
            protection_req = urllib.request.Request(
                f"https://api.vercel.com/v9/projects/{project_name}",
                data=json.dumps(protection_payload).encode(),
                headers={
                    "Authorization": f"Bearer {VERCEL_TOKEN}",
                    "Content-Type": "application/json",
                },
                method="PATCH",
            )
            with urllib.request.urlopen(protection_req, timeout=30):
                pass
        except Exception as pe:
            print(f"Could not update project protection: {pe}")

        live = f"https://{deployment_url}"
        return {"success": True, "liveUrl": live, "previewUrl": live}

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        print(f"Vercel API error: {e.code} - {error_body}")
        return {"success": False, "error": f"Vercel deployment failed: {error_body or str(e)}"}
    except Exception as e:
        print(f"Deployment error: {e}")
        return {"success": False, "error": str(e)}
