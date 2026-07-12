"""Momentum — bold creative agency portfolio."""

from typing import Any, Dict

from .common import exp_highlights, extract_common_data, skill_names


def generate_momentum_html(data: Dict[str, Any]) -> str:
    d = extract_common_data(data)

    skills_html = ""
    for cat, lst in d["skills"].items():
        names = skill_names(lst)
        if names:
            pills = "".join(f'<span class="pill">{n}</span>' for n in names)
            skills_html += f'<div class="skill-group"><span class="label">{cat.upper()}</span>{pills}</div>'

    exp_html = ""
    for i, exp in enumerate(d["experience"]):
        offset = "offset" if i % 2 else ""
        exp_html += f"""<div class="card {offset}">
            <span class="badge">{exp.get('period','')}</span>
            <h3>{exp.get('title','')}</h3>
            <p class="co">{exp.get('company','')}</p>
            {exp_highlights(exp)}
        </div>"""

    proj_html = ""
    for proj in d["projects"]:
        proj_html += f"""<div class="proj">
            <h3>{proj.get('name','')}</h3>
            <p>{proj.get('description','')}</p>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{d['name']} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:Inter,sans-serif;background:#fff7ed;color:#1c1917;line-height:1.6;overflow-x:hidden}}
.hero{{min-height:50vh;display:grid;grid-template-columns:1fr 1fr;position:relative}}
.hero-text{{padding:60px 40px;display:flex;flex-direction:column;justify-content:center;z-index:1}}
.hero-accent{{background:linear-gradient(135deg,#f97316,#fb923c);clip-path:polygon(20% 0,100% 0,100% 100%,0 100%)}}
.hero h1{{font-family:'Space Grotesk',sans-serif;font-size:clamp(2.5rem,6vw,4rem);font-weight:700;line-height:1.05;text-transform:uppercase}}
.hero .role{{font-size:1.2rem;color:#ea580c;font-weight:500;margin:12px 0}}
.hero .bio{{max-width:420px;color:#57534e;margin-top:16px}}
main{{max-width:1100px;margin:0 auto;padding:40px 24px 80px}}
h2{{font-family:'Space Grotesk',sans-serif;font-size:2rem;text-transform:uppercase;margin-bottom:32px;position:relative}}
h2::before{{content:'';position:absolute;left:-12px;top:50%;width:4px;height:70%;background:#f97316;transform:translateY(-50%)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}}
.card{{background:#fff;border:3px solid #1c1917;padding:28px;position:relative}}
.card.offset{{transform:translateY(20px)}}
.badge{{display:inline-block;background:#f97316;color:#fff;font-size:.7rem;font-weight:700;padding:4px 10px;margin-bottom:12px;text-transform:uppercase}}
.card h3{{font-family:'Space Grotesk',sans-serif;font-size:1.2rem;margin-bottom:4px}}
.co{{color:#ea580c;font-weight:500;margin-bottom:12px}}
.bullets{{margin-left:18px}} .bullets li{{margin-bottom:6px}}
.skill-group{{margin-bottom:16px}}
.label{{display:block;font-size:.7rem;font-weight:700;letter-spacing:.1em;color:#ea580c;margin-bottom:8px}}
.pills{{display:flex;flex-wrap:wrap;gap:8px}}
.pill{{background:#1c1917;color:#fff;padding:8px 14px;font-size:.85rem;font-weight:500}}
.proj{{border-left:4px solid #f97316;padding-left:20px;margin-bottom:28px}}
.proj h3{{font-family:'Space Grotesk',sans-serif;margin-bottom:8px}}
.contact{{display:flex;gap:20px;flex-wrap:wrap;margin-top:40px}}
.contact a{{background:#1c1917;color:#fff;padding:12px 24px;font-weight:600;text-decoration:none}}
.contact a:hover{{background:#f97316}}
@media(max-width:768px){{.hero{{grid-template-columns:1fr}}.hero-accent{{display:none}}}}
</style>
</head>
<body>
<section class="hero">
<div class="hero-text">
<h1>{d['name']}</h1>
<p class="role">{d['title']}</p>
{f'<p class="tag">{d["tagline"]}</p>' if d['tagline'] else ''}
<p class="bio">{d['bio'] or d['about_description']}</p>
</div>
<div class="hero-accent"></div>
</section>
<main>
{f'<section><h2>Skills</h2>{skills_html}</section>' if skills_html else ''}
{f'<section style="margin-top:56px"><h2>Experience</h2><div class="grid">{exp_html}</div></section>' if exp_html else ''}
{f'<section style="margin-top:56px"><h2>Projects</h2>{proj_html}</section>' if proj_html else ''}
<section style="margin-top:56px"><h2>Contact</h2>
<div class="contact">
{f'<a href="mailto:{d["email"]}">Email</a>' if d['email'] else ''}
{f'<a href="{d["github"]}" target="_blank">GitHub</a>' if d['github'] else ''}
{f'<a href="{d["linkedin"]}" target="_blank">LinkedIn</a>' if d['linkedin'] else ''}
</div></section>
</main>
</body>
</html>"""
