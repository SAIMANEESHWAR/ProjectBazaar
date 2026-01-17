"""
Lambda Function: Portfolio Generator
------------------------------------
1. Receive resume (PDF/DOCX) as base64
2. Extract text using pdfplumber (primary) / PyPDF2 (fallback)
3. Parse resume text with regex patterns to extract portfolio data
4. Generate portfolio with selectable templates
5. Deploy to Vercel
6. Return live URL
7. Save history to DynamoDB

Supported Actions:
- getTemplates: Returns list of available templates
- parseResume: Extracts portfolio data from resume (for preview)
- previewPortfolio: Generates HTML preview without deploying
- generatePortfolio: Full flow - extract, generate, deploy
- getPortfolioHistory: Get user's portfolio generation history
- deletePortfolio: Delete a portfolio from history
"""

import json
import base64
import os
import re
import tempfile
import shutil
import zipfile
import urllib.request
import urllib.error
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from decimal import Decimal

# Import AWS SDK for DynamoDB
try:
    import boto3
    from boto3.dynamodb.conditions import Key
    dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'ap-south-2'))
    PORTFOLIO_TABLE = dynamodb.Table(os.environ.get('DYNAMODB_TABLE', 'portfolio-history'))
    DYNAMODB_ENABLED = True
except ImportError:
    DYNAMODB_ENABLED = False
    PORTFOLIO_TABLE = None

# Import templates module
try:
    from portfolio_templates import TEMPLATES, get_template_list, generate_portfolio_html
except ImportError:
    # Fallback for local testing
    TEMPLATES = {}
    def get_template_list(): return []
    def generate_portfolio_html(data, template_id="modern"): return "<html><body>Template not found</body></html>"

# =========================
# CONFIG
# =========================
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")

# =========================
# LAMBDA HANDLER
# =========================
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
        "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    }

    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    try:
        # Parse body - handle both string and dict formats from API Gateway
        body = event
        if "body" in event:
            if isinstance(event["body"], str):
                try:
                    body = json.loads(event["body"])
                except json.JSONDecodeError:
                    return error_response("Invalid JSON in request body", headers)
            elif isinstance(event["body"], dict):
                body = event["body"]
        
        action = body.get("action", "")
        print(f"Received request: action={action}")

        # Route to appropriate handler based on action
        if action == "getTemplates":
            return handle_get_templates(headers)
        
        elif action == "parseResume":
            return handle_parse_resume(body, headers)
        
        elif action == "previewPortfolio":
            return handle_preview_portfolio(body, headers)
        
        elif action == "generatePortfolio":
            return handle_generate_portfolio(body, headers)
        
        elif action == "getPortfolioHistory":
            return handle_get_portfolio_history(body, headers)
        
        elif action == "deletePortfolio":
            return handle_delete_portfolio(body, headers)
        
        else:
            return error_response(f"Invalid action: {action}. Valid actions: getTemplates, parseResume, previewPortfolio, generatePortfolio, getPortfolioHistory, deletePortfolio", headers)

    except Exception as e:
        print("Lambda error:", e)
        import traceback
        traceback.print_exc()
        return error_response(str(e), headers)


# =========================
# ACTION HANDLERS
# =========================
def handle_get_templates(headers: Dict[str, str]) -> Dict[str, Any]:
    """Return list of available portfolio templates."""
    templates = get_template_list()
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": True,
            "templates": templates
        })
    }


def handle_parse_resume(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Parse resume and extract portfolio data without generating HTML."""
    user_email = body.get("userEmail", "")
    file_name = body.get("fileName", "resume.pdf")
    file_type = body.get("fileType", "application/pdf")
    file_b64 = body.get("fileContent")

    if not file_b64:
        return error_response("No resume provided", headers)

    file_bytes = base64.b64decode(file_b64)
    resume_text = extract_text_from_resume(file_bytes, file_type, file_name)
    
    if len(resume_text) < 50:
        return error_response(
            "Could not extract text from resume. This usually happens when: "
            "1) The PDF is scanned/image-based (not selectable text), "
            "2) The PDF uses unusual fonts or encoding. "
            "Try uploading a different PDF or a Word document (.docx).", 
            headers
        )

    portfolio_data = extract_portfolio_data(resume_text, user_email)
    
    # Return extracted text for user to review (truncated to 5000 chars)
    extracted_text = resume_text[:5000]
    if len(resume_text) > 5000:
        extracted_text += f"\n\n... [truncated, {len(resume_text)} total characters extracted]"

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": True,
            "portfolioData": portfolio_data,
            "extractedText": extracted_text,
            "extractionMethod": "regex_parser",
            "textLength": len(resume_text)
        })
    }


def handle_preview_portfolio(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Generate HTML preview for a specific template without deploying."""
    portfolio_data = body.get("portfolioData")
    template_id = body.get("templateId", "modern")
    
    if not portfolio_data:
        return error_response("No portfolio data provided", headers)
    
    # Validate template exists
    if template_id not in TEMPLATES and TEMPLATES:
        return error_response(f"Invalid template: {template_id}", headers)
    
    # Generate HTML
    html_content = generate_portfolio_html(portfolio_data, template_id)
    
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": True,
            "html": html_content,
            "templateId": template_id
        })
    }


