"""
Transactional email via Gmail SMTP (auth, job digests).

Lambda environment:
  SMTP_HOST          — default smtp.gmail.com
  SMTP_PORT          — default 587
  SMTP_USER          — Gmail address
  SMTP_APP_PASSWORD  — Google App Password (16 chars)
  SMTP_FROM_NAME     — optional display name (default CodeXCareer)
  SMTP_FROM_EMAIL    — optional From address (defaults to SMTP_USER)
  ALLOWED_ORIGIN     — CORS fallback origin (default https://codexcareer.com)
  APP_BASE_URL       — public site URL for logo + email links (default ALLOWED_ORIGIN)
  JOB_HUNT_URL       — browse CTA link (default {APP_BASE_URL}/dashboard)
"""

from __future__ import annotations

import html
import os
import smtplib
import ssl
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "").strip()
SMTP_APP_PASSWORD = os.environ.get("SMTP_APP_PASSWORD", "").strip()
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "CodeXCareer").strip()
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USER).strip()
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://codexcareer.com").strip()
SITE_URL = os.environ.get("APP_BASE_URL", ALLOWED_ORIGIN).rstrip("/")
JOB_HUNT_URL = os.environ.get("JOB_HUNT_URL", f"{SITE_URL}/dashboard").rstrip("/")
SETTINGS_URL = f"{SITE_URL}/dashboard"

BRAND_NAME = "CodeXCareer"
BRAND_TAGLINE = "CODE • LEARN • LAUNCH"
SUPPORT_EMAIL = "support@codexcareer.com"
LOGO_URL = f"{SITE_URL}/logo1.png"
BRAND_ORANGE = "#FF6B00"

_PILL_BUTTON_STYLE = (
    "display:inline-block;background:linear-gradient(90deg,#ff7a1a 0%,"
    f"{BRAND_ORANGE} 100%);color:#ffffff;text-decoration:none;"
    "padding:14px 34px;border-radius:999px;font-size:15px;font-weight:700;"
    "box-shadow:0 12px 24px rgba(255,107,0,0.25);"
)


def is_smtp_configured() -> bool:
    return bool(SMTP_USER and SMTP_APP_PASSWORD)


def _from_header() -> str:
    if SMTP_FROM_NAME and SMTP_FROM_EMAIL:
        return f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    return SMTP_FROM_EMAIL or SMTP_USER


def _escape_html(text: Any) -> str:
    if text is None:
        return ""
    return html.escape(str(text), quote=True)


def _pill_button(href: str, label: str) -> str:
    return f'<a href="{_escape_html(href)}" style="{_PILL_BUTTON_STYLE}">{_escape_html(label)}</a>'


def _build_branded_shell(
    *,
    page_title: str,
    hero_title: str,
    hero_subtitle: str,
    body_html: str,
    footer_note_html: Optional[str] = None,
) -> str:
    year = datetime.utcnow().year
    footer_note_section = ""
    if footer_note_html:
        footer_note_section = f"""
                <tr>
                  <td style="padding:0 32px 28px 32px;">
                    {footer_note_html}
                  </td>
                </tr>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{_escape_html(page_title)}</title>
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
                    <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;font-weight:700;">{_escape_html(hero_title)}</h1>
                    <p style="margin:10px 0 0 0;font-size:15px;line-height:1.5;color:#fff4eb;">{_escape_html(hero_subtitle)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 12px 32px;">
                    {body_html}
                  </td>
                </tr>
                {footer_note_section}
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


def _peach_callout(title: str, message: str) -> str:
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f1;border:1px solid #ffe4cc;border-radius:16px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#9a3412;">{_escape_html(title)}</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#7c2d12;">{message}</p>
        </td>
      </tr>
    </table>
    """


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
    digit_boxes = _code_digit_boxes(code)
    body_html = f"""
    <div style="text-align:center;">
      <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#374151;">Hi there,</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">
        Thanks for joining <strong>{BRAND_NAME}</strong>. Use the verification code below or tap the button to confirm your email address.
      </p>
      {digit_boxes}
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;color:#9ca3af;">Do not share this code with anyone.</p>
      {_pill_button(verify_link, "Verify Email")}
    </div>
    """
    footer_note = _peach_callout(
        "Was this request not made by you?",
        f"If you did not create a {BRAND_NAME} account, you can safely ignore this email. This code expires in 15 minutes.",
    )
    return _build_branded_shell(
        page_title=f"Verify your email — {BRAND_NAME}",
        hero_title="Email Verification",
        hero_subtitle=f"Confirm your email to secure your {BRAND_NAME} account",
        body_html=body_html,
        footer_note_html=footer_note,
    )


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
        "Open the HTML version of this email and tap Verify Email, or enter the code in the app.\n\n"
        "This code expires in 15 minutes.\n"
        "If you did not create an account, you can ignore this email.\n\n"
        f"Need help? {SUPPORT_EMAIL}\n"
        f"{BRAND_TAGLINE}\n"
    )
    html_body = _build_verification_email_html(code, verify_link)
    send_email(to_email, subject, text_body, html_body)


