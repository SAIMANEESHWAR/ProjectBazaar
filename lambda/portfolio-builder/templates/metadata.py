"""Portfolio template metadata and HTML dispatch."""

from typing import Any, Dict, List

from .alexa import generate_alexa_html
from .editorial import generate_editorial_html

TEMPLATE_IDS = ("editorial", "alexa")

TEMPLATE_GENERATORS = {
    "editorial": generate_editorial_html,
    "alexa": generate_alexa_html,
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
    "alexa": {
        "id": "alexa",
        "name": "Alexa",
        "description": "Responsive creative portfolio with skill bars, project imagery, and purple accents",
        "accentColor": "#6c63ff",
        "previewColor": "#f8f7ff",
        "thumbnail": "💜",
        "inspiration": "bedimcode/responsive-portfolio-website-Alexa",
    },
}

PREVIEW_HTML = {
    "editorial": """<div style="background:#0c0c0c;height:100%;padding:12px;font-family:'Arial Narrow',sans-serif;color:#f5f3ee;border-radius:8px;overflow:hidden"><div style="font-size:7px;color:#8a8a85;letter-spacing:.1em;margin-bottom:4px">PORTFOLIO — DEVELOPER</div><div style="font-family:Impact,sans-serif;font-size:22px;line-height:.85;text-transform:uppercase;font-weight:400">FRONT<br><span style="color:transparent;-webkit-text-stroke:1px #f5f3ee">END</span></div><div style="margin-top:8px;height:1px;background:rgba(245,243,238,.15)"></div><div style="margin-top:6px;font-size:6px;color:#e8ff59;letter-spacing:.1em">LET'S TALK — LET'S COLLABORATE —</div></div>""",
    "alexa": """<div style="background:#f8f7ff;height:100%;padding:10px;font-family:Poppins,sans-serif;border-radius:8px;overflow:hidden;position:relative"><div style="position:absolute;top:0;right:0;width:45%;height:100%;background:linear-gradient(135deg,#6c63ff22,#a29bfe11)"></div><div style="font-size:7px;color:#6e6e8a">Hi, I'm</div><div style="font-size:11px;font-weight:700;color:#1f1f2e;margin:2px 0 6px">Alexa <span style="color:#6c63ff">Dev</span></div><div style="font-size:7px;color:#6e6e8a;margin-bottom:8px">Full Stack Developer</div><div style="width:70%;height:4px;background:#6c63ff22;border-radius:99px;margin-bottom:4px"><div style="width:88%;height:100%;background:#6c63ff;border-radius:99px"></div></div><div style="width:55%;height:4px;background:#6c63ff22;border-radius:99px"><div style="width:76%;height:100%;background:#6c63ff;border-radius:99px"></div></div><div style="margin-top:8px;display:flex;gap:3px"><span style="font-size:6px;padding:2px 5px;background:#6c63ff18;color:#6c63ff;border-radius:99px">React</span><span style="font-size:6px;padding:2px 5px;background:#6c63ff18;color:#6c63ff;border-radius:99px">Node</span></div></div>""",
}


def get_template_list() -> List[Dict[str, Any]]:
    out = []
    for tid in TEMPLATE_IDS:
        meta = dict(TEMPLATES[tid])
        meta["previewHtml"] = PREVIEW_HTML.get(tid, "")
        out.append(meta)
    return out


def generate_portfolio_html(data: Dict[str, Any], template_id: str = "editorial") -> str:
    gen = TEMPLATE_GENERATORS.get(template_id, generate_editorial_html)
    return gen(data)
