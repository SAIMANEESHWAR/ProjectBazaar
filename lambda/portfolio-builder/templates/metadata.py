"""Portfolio template metadata and HTML dispatch."""

from typing import Any, Dict, List

from .aurora import generate_aurora_html
from .editorial import generate_editorial_html
from .momentum import generate_momentum_html
from .slate import generate_slate_html

TEMPLATE_IDS = ("editorial", "aurora", "slate", "momentum")

TEMPLATE_GENERATORS = {
    "editorial": generate_editorial_html,
    "aurora": generate_aurora_html,
    "slate": generate_slate_html,
    "momentum": generate_momentum_html,
}

TEMPLATES = {
    "editorial": {
        "id": "editorial",
        "name": "Editorial",
        "description": "Bold oversized typography with marquee and featured work, award-style portfolio",
        "accentColor": "#e8ff59",
        "previewColor": "#0c0c0c",
        "thumbnail": "🅴",
        "inspiration": "Award-winning creative dev portfolios",
    },
    "aurora": {
        "id": "aurora",
        "name": "Aurora",
        "description": "Dark dev portfolio with gradient accents and section navigation",
        "accentColor": "#8b5cf6",
        "previewColor": "#0f0f1a",
        "thumbnail": "🌌",
        "inspiration": "Modern developer portfolios",
    },
    "slate": {
        "id": "slate",
        "name": "Slate",
        "description": "Minimal whitespace design with refined serif typography",
        "accentColor": "#1e293b",
        "previewColor": "#fafaf9",
        "thumbnail": "📐",
        "inspiration": "Designer minimalist portfolios",
    },
    "momentum": {
        "id": "momentum",
        "name": "Momentum",
        "description": "Bold creative layout with asymmetric blocks and vibrant accents",
        "accentColor": "#f97316",
        "previewColor": "#fff7ed",
        "thumbnail": "⚡",
        "inspiration": "Creative agency portfolios",
    },
}

PREVIEW_HTML = {
    "editorial": """<div style="background:#0c0c0c;height:100%;padding:12px;font-family:'Arial Narrow',sans-serif;color:#f5f3ee;border-radius:8px;overflow:hidden"><div style="font-size:7px;color:#8a8a85;letter-spacing:.1em;margin-bottom:4px">PORTFOLIO — DEVELOPER</div><div style="font-family:Impact,sans-serif;font-size:22px;line-height:.85;text-transform:uppercase;font-weight:400">FRONT<br><span style="color:transparent;-webkit-text-stroke:1px #f5f3ee">END</span></div><div style="margin-top:8px;height:1px;background:rgba(245,243,238,.15)"></div><div style="margin-top:6px;font-size:6px;color:#e8ff59;letter-spacing:.1em">LET'S TALK — LET'S COLLABORATE —</div></div>""",
    "aurora": """<div style="background:linear-gradient(135deg,#0f0f1a,#1a1035);height:100%;padding:12px;font-family:Inter,sans-serif;color:#e2e8f0;border-radius:8px"><div style="height:4px;width:40px;background:linear-gradient(90deg,#8b5cf6,#06b6d4);border-radius:2px;margin-bottom:8px"></div><div style="font-size:11px;font-weight:700">Alex Dev</div><div style="font-size:8px;color:#94a3b8;margin:2px 0 8px">Full Stack Engineer</div><div style="display:flex;gap:4px"><span style="font-size:7px;padding:2px 6px;background:rgba(139,92,246,.2);border-radius:4px">React</span><span style="font-size:7px;padding:2px 6px;background:rgba(6,182,212,.2);border-radius:4px">Node</span></div></div>""",
    "slate": """<div style="background:#fafaf9;height:100%;padding:14px;font-family:Georgia,serif;color:#1c1917;border-radius:8px;border:1px solid #e7e5e4"><div style="font-size:12px;font-weight:400;letter-spacing:.05em">JANE DOE</div><div style="font-size:8px;color:#78716c;margin:4px 0 10px">Product Designer</div><div style="height:1px;background:#e7e5e4;margin-bottom:8px"></div><div style="font-size:7px;color:#57534e;line-height:1.5">Crafting thoughtful digital experiences.</div></div>""",
    "momentum": """<div style="background:#fff7ed;height:100%;padding:10px;font-family:system-ui,sans-serif;border-radius:8px;position:relative;overflow:hidden"><div style="position:absolute;top:0;right:0;width:40%;height:100%;background:#f97316;opacity:.15"></div><div style="font-size:13px;font-weight:900;color:#1c1917;transform:rotate(-1deg)">CREATIVE</div><div style="font-size:9px;font-weight:600;color:#ea580c;margin-top:4px">Portfolio 2025</div><div style="margin-top:10px;width:60%;height:3px;background:#f97316"></div></div>""",
}


def get_template_list() -> List[Dict[str, Any]]:
    out = []
    for tid in TEMPLATE_IDS:
        meta = dict(TEMPLATES[tid])
        meta["previewHtml"] = PREVIEW_HTML.get(tid, "")
        out.append(meta)
    return out


def generate_portfolio_html(data: Dict[str, Any], template_id: str = "aurora") -> str:
    gen = TEMPLATE_GENERATORS.get(template_id, generate_aurora_html)
    return gen(data)