def _build_password_reset_email_html(code: str, reset_link: str) -> str:
    digit_boxes = _code_digit_boxes(code)
    body_html = f"""
    <div style="text-align:center;">
      <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#374151;">Hi there,</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">
        We received a request to reset your <strong>{BRAND_NAME}</strong> password. Use the code below or click the button to choose a new password.
      </p>
      {digit_boxes}
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;color:#9ca3af;">Do not share this code with anyone.</p>
      {_pill_button(reset_link, "Reset Password")}
      <p style="margin:24px 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">Or copy and paste this link into your browser:</p>
      <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
        <a href="{_escape_html(reset_link)}" style="color:{BRAND_ORANGE};text-decoration:underline;">{_escape_html(reset_link)}</a>
      </p>
    </div>
    """
    footer_note = _peach_callout(
        "Didn't request a password reset?",
        f"If you did not ask to reset your password, you can safely ignore this email. Your password will not change. This link expires in 30 minutes.",
    )
    return _build_branded_shell(
        page_title=f"Reset your password — {BRAND_NAME}",
        hero_title="Password Reset",
        hero_subtitle=f"Reset your {BRAND_NAME} account password",
        body_html=body_html,
        footer_note_html=footer_note,
    )


def send_password_reset(
    to_email: str,
    code: str,
    reset_link: str,
) -> None:
    subject = f"Reset your password — {BRAND_NAME}"
    text_body = (
        f"Reset your {BRAND_NAME} password\n\n"
        f"Your reset code: {code}\n\n"
        f"Reset in one click:\n{reset_link}\n\n"
        "This code expires in 30 minutes.\n"
        "If you did not request a reset, you can ignore this email.\n\n"
        f"Need help? {SUPPORT_EMAIL}\n"
        f"{BRAND_TAGLINE}\n"
    )
    html_body = _build_password_reset_email_html(code, reset_link)
    send_email(to_email, subject, text_body, html_body)


