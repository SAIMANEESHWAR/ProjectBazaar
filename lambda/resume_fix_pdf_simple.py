"""
Simple text-only PDF from improved résumé JSON.

Stdlib-only PDF (no fpdf2 / PIL). Survives broken or layered Pillow on Lambda.
"""

from __future__ import annotations

import re
from typing import Any

PAGE_W = 612.0
PAGE_H = 792.0
MARGIN = 51.0  # ~18 mm, similar to previous fpdf margins
MIN_Y = MARGIN
START_Y = PAGE_H - MARGIN
MAX_CHARS = 88  # ~510 pt line at 10 pt Helvetica


def _latin1_safe(s: str) -> str:
    """Standard Type1 text uses PDF literal strings; keep Latin-1."""
    return (s or "").encode("latin-1", errors="replace").decode("latin-1")


def _pdf_escape_literal(s: str) -> str:
    out: list[str] = []
    for c in _latin1_safe(s):
        if c == "\\":
            out.append("\\\\")
        elif c == "(":
            out.append("\\(")
        elif c == ")":
            out.append("\\)")
        elif c == "\r":
            continue
        elif c == "\n":
            out.append(" ")
        else:
            out.append(c)
    return "".join(out)


def _para_chunks(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n+", text) if p.strip()]


def _wrap_text_lines(text: str, max_chars: int) -> list[str]:
    text = " ".join((text or "").split())
    if not text:
        return []
    lines: list[str] = []
    for raw_line in text.split("\n"):
        raw_line = raw_line.strip()
        if not raw_line:
            continue
        words = raw_line.split()
        cur: list[str] = []
        n = 0
        for w in words:
            extra = len(w) + (1 if cur else 0)
            if extra > max_chars and not cur:
                for i in range(0, len(w), max_chars):
                    lines.append(w[i : i + max_chars])
                n = 0
                cur = []
                continue
            if n + extra > max_chars and cur:
                lines.append(" ".join(cur))
                cur = [w]
                n = len(w)
            else:
                cur.append(w)
                n += extra
        if cur:
            lines.append(" ".join(cur))
    return lines


def _assemble_pdf(page_streams: list[str]) -> bytes:
    n = len(page_streams)
    if n < 1:
        return b""
    max_obj = 2 * n + 4
    off = [0] * (max_obj + 1)

    buf = bytearray(b"%PDF-1.4\n")

    def write_obj(i: int, body: bytes) -> None:
        off[i] = len(buf)
        buf.extend(f"{i} 0 obj\n".encode("ascii"))
        buf.extend(body)
        buf.extend(b"\nendobj\n")

    font1_id = 2 * n + 3
    font2_id = 2 * n + 4

    write_obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{3 + 2 * i} 0 R" for i in range(n))
    write_obj(
        2,
        f"<< /Type /Pages /Kids [ {kids} ] /Count {n} >>".encode("ascii"),
    )

    for i in range(n):
        page_id = 3 + 2 * i
        content_id = 4 + 2 * i
        stream_bytes = page_streams[i].encode("latin-1", errors="replace")
        write_obj(
            content_id,
            b"<< /Length "
            + str(len(stream_bytes)).encode("ascii")
            + b" >>\nstream\n"
            + stream_bytes
            + b"\nendstream",
        )
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W:.0f} {PAGE_H:.0f}] "
            f"/Resources << /Font << /F1 {font1_id} 0 R /F2 {font2_id} 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        )
        write_obj(page_id, page_dict.encode("ascii"))

    write_obj(
        font1_id,
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    )
    write_obj(
        font2_id,
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    )

    xref_pos = len(buf)
    buf.extend(f"xref\n0 {max_obj + 1}\n".encode("ascii"))
    buf.extend(b"0000000000 65535 f \n")
    for i in range(1, max_obj + 1):
        buf.extend(f"{off[i]:010d} 00000 n \n".encode("ascii"))
    buf.extend(
        f"trailer << /Size {max_obj + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(buf)


def build_simple_pdf_bytes(data: dict[str, Any]) -> bytes | None:
    """Returns PDF bytes or None on failure."""
    try:
        pages: list[str] = []
        ops: list[str] = []
        y = START_Y

        def new_page() -> None:
            nonlocal y, ops, pages
            if ops:
                pages.append("\n".join(ops))
            ops = []
            y = START_Y

        def draw_line(font: str, size: float, line: str, leading: float) -> None:
            nonlocal y
            if y < MIN_Y + max(14.0, size + 4.0):
                new_page()
            ops.append(
                f"BT /{font} {size:.0f} Tf {MARGIN:.0f} {y:.2f} Td "
                f"({_pdf_escape_literal(line)}) Tj ET"
            )
            y -= leading

        def vspace(pts: float) -> None:
            nonlocal y
            if y - pts < MIN_Y + 14.0:
                new_page()
            else:
                y -= pts

        title = str(data.get("name") or "Resume").strip() or "Resume"
        draw_line("F2", 16.0, title, 22.0)
        vspace(10.0)

        def write_body(text: str) -> None:
            for chunk in _para_chunks(text) if text else []:
                for line in _wrap_text_lines(chunk, MAX_CHARS):
                    draw_line("F1", 10.0, line, 12.0)
                vspace(6.0)

        def write_heading(t: str) -> None:
            vspace(4.0)
            for line in _wrap_text_lines(t, MAX_CHARS):
                draw_line("F2", 11.0, line, 14.0)

        if (data.get("summary") or "").strip():
            write_heading("Summary")
            write_body(str(data["summary"]))

        skills = data.get("skills") or []
        if skills:
            write_heading("Skills")
            write_body(", ".join(str(s) for s in skills if s))

        experience = data.get("experience") or []
        if experience:
            write_heading("Experience")
            for e in experience:
                if not isinstance(e, dict):
                    continue
                t = (e.get("title") or "").strip()
                if t:
                    for line in _wrap_text_lines(t, MAX_CHARS):
                        draw_line("F2", 10.0, line, 12.0)
                d = (e.get("detail") or "").strip()
                if d:
                    write_body(d)
                vspace(4.0)

        projects = data.get("projects") or []
        if projects:
            write_heading("Projects")
            for p in projects:
                if not isinstance(p, dict):
                    continue
                n = (p.get("name") or "").strip()
                if n:
                    for line in _wrap_text_lines(n, MAX_CHARS):
                        draw_line("F2", 10.0, line, 12.0)
                desc = (p.get("description") or "").strip()
                if desc:
                    write_body(desc)
                vspace(4.0)

        edu = (data.get("education") or "").strip()
        if edu:
            write_heading("Education")
            write_body(edu)

        extra = (data.get("extra") or "").strip()
        if extra:
            write_heading("Additional")
            write_body(extra)

        if ops:
            pages.append("\n".join(ops))

        raw = _assemble_pdf(pages)
        if len(raw) > 100:
            return raw
        return None
    except Exception as e:
        print(f"resume_fix_pdf_simple: {e}")
        return None


def build_simple_pdf_from_resume_data(data: dict[str, Any]) -> bytes | None:
    """
    Text-layer PDF from ResumePreview JSON (`resumeData`).
    Uses Helvetica + PDF text operators (Tj) — selectable copy/paste and ATS-friendly.
    Browser “Print → PDF” from HTML is often image-based; this is the server alternative.
    """
    try:
        pages: list[str] = []
        ops: list[str] = []
        y = START_Y

        def new_page() -> None:
            nonlocal y, ops, pages
            if ops:
                pages.append("\n".join(ops))
            ops = []
            y = START_Y

        def draw_line(font: str, size: float, line: str, leading: float) -> None:
            nonlocal y
            if y < MIN_Y + max(14.0, size + 4.0):
                new_page()
            ops.append(
                f"BT /{font} {size:.0f} Tf {MARGIN:.0f} {y:.2f} Td "
                f"({_pdf_escape_literal(line)}) Tj ET"
            )
            y -= leading

        def vspace(pts: float) -> None:
            nonlocal y
            if y - pts < MIN_Y + 14.0:
                new_page()
            else:
                y -= pts

        title = str(data.get("name") or "Resume").strip() or "Resume"
        draw_line("F2", 16.0, title, 22.0)
        vspace(8.0)

        for s in data.get("subtitle") or []:
            st = str(s).strip()
            if st:
                for line in _wrap_text_lines(st, MAX_CHARS):
                    draw_line("F1", 10.0, line, 12.0)
        vspace(6.0)

        for c in data.get("contacts") or []:
            if not isinstance(c, dict):
                continue
            lab = str(c.get("label") or "").strip()
            href = str(c.get("href") or "").strip()
            line = lab or href
            if line:
                for wl in _wrap_text_lines(line, MAX_CHARS):
                    draw_line("F1", 9.0, wl, 11.0)
        vspace(8.0)

        for sec in data.get("sections") or []:
            if not isinstance(sec, dict):
                continue
            stype = str(sec.get("type") or "").strip()
            stitle = str(sec.get("title") or "").strip()
            if stitle:
                vspace(4.0)
                for line in _wrap_text_lines(stitle, MAX_CHARS):
                    draw_line("F2", 11.0, line, 14.0)
            if stype == "table":
                headers = sec.get("headers") if isinstance(sec.get("headers"), list) else []
                rows = sec.get("rows") if isinstance(sec.get("rows"), list) else []
                if headers:
                    hline = " | ".join(str(h) for h in headers)
                    for wl in _wrap_text_lines(hline, MAX_CHARS):
                        draw_line("F2", 9.0, wl, 11.0)
                for row in rows[:40]:
                    if isinstance(row, list):
                        rline = " | ".join(str(x) for x in row)
                        for wl in _wrap_text_lines(rline, MAX_CHARS):
                            draw_line("F1", 9.0, wl, 11.0)
            elif stype == "skills":
                for it in (sec.get("items") or [])[:50]:
                    if not isinstance(it, dict):
                        continue
                    lv = str(it.get("label") or "").strip()
                    val = str(it.get("value") or "").strip()
                    line = f"{lv}: {val}" if lv and val else (val or lv)
                    if line:
                        for wl in _wrap_text_lines(line, MAX_CHARS):
                            draw_line("F1", 9.0, wl, 11.0)
            elif stype == "entries":
                for it in (sec.get("items") or [])[:40]:
                    if not isinstance(it, dict):
                        continue
                    et = str(it.get("title") or "").strip()
                    org = str(it.get("org") or "").strip()
                    head = et + (f" — {org}" if org else "")
                    if head:
                        for wl in _wrap_text_lines(head, MAX_CHARS):
                            draw_line("F2", 10.0, wl, 12.0)
                    for b in (it.get("bullets") or [])[:12]:
                        bs = str(b).strip()
                        if bs:
                            for wl in _wrap_text_lines(f"• {bs}", MAX_CHARS):
                                draw_line("F1", 9.0, wl, 11.0)
                    vspace(4.0)
            elif stype == "list":
                for item in (sec.get("items") or [])[:80]:
                    if isinstance(item, str):
                        for wl in _wrap_text_lines(item.strip(), MAX_CHARS):
                            draw_line("F1", 9.0, wl, 11.0)
                    elif isinstance(item, dict):
                        tx = str(item.get("text") or "").strip()
                        meta = str(item.get("meta") or "").strip()
                        ds = str(item.get("desc") or "").strip()
                        blob = tx
                        if meta:
                            blob += f" ({meta})"
                        if ds:
                            blob += f" — {ds}"
                        if blob:
                            for wl in _wrap_text_lines(blob, MAX_CHARS):
                                draw_line("F1", 9.0, wl, 11.0)
            vspace(6.0)

        if ops:
            pages.append("\n".join(ops))

        raw = _assemble_pdf(pages)
        if len(raw) > 100:
            return raw
        return None
    except Exception as e:
        print(f"build_simple_pdf_from_resume_data: {e}")
        return None
