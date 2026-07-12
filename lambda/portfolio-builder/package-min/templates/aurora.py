"""Aurora — dark dev portfolio with gradient accents."""

from typing import Any, Dict

from .common import exp_highlights, extract_common_data, skill_names


def generate_aurora_html(data: Dict[str, Any]) -> str:
    d = extract_common_data(data)

    nav_links = "".join(
        f'<a href="#{s}">{s.title()}</a>'
        for s in ("about", "skills", "experience", "projects", "contact")
    )

    skills_html = ""
    for cat, lst in d["skills"].items():
        names = skill_names(lst)
        if names:
            tags = "".join(f'<span class="tag">{n}</span>' for n in names)
            skills_html += f'<div class="skill-block"><h4>{cat.title()}</h4><div class="tags">{tags}</div></div>'

    exp_html = ""
    for exp in d["experience"]:
        exp_html += f"""<article class="exp-card">
            <div class="exp-head"><h3>{exp.get('title','')}</h3><span class="period">{exp.get('period','')}</span></div>
            <p class="company">{exp.get('company','')}</p>
            {exp_highlights(exp)}
        </article>"""

    proj_html = ""
    for proj in d["projects"]:
        techs = proj.get("technologies") or []
        tech_html = "".join(f'<span class="tech">{t}</span>' for t in techs[:5])
        proj_html += f"""<article class="proj-card">
            <h3>{proj.get('name','')}</h3>
            <p>{proj.get('description','')}</p>
            <div class="techs">{tech_html}</div>
        </article>"""

    edu_html = ""
    for edu in d["education"]:
        edu_html += f"""<div class="edu-row">
            <strong>{edu.get('degree','')}</strong>
            <span>{edu.get('institution','')} · {edu.get('year','')}</span>
        </div>"""

    highlights = "".join(f"<li>{h}</li>" for h in d["highlights"][:5])

    contact = []
    if d["email"]:
        contact.append(f'<a href="mailto:{d["email"]}">Email</a>')
    if d["github"]:
        contact.append(f'<a href="{d["github"]}" target="_blank" rel="noopener">GitHub</a>')
    if d["linkedin"]:
        contact.append(f'<a href="{d["linkedin"]}" target="_blank" rel="noopener">LinkedIn</a>')
    contact_html = "".join(contact)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{d['name']} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:Inter,sans-serif;background:#0a0a12;color:#e2e8f0;line-height:1.65}}
a{{color:#a78bfa;text-decoration:none}} a:hover{{color:#c4b5fd}}
.wrap{{max-width:960px;margin:0 auto;padding:0 24px 80px}}
nav{{display:flex;gap:20px;flex-wrap:wrap;padding:20px 0;font-size:.85rem;border-bottom:1px solid rgba(255,255,255,.06)}}
nav a{{color:#94a3b8}} nav a:hover{{color:#fff}}
.hero{{padding:72px 0 48px}}
.hero h1{{font-size:clamp(2.2rem,5vw,3.2rem);font-weight:700;background:linear-gradient(135deg,#fff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}}
.hero .role{{font-size:1.15rem;color:#8b5cf6;margin-bottom:12px}}
.hero .tagline{{color:#94a3b8;max-width:560px;margin-bottom:20px}}
.hero .bio{{color:#cbd5e1;max-width:640px}}
section{{margin-top:56px}}
section>h2{{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:#64748b;margin-bottom:24px;display:flex;align-items:center;gap:12px}}
section>h2::after{{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(139,92,246,.4),transparent)}}
.skill-block{{margin-bottom:20px}} .skill-block h4{{font-size:.8rem;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em}}
.tags{{display:flex;flex-wrap:wrap;gap:8px}}
.tag{{background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);padding:6px 12px;border-radius:6px;font-size:.85rem}}
.exp-card{{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:24px;margin-bottom:16px}}
.exp-head{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px}}
.exp-head h3{{font-size:1.05rem}} .period{{color:#64748b;font-size:.85rem}}
.company{{color:#8b5cf6;font-size:.9rem;margin-bottom:12px}}
.bullets{{margin-left:18px;color:#cbd5e1}} .bullets li{{margin-bottom:6px}}
.proj-card{{padding:20px 0;border-bottom:1px solid rgba(255,255,255,.06)}}
.proj-card h3{{margin-bottom:8px}} .techs{{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}}
.tech{{font-size:.75rem;color:#06b6d4;background:rgba(6,182,212,.1);padding:4px 10px;border-radius:4px}}
.edu-row{{margin-bottom:12px}} .edu-row span{{display:block;color:#94a3b8;font-size:.9rem}}
.contact{{display:flex;gap:24px;flex-wrap:wrap}}
ul{{list-style:disc}}
</style>
</head>
<body>
<div class="wrap">
<nav>{nav_links}</nav>
<header class="hero" id="about">
<h1>{d['name']}</h1>
<p class="role">{d['title']}</p>
{f'<p class="tagline">{d["tagline"]}</p>' if d['tagline'] else ''}
<p class="bio">{d['bio'] or d['about_description']}</p>
{f'<ul style="margin-top:16px;color:#94a3b8">{highlights}</ul>' if highlights else ''}
</header>
{f'<section id="skills"><h2>Skills</h2>{skills_html}</section>' if skills_html else ''}
{f'<section id="experience"><h2>Experience</h2>{exp_html}</section>' if exp_html else ''}
{f'<section id="projects"><h2>Projects</h2>{proj_html}</section>' if proj_html else ''}
{f'<section id="education"><h2>Education</h2>{edu_html}</section>' if edu_html else ''}
<section id="contact"><h2>Contact</h2><div class="contact">{contact_html}</div></section>
</div>
</body>
</html>"""