def _build_job_card_html(job: Dict[str, Any]) -> str:
    title = job.get("job_title") or "New Job"
    company = job.get("company") or "Unknown Company"
    location = job.get("location") or ""
    salary = job.get("salary") or ""
    job_type = job.get("job_type") or ""
    description = (job.get("description") or "")[:300]
    apply_link = job.get("apply_link") or JOB_HUNT_URL
    logo = job.get("company_logo") or job.get("company_logo_url") or ""

    meta_parts = [p for p in [location, job_type, salary] if p]
    meta_html = " &nbsp;|&nbsp; ".join(_escape_html(p) for p in meta_parts)

    logo_html = ""
    if logo:
        logo_html = f"""
        <div style="margin-bottom:12px;">
          <img src="{_escape_html(logo)}" alt="{_escape_html(company)} logo"
            style="max-height:48px;max-width:120px;object-fit:contain;border:0;" />
        </div>
        """

    description_html = ""
    if description:
        truncated = len(job.get("description") or "") > 300
        description_html = f"""
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4b5563;">
          {_escape_html(description)}{"…" if truncated else ""}
        </p>
        """

    meta_section = ""
    if meta_html:
        meta_section = f'<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">{meta_html}</p>'

    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="margin:0 0 16px 0;background:#fff8f1;border:1px solid #ffe4cc;border-radius:16px;">
      <tr>
        <td style="padding:20px 22px;">
          {logo_html}
          <h2 style="margin:0 0 6px;font-size:18px;line-height:1.3;color:#111827;">{_escape_html(title)}</h2>
          <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#374151;">{_escape_html(company)}</p>
          {meta_section}
          {description_html}
          <a href="{_escape_html(apply_link)}"
            style="display:inline-block;background:linear-gradient(90deg,#ff7a1a 0%,{BRAND_ORANGE} 100%);color:#ffffff;
            text-decoration:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:700;">
            View &amp; Apply
          </a>
        </td>
      </tr>
    </table>
    """


def _build_job_digest_email_html(
    jobs: List[Dict[str, Any]],
    job_hunt_url: Optional[str] = None,
) -> str:
    browse_url = (job_hunt_url or JOB_HUNT_URL).rstrip("/")
    count = len(jobs)
    job_word = "job" if count == 1 else "jobs"
    cards = "".join(_build_job_card_html(job) for job in jobs)

    body_html = f"""
    <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#374151;">Hi there,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">
      We found <strong>{count} new {job_word}</strong> on <strong>{BRAND_NAME} Job Hunt</strong>.
      Browse roles, save favorites, and apply when you are ready.
    </p>
    {cards}
    <div style="text-align:center;margin-top:8px;">
      {_pill_button(browse_url, "Browse all jobs")}
    </div>
    """

    footer_note = _peach_callout(
        "Manage email notifications",
        (
            f'You received this because you enabled job email notifications on {BRAND_NAME}. '
            f'To unsubscribe, open <a href="{SETTINGS_URL}" style="color:{BRAND_ORANGE};text-decoration:underline;">Settings</a> '
            f'and disable &ldquo;Email me when new jobs are posted&rdquo;.'
        ),
    )

    return _build_branded_shell(
        page_title=f"New jobs on {BRAND_NAME} Job Hunt",
        hero_title="New Jobs on Job Hunt",
        hero_subtitle=f"Fresh listings scraped for your {BRAND_NAME} dashboard",
        body_html=body_html,
        footer_note_html=footer_note,
    )


def _build_job_digest_text(
    jobs: List[Dict[str, Any]],
    job_hunt_url: Optional[str] = None,
) -> str:
    browse_url = (job_hunt_url or JOB_HUNT_URL).rstrip("/")
    count = len(jobs)
    lines = [
        f"{count} new job{'s' if count != 1 else ''} on {BRAND_NAME} Job Hunt",
        "",
        f"Browse all jobs: {browse_url}",
        "",
    ]
    for index, job in enumerate(jobs, start=1):
        title = job.get("job_title") or "New Job"
        company = job.get("company") or "Unknown Company"
        location = job.get("location") or ""
        apply_link = job.get("apply_link") or browse_url
        lines.append(f"{index}. {title} at {company}")
        if location:
            lines.append(f"   Location: {location}")
        lines.append(f"   Apply: {apply_link}")
        lines.append("")
    lines.extend(
        [
            f"You received this because you enabled job email notifications on {BRAND_NAME}.",
            f"To unsubscribe, open Settings in your dashboard: {SETTINGS_URL}",
            "",
            f"Need help? {SUPPORT_EMAIL}",
            BRAND_TAGLINE,
        ]
    )
    return "\n".join(lines)


def send_job_digest_email(
    to_email: str,
    jobs: List[Dict[str, Any]],
    job_hunt_url: Optional[str] = None,
) -> bool:
    """Send a branded job digest via Gmail SMTP. Returns True on success."""
    if not jobs or not is_smtp_configured():
        return False

    count = len(jobs)
    job_word = "job" if count == 1 else "jobs"
    subject = f"{count} new {job_word} on {BRAND_NAME} Job Hunt"
    text_body = _build_job_digest_text(jobs, job_hunt_url)
    html_body = _build_job_digest_email_html(jobs, job_hunt_url)

    try:
        send_email(to_email, subject, text_body, html_body)
        return True
    except Exception:
        return False
