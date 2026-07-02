"""
Shared PDF/DOCX → plain text extraction for ATS scorer and Fix Resume Lambdas.

PDF order: PyPDF2 → pdfminer.six (pure Python; helps when PyMuPDF .so is broken on Lambda)
→ PyMuPDF → optional Textract OCR.

Env (optional):
- ENABLE_TEXTRACT_OCR=1, OCR_MAX_PDF_PAGES (default 3): Textract for scanned PDFs
- MIN_PDF_TEXT_CHARS (default 40): threshold before trying extra extractors / OCR
- SKIP_PYMUPDF_PDF=1: never load PyMuPDF (use when native .so is broken on Lambda)
"""

from __future__ import annotations

import io
import os
import re

# Optional AWS dependency (local dev may not have boto3 installed).
try:
    import boto3  # type: ignore
except Exception:  # pragma: no cover
    boto3 = None  # type: ignore

ENABLE_TEXTRACT_OCR = os.environ.get("ENABLE_TEXTRACT_OCR", "").lower() in ("1", "true", "yes")
try:
    OCR_MAX_PDF_PAGES = max(1, min(10, int(os.environ.get("OCR_MAX_PDF_PAGES", "3"))))
except ValueError:
    OCR_MAX_PDF_PAGES = 3
try:
    MIN_PDF_TEXT_CHARS = max(5, int(os.environ.get("MIN_PDF_TEXT_CHARS", "40")))
except ValueError:
    MIN_PDF_TEXT_CHARS = 40

# Cached after first probe: False when PyMuPDF native libs cannot load (common bad Lambda zips).
_fitz_usable: bool | None = None
_FITZ_PROBE_PDF = (
    b"%PDF-1.1\n"
    b"1 0 obj<<>>endobj\n"
    b"trailer<<>>\n"
    b"%%EOF\n"
)


def _fitz_open_probe() -> bool:
    """Return True only if fitz can load; avoids repeated _extra.so errors on warm Lambdas."""
    global _fitz_usable
    if _fitz_usable is not None:
        return _fitz_usable
    if os.environ.get("SKIP_PYMUPDF_PDF", "").lower() in ("1", "true", "yes"):
        _fitz_usable = False
        return False
    try:
        import fitz  # type: ignore

        d = fitz.open(stream=_FITZ_PROBE_PDF, filetype="pdf")
        d.close()
        _fitz_usable = True
    except Exception:
        _fitz_usable = False
    return _fitz_usable


def _invalidate_fitz() -> None:
    global _fitz_usable
    _fitz_usable = False


def _pypdf_extract(data: bytes) -> str:
    import PyPDF2

    reader = PyPDF2.PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def _pdfminer_extract(data: bytes) -> str:
    """Pure-Python PDF text; works when PyMuPDF native libs are missing on Lambda."""
    try:
        from pdfminer.high_level import extract_text
    except ImportError:
        return ""
    try:
        return (extract_text(io.BytesIO(data)) or "").strip()
    except Exception:
        return ""


def _fitz_text_extract(data: bytes) -> str:
    import fitz

    doc = fitz.open(stream=data, filetype="pdf")
    parts = []
    for i in range(doc.page_count):
        parts.append(doc.load_page(i).get_text("text") or "")
    doc.close()
    return "\n".join(parts).strip()


def _fitz_textract_ocr(data: bytes) -> str:
    import fitz

    if boto3 is None:
        raise RuntimeError("boto3 not installed; Textract OCR is unavailable.")
    textract = boto3.client("textract")
    doc = fitz.open(stream=data, filetype="pdf")
    out = []
    n = min(doc.page_count, OCR_MAX_PDF_PAGES)
    for i in range(n):
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        png = pix.tobytes("png")
        resp = textract.detect_document_text(Document={"Bytes": png})
        lines = [b.get("Text", "") for b in resp.get("Blocks", []) if b.get("BlockType") == "LINE"]
        out.append("\n".join(lines))
    doc.close()
    return "\n".join(out).strip()


