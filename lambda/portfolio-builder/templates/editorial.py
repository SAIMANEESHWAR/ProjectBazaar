"""Editorial — bold creative developer portfolio (seyi.dev / folio-v2 inspired)."""

from typing import Any, Dict

from .common import extract_common_data, skill_names


def generate_editorial_html(data: Dict[str, Any]) -> str:
    d = extract_common_data(data)

    # Split the title into stacked words for the oversized hero.
    title_words = (d["title"] or "Developer").upper().split()
    if len(title_words) == 1:
        hero_lines = title_words
    elif len(title_words) == 2:
        hero_lines = title_words
    else:
        mid = len(title_words) // 2
        hero_lines = [" ".join(title_words[:mid]), " ".join(title_words[mid:])]
    hero_html = "".join(f"<span class='line'>{w}</span>" for w in hero_lines)

    # Featured projects, numbered.
    proj_html = ""
    for i, proj in enumerate(d["projects"], start=1):
        techs = ", ".join((proj.get("technologies") or [])[:4])
        link = proj.get("url") or proj.get("github") or ""
        visit = (
            f'<a class="visit" href="{link}" target="_blank" rel="noopener">Visit Site &#8599;</a>'
            if link
            else ""
        )
        proj_html += f"""<article class="project">
            <div class="project-index">({i:02d})</div>
            <div class="project-body">
                <p class="project-cat">{techs or 'Project'}</p>
                <h3 class="project-name">{proj.get('name','Untitled')}</h3>
                <p class="project-desc">{proj.get('description','')}</p>
                {visit}
            </div>
        </article>"""

    # Experience as a recognition/timeline list.
    exp_html = ""
    for exp in d["experience"]:
        bullets = exp.get("highlights") or []
        bl = "".join(f"<li>{b}</li>" for b in bullets[:3])
        exp_html += f"""<div class="rec-row">
            <div class="rec-left"><span class="rec-role">{exp.get('title','')}</span><span class="rec-co">{exp.get('company','')}</span></div>
            <div class="rec-right"><span class="rec-period">{exp.get('period','')}</span>{f'<ul>{bl}</ul>' if bl else ''}</div>
        </div>"""

    # Skills marquee chips.
    all_skills = []
    for lst in d["skills"].values():
        all_skills.extend(skill_names(lst))
    skills_inline = " &nbsp;/&nbsp; ".join(all_skills) if all_skills else ""

    edu_html = ""
    for edu in d["education"]:
        edu_html += f"""<div class="rec-row">
            <div class="rec-left"><span class="rec-role">{edu.get('degree','')}</span><span class="rec-co">{edu.get('institution','')}</span></div>
            <div class="rec-right"><span class="rec-period">{edu.get('year','')}</span></div>
        </div>"""

    socials = []
    if d["github"]:
        socials.append(f'<a href="{d["github"]}" target="_blank" rel="noopener">GitHub</a>')
    if d["linkedin"]:
        socials.append(f'<a href="{d["linkedin"]}" target="_blank" rel="noopener">LinkedIn</a>')
    if d["twitter"]:
        socials.append(f'<a href="{d["twitter"]}" target="_blank" rel="noopener">Twitter</a>')
    if d["website"]:
        socials.append(f'<a href="{d["website"]}" target="_blank" rel="noopener">Website</a>')
    socials_html = "".join(socials)

    marquee_text = "LET&rsquo;S TALK &mdash; LET&rsquo;S COLLABORATE &mdash; SAY HELLO &mdash; "
    marquee_full = marquee_text * 4

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{d['name']} &mdash; {d['title']}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
:root{{--bg:#0c0c0c;--fg:#f5f3ee;--muted:#8a8a85;--accent:#e8ff59;--line:rgba(245,243,238,.12)}}
html{{scroll-behavior:smooth}}
body{{font-family:'Inter',sans-serif;background:var(--bg);color:var(--fg);line-height:1.5;-webkit-font-smoothing:antialiased;overflow-x:hidden}}
.wrap{{max-width:1200px;margin:0 auto;padding:0 24px}}
a{{color:inherit;text-decoration:none}}
/* nav */
.topbar{{display:flex;justify-content:space-between;align-items:center;padding:24px 0;font-size:.85rem;letter-spacing:.02em;border-bottom:1px solid var(--line)}}
.topbar .brand{{font-weight:600}}
.topbar .loc{{color:var(--muted);text-transform:uppercase;font-size:.72rem;letter-spacing:.12em}}
/* hero */
.hero{{padding:9vw 0 6vw}}
.hero .eyebrow{{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.8rem;text-transform:uppercase;letter-spacing:.18em;margin-bottom:28px}}
.hero .eyebrow::before{{content:'';width:36px;height:1px;background:var(--accent)}}
.hero h1{{font-family:'Anton',sans-serif;font-weight:400;line-height:.92;letter-spacing:-.01em;text-transform:uppercase;font-size:clamp(3.2rem,13vw,11rem)}}
.hero h1 .line{{display:block}}
.hero h1 .line:nth-child(2){{color:transparent;-webkit-text-stroke:1.5px var(--fg);text-stroke:1.5px var(--fg)}}
.hero .sub{{margin-top:32px;max-width:560px;font-size:1.15rem;color:#d7d4cc}}
.hero .name-tag{{font-family:'Instrument Serif',serif;font-style:italic;font-size:1.4rem;color:var(--accent);margin-bottom:8px}}
/* marquee */
.marquee{{border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;white-space:nowrap;padding:18px 0;margin:40px 0}}
.marquee .track{{display:inline-block;animation:scroll 28s linear infinite;font-family:'Anton',sans-serif;text-transform:uppercase;font-size:2rem;letter-spacing:.02em}}
.marquee.alt .track{{animation-duration:36s;color:var(--muted)}}
@keyframes scroll{{from{{transform:translateX(0)}}to{{transform:translateX(-50%)}}}}
/* sections */
section{{padding:7vw 0}}
.sec-head{{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:48px;border-bottom:1px solid var(--line);padding-bottom:18px;flex-wrap:wrap}}
.sec-head h2{{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(1.8rem,4vw,3rem);font-weight:400;letter-spacing:-.01em}}
.sec-head .count{{color:var(--accent);font-size:.85rem}}
.lead{{font-size:clamp(1.3rem,2.6vw,2rem);font-family:'Instrument Serif',serif;line-height:1.4;max-width:900px;color:#e9e6df}}
/* projects */
.project{{display:grid;grid-template-columns:90px 1fr;gap:24px;padding:36px 0;border-bottom:1px solid var(--line);transition:.3s}}
.project:hover{{padding-left:14px;background:linear-gradient(90deg,rgba(232,255,89,.05),transparent)}}
.project-index{{color:var(--muted);font-size:.9rem;padding-top:8px}}
.project-cat{{color:var(--accent);text-transform:uppercase;font-size:.72rem;letter-spacing:.14em;margin-bottom:10px}}
.project-name{{font-family:'Anton',sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(1.6rem,4vw,3rem);line-height:1;margin-bottom:14px}}
.project-desc{{color:#c9c6bf;max-width:640px;margin-bottom:16px}}
.visit{{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:100px;padding:8px 18px;font-size:.8rem;transition:.25s}}
.visit:hover{{background:var(--accent);color:#0c0c0c;border-color:var(--accent)}}
/* recognition */
.rec-row{{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 0;border-bottom:1px solid var(--line)}}
.rec-left{{display:flex;flex-direction:column;gap:4px}}
.rec-role{{font-size:1.25rem;font-weight:600}}
.rec-co{{color:var(--accent);font-size:.9rem}}
.rec-period{{color:var(--muted);font-size:.85rem}}
.rec-right ul{{margin:10px 0 0 18px;color:#c9c6bf;font-size:.95rem}}
.rec-right li{{margin-bottom:6px}}
/* skills */
.skill-wrap{{display:flex;flex-wrap:wrap;gap:12px}}
.chip{{border:1px solid var(--line);border-radius:100px;padding:10px 20px;font-size:.95rem;color:#d7d4cc}}
/* contact */
.contact{{padding:10vw 0 7vw}}
.contact .big{{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(2.4rem,9vw,7rem);line-height:.95;letter-spacing:-.01em}}
.contact a.mail{{color:var(--accent);text-decoration:underline;text-underline-offset:8px}}
.contact .row{{display:flex;gap:28px;flex-wrap:wrap;margin-top:40px;font-size:.95rem}}
.contact .row a{{color:#d7d4cc;border-bottom:1px solid transparent;padding-bottom:2px}}
.contact .row a:hover{{border-color:var(--accent);color:var(--fg)}}
footer{{border-top:1px solid var(--line);padding:32px 0;color:var(--muted);font-size:.8rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}}
@media(max-width:640px){{
  .project{{grid-template-columns:1fr;gap:8px}}
  .rec-row{{grid-template-columns:1fr}}
  .hero h1 .line:nth-child(2){{-webkit-text-stroke:1px var(--fg)}}
}}
</style>
</head>
<body>
<div class="wrap">
  <nav class="topbar">
    <span class="brand">{d['name']}</span>
    <span class="loc">{d['location'] or 'Available for work'}</span>
    {f'<a href="mailto:{d["email"]}" style="color:var(--accent)">Contact</a>' if d['email'] else '<span></span>'}
  </nav>

  <header class="hero">
    <div class="eyebrow">Portfolio &mdash; {d['title']}</div>
    <div class="name-tag">{d['name']}</div>
    <h1>{hero_html}</h1>
    <p class="sub">{d['bio'] or d['about_description']}</p>
  </header>
</div>

<div class="marquee"><div class="track">{marquee_full}</div></div>

<div class="wrap">
  {f'''<section id="about">
    <div class="sec-head"><h2>About</h2></div>
    <p class="lead">{d['about_description'] or d['bio']}</p>
  </section>''' if (d['about_description'] or d['bio']) else ''}

  {f'''<section id="work">
    <div class="sec-head"><h2>Featured Work</h2><span class="count">({len(d['projects']):02d})</span></div>
    {proj_html}
  </section>''' if proj_html else ''}

  {f'''<section id="experience">
    <div class="sec-head"><h2>Experience</h2></div>
    {exp_html}
  </section>''' if exp_html else ''}

  {f'''<section id="skills">
    <div class="sec-head"><h2>Capabilities</h2></div>
    <div class="skill-wrap">{"".join(f'<span class="chip">{s}</span>' for s in all_skills)}</div>
  </section>''' if all_skills else ''}

  {f'''<section id="education">
    <div class="sec-head"><h2>Education</h2></div>
    {edu_html}
  </section>''' if edu_html else ''}
</div>

<div class="marquee alt"><div class="track">{marquee_full}</div></div>

<div class="wrap">
  <section class="contact" id="contact">
    <p class="eyebrow" style="color:var(--muted);text-transform:uppercase;letter-spacing:.18em;font-size:.8rem;margin-bottom:24px">Got a project in mind?</p>
    <div class="big">Let&rsquo;s build<br>something{f' &mdash; <a class="mail" href="mailto:{d["email"]}">together</a>' if d['email'] else ' together'}</div>
    <div class="row">{socials_html}</div>
  </section>
</div>

<div class="wrap">
  <footer>
    <span>&copy; {d['name']}</span>
    <span>Built with CodeXCareer Portfolio Builder</span>
  </footer>
</div>
</body>
</html>"""