def handle_generate_portfolio(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Full portfolio generation: parse resume, generate HTML, deploy to Vercel."""
    user_id = body.get("userId", f"user_{int(datetime.now().timestamp())}")
    user_email = body.get("userEmail", "")
    file_name = body.get("fileName", "resume.pdf")
    file_type = body.get("fileType", "application/pdf")
    file_b64 = body.get("fileContent")
    template_id = body.get("templateId", "modern")
    
    # Can also accept pre-parsed portfolio data
    portfolio_data = body.get("portfolioData")
    extracted_text = ""
    extraction_method = "pre_parsed"

    if not portfolio_data:
        # Need to parse resume first
        if not file_b64:
            return error_response("No resume or portfolio data provided", headers)

        file_bytes = base64.b64decode(file_b64)
        resume_text = extract_text_from_resume(file_bytes, file_type, file_name)
        
        if len(resume_text) < 50:
            return error_response(
                "Could not extract text from resume. Try uploading a different PDF or Word document (.docx).", 
                headers
            )

        portfolio_data = extract_portfolio_data(resume_text, user_email)
        
        # Prepare extracted text for response
        extracted_text = resume_text[:5000]
        if len(resume_text) > 5000:
            extracted_text += f"\n\n... [truncated, {len(resume_text)} total characters extracted]"
        extraction_method = "regex_parser"

    # Deploy with selected template
    deployment = deploy_to_vercel(portfolio_data, user_id, template_id)
    
    if not deployment.get("success"):
        return error_response(deployment.get("error"), headers)

    # Save to DynamoDB history
    portfolio_id = str(uuid.uuid4())
    history_record = save_portfolio_to_history(
        portfolio_id=portfolio_id,
        user_id=user_id,
        user_email=user_email,
        portfolio_data=portfolio_data,
        template_id=template_id,
        live_url=deployment["liveUrl"],
        file_name=file_name
    )

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": True,
            "portfolioId": portfolio_id,
            "liveUrl": deployment["liveUrl"],
            "previewUrl": deployment["previewUrl"],
            "portfolioData": portfolio_data,
            "templateId": template_id,
            "extractedText": extracted_text,
            "extractionMethod": extraction_method
        })
    }


def handle_get_portfolio_history(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Get user's portfolio generation history."""
    user_id = body.get("userId")
    
    if not user_id:
        return error_response("User ID is required", headers)
    
    history = get_portfolio_history(user_id)
    
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": True,
            "history": history
        })
    }


