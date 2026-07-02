"""
Generate branded subscription invoice PDFs for CodeXCareer.

Requires reportlab in the Lambda deployment package (see requirements-resume-pdf.txt).
"""
from __future__ import annotations

import io
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.fonts import addMapping
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        HRFlowable,
        Image,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

BRAND_NAME = "CodeXCareer"
BRAND_ORANGE = "#FF6B00"
BRAND_ORANGE_LIGHT = "#FFF7F0"
BRAND_GREEN = "#16A34A"
BRAND_GREEN_BG = "#ECFDF5"
BRAND_GREEN_BORDER = "#86EFAC"
BRAND_GREY_BG = "#F9FAFB"
BRAND_GREY_BORDER = "#E5E7EB"
BRAND_DARK = "#111827"
BRAND_MUTED = "#6B7280"
BRAND_FOOTER = "#1E293B"
BRAND_PEACH = "#FFF8F1"
SUPPORT_EMAIL = "support@codexcareer.com"
SITE_URL = "https://codexcareer.com"
COMPANY_LOCATION = "Hyderabad, Telangana, India"

SOCIAL_LINKS: List[Tuple[str, str, str]] = [
    (
        "instagram.png",
        "Instagram",
        "https://www.instagram.com/codex.career?igsh=MXhqazc5bzd0NXh3dg==",
    ),
    (
        "youtube.png",
        "YouTube",
        "https://youtube.com/@codexcareer?si=HgOzfWBZ2eqxXrLN",
    ),
    (
        "linkedin.png",
        "LinkedIn",
        "https://www.linkedin.com/in/codex-career-417815408/?skipRedirect=true",
    ),
]

S3_REGION = os.environ.get("REGION", "ap-south-2")
DEFAULT_INVOICE_BUCKET = "project-bazaar-users-profile-images"
INVOICE_S3_BUCKET = (
    os.environ.get("INVOICE_S3_BUCKET")
    or os.environ.get("ATS_RESUME_S3_BUCKET")
    or DEFAULT_INVOICE_BUCKET
).strip()
INVOICE_S3_PREFIX = os.environ.get("INVOICE_S3_PREFIX", "subscription-invoices/")

_UNICODE_FONTS_READY = False


def _s3_client():
    import boto3

    return boto3.client(
        "s3",
        region_name=S3_REGION,
        endpoint_url=f"https://s3.{S3_REGION}.amazonaws.com",
    )


def is_invoice_pdf_available() -> bool:
    return REPORTLAB_AVAILABLE


def generate_invoice_number() -> str:
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    short = uuid.uuid4().hex[:6].upper()
    return f"CXC-INV-{date_part}-{short}"


def _asset_path(filename: str) -> Optional[str]:
    base = os.path.dirname(os.path.abspath(__file__))
    for prefix in ("invoice_assets", ""):
        path = os.path.join(base, prefix, filename) if prefix else os.path.join(base, filename)
        if os.path.isfile(path):
            return path
    return None


def _logo_path() -> Optional[str]:
    return _asset_path("logo1.png")


def _ensure_unicode_fonts() -> str:
    """Register a Unicode TTF so the Indian Rupee sign (₹) renders correctly."""
    global _UNICODE_FONTS_READY
    if _UNICODE_FONTS_READY and "InvoiceFont" in pdfmetrics.getRegisteredFontNames():
        return "InvoiceFont"

    regular = _asset_path("NotoSans-Regular.ttf") or _asset_path("DejaVuSans.ttf")
    bold = _asset_path("NotoSans-Bold.ttf") or _asset_path("DejaVuSans-Bold.ttf")
    if regular:
        pdfmetrics.registerFont(TTFont("InvoiceFont", regular))
        pdfmetrics.registerFont(TTFont("InvoiceFont-Bold", bold or regular))
        addMapping("InvoiceFont", 0, 0, "InvoiceFont")
        addMapping("InvoiceFont", 1, 0, "InvoiceFont-Bold")
        addMapping("InvoiceFont", 0, 1, "InvoiceFont")
        addMapping("InvoiceFont", 1, 1, "InvoiceFont-Bold")
        _UNICODE_FONTS_READY = True
        return "InvoiceFont"
    return "Helvetica"


def _format_inr(amount: Any, *, decimals: bool = True) -> str:
    try:
        val = float(amount)
    except (TypeError, ValueError):
        val = 0.0
    if decimals:
        return f"\u20b9{val:,.2f}"
    return f"\u20b9{int(val):,}"