def structure_resume_sections(text: str) -> str:
    """Insert clearer breaks before common résumé headings."""
    if not text:
        return text
    pattern = re.compile(
        r"(?m)(^\s*(?:EXPERIENCE|WORK\s+EXPERIENCE|EDUCATION|SKILLS|PROJECTS?|SUMMARY|"
        r"CERTIFICATIONS?|ACHIEVEMENTS?|TECHNICAL\s+SKILLS|PUBLICATIONS?|INTERNSHIP|CERTIFICATES?)\s*:?\s*$)",
        re.I,
    )

    def _break_before(m):
        return "\n\n" + m.group(1).strip() + "\n"

    out = pattern.sub(_break_before, text)
    return re.sub(r"\n{3,}", "\n\n", out).strip()


def _pdf_extraction_deps_missing_hint(notes):
    blob = " ".join(notes)
    if "No module named 'PyPDF2'" in blob or "No module named 'fitz'" in blob:
        return (
            " The bundle is missing PyPDF2 and/or PyMuPDF: install "
            "lambda/ats_resume_scorer_requirements.txt into the deployment zip."
        )
    if "_extra.so" in blob or "cannot open shared object file" in blob:
        return (
            " PyMuPDF native library failed on this host—rebuild the Lambda zip for Linux "
            "(see lambda/build_ats_zip.py). pdfminer.six should still extract many text PDFs after redeploy."
        )
    return ""


def extract_text_from_bytes(data: bytes, filename: str) -> str:
    """Extract plain text from PDF or DOCX; PDF tries PyPDF2 → pdfminer → PyMuPDF → optional Textract OCR."""
    fn = (filename or "resume.pdf").lower()
    if fn.endswith(".pdf"):
        notes = []
        text = ""
        try:
            text = _pypdf_extract(data)
        except Exception as e:
            notes.append(f"PyPDF2:{e}")
            text = ""
        if len(text) < MIN_PDF_TEXT_CHARS:
            t_min = _pdfminer_extract(data)
            if len(t_min) > len(text):
                text = t_min
        if len(text) < MIN_PDF_TEXT_CHARS and _fitz_open_probe():
            try:
                t2 = _fitz_text_extract(data)
                if len(t2) > len(text):
                    text = t2
            except Exception as e:
                notes.append(f"PyMuPDF:{e}")
                _invalidate_fitz()
        if len(text) < MIN_PDF_TEXT_CHARS and ENABLE_TEXTRACT_OCR and _fitz_open_probe():
            try:
                t3 = _fitz_textract_ocr(data)
                if len(t3) > len(text):
                    text = t3
            except Exception as e:
                notes.append(f"Textract:{e}")
                _invalidate_fitz()
        if not text or len(text.strip()) < 5:
            deps_hint = _pdf_extraction_deps_missing_hint(notes)
            textract_hint = ""
            if not deps_hint:
                if not ENABLE_TEXTRACT_OCR:
                    textract_hint = (
                        " Try ENABLE_TEXTRACT_OCR=1 with textract:DetectDocumentText on the Lambda role "
                        "(requires working PyMuPDF on this host for page images)."
                    )
                elif not _fitz_open_probe():
                    textract_hint = (
                        " Textract OCR is enabled but PyMuPDF cannot load on this host, so OCR was skipped. "
                        "Use a text-based PDF/DOCX, fix the PyMuPDF Linux wheel in the deployment zip, or set "
                        "SKIP_PYMUPDF_PDF=1."
                    )
            raise ValueError(
                "Could not extract enough text from PDF (may be scanned)."
                + deps_hint
                + textract_hint
                + (" Details: " + "; ".join(notes) if notes else "")
            )
        return structure_resume_sections(text)
    if fn.endswith(".docx"):
        try:
            import docx
        except ImportError as e:
            raise RuntimeError("python-docx not installed in Lambda layer/package") from e
        document = docx.Document(io.BytesIO(data))
        text = "\n".join(p.text for p in document.paragraphs if p.text).strip()
        if not text:
            raise ValueError("Could not extract text from DOCX")
        return structure_resume_sections(text)
    raise ValueError("Unsupported file type. Use .pdf or .docx")
