"""
Transactional email via Gmail SMTP (App Password).

Lambda environment:
  SMTP_HOST          — default smtp.gmail.com
  SMTP_PORT          — default 587
  SMTP_USER          — Gmail address
  SMTP_APP_PASSWORD  — Google App Password (16 chars)
  SMTP_FROM_NAME     — optional display name (default CodeXCareer)
  SMTP_FROM_EMAIL    — optional From address (defaults to SMTP_USER)
"""

from __future__ import annotations

import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional


SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD", "").strip()
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "CodeXCareer").strip()
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USER).strip()


def is_smtp_configured() -> bool:
    return bool(SMTP_USER and SMTP_APP_PASSWORD)


def _from_header() -> str:
    if SMTP_FROM_NAME and SMTP_FROM_EMAIL:
        return f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    return SMTP_FROM_EMAIL or SMTP_USER


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
    subject = "Confirm your email — CodeXCareer"
    text_body = (
        "Confirm your email address for CodeXCareer.\n\n"
        f"Your verification code: {code}\n\n"
        f"Or confirm in one click:\n{verify_link}\n\n"
        "This code expires in 15 minutes. If you did not create an account, "
        "you can ignore this email."
    )
    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; line-height: 1.5;">
  <h2 style="color: #ea580c;">Confirm your email</h2>
  <p>Thanks for signing up on CodeXCareer. Use the code below or click the button to verify your email.</p>
  <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">{code}</p>
  <p><a href="{verify_link}" style="display: inline-block; background: #ea580c; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Confirm email</a></p>
  <p style="font-size: 13px; color: #666;">Or copy this link:<br><a href="{verify_link}">{verify_link}</a></p>
  <p style="font-size: 13px; color: #666;">Expires in 15 minutes.</p>
</body>
</html>"""
    send_email(to_email, subject, text_body, html_body)