def handle_delete_portfolio(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Delete a portfolio from history."""
    user_id = body.get("userId")
    portfolio_id = body.get("portfolioId")
    
    if not user_id or not portfolio_id:
        return error_response("User ID and Portfolio ID are required", headers)
    
    success = delete_portfolio_from_history(user_id, portfolio_id)
    
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "success": success,
            "message": "Portfolio deleted successfully" if success else "Failed to delete portfolio"
        })
    }

# =========================
# HELPERS
# =========================
def error_response(message: str, headers: Dict[str, str]) -> Dict[str, Any]:
    return {
        "statusCode": 400,
        "headers": headers,
        "body": json.dumps({"success": False, "error": message})
    }


# =========================
# DATABASE FUNCTIONS
# =========================
def save_portfolio_to_history(
    portfolio_id: str,
    user_id: str,
    user_email: str,
    portfolio_data: Dict[str, Any],
    template_id: str,
    live_url: str,
    file_name: str
) -> Optional[Dict[str, Any]]:
    """Save portfolio generation to DynamoDB history."""
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        print("DynamoDB not enabled, skipping history save")
        return None
    
    try:
        # Get name from portfolio data
        name = portfolio_data.get("personal", {}).get("name", "Untitled Portfolio")
        title = portfolio_data.get("personal", {}).get("title", "")
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        item = {
            "userId": user_id,
            "portfolioId": portfolio_id,
            "userEmail": user_email,
            "name": name,
            "title": title,
            "templateId": template_id,
            "liveUrl": live_url,
            "fileName": file_name,
            "createdAt": timestamp,
            "updatedAt": timestamp,
            # Store a summary, not full data to save space
            "summary": {
                "skillCount": sum(len(v) for v in portfolio_data.get("skills", {}).values()),
                "experienceCount": len(portfolio_data.get("experience", [])),
                "projectCount": len(portfolio_data.get("projects", [])),
                "educationCount": len(portfolio_data.get("education", []))
            }
        }
        
        PORTFOLIO_TABLE.put_item(Item=item)
        print(f"Saved portfolio {portfolio_id} for user {user_id}")
        return item
        
    except Exception as e:
        print(f"Error saving to DynamoDB: {e}")
        return None


def get_portfolio_history(user_id: str) -> List[Dict[str, Any]]:
    """Get all portfolios for a user from DynamoDB."""
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        print("DynamoDB not enabled, returning empty history")
        return []
    
    try:
        response = PORTFOLIO_TABLE.query(
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False  # Sort by newest first
        )
        
        items = response.get('Items', [])
        
        # Convert Decimal types to int/float for JSON serialization
        def convert_decimals(obj):
            if isinstance(obj, Decimal):
                return int(obj) if obj % 1 == 0 else float(obj)
            elif isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_decimals(i) for i in obj]
            return obj
        
        return [convert_decimals(item) for item in items]
        
    except Exception as e:
        print(f"Error querying DynamoDB: {e}")
        return []


def delete_portfolio_from_history(user_id: str, portfolio_id: str) -> bool:
    """Delete a portfolio from DynamoDB history."""
    if not DYNAMODB_ENABLED or not PORTFOLIO_TABLE:
        print("DynamoDB not enabled, cannot delete")
        return False
    
    try:
        PORTFOLIO_TABLE.delete_item(
            Key={
                'userId': user_id,
                'portfolioId': portfolio_id
            }
        )
        print(f"Deleted portfolio {portfolio_id} for user {user_id}")
        return True
        
    except Exception as e:
        print(f"Error deleting from DynamoDB: {e}")
        return False


# =========================
# RESUME EXTRACTION (Smart Pipeline)
# =========================
def extract_text_from_resume(content: bytes, file_type: str, file_name: str) -> str:
    """
    Extract text from resume files (PDF/DOCX).
    Uses PyPDF2 (primary) with pdfplumber + OCR fallback for PDFs.
    """
    temp_dir = tempfile.mkdtemp()
    path = os.path.join(temp_dir, file_name)

    try:
        # Save file to temp directory
        with open(path, "wb") as f:
            f.write(content)

        if file_name.lower().endswith(".pdf"):
            # Use smart PDF extraction
            text = extract_pdf_text_smart(path)
            
            # Check if extraction produced garbage or failed
            if is_garbage_text(text):
                print("PDF extraction produced unreadable text")
                return ""
            
            print(f"PDF extraction successful: {len(text)} characters")
            return text
            
        if file_name.lower().endswith((".docx", ".doc")):
            return extract_docx_text(path)

        return content.decode("utf-8", errors="ignore")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def extract_pdf_text_smart(pdf_path: str) -> str:
    """
    Smart PDF text extraction with 3-step strategy:
    1. pdfplumber (primary - more accurate for complex layouts)
    2. PyPDF2 (fallback) - works in Lambda without extra dependencies
    3. Basic regex extraction (no dependencies) - fallback using zlib decompression
    """
    
    # Step 1: Try pdfplumber first (more accurate for complex layouts)
    try:
        import pdfplumber
        
        print("Attempting PDF extraction with pdfplumber...")
        all_text = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                try:
                    # Try simple extraction first (most compatible)
                    page_text = page.extract_text()
                    
                    # If simple extraction fails, try with tolerances
                    if not page_text:
                        page_text = page.extract_text(
                            x_tolerance=3,
                            y_tolerance=3
                        )
                    
                    if page_text:
                        all_text.append(page_text)
                        print(f"  Page {page_num + 1}: extracted {len(page_text)} chars")
                except Exception as e:
                    print(f"pdfplumber error on page {page_num + 1}: {e}")
                    continue
        
        combined_text = "\n\n".join(all_text)
        cleaned_text = clean_resume_text(combined_text)
        
        # If we got substantial text, return it
        if len(cleaned_text) > 200:
            print(f"pdfplumber extraction successful: {len(cleaned_text)} chars")
            return cleaned_text
        else:
            print(f"pdfplumber extracted only {len(cleaned_text)} chars, trying PyPDF2...")
            
    except ImportError:
        print("pdfplumber not available, trying PyPDF2...")
    except Exception as e:
        print(f"pdfplumber failed: {e}, trying PyPDF2...")
    
    # Step 2: Try PyPDF2 as fallback
    try:
        import PyPDF2
        
        print("Attempting PDF extraction with PyPDF2...")
        all_text = []
        
        with open(pdf_path, 'rb') as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        all_text.append(page_text)
                except Exception as e:
                    print(f"PyPDF2 error on page {page_num + 1}: {e}")
                    continue
        
        combined_text = "\n\n".join(all_text)
        cleaned_text = clean_resume_text(combined_text)
        
        if len(cleaned_text) > 200:
            print(f"PyPDF2 extraction successful: {len(cleaned_text)} chars")
            return cleaned_text
        else:
            print(f"PyPDF2 extracted only {len(cleaned_text)} chars, trying basic extraction...")
            
    except ImportError:
        print("PyPDF2 not available, trying basic extraction...")
    except Exception as e:
        print(f"PyPDF2 failed: {e}, trying basic extraction...")
    
    # Step 3: Basic text extraction from PDF bytes (no dependencies needed)
    try:
        print("Attempting basic PDF text extraction (no dependencies)...")
        text = extract_pdf_text_basic(pdf_path)
        if len(text) > 100:
            print(f"Basic extraction successful: {len(text)} chars")
            return text
        else:
            print(f"Basic extraction got only {len(text)} chars")
    except Exception as e:
        print(f"Basic extraction failed: {e}")
    
    # If all methods fail, return empty string
    print("All PDF extraction methods failed - PDF may be scanned/image-based")
    return ""


def extract_pdf_text_basic(pdf_path: str) -> str:
    """
    Basic PDF text extraction using regex on raw PDF content.
    Works without any external dependencies (uses standard library zlib).
    This is a fallback for when PyPDF2/pdfplumber aren't available.
    """
    import zlib
    
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    text_parts = []
    
    # First, try to decompress FlateDecode streams (most modern PDFs use compression)
    # Find all stream objects
    stream_pattern = re.compile(rb'stream\s*\n(.*?)\nendstream', re.DOTALL)
    
    for match in stream_pattern.finditer(pdf_bytes):
        stream_data = match.group(1)
        
        # Try to decompress with zlib (FlateDecode)
        try:
            decompressed = zlib.decompress(stream_data)
            # Decode to string
            try:
                content = decompressed.decode('utf-8', errors='ignore')
            except:
                content = decompressed.decode('latin-1', errors='ignore')
            
            # Extract text from decompressed content
            extracted = extract_text_from_pdf_content(content)
            if extracted:
                text_parts.append(extracted)
        except zlib.error:
            # Not compressed or different compression, try raw
            pass
        except Exception as e:
            continue
    
    # Also try uncompressed content (older PDFs)
    try:
        pdf_content = pdf_bytes.decode('latin-1')
        extracted = extract_text_from_pdf_content(pdf_content)
        if extracted and len(extracted) > len(' '.join(text_parts)):
            text_parts = [extracted]
    except:
        pass
    
    # Join and clean the text
    raw_text = ' '.join(text_parts)
    cleaned = clean_resume_text(raw_text)
    
    return cleaned


def extract_text_from_pdf_content(content: str) -> str:
    """Extract text strings from PDF content stream."""
    text_parts = []
    
    # Pattern 1: Simple text strings - (text) Tj
    pattern1 = re.compile(r'\(([^)]*)\)\s*Tj', re.DOTALL)
    for match in pattern1.finditer(content):
        text = decode_pdf_string(match.group(1))
        if text.strip() and len(text) > 0:
            text_parts.append(text)
    
    # Pattern 2: Text arrays - [(text) -100 (more)] TJ
    pattern2 = re.compile(r'\[(.*?)\]\s*TJ', re.DOTALL)
    for match in pattern2.finditer(content):
        array_content = match.group(1)
        strings = re.findall(r'\(([^)]*)\)', array_content)
        line_parts = []
        for s in strings:
            text = decode_pdf_string(s)
            if text:
                line_parts.append(text)
        if line_parts:
            text_parts.append(''.join(line_parts))
    
    # Pattern 3: Hex strings - <48656C6C6F> Tj
    pattern3 = re.compile(r'<([0-9A-Fa-f]+)>\s*Tj', re.DOTALL)
    for match in pattern3.finditer(content):
        hex_str = match.group(1)
        try:
            text = bytes.fromhex(hex_str).decode('utf-8', errors='ignore')
            if text.strip():
                text_parts.append(text)
        except:
            pass
    
    # Pattern 4: Look for BT...ET blocks and extract all text
    pattern4 = re.compile(r'BT\s*(.*?)\s*ET', re.DOTALL)
    for match in pattern4.finditer(content):
        block = match.group(1)
        # Get all strings in the block
        strings = re.findall(r'\(([^)]+)\)', block)
        block_text = []
        for s in strings:
            text = decode_pdf_string(s)
            if text and len(text) > 0:
                block_text.append(text)
        if block_text:
            text_parts.append(' '.join(block_text))
    
    # Join with spaces and newlines where appropriate
    result = ' '.join(text_parts)
    
    # Try to restore some structure - add newlines after common patterns
    result = re.sub(r'([.!?])\s+([A-Z])', r'\1\n\2', result)
    
    return result


def decode_pdf_string(s: str) -> str:
    """Decode PDF escape sequences in a string."""
    # Common PDF escape sequences
    s = s.replace('\\n', '\n')
    s = s.replace('\\r', '\r')
    s = s.replace('\\t', '\t')
    s = s.replace('\\(', '(')
    s = s.replace('\\)', ')')
    s = s.replace('\\\\', '\\')
    
    # Decode octal sequences like \050 for '('
    def octal_replace(match):
        try:
            return chr(int(match.group(1), 8))
        except:
            return match.group(0)
    
    s = re.sub(r'\\([0-7]{1,3})', octal_replace, s)
    
    # Remove non-printable characters except newlines/tabs
    s = ''.join(c for c in s if c.isprintable() or c in '\n\t')
    
    return s


def clean_resume_text(text: str) -> str:
    """
    Clean and normalize extracted resume text.
    Removes artifacts and fixes common extraction issues.
    """
    if not text:
        return ""
    
    # Remove FontAwesome / CID artifacts like (cid:123)
    text = re.sub(r'\(cid:\d+\)', '', text)
    text = re.sub(r'cid:\d+', '', text)
    
    # Remove other common PDF artifacts (Unicode private use area)
    # Use actual Unicode characters, not raw string escapes
    text = re.sub('[\uf000-\uf0ff]', '', text)  # FontAwesome icons range
    text = re.sub('[\ue000-\uf8ff]', '', text)  # Full private use area
    
    # Normalize various bullet point styles to simple dash
    bullet_patterns = ['•', '●', '○', '▪', '▫', '►', '▸', '◆', '◇', '■', '□', '★', '☆', '➤', '➢', '→', '»']
    for bullet in bullet_patterns:
        text = text.replace(bullet, '-')
    
    # Fix broken email addresses (user @ gmail . com -> user@gmail.com)
    text = re.sub(r'(\w+)\s*@\s*(\w+)\s*\.\s*(\w+)', r'\1@\2.\3', text)
    
    # Fix broken URLs
    text = re.sub(r'(https?)\s*:\s*/\s*/\s*', r'\1://', text)
    
    # Fix broken phone numbers with excessive spaces
    text = re.sub(r'(\+?\d)\s+(\d)\s+(\d)\s+(\d)', r'\1\2\3\4', text)
    
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Collapse multiple newlines to max 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Collapse multiple spaces to single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove lines that are just whitespace
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if line]
    
    # Rejoin with newlines
    text = '\n'.join(lines)
    
    # Remove any remaining non-printable characters except newlines/tabs
    text = ''.join(c for c in text if c.isprintable() or c in '\n\t')
    
    return text.strip()


def is_garbage_text(text: str) -> bool:
    """Check if extracted text is garbage/unreadable."""
    if not text or len(text) < 50:
        return True
    
    # Check for CID artifacts (common in failed PDF extraction)
    cid_count = len(re.findall(r'\(cid:\d+\)', text)) + len(re.findall(r'cid:\d+', text))
    if cid_count > 10:
        print(f"Found {cid_count} CID artifacts - likely garbage")
        return True
    
    # Count readable ASCII characters (letters, numbers, common punctuation)
    readable = sum(1 for c in text if c.isalnum() or c in ' .,;:!?@#$%&*()-_+=\n\t\'"/:')
    ratio = readable / len(text) if text else 0
    
    # If less than 60% readable characters, it's likely garbage
    if ratio < 0.6:
        print(f"Readable ratio {ratio:.2f} < 0.6 - likely garbage")
        return True
    
    # Check for common words that should appear in a resume
    common_words = [
        'experience', 'education', 'skills', 'work', 'project', 'email', 
        'phone', 'address', 'university', 'degree', 'company', 'developer',
        'engineer', 'manager', 'bachelor', 'master', 'year', 'resume', 'cv',
        'summary', 'objective', 'professional', 'technical', 'software',
        'programming', 'languages', 'certifications', 'achievements'
    ]
    text_lower = text.lower()
    found_words = sum(1 for word in common_words if word in text_lower)
    
    # If very few common resume words found, likely garbage
    if found_words < 2:
        print(f"Found only {found_words} common resume words - likely garbage")
        return True
    
    return False


def extract_docx_text(path: str) -> str:
    """Extract text from DOCX files."""
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        text = re.sub("<[^<]+?>", " ", xml)
        text = re.sub(r"\s+", " ", text)
        return clean_resume_text(text)
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

# =========================
# RESUME PARSER (Regex-based)
# =========================
def extract_portfolio_data(resume_text: str, user_email: str) -> Dict[str, Any]:
    """
    Extract portfolio data from resume text using regex patterns.
    No AI/external API required.
    """
    print(f"Parsing resume text ({len(resume_text)} characters)...")
    
    # Check if we received raw PDF marker (extraction failed)
    if resume_text.startswith("[PDF_RAW_BASE64:"):
        print("Cannot parse raw PDF without text extraction")
        return get_empty_portfolio_data(user_email)
    
    text = resume_text
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract email
    email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', text)
    email = email_match.group(0) if email_match else user_email or ""
    
    # Extract phone
    phone_match = re.search(r'[\+]?[\d\s\-\(\)]{10,}', text)
    phone = phone_match.group(0).strip() if phone_match else ""
    
    # Extract name (usually first non-empty line that looks like a name)
    name = extract_name(lines)
    
    # Extract title/role
    title = extract_title(text, lines)
    
    # Extract location
    location = extract_location(text)
    
    # Extract links
    github = extract_url(text, r'github\.com/[\w-]+')
    linkedin = extract_url(text, r'linkedin\.com/in/[\w-]+')
    
    # Extract skills
    skills = extract_skills(text)
    
    # Extract experience
    experience = extract_experience(text)
    
    # Extract education
    education = extract_education(text)
    
    # Extract projects
    projects = extract_projects(text)
    
    # Extract certifications
    certifications = extract_certifications(text)
    
    # Build bio from summary section or first paragraph
    bio = extract_summary(text) or f"{title} with expertise in {', '.join(list(skills.get('other', []))[:3]) or 'software development'}."
    
    result = {
        "personal": {
            "name": name,
            "title": title,
            "tagline": f"{title} | {location}" if location else title,
            "email": email,
            "phone": phone,
            "location": location,
            "bio": bio
        },
        "about": {
            "headline": "About Me",
            "description": bio,
            "highlights": extract_highlights(text, skills)
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certifications": certifications,
        "links": {
            "github": f"https://{github}" if github else "",
            "linkedin": f"https://{linkedin}" if linkedin else "",
            "twitter": "",
            "email": f"mailto:{email}" if email else ""
        }
    }
    
    print(f"Extracted portfolio for: {name}")
    return result


def extract_name(lines: List[str]) -> str:
    """Extract name from resume lines."""
    for line in lines[:5]:  # Check first 5 lines
        # Skip lines that look like headers or contact info
        if any(skip in line.lower() for skip in ['resume', 'cv', 'curriculum', '@', 'http', 'phone', 'email', 'address']):
            continue
        # Name is usually 2-4 words, capitalized
        words = line.split()
        if 1 <= len(words) <= 5 and all(w[0].isupper() for w in words if w.isalpha()):
            # Filter out single letters and titles
            if len(line) > 3 and len(line) < 50:
                return line
    return lines[0][:40] if lines else "Professional"


def extract_title(text: str, lines: List[str]) -> str:
    """Extract job title from resume."""
    # Common title patterns
    title_patterns = [
        r'(?:software|senior|junior|lead|full[- ]?stack|front[- ]?end|back[- ]?end|web|mobile|data|ml|ai|cloud|devops|qa|test|ui/?ux)\s*(?:developer|engineer|architect|designer|analyst|scientist|specialist)',
        r'(?:project|product|program|engineering|technical)\s*manager',
        r'(?:cto|ceo|vp|director|head)\s*(?:of)?\s*(?:engineering|technology|development)?',
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(0).title()
    
    # Check lines after name for title
    for line in lines[1:6]:
        line_lower = line.lower()
        if any(kw in line_lower for kw in ['developer', 'engineer', 'designer', 'manager', 'analyst', 'architect']):
            return line[:60]
    
    return "Software Developer"


def extract_location(text: str) -> str:
    """Extract location from resume."""
    # Common location patterns
    location_patterns = [
        r'(?:location|address|city|based in)[:\s]*([A-Za-z\s,]+)',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(?:India|USA|UK|Canada|Australia|Germany|France|Singapore)',
        r'(?:Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Chennai|Pune|Kolkata|New York|San Francisco|London|Berlin|Singapore)',
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            loc = match.group(1) if match.lastindex else match.group(0)
            return loc.strip()[:50]
    
    return ""


def extract_url(text: str, pattern: str) -> str:
    """Extract URL matching pattern."""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(0) if match else ""


def extract_skills(text: str) -> Dict[str, List[Dict[str, Any]]]:
    """Extract skills categorized by type."""
    text_lower = text.lower()
    
    # Skill categories and keywords
    skill_categories = {
        "frontend": ["react", "angular", "vue", "javascript", "typescript", "html", "css", "sass", "tailwind", "bootstrap", "jquery", "next.js", "redux", "webpack"],
        "backend": ["python", "java", "node.js", "nodejs", "express", "django", "flask", "spring", "php", "ruby", "rails", "go", "golang", "rust", "c#", ".net", "fastapi"],
        "database": ["mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch", "oracle", "sql server", "sqlite", "dynamodb", "cassandra", "firebase"],
        "devops": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd", "terraform", "ansible", "linux", "git", "github actions", "gitlab"],
        "other": ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "agile", "scrum", "jira", "rest api", "graphql", "microservices"]
    }
    
    found_skills: Dict[str, List[Dict[str, Any]]] = {cat: [] for cat in skill_categories}
    
    for category, keywords in skill_categories.items():
        for skill in keywords:
            if skill in text_lower:
                # Check it's a word boundary match
                if re.search(rf'\b{re.escape(skill)}\b', text_lower):
                    found_skills[category].append({
                        "name": skill.title() if len(skill) > 3 else skill.upper(),
                        "level": 80
                    })
    
    # Remove empty categories
    found_skills = {k: v for k, v in found_skills.items() if v}
    
    # If no skills found, add some defaults
    if not found_skills:
        found_skills = {
            "other": [{"name": "Problem Solving", "level": 80}]
        }
    
    return found_skills


def extract_experience(text: str) -> List[Dict[str, Any]]:
    """Extract work experience from resume."""
    experience = []
    
    # Find experience section
    exp_section = re.search(
        r'(?:work\s*)?experience[s]?[:\s]*\n([\s\S]*?)(?=\n(?:education|projects?|skills?|certification|$))',
        text, re.IGNORECASE
    )
    
    if exp_section:
        exp_text = exp_section.group(1)
        
        # Pattern for job entries
        job_pattern = re.compile(
            r'([A-Z][^\n]{5,60})\s*[-–|]\s*([A-Z][^\n]{3,40})\s*\n\s*'
            r'(?:(\d{4}\s*[-–]\s*(?:\d{4}|present|current)))?',
            re.IGNORECASE
        )
        
        for match in job_pattern.finditer(exp_text):
            title = match.group(1).strip()
            company = match.group(2).strip()
            period = match.group(3).strip() if match.group(3) else ""
            
            # Get description (next few lines)
            start_pos = match.end()
            end_pos = exp_text.find('\n\n', start_pos)
            desc = exp_text[start_pos:end_pos if end_pos > 0 else start_pos + 200].strip()
            
            experience.append({
                "company": company,
                "title": title,
                "period": period,
                "description": desc[:300] if desc else f"Worked as {title}"
            })
    
    # Simple fallback - look for company names and dates
    if not experience:
        company_pattern = re.compile(
            r'(?:at|@)\s+([A-Z][A-Za-z\s&]+?)(?:\s+|,|\n)',
            re.MULTILINE
        )
        date_pattern = re.compile(r'(\d{4})\s*[-–]\s*(\d{4}|present|current)', re.IGNORECASE)
        
        companies = company_pattern.findall(text)
        dates = date_pattern.findall(text)
        
        for i, company in enumerate(companies[:4]):
            period = f"{dates[i][0]} - {dates[i][1]}" if i < len(dates) else ""
            experience.append({
                "company": company.strip(),
                "title": "Software Developer",
                "period": period,
                "description": f"Worked at {company.strip()}"
            })
    
    return experience[:6]  # Limit to 6 entries


def extract_education(text: str) -> List[Dict[str, Any]]:
    """Extract education from resume."""
    education = []
    
    # Common degree patterns
    degree_patterns = [
        r"((?:bachelor|master|ph\.?d|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|b\.?a|m\.?a|mba|bca|mca)[^\n]{0,60})",
        r"((?:computer science|information technology|software engineering|electrical engineering|mechanical engineering)[^\n]{0,40})"
    ]
    
    # Find education section
    edu_section = re.search(
        r'education[:\s]*\n([\s\S]*?)(?=\n(?:experience|projects?|skills?|certification|$))',
        text, re.IGNORECASE
    )
    
    search_text = edu_section.group(1) if edu_section else text
    
    for pattern in degree_patterns:
        for match in re.finditer(pattern, search_text, re.IGNORECASE):
            degree_text = match.group(1).strip()
            
            # Extract year
            year_match = re.search(r'(\d{4})', degree_text)
            year = year_match.group(1) if year_match else ""
            
            # Try to find institution
            inst_match = re.search(
                r'(?:from|at|,)\s*([A-Z][A-Za-z\s]+(?:University|Institute|College|School))',
                search_text[match.start():match.start()+200],
                re.IGNORECASE
            )
            institution = inst_match.group(1).strip() if inst_match else ""
            
            education.append({
                "degree": degree_text[:80],
                "institution": institution or "University",
                "field": "",
                "year": year
            })
    
    return education[:4]  # Limit to 4 entries


def extract_projects(text: str) -> List[Dict[str, Any]]:
    """Extract projects from resume."""
    projects = []
    
    # Find projects section
    proj_section = re.search(
        r'projects?[:\s]*\n([\s\S]*?)(?=\n(?:education|experience|skills?|certification|$))',
        text, re.IGNORECASE
    )
    
    if proj_section:
        proj_text = proj_section.group(1)
        
        # Split by double newline or bullet points
        project_blocks = re.split(r'\n\s*\n|\n\s*[-•]\s*', proj_text)
        
        for block in project_blocks[:6]:
            block = block.strip()
            if len(block) > 20:
                # First line is usually project name
                lines = block.split('\n')
                name = lines[0].strip()[:60]
                desc = ' '.join(lines[1:])[:200] if len(lines) > 1 else ""
                
                # Extract technologies mentioned
                techs = []
                tech_keywords = ['react', 'node', 'python', 'java', 'aws', 'docker', 'mongodb', 'postgresql', 'typescript', 'javascript']
                for tech in tech_keywords:
                    if tech in block.lower():
                        techs.append(tech.title())
                
                if name and not any(skip in name.lower() for skip in ['experience', 'education', 'skills']):
                    projects.append({
                        "name": name,
                        "description": desc or f"Project: {name}",
                        "technologies": techs[:4]
                    })
    
    return projects[:6]


def extract_certifications(text: str) -> List[Dict[str, Any]]:
    """Extract certifications from resume."""
    certifications = []
    
    cert_patterns = [
        r'(aws\s+(?:certified|solutions?\s+architect|developer|sysops)[^\n]{0,40})',
        r'((?:google|azure|oracle|cisco|comptia|pmp|scrum)[^\n]{0,50}(?:certified|certificate|certification)?)',
        r'((?:certified|certificate)\s+[^\n]{10,50})',
    ]
    
    for pattern in cert_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            cert_name = match.group(1).strip()
            year_match = re.search(r'(\d{4})', cert_name)
            
            certifications.append({
                "name": cert_name[:60],
                "issuer": "",
                "year": year_match.group(1) if year_match else ""
            })
    
    return certifications[:5]


def extract_summary(text: str) -> str:
    """Extract professional summary/objective from resume."""
    summary_patterns = [
        r'(?:summary|objective|profile|about)[:\s]*\n([^\n]{50,300})',
        r'^([A-Z][^.]{50,250}\.)',  # First sentence if it's long enough
    ]
    
    for pattern in summary_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    
    return ""


def extract_highlights(text: str, skills: Dict[str, List]) -> List[str]:
    """Generate highlights from extracted data."""
    highlights = []
    
    # Count skills per category
    for category, skill_list in skills.items():
        if skill_list:
            highlights.append(f"{category.title()}: {len(skill_list)}+ technologies")
    
    # Add experience highlight
    exp_years = re.search(r'(\d+)\+?\s*years?\s*(?:of)?\s*experience', text, re.IGNORECASE)
    if exp_years:
        highlights.append(f"{exp_years.group(1)}+ years of experience")
    
    # Add education highlight
    if 'master' in text.lower() or 'ph.d' in text.lower():
        highlights.append("Advanced Degree")
    elif 'bachelor' in text.lower() or 'b.tech' in text.lower():
        highlights.append("Bachelor's Degree")
    
    return highlights[:5] or ["Problem Solver", "Team Player", "Quick Learner"]


def get_empty_portfolio_data(user_email: str) -> Dict[str, Any]:
    """Return empty portfolio structure when parsing fails."""
    return {
        "personal": {
            "name": "Your Name",
            "title": "Professional",
            "tagline": "Your tagline here",
            "email": user_email or "",
            "phone": "",
            "location": "",
            "bio": "Add your professional summary here."
        },
        "about": {
            "headline": "About Me",
            "description": "Add your description here.",
            "highlights": []
        },
        "education": [],
        "experience": [],
        "projects": [],
        "skills": {},
        "certifications": [],
        "links": {
            "github": "",
            "linkedin": "",
            "twitter": "",
            "email": f"mailto:{user_email}" if user_email else ""
        }
    }

# =========================
# VERCEL DEPLOY
# =========================
def deploy_to_vercel(portfolio_data: Dict[str, Any], user_id: str, template_id: str = "modern") -> Dict[str, Any]:
    if not VERCEL_TOKEN:
        return {
            "success": True,
            "liveUrl": f"https://portfolio-{user_id}.vercel.app",
            "previewUrl": f"https://portfolio-{user_id}.vercel.app"
        }

    try:
        # Sanitize user_id for valid project name (alphanumeric, hyphens, max 100 chars)
        safe_user_id = re.sub(r'[^a-zA-Z0-9-]', '-', user_id)[:50]
        
        # Generate portfolio HTML content using selected template
        html_content = generate_portfolio_html(portfolio_data, template_id)
        print(f"Generated portfolio with template: {template_id}")
        
        files = [{
            "file": "index.html",
            "data": base64.b64encode(html_content.encode()).decode(),
            "encoding": "base64"
        }]

        payload = {
            "name": f"portfolio-{safe_user_id}",
            "files": files,
            "target": "production",
            "projectSettings": {
                "framework": None
            }
        }

        req = urllib.request.Request(
            "https://api.vercel.com/v13/deployments",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {VERCEL_TOKEN}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.loads(r.read().decode())

        return {
            "success": True,
            "liveUrl": f"https://{res.get('url')}",
            "previewUrl": f"https://{res.get('url')}"
        }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        print(f"Vercel API error: {e.code} - {error_body}")
        return {"success": False, "error": f"Vercel deployment failed: {error_body or str(e)}"}
    except Exception as e:
        print(f"Deployment error: {e}")
        return {"success": False, "error": str(e)}
