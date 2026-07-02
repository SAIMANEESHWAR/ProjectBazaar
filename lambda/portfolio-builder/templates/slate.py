"""Slate — minimal designer portfolio."""

from typing import Any, Dict

from .common import exp_highlights, extract_common_data, skill_names


def generate_slate_html(data: Dict[str, Any]) -> str:
    d = extract_common_data(data)

    skills_html = ""
    for cat, lst in d["skills"].items():
        names = skill_names(lst)
        if names:
            skills_html += f'<p class="skill-line"><em>{cat.title()}</em> — {", ".join(names)}</p>'

    exp_html = ""
    for exp in d["experience"]:
        exp_html += f"""<div class="block">
            <div class="row"><strong>{exp.get('title','')}</strong><span>{exp.get('period','')}</span></div>
            <div class="sub">{exp.get('company','')}</div>
            {exp_highlights(exp)}
        </div>"""

    proj_html = ""
    for proj in d["projects"]:
        proj_html += f"""<div class="block">
            <strong>{proj.get('name','')}</strong>
            <p>{proj.get('description','')}</p>
        </div>"""

    edu_html = ""
    for edu in d["education"]:
        edu_html += f"""<div class="block compact">
            <strong>{edu.get('degree','')}</strong>
            <span>{edu.get('institution','')} · {edu.get('year','')}</span>
        </div>"""

    links = []
    if d["email"]:
        links.append(f'<a href="mailto:{d["email"]}">{d["email"]}</a>')
    if d["github"]:
        links.append(f'<a href="{d["github"]}">GitHub</a>')
    if d["linkedin"]:
        links.append(f'<a href="{d["linkedin"]}">LinkedIn</a>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{d['name']}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:Inter,sans-serif;background:#fafaf9;color:#1c1917;line-height:1.8;font-weight:300}}
.page{{max-width:680px;margin:0 auto;padding:80px 28px}}
h1{{font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:400;letter-spacing:.02em;margin-bottom:4px}}
.subtitle{{font-size:1rem;color:#78716c;margin-bottom:32px}}
.rule{{height:1px;background:#e7e5e4;margin:40px 0}}
.lead{{font-size:1.05rem;color:#44403c;max-width:540px}}
h2{{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;margin-bottom:24px;color:#292524}}
.block{{margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #f5f5f4}}
.block.compact{{padding-bottom:16px;margin-bottom:16px}}
.row{{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px}}
.row span,.sub{{color:#78716c;font-size:.9rem}}
.sub{{margin-bottom:10px}}
.skill-line{{margin-bottom:8px;font-size:.95rem;color:#57534e}}
.skill-line em{{font-style:normal;color:#a8a29e}}
.bullets{{margin:8px 0 0 18px;color:#57534e}} .bullets li{{margin-bottom:4px}}
.contact{{display:flex;flex-direction:column;gap:8px}}
.contact a{{color:#1c1917;border-bottom:1px solid #d6d3d1;width:fit-content}}
.contact a:hover{{border-color:#1c1917}}
</style>
</head>
<body>
<div class="page">
<header>
<h1>{d['name']}</h1>
<p class="subtitle">{d['title']}{f' · {d["location"]}' if d['location'] else ''}</p>
<p class="lead">{d['bio'] or d['about_description']}</p>
</header>
<div class="rule"></div>
{f'<section><h2>Skills</h2>{skills_html}</section><div class="rule"></div>' if skills_html else ''}
{f'<section><h2>Experience</h2>{exp_html}</section><div class="rule"></div>' if exp_html else ''}
{f'<section><h2>Projects</h2>{proj_html}</section><div class="rule"></div>' if proj_html else ''}
{f'<section><h2>Education</h2>{edu_html}</section><div class="rule"></div>' if edu_html else ''}
<section><h2>Contact</h2><div class="contact">{"".join(links)}</div></section>
</div>
</body>
</html>"""
