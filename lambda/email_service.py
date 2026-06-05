"""
Transactional email via Gmail SMTP (App Password).

Lambda environment:
  SMTP_HOST          — default smtp.gmail.com
  SMTP_PORT          — default 587
  SMTP_USER          — Gmail address
  SMTP_APP_PASSWORD  — Google App Password (16 chars)
  SMTP_FROM_NAME     — optional display name (default CodeXCareer)
  SMTP_FROM_EMAIL    — optional From address (defaults to SMTP_USER)
  ALLOWED_ORIGIN     — site URL for logo + verify links (default https://codexcareer.com)
"""

from __future__ import annotations

import os
import smtplib
import ssl
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD", "").strip()
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "CodeXCareer").strip()
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USER).strip()
SITE_URL = os.environ.get("ALLOWED_ORIGIN", "https://codexcareer.com").rstrip("/")
BRAND_NAME = "CodeXCareer"
BRAND_TAGLINE = "CODE • LEARN • LAUNCH"
SUPPORT_EMAIL = "support@codexcareer.com"
LOGO_URL = f"{SITE_URL}/logo1.png"
BRAND_ORANGE = "#FF6B00"


def is_smtp_configured() -> bool:
    return bool(SMTP_USER and SMTP_APP_PASSWORD)


def _from_header() -> str:
    if SMTP_FROM_NAME and SMTP_FROM_EMAIL:
        return f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    return SMTP_FROM_EMAIL or SMTP_USER


def _code_digit_boxes(code: str) -> str:
    digits = [ch for ch in code if ch.isdigit()][:6]
    cells = []
    for digit in digits:
        cells.append(
            f"""
            <td style="padding:0 6px;">
              <div style="width:44px;height:52px;border:1px solid #ffd7b8;border-radius:12px;background:#ffffff;
                box-shadow:0 8px 20px rgba(255,107,0,0.08);font-size:24px;font-weight:700;color:#111827;
                line-height:52px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                {digit}
              </div>
            </td>
            """
        )
    return f"""
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto 8px auto;">
      <tr>{''.join(cells)}</tr>
    </table>
    """


def _build_verification_email_html(code: str, verify_link: str) -> str:
    year = datetime.utcnow().year
    digit_boxes = _code_digit_boxes(code)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — {BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#fff7f0 0%,#f7f8fb 100%);padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">
          <tr>
            <td align="center" style="padding:8px 0 20px 0;">
              <img src="{LOGO_URL}" alt="{BRAND_NAME} logo" width="220" style="display:block;max-width:220px;height:auto;border:0;" />
              <p style="margin:10px 0 0 0;font-size:11px;letter-spacing:0.22em;color:{BRAND_ORANGE};font-weight:700;text-transform:uppercase;">
                {BRAND_TAGLINE}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #ffe4cc;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(255,107,0,0.12);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#ff7a1a 0%,{BRAND_ORANGE} 100%);padding:28px 32px;text-align:center;">
                    <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;font-weight:700;">Email Verification</h1>
                    <p style="margin:10px 0 0 0;font-size:15px;line-height:1.5;color:#fff4eb;">Confirm your email to secure your {BRAND_NAME} account</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 12px 32px;text-align:center;">
                    <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#374151;">Hi there,</p>
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">
                      Thanks for joining <strong>{BRAND_NAME}</strong>. Use the verification code below or click the button to confirm your email address.
                    </p>
                    {digit_boxes}
                    <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;color:#9ca3af;">Do not share this code with anyone.</p>
                    <a href="{verify_link}" style="display:inline-block;background:linear-gradient(90deg,#ff7a1a 0%,{BRAND_ORANGE} 100%);color:#ffffff;text-decoration:none;
                      padding:14px 34px;border-radius:999px;font-size:15px;font-weight:700;box-shadow:0 12px 24px rgba(255,107,0,0.25);">
                      Verify Email
                    </a>
                    <p style="margin:24px 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">Or copy and paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
                      <a href="{verify_link}" style="color:{BRAND_ORANGE};text-decoration:underline;">{verify_link}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f1;border:1px solid #ffe4cc;border-radius:16px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#9a3412;">Was this request not made by you?</p>
                          <p style="margin:0;font-size:13px;line-height:1.6;color:#7c2d12;">
                            If you did not create a {BRAND_NAME} account, you can safely ignore this email. This code expires in 15 minutes.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#fff7f0;border-top:1px solid #ffe4cc;padding:20px 32px;text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">This is an automated message. Please do not reply.</p>
                    <p style="margin:10px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
                      Need help? <a href="mailto:{SUPPORT_EMAIL}" style="color:{BRAND_ORANGE};text-decoration:none;font-weight:600;">{SUPPORT_EMAIL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 12px 8px 12px;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">© {year} {BRAND_NAME}. All rights reserved.</p>
              <p style="margin:6px 0 0 0;font-size:11px;line-height:1.6;color:#9ca3af;">
                <a href="{SITE_URL}" style="color:#9ca3af;text-decoration:none;">{SITE_URL.replace('https://', '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: Optional[str] = None,
) -> None:
    if not is_smtp_configured():
        raise RuntimeError(
            "SMTP is not configured (set SMTP_USER and SMTP_APP_PASSWORD)"
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = _from_header()
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    if html_body:
        msg.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(SMTP_USER, SMTP_APP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL or SMTP_USER, [to_email], msg.as_string())


def send_email_verification(
    to_email: str,
    code: str,
    verify_link: str,
) -> None:
    subject = f"Verify your email — {BRAND_NAME}"
    text_body = (
        f"Verify your email for {BRAND_NAME}\n\n"
        f"Your verification code: {code}\n\n"
        f"Verify in one click:\n{verify_link}\n\n"
        "This code expires in 15 minutes.\n"
        "If you did not create an account, you can ignore this email.\n\n"
        f"Need help? {SUPPORT_EMAIL}\n"
        f"{BRAND_TAGLINE}\n"
    )
    html_body = _build_verification_email_html(code, verify_link)
    send_email(to_email, subject, text_body, html_body)
