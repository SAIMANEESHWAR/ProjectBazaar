"""PDF/DOCX resume text extraction for portfolio builder."""

from __future__ import annotations

import io
import os
import re
import shutil
import tempfile
import zipfile
import zlib


def extract_text_from_resume(content: bytes, file_type: str, file_name: str) -> str:
    """Extract plain text from resume bytes."""
    try:
        from resume_text_extract import extract_text_from_bytes

        text = extract_text_from_bytes(content, file_name or "resume.pdf")
        if text and not _is_garbage_text(text):
            return _clean_resume_text(text)
    except ImportError:
        pass

    temp_dir = tempfile.mkdtemp()
    path = os.path.join(temp_dir, file_name or "resume.pdf")
    try:
        with open(path, "wb") as f:
            f.write(content)

        lower = (file_name or "").lower()
        if lower.endswith(".pdf") or "pdf" in (file_type or "").lower():
            text = _extract_pdf_smart(content, path)
            return "" if _is_garbage_text(text) else text
        if lower.endswith((".docx", ".doc")):
            return _extract_docx(path)
        return _clean_resume_text(content.decode("utf-8", errors="ignore"))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def _extract_pdf_smart(data: bytes, pdf_path: str) -> str:
    """PyPDF2 → pdfplumber → pdfminer.six → stdlib zlib fallback."""
    best = ""

    try:
        import PyPDF2

        reader = PyPDF2.PdfReader(io.BytesIO(data))
        parts = [page.extract_text() for page in reader.pages if page.extract_text()]
        best = _clean_resume_text("\n\n".join(parts))
        if len(best) >= 50:
            return best
    except Exception as e:
        print(f"PyPDF2: {e}")

    try:
        import pdfplumber

        parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or page.extract_text(x_tolerance=3, y_tolerance=3)
                if t:
                    parts.append(t)
        t = _clean_resume_text("\n\n".join(parts))
        if len(t) > len(best):
            best = t
        if len(best) >= 50:
            return best
    except Exception as e:
        print(f"pdfplumber: {e}")

    try:
        from pdfminer.high_level import extract_text

        t = _clean_resume_text((extract_text(io.BytesIO(data)) or "").strip())
        if len(t) > len(best):
            best = t
        if len(best) >= 50:
            return best
    except Exception as e:
        print(f"pdfminer: {e}")

    basic = _extract_pdf_basic(data)
    if len(basic) > len(best):
        best = basic
    return best


def _extract_pdf_basic(pdf_bytes: bytes) -> str:
    """Stdlib-only PDF text extraction (no PyPDF2 required)."""
    text_parts = []
    stream_pattern = re.compile(rb"stream\r?\n(.*?)\r?\nendstream", re.DOTALL)

    for match in stream_pattern.finditer(pdf_bytes):
        stream_data = match.group(1)
        try:
            decompressed = zlib.decompress(stream_data)
            for encoding in ("utf-8", "latin-1"):
                try:
                    content = decompressed.decode(encoding, errors="ignore")
                    extracted = _extract_text_from_pdf_content(content)
                    if extracted:
                        text_parts.append(extracted)
                    break
                except Exception:
                    continue
        except zlib.error:
            pass
        except Exception:
            continue

    try:
        pdf_content = pdf_bytes.decode("latin-1", errors="ignore")
        extracted = _extract_text_from_pdf_content(pdf_content)
        if extracted and len(extracted) > len(" ".join(text_parts)):
            text_parts = [extracted]
    except Exception:
        pass

    return _clean_resume_text(" ".join(text_parts))


def _extract_text_from_pdf_content(content: str) -> str:
    text_parts = []

    for match in re.finditer(r"\(([^)]*)\)\s*Tj", content, re.DOTALL):
        text = _decode_pdf_string(match.group(1))
        if text.strip():
            text_parts.append(text)

    for match in re.finditer(r"\[(.*?)\]\s*TJ", content, re.DOTALL):
        strings = re.findall(r"\(([^)]*)\)", match.group(1))
        line_parts = [_decode_pdf_string(s) for s in strings if _decode_pdf_string(s)]
        if line_parts:
            text_parts.append("".join(line_parts))

    for match in re.finditer(r"<([0-9A-Fa-f]+)>\s*Tj", content, re.DOTALL):
        try:
            text = bytes.fromhex(match.group(1)).decode("utf-8", errors="ignore")
            if text.strip():
                text_parts.append(text)
        except Exception:
            pass

    for match in re.finditer(r"BT\s*(.*?)\s*ET", content, re.DOTALL):
        strings = re.findall(r"\(([^)]+)\)", match.group(1))
        block_text = [_decode_pdf_string(s) for s in strings if _decode_pdf_string(s)]
        if block_text:
            text_parts.append(" ".join(block_text))

    result = " ".join(text_parts)
    return re.sub(r"([.!?])\s+([A-Z])", r"\1\n\2", result)


def _decode_pdf_string(s: str) -> str:
    s = s.replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t")
    s = s.replace("\\(", "(").replace("\\)", ")").replace("\\\\", "\\")

    def octal_replace(match):
        try:
            return chr(int(match.group(1), 8))
        except Exception:
            return match.group(0)

    s = re.sub(r"\\([0-7]{1,3})", octal_replace, s)
    return "".join(c for c in s if c.isprintable() or c in "\n\t")


def _extract_docx(path: str) -> str:
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        text = re.sub("<[^<]+?>", " ", xml)
        return _clean_resume_text(re.sub(r"\s+", " ", text))
    except Exception as e:
        print(f"DOCX error: {e}")
        return ""


def _clean_resume_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\(cid:\d+\)", "", text)
    text = re.sub(r"cid:\d+", "", text)
    text = text.replace("\ufffd", " ")
    text = re.sub("[\uf000-\uf0ff]", "", text)
    text = re.sub("[\ue000-\uf8ff]", "", text)
    for bullet in ("•", "●", "○", "▪", "▫", "►", "▸", "◆", "■", "→", "»"):
        text = text.replace(bullet, "-")
    text = re.sub(r"(\w+)\s*@\s*(\w+)\s*\.\s*(\w+)", r"\1@\2.\3", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    return "\n".join(lines).strip()


def _is_garbage_text(text: str) -> bool:
    if not text or len(text) < 50:
        return True
    cid_count = len(re.findall(r"\(cid:\d+\)", text)) + len(re.findall(r"cid:\d+", text))
    if cid_count > 10:
        return True
    printable = sum(1 for c in text if c.isalnum() or c.isspace())
    return printable / max(len(text), 1) < 0.5
