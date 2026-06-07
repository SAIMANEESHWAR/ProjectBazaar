"""
Generate branded subscription invoice PDFs for CodeXCareer.

Requires reportlab in the Lambda deployment package (see requirements-resume-pdf.txt).
"""
from __future__ import annotations

import io
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

BRAND_NAME = "CodeXCareer"
BRAND_ORANGE = "#FF6B00"
INVOICE_S3_BUCKET = os.environ.get("INVOICE_S3_BUCKET", os.environ.get("ATS_RESUME_S3_BUCKET", ""))
INVOICE_S3_PREFIX = os.environ.get("INVOICE_S3_PREFIX", "subscription-invoices/")


def is_invoice_pdf_available() -> bool:
    return REPORTLAB_AVAILABLE


def generate_invoice_number() -> str:
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    short = uuid.uuid4().hex[:6].upper()
    return f"CXC-INV-{date_part}-{short}"


def _format_inr(amount: Any) -> str:
    try:
        val = int(float(amount))
    except (TypeError, ValueError):
        val = 0
    return f"₹{val:,}"


def _draw_watermark(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(colors.Color(1, 0.42, 0, alpha=0.08))
    canvas.setFont("Helvetica-Bold", 52)
    canvas.translate(A4[0] / 2, A4[1] / 2)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, BRAND_NAME)
    canvas.restoreState()


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

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor(BRAND_ORANGE),
        spaceAfter=6,
    )
    h2 = ParagraphStyle(
        "InvoiceH2",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#111827"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "InvoiceBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#374151"),
    )
    small = ParagraphStyle(
        "InvoiceSmall",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#6b7280"),
    )

    try:
        paid_dt = datetime.fromisoformat(payment_date_iso.replace("Z", "+00:00"))
        paid_display = paid_dt.strftime("%d %b %Y, %H:%M UTC")
    except (ValueError, TypeError):
        paid_display = payment_date_iso

    story = []
    story.append(Paragraph(BRAND_NAME, title_style))
    story.append(Paragraph("CODE • LEARN • LAUNCH", small))
    story.append(Spacer(1, 12))
    story.append(Paragraph("PAYMENT RECEIPT / TAX INVOICE", h2))
    story.append(Spacer(1, 8))

    meta_rows = [
        ["Invoice #", invoice_number],
        ["Date", paid_display],
        ["Bill to", f"{user_name}<br/>{user_email}"],
    ]
    meta_table = Table(meta_rows, colWidths=[1.4 * inch, 4.6 * inch])
    meta_table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 16))

    line_rows = [
        ["Description", "Qty", "Amount"],
        [f"{plan_name} Plan ({plan_id})", "1", _format_inr(price_inr)],
    ]
    line_table = Table(line_rows, colWidths=[3.8 * inch, 0.6 * inch, 1.6 * inch])
    line_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff7f0")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ffe4cc")),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(line_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>Total paid:</b> {_format_inr(price_inr)}", body))

    if payment_id:
        story.append(Paragraph(f"Payment reference: {payment_id}", body))
    if upgrade_from_plan:
        story.append(
            Paragraph(
                f"Upgraded from {upgrade_from_plan} plan — previous plan replaced immediately.",
                body,
            )
        )

    story.append(Spacer(1, 20))
    story.append(Paragraph("Prices include GST where applicable.", small))
    story.append(Paragraph("support@codexcareer.com · https://codexcareer.com", small))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"© {datetime.now(timezone.utc).year} {BRAND_NAME}. All rights reserved.", small))

    doc.build(story, onFirstPage=_draw_watermark, onLaterPages=_draw_watermark)
    return buf.getvalue()


def upload_invoice_pdf(
    user_id: str,
    subscription_id: str,
    pdf_bytes: bytes,
) -> Tuple[Optional[str], Optional[str]]:
    """Upload PDF to S3. Returns (s3_key, error_message)."""
    if not INVOICE_S3_BUCKET:
        return None, "INVOICE_S3_BUCKET not configured"
    try:
        import boto3

        s3 = boto3.client("s3", region_name=os.environ.get("REGION", "ap-south-2"))
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


def get_invoice_presigned_url(s3_key: str, *, download: bool = False) -> Optional[str]:
    if not INVOICE_S3_BUCKET or not s3_key:
        return None
    try:
        import boto3

        s3 = boto3.client("s3", region_name=os.environ.get("REGION", "ap-south-2"))
        params: Dict[str, Any] = {
            "Bucket": INVOICE_S3_BUCKET,
            "Key": s3_key,
        }
        if download:
            params["ResponseContentDisposition"] = (
                f'attachment; filename="{os.path.basename(s3_key)}"'
            )
        return s3.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=3600,
        )
    except Exception as exc:
        print(f"get_invoice_presigned_url failed: {exc}")
        return None