def _plan_line_description(plan_name: str, plan_id: str, user_name: str) -> str:
    access = {
        "lifetime": "lifetime access",
        "yearly": "yearly access",
        "monthly": "monthly access",
    }.get((plan_id or "").lower(), f"{plan_id} access")
    return f"{plan_name} Plan ({access}) — {user_name}"


def _thank_you_message(plan_id: str, upgrade_from_plan: Optional[str]) -> str:
    if upgrade_from_plan:
        return (
            f"Thank you for upgrading! Your {upgrade_from_plan} plan was replaced "
            f"and your new access is now active."
        )
    pid = (plan_id or "").lower()
    if pid == "lifetime":
        return "Thank you for your payment! Your lifetime access is now active."
    if pid == "yearly":
        return "Thank you for your payment! Your yearly plan is now active."
    if pid == "monthly":
        return "Thank you for your payment! Your monthly plan is now active."
    return "Thank you for your payment! Your plan is now active."


def _draw_watermark(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(colors.Color(1, 0.42, 0, alpha=0.07))
    canvas.setFont("Helvetica-Bold", 54)
    page_w, page_h = A4
    canvas.translate(page_w / 2, page_h / 2)
    canvas.rotate(42)
    canvas.drawCentredString(0, 0, BRAND_NAME)
    canvas.restoreState()


def _draw_page_footer(canvas, doc) -> None:
    canvas.saveState()
    page_w, _ = A4
    bar_h = 22
    canvas.setFillColor(colors.HexColor(BRAND_FOOTER))
    canvas.rect(0, 0, page_w, bar_h, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    font = _ensure_unicode_fonts()
    canvas.setFont(font, 8)
    year = datetime.now(timezone.utc).year
    canvas.drawCentredString(page_w / 2, 7, f"© {year} {BRAND_NAME}. All rights reserved.")
    canvas.restoreState()


def _draw_page_canvas(canvas, doc) -> None:
    _draw_watermark(canvas, doc)
    _draw_page_footer(canvas, doc)


def _section_heading(text: str, font_bold: str) -> Paragraph:
    return Paragraph(
        f'<font color="{BRAND_ORANGE}"><b>{text}</b></font>',
        ParagraphStyle("SectionHeading", fontSize=9, leading=12, fontName=font_bold),
    )


def _social_media_row(font: str, link_style: ParagraphStyle) -> Table:
    icon_size = 0.18 * inch
    cells: list[Any] = [Paragraph("<b>Connect with Us</b>", link_style)]
    for icon_file, label, url in SOCIAL_LINKS:
        icon_path = _asset_path(icon_file)
        icon_cell: Any = ""
        if icon_path:
            icon_cell = Image(icon_path, width=icon_size, height=icon_size, kind="proportional")
        link_cell = Paragraph(
            f'<link href="{url}" color="{BRAND_ORANGE}"><u>{label}</u></link>',
            ParagraphStyle(
                f"Social_{label}",
                parent=link_style,
                fontSize=7.5,
                leading=10,
                fontName=font,
            ),
        )
        cells.append(Table(
            [[icon_cell, link_cell]],
            colWidths=[icon_size + 4, 0.75 * inch],
        ))

    social = Table([cells], colWidths=[1.0 * inch, 1.1 * inch, 1.0 * inch, 1.1 * inch])
    social.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return social


def build_subscription_invoice_pdf(
    *,
    invoice_number: str,
    user_name: str,
    user_email: str,
    plan_name: str,
    plan_id: str,
    price_inr: int,
    payment_id: Optional[str],
    payment_date_iso: str,
    upgrade_from_plan: Optional[str] = None,
) -> bytes:
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab is not installed")

    font = _ensure_unicode_fonts()
    font_bold = "InvoiceFont-Bold" if font == "InvoiceFont" else "Helvetica-Bold"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.45 * inch,
    )
    styles = getSampleStyleSheet()
    page_w = A4[0] - doc.leftMargin - doc.rightMargin

    title_right = ParagraphStyle(
        "ReceiptTitle",
        parent=styles["Normal"],
        fontSize=13,
        leading=16,
        fontName=font_bold,
        textColor=colors.HexColor(BRAND_DARK),
        alignment=TA_RIGHT,
    )
    link_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        fontName=font,
        textColor=colors.HexColor("#374151"),
    )
    small = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        fontName=font,
        textColor=colors.HexColor(BRAND_MUTED),
    )
    body = ParagraphStyle(
        "Link",
        parent=small,
        fontSize=8,
        leading=11,
        fontName=font,
        textColor=colors.HexColor(BRAND_DARK),
    )

    try:
        paid_dt = datetime.fromisoformat(payment_date_iso.replace("Z", "+00:00"))
        paid_display = paid_dt.strftime("%d %b %Y, %H:%M UTC")
    except (ValueError, TypeError):
        paid_display = payment_date_iso

    display_name = (user_name or "Customer").strip()
    line_description = _plan_line_description(plan_name, plan_id, display_name)
    amount_str = _format_inr(price_inr)
    thank_you = _thank_you_message(plan_id, upgrade_from_plan)

    story = []

    # ── Header ────────────────────────────────────────────────────────────
    logo_cell: Any
    logo_file = _logo_path()
    if logo_file:
        logo_cell = Image(logo_file, width=3.0 * inch, height=0.78 * inch, kind="proportional")
    else:
        logo_cell = Paragraph(
            f'<font color="{BRAND_ORANGE}"><b>{BRAND_NAME}</b></font><br/>'
            f'<font size="7" color="{BRAND_MUTED}">CODE • LEARN • LAUNCH</font>',
            body,
        )

    header = Table(
        [[logo_cell, Paragraph("PAYMENT RECEIPT / TAX INVOICE", title_right)]],
        colWidths=[page_w * 0.55, page_w * 0.45],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(header)
    story.append(HRFlowable(width=page_w, thickness=2, color=colors.HexColor(BRAND_ORANGE)))
    story.append(Spacer(1, 14))

    # ── Company + invoice details (open two-column, no boxes) ─────────────
    company_block = Paragraph(
        f"<b>{BRAND_NAME}</b><br/>"
        "Empowering Learners. Building Careers.<br/>"
        f"{COMPANY_LOCATION}<br/>"
        f"{SUPPORT_EMAIL}<br/>"
        f'<link href="{SITE_URL}" color="{BRAND_MUTED}">{SITE_URL}</link><br/>'
        "GST: Not Applicable",
        small,
    )
    ref_html = f"<br/>Payment Reference: <b>{payment_id}</b>" if payment_id else ""
    invoice_meta = Paragraph(
        f"Invoice #: <b>{invoice_number}</b><br/>"
        f"Invoice Date: <b>{paid_display}</b><br/>"
        f'Payment Status: <b><font color="{BRAND_GREEN}">PAID</font></b><br/>'
        f"Payment Method: <b>Online Payment</b>"
        f"{ref_html}",
        ParagraphStyle("InvoiceMeta", parent=small, alignment=TA_RIGHT, fontName=font),
    )

    info_row = Table(
        [[company_block, invoice_meta]],
        colWidths=[page_w * 0.52, page_w * 0.48],
    )
    info_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(info_row)
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width=page_w, thickness=0.5, color=colors.HexColor(BRAND_GREY_BORDER)))
    story.append(Spacer(1, 12))

    # ── Bill To (label + text, no box) ──────────────────────────────────────
    story.append(_section_heading("Bill To", font_bold))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"<b>{display_name}</b><br/>{user_email}",
        ParagraphStyle("Bill", parent=body, fontSize=9.5, leading=14, fontName=font),
    ))
    story.append(Spacer(1, 16))

    # ── Line items (single clean table) ─────────────────────────────────────
    unit_para = Paragraph(amount_str, ParagraphStyle(
        "UnitAmt", parent=body, fontSize=9, fontName=font, alignment=TA_RIGHT,
    ))
    total_amt_para = Paragraph(amount_str, ParagraphStyle(
        "LineAmt", parent=body, fontSize=9, fontName=font, alignment=TA_RIGHT,
    ))
    line_table = Table(
        [
            ["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"],
            [line_description, "1", unit_para, total_amt_para],
        ],
        colWidths=[page_w * 0.46, page_w * 0.12, page_w * 0.21, page_w * 0.21],
    )
    line_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(BRAND_ORANGE)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), font_bold),
        ("FONTNAME", (0, 1), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (0, -1), (-1, -1), 0.75, colors.HexColor(BRAND_GREY_BORDER)),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 10))

    # ── Totals (right-aligned, no side box) ─────────────────────────────────
    total_para = Paragraph(
        f'<font color="{BRAND_ORANGE}"><b>{amount_str}</b></font>',
        ParagraphStyle("Total", parent=body, fontSize=11, fontName=font_bold, alignment=TA_RIGHT),
    )
    totals = Table(
        [
            ["", Paragraph("Subtotal", body), Paragraph(amount_str, ParagraphStyle(
                "SubAmt", parent=body, fontName=font, alignment=TA_RIGHT,
            ))],
            ["", Paragraph("<b>Total (Incl. GST)</b>", body), total_para],
        ],
        colWidths=[page_w * 0.46, page_w * 0.24, page_w * 0.30],
    )
    totals.setStyle(TableStyle([
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(totals)
    story.append(Spacer(1, 14))

    # ── Thank you + confirmation (plain text, no boxes) ───────────────────
    story.append(Paragraph(
        f'<font color="{BRAND_ORANGE}">&#10003;</font> {thank_you}',
        ParagraphStyle("Thanks", parent=body, fontSize=9, fontName=font, leading=13),
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        '<b>PAYMENT CONFIRMED</b> — This is a computer generated receipt and does not '
        'require a signature. For help, contact our support team.',
        ParagraphStyle("Confirmed", parent=small, fontSize=8, leading=12, fontName=font,
                         textColor=colors.HexColor(BRAND_GREEN)),
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"<b>Notes:</b> Prices include GST where applicable. "
        f"This receipt is valid for your records. "
        f"Billing queries: {SUPPORT_EMAIL}",
        small,
    ))
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width=page_w, thickness=0.5, color=colors.HexColor(BRAND_GREY_BORDER)))
    story.append(Spacer(1, 10))

    # ── Footer: social + thank you + logo ───────────────────────────────────
    social_row = _social_media_row(font, link_style)
    footer_row = Table(
        [[social_row, Paragraph(
            f'<i>Thank you</i> for being a part of {BRAND_NAME}',
            ParagraphStyle("FooterThanks", parent=small, fontSize=9, fontName=font,
                           alignment=TA_RIGHT, textColor=colors.HexColor(BRAND_MUTED)),
        )]],
        colWidths=[page_w * 0.62, page_w * 0.38],
    )
    footer_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(footer_row)

    logo_file = _logo_path()
    if logo_file:
        story.append(Spacer(1, 12))
        footer_logo = Image(logo_file, width=2.2 * inch, height=0.57 * inch, kind="proportional")
        footer_logo.hAlign = "CENTER"
        story.append(footer_logo)

    doc.build(story, onFirstPage=_draw_page_canvas, onLaterPages=_draw_page_canvas)
    return buf.getvalue()


def invoice_download_filename(user_name: str) -> str:
    """Build a safe attachment name like Sharan_Medamoni_codexcareer.pdf."""
    name = (user_name or "Customer").strip()
    safe = re.sub(r"[^\w\s-]", "", name, flags=re.UNICODE)
    safe = re.sub(r"\s+", "_", safe).strip("_")
    if not safe:
        safe = "Customer"
    return f"{safe[:60]}_codexcareer.pdf"


def upload_invoice_pdf(
    user_id: str,
    subscription_id: str,
    pdf_bytes: bytes,
) -> Tuple[Optional[str], Optional[str]]:
    """Upload PDF to S3. Returns (s3_key, error_message)."""
    if not INVOICE_S3_BUCKET:
        return None, "INVOICE_S3_BUCKET not configured"
    try:
        s3 = _s3_client()
        key = f"{INVOICE_S3_PREFIX.rstrip('/')}/{user_id}/{subscription_id}.pdf"
        s3.put_object(
            Bucket=INVOICE_S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )
        return key, None
    except Exception as exc:
        print(f"upload_invoice_pdf failed: {exc}")
        return None, str(exc)


def get_invoice_presigned_url(
    s3_key: str,
    *,
    download: bool = False,
    download_filename: Optional[str] = None,
) -> Optional[str]:
    if not INVOICE_S3_BUCKET or not s3_key:
        return None
    try:
        s3 = _s3_client()
        params: Dict[str, Any] = {
            "Bucket": INVOICE_S3_BUCKET,
            "Key": s3_key,
        }
        filename = (download_filename or os.path.basename(s3_key)).replace('"', "'")
        disposition = "attachment" if download else "inline"
        params["ResponseContentDisposition"] = f'{disposition}; filename="{filename}"'
        return s3.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=3600,
        )
    except Exception as exc:
        print(f"get_invoice_presigned_url failed: {exc}")
        return None
