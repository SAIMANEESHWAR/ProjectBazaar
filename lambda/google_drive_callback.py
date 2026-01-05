import json
import urllib.parse
import urllib.request
import base64

CLIENT_ID = "1045739523565-va7quhkm5ngjflbcp4r7q2mijc69bkm6.apps.googleusercontent.com"
CLIENT_SECRET = "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"
REDIRECT_URI = "https://yr3g0hy49k.execute-api.ap-south-2.amazonaws.com/default/Google_Drive_Callback"

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }

def redirect_response(url):
    """Return HTML redirect response"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="refresh" content="0;url={url}">
        <script>window.location.href = {json.dumps(url)};</script>
    </head>
    <body>
        <p>Redirecting...</p>
        <p>If you are not redirected, <a href="{url}">click here</a>.</p>
    </body>
    </html>
    """
    return {
        "statusCode": 302,
        "headers": {
            "Location": url,
            "Content-Type": "text/html"
        },
        "body": html
    }

def lambda_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return response(200, {})
        
        params = event.get("queryStringParameters", {}) or {}
        code = params.get("code")
        state = params.get("state")
        
        # Parse state to get return URL
        return_url = None
        if state:
            try:
                state_data = json.loads(base64.b64decode(state).decode())
                return_url = state_data.get("returnUrl")
            except:
                pass
        
        if not code:
            error_message = "Missing code"
            if return_url:
                error_url = return_url + "?error=missing_code&message=" + urllib.parse.quote(error_message)
                return redirect_response(error_url)
            return response(400, {"error": error_message})
        
        # Exchange code for token
        data = urllib.parse.urlencode({
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI
        }).encode()
        
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        with urllib.request.urlopen(req) as res:
            token = json.loads(res.read().decode())
        
        access_token = token.get("access_token")
        if not access_token:
            error_message = token.get("error_description") or token.get("error") or "Failed to get access token"
            if return_url:
                error_url = return_url + "?error=token_failed&message=" + urllib.parse.quote(error_message)
                return redirect_response(error_url)
            return response(400, {"error": error_message})
        
        # Fetch Drive files
        req = urllib.request.Request(
            "https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name)",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        with urllib.request.urlopen(req) as res:
            files = json.loads(res.read().decode())
        
        # Fetch user info
        try:
            user_req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            with urllib.request.urlopen(user_req) as user_res:
                user_info = json.loads(user_res.read().decode())
        except:
            user_info = {}
        
        # Prepare response data
        drive_data = {
            "success": True,
            "drive": {
                "accessToken": access_token,
                "files": files.get("files", []),
                "user": {
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture")
                }
            }
        }
        
        # Redirect to frontend with Drive data
        if return_url:
            drive_data_encoded = urllib.parse.quote(json.dumps(drive_data))
            redirect_url = f"{return_url}?drive_data={drive_data_encoded}"
            return redirect_response(redirect_url)
        else:
            # Fallback: return JSON if no return URL
            return response(200, drive_data)
        
    except Exception as e:
        # Try to get return URL for error redirect
        params = event.get("queryStringParameters", {}) or {}
        state = params.get("state")
        return_url = None
        if state:
            try:
                state_data = json.loads(base64.b64decode(state).decode())
                return_url = state_data.get("returnUrl")
            except:
                pass
        
        error_message = str(e)
        if return_url:
            error_url = return_url + "?error=server_error&message=" + urllib.parse.quote(error_message)
            return redirect_response(error_url)
        return response(500, {"error": error_message})
