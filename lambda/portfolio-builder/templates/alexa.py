"""Alexa — responsive creative portfolio (inspired by bedimcode/responsive-portfolio-website-Alexa)."""

from __future__ import annotations

import hashlib
from typing import Any, Dict, List

from .common import exp_highlights, extract_common_data, skill_names

# Reference: https://github.com/bedimcode/responsive-portfolio-website-Alexa
ACCENT = "#6c63ff"
ACCENT_ALT = "#5846cf"


def _skill_pct(name: str, index: int) -> int:
    """Stable pseudo-proficiency for progress bars."""
    digest = hashlib.md5(name.encode()).hexdigest()
    base = 72 + (int(digest[:2], 16) % 24)
    return max(68, min(98, base - index * 2))


def _avatar_url(name: str) -> str:
    safe = name.replace(" ", "+") or "Developer"
    return (
        f"https://ui-avatars.com/api/?name={safe}&size=320"
        f"&background=6c63ff&color=fff&bold=true&format=png"
    )


def _project_image(name: str, index: int) -> str:
    seed = (name or f"project-{index}").replace(" ", "-").lower()
    return f"https://picsum.photos/seed/{seed}/640/420"


def _skill_icon(name: str) -> str:
    key = name.lower()
    icons = {
        "react": "⚛",
        "node": "⬢",
        "python": "🐍",
        "java": "☕",
        "aws": "☁",
        "docker": "🐳",
        "typescript": "TS",
        "javascript": "JS",
        "css": "🎨",
        "html": "⌘",
        "sql": "🗄",
        "git": "⎇",
        "figma": "◆",
    }
    for k, icon in icons.items():
        if k in key:
            return icon
    return "◈"


def _skills_tabs(skills: Dict[str, List]) -> str:
    categories = [(cat, skill_names(lst)) for cat, lst in skills.items() if skill_names(lst)]
    if not categories:
        return ""

    if len(categories) == 1:
        cat, names = categories[0]
        return _skills_panel(cat, names, active=True)

    tabs = ""
    panels = ""
    for i, (cat, names) in enumerate(categories):
        active = i == 0
        tab_id = cat.replace(" ", "-").lower()
        tabs += (
            f'<button type="button" class="skills__tab{" skills__tab--active" if active else ""}" '
            f'data-tab="{tab_id}">{cat.title()}</button>'
        )
        panels += _skills_panel(cat, names, active=active, panel_id=tab_id)

    return f"""<div class="skills__tabs">{tabs}</div><div class="skills__panels">{panels}</div>"""


def _skills_panel(cat: str, names: List[str], active: bool = False, panel_id: str | None = None) -> str:
    pid = panel_id or cat.replace(" ", "-").lower()
    rows = ""
    for i, skill in enumerate(names[:10]):
        pct = _skill_pct(skill, i)
        rows += f"""<article class="skill-row">
            <div class="skill-row__head">
                <span class="skill-row__icon">{_skill_icon(skill)}</span>
                <h4 class="skill-row__name">{skill}</h4>
                <span class="skill-row__pct">{pct}%</span>
            </div>
            <div class="skill-row__track"><span class="skill-row__fill" style="width:{pct}%"></span></div>
        </article>"""
    cls = "skills__panel skills__panel--active" if active else "skills__panel"
    return f'<div class="{cls}" data-panel="{pid}">{rows}</div>'


def generate_alexa_html(data: Dict[str, Any]) -> str:
    d = extract_common_data(data)
    name = d["name"]
    title = d["title"]
    bio = d["bio"] or d["about_description"] or "Passionate professional building meaningful digital experiences."
    avatar = _avatar_url(name)

    exp_count = len(d["experience"])
    proj_count = len(d["projects"])
    skill_count = sum(len(skill_names(v)) for v in d["skills"].values())
    years = max(1, min(15, exp_count * 2 + 1))

    socials = []
    if d["linkedin"]:
        socials.append(f'<a href="{d["linkedin"]}" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>')
    if d["github"]:
        socials.append(f'<a href="{d["github"]}" target="_blank" rel="noopener" aria-label="GitHub">gh</a>')
    if d["twitter"]:
        socials.append(f'<a href="{d["twitter"]}" target="_blank" rel="noopener" aria-label="Twitter">𝕏</a>')
    if d["website"]:
        socials.append(f'<a href="{d["website"]}" target="_blank" rel="noopener" aria-label="Website">↗</a>')
    social_html = "".join(socials) or '<span class="muted">Add links in your profile</span>'

    timeline = ""
    for exp in d["experience"]:
        timeline += f"""<div class="timeline__item">
            <div class="timeline__dot"></div>
            <div class="timeline__body">
                <span class="timeline__date">{exp.get('period','')}</span>
                <h3>{exp.get('title','')}</h3>
                <p class="timeline__sub">{exp.get('company','')}</p>
                {exp_highlights(exp).replace("class='bullets'", "class='timeline__bullets'")}
            </div>
        </div>"""
    for edu in d["education"]:
        timeline += f"""<div class="timeline__item">
            <div class="timeline__dot timeline__dot--edu"></div>
            <div class="timeline__body">
                <span class="timeline__date">{edu.get('year','')}</span>
                <h3>{edu.get('degree','')}</h3>
                <p class="timeline__sub">{edu.get('institution','')}</p>
            </div>
        </div>"""

    projects = ""
    for i, proj in enumerate(d["projects"]):
        img = _project_image(proj.get("name", ""), i)
        link = proj.get("url") or proj.get("github") or "#"
        techs = ", ".join((proj.get("technologies") or [])[:4])
        projects += f"""<article class="work-card">
            <div class="work-card__img">
                <img src="{img}" alt="{proj.get('name','Project')}" loading="lazy"/>
                <div class="work-card__overlay">
                    <a href="{link}" target="_blank" rel="noopener">View project</a>
                </div>
            </div>
            <div class="work-card__body">
                <p class="work-card__tag">{techs or 'Portfolio work'}</p>
                <h3>{proj.get('name','')}</h3>
                <p>{proj.get('description','')}</p>
            </div>
        </article>"""

    skill_tags = []
    for lst in d["skills"].values():
        skill_tags.extend(skill_names(lst))
    chip_html = "".join(f'<span class="chip">{s}</span>' for s in skill_tags[:12])

    contact_lines = []
    if d["email"]:
        contact_lines.append(f'<p><strong>Email</strong><a href="mailto:{d["email"]}">{d["email"]}</a></p>')
    if d["phone"]:
        contact_lines.append(f'<p><strong>Phone</strong><span>{d["phone"]}</span></p>')
    if d["location"]:
        contact_lines.append(f'<p><strong>Location</strong><span>{d["location"]}</span></p>')
    contact_html = "".join(contact_lines) or "<p class='muted'>Add contact details in the editor.</p>"

    skills_section = _skills_tabs(d["skills"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{{
  --accent:{ACCENT};--accent-alt:{ACCENT_ALT};--title:#1f1f2e;--text:#6e6e8a;--bg:#f8f7ff;--card:#fff;
  --shadow:0 12px 40px rgba(108,99,255,.12);--radius:1rem;
}}
*{{box-sizing:border-box;margin:0;padding:0}}
html{{scroll-behavior:smooth}}
body{{font-family:Poppins,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}}
a{{color:var(--accent);text-decoration:none}} a:hover{{color:var(--accent-alt)}}
img{{max-width:100%;display:block}}
.container{{max-width:1040px;margin:0 auto;padding:0 1.25rem}}
.section{{padding:4.5rem 0}}
.section__head{{text-align:center;margin-bottom:2.5rem}}
.section__head h2{{font-size:clamp(1.5rem,3vw,2rem);color:var(--title);margin-bottom:.35rem}}
.section__head p{{font-size:.9rem;color:var(--text)}}
.header{{
  position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(255,255,255,.92);
  backdrop-filter:blur(10px);border-top:1px solid rgba(108,99,255,.12);padding:.65rem 0;
}}
.nav{{display:flex;justify-content:center;gap:1.25rem;flex-wrap:wrap;font-size:.82rem;font-weight:500}}
.nav a{{color:var(--text);padding:.35rem .5rem;border-radius:.5rem}}
.nav a:hover,.nav a.active{{color:var(--accent);background:rgba(108,99,255,.08)}}
.hero{{padding:3rem 0 2rem;min-height:88vh;display:flex;align-items:center}}
.hero__grid{{display:grid;gap:2rem;align-items:center}}
.hero__copy span{{font-size:.95rem;color:var(--text)}}
.hero__copy h1{{font-size:clamp(2rem,5vw,3rem);color:var(--title);margin:.35rem 0 .5rem;line-height:1.15}}
.hero__copy h1 em{{color:var(--accent);font-style:normal}}
.hero__role{{font-size:1.05rem;color:var(--title);margin-bottom:1rem;font-weight:500}}
.hero__social{{display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1.25rem}}
.hero__social a{{
  width:2.25rem;height:2.25rem;border-radius:.65rem;background:var(--card);box-shadow:var(--shadow);
  display:grid;place-items:center;font-size:.75rem;font-weight:700;color:var(--accent);
}}
.hero__cta{{
  display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#fff;
  padding:.75rem 1.35rem;border-radius:.75rem;font-weight:600;box-shadow:var(--shadow);
}}
.hero__cta:hover{{background:var(--accent-alt);color:#fff}}
.hero__visual{{position:relative;display:grid;place-items:center}}
.hero__blob{{
  width:min(320px,78vw);aspect-ratio:1;border-radius:38% 62% 55% 45%/48% 38% 62% 52%;
  background:linear-gradient(135deg,var(--accent),#a29bfe);padding:6px;animation:blob 8s ease-in-out infinite;
}}
.hero__blob img{{width:100%;height:100%;object-fit:cover;border-radius:inherit}}
.hero__orbit{{
  position:absolute;width:56px;height:56px;border-radius:1rem;background:#fff;box-shadow:var(--shadow);
  display:grid;place-items:center;font-size:1.25rem;animation:float 4s ease-in-out infinite;
}}
.hero__orbit--1{{top:8%;right:8%}}
.hero__orbit--2{{bottom:12%;left:4%;animation-delay:1.2s}}
@keyframes blob{{0%,100%{{border-radius:38% 62% 55% 45%/48% 38% 62% 52%}}50%{{border-radius:55% 45% 38% 62%/62% 52% 48% 38%}}}}
@keyframes float{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-8px)}}}}
.about__grid{{display:grid;gap:2rem;align-items:start}}
.about__text{{background:var(--card);padding:1.75rem;border-radius:var(--radius);box-shadow:var(--shadow)}}
.about__text p{{margin-bottom:1rem}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem}}
.stat{{background:linear-gradient(145deg,rgba(108,99,255,.08),rgba(108,99,255,.02));border-radius:.85rem;padding:1rem;text-align:center}}
.stat strong{{display:block;font-size:1.5rem;color:var(--accent)}}
.stat span{{font-size:.75rem;color:var(--text)}}
.chips{{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}}
.chip{{
  font-size:.75rem;padding:.35rem .75rem;border-radius:999px;background:rgba(108,99,255,.1);
  color:var(--accent);font-weight:500;
}}
.skills__wrap{{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:1.75rem}}
.skills__tabs{{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem}}
.skills__tab{{
  border:0;background:rgba(108,99,255,.08);color:var(--text);padding:.5rem 1rem;border-radius:.65rem;
  font:inherit;font-weight:500;cursor:pointer;
}}
.skills__tab--active,.skills__tab:hover{{background:var(--accent);color:#fff}}
.skills__panel{{display:none;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}}
.skills__panel--active{{display:grid}}
.skill-row{{padding:.35rem 0}}
.skill-row__head{{display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem}}
.skill-row__icon{{
  width:1.75rem;height:1.75rem;border-radius:.45rem;background:rgba(108,99,255,.12);
  display:grid;place-items:center;font-size:.75rem;color:var(--accent);font-weight:700;
}}
.skill-row__name{{flex:1;font-size:.9rem;color:var(--title)}}
.skill-row__pct{{font-size:.75rem;color:var(--accent);font-weight:600}}
.skill-row__track{{height:.45rem;background:rgba(108,99,255,.12);border-radius:999px;overflow:hidden}}
.skill-row__fill{{
  display:block;height:100%;border-radius:inherit;
  background:linear-gradient(90deg,var(--accent),#a29bfe);animation:fill 1.2s ease;
}}
@keyframes fill{{from{{width:0!important}}}}
.timeline{{position:relative;padding-left:1.25rem;border-left:2px solid rgba(108,99,255,.2)}}
.timeline__item{{position:relative;padding:0 0 1.75rem 1.25rem}}
.timeline__dot{{
  position:absolute;left:-1.42rem;top:.25rem;width:.85rem;height:.85rem;border-radius:50%;
  background:var(--accent);box-shadow:0 0 0 4px rgba(108,99,255,.15);
}}
.timeline__dot--edu{{background:#a29bfe}}
.timeline__date{{font-size:.75rem;color:var(--accent);font-weight:600}}
.timeline__body h3{{font-size:1rem;color:var(--title);margin:.2rem 0}}
.timeline__sub{{font-size:.85rem;margin-bottom:.35rem}}
.timeline__bullets{{margin-left:1rem;font-size:.85rem}}
.timeline__bullets li{{margin-bottom:.25rem}}
.work-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem}}
.work-card{{background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);transition:transform .25s}}
.work-card:hover{{transform:translateY(-4px)}}
.work-card__img{{position:relative;aspect-ratio:16/10;overflow:hidden}}
.work-card__img img{{width:100%;height:100%;object-fit:cover;transition:transform .35s}}
.work-card:hover .work-card__img img{{transform:scale(1.05)}}
.work-card__overlay{{
  position:absolute;inset:0;background:rgba(31,31,46,.55);display:grid;place-items:center;
  opacity:0;transition:opacity .25s;
}}
.work-card:hover .work-card__overlay{{opacity:1}}
.work-card__overlay a{{
  background:#fff;color:var(--accent);padding:.55rem 1rem;border-radius:.55rem;font-weight:600;font-size:.85rem;
}}
.work-card__body{{padding:1.1rem}}
.work-card__tag{{font-size:.72rem;color:var(--accent);font-weight:600;margin-bottom:.25rem}}
.work-card__body h3{{color:var(--title);font-size:1rem;margin-bottom:.35rem}}
.work-card__body p{{font-size:.85rem}}
.contact__grid{{display:grid;gap:1.5rem}}
.contact__card{{background:var(--card);padding:1.75rem;border-radius:var(--radius);box-shadow:var(--shadow)}}
.contact__card p{{margin-bottom:.75rem;font-size:.9rem}}
.contact__card strong{{display:block;color:var(--title);font-size:.78rem;margin-bottom:.15rem}}
.footer{{text-align:center;padding:1.5rem 0 5.5rem;font-size:.78rem;color:var(--text)}}
.footer a{{font-weight:600}}
.muted{{color:var(--text);font-size:.85rem}}
@media(min-width:768px){{
  .header{{top:0;bottom:auto;border-top:0;border-bottom:1px solid rgba(108,99,255,.12)}}
  .hero{{padding-top:6rem}}
  .hero__grid{{grid-template-columns:1.1fr .9fr}}
  .about__grid{{grid-template-columns:1fr 1fr}}
  .contact__grid{{grid-template-columns:1fr 1fr}}
  .footer{{padding-bottom:2rem}}
}}
</style>
</head>
<body>
<header class="header">
  <nav class="nav container">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#skills">Skills</a>
    <a href="#work">Portfolio</a>
    <a href="#contact">Contact</a>
  </nav>
</header>

<section class="hero" id="home">
  <div class="container hero__grid">
    <div class="hero__copy">
      <span>Hi, I&rsquo;m</span>
      <h1>I&rsquo;m <em>{name}</em></h1>
      <p class="hero__role">{title}{f' · {d["tagline"]}' if d['tagline'] else ''}</p>
      <div class="hero__social">{social_html}</div>
      <a class="hero__cta" href="#contact">Contact me ↓</a>
    </div>
    <div class="hero__visual">
      <div class="hero__blob"><img src="{avatar}" alt="{name}"/></div>
      <div class="hero__orbit hero__orbit--1">⚡</div>
      <div class="hero__orbit hero__orbit--2">✦</div>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="container about__grid">
    <div class="section__head" style="text-align:left;margin:0">
      <h2>About Me</h2>
      <p>Get to know my story</p>
    </div>
    <div class="about__text">
      <p>{bio}</p>
      {f'<div class="chips">{chip_html}</div>' if chip_html else ''}
      <div class="stats">
        <div class="stat"><strong>{years}+</strong><span>Years experience</span></div>
        <div class="stat"><strong>{proj_count}</strong><span>Projects built</span></div>
        <div class="stat"><strong>{skill_count}</strong><span>Core skills</span></div>
      </div>
    </div>
  </div>
</section>

{f'''<section class="section" id="skills">
  <div class="container">
    <div class="section__head"><h2>Skills</h2><p>Technologies I work with</p></div>
    <div class="skills__wrap">{skills_section}</div>
  </div>
</section>''' if skills_section else ''}

{f'''<section class="section" id="qualification">
  <div class="container">
    <div class="section__head"><h2>Qualification</h2><p>Education &amp; experience</p></div>
    <div class="timeline">{timeline}</div>
  </div>
</section>''' if timeline else ''}

{f'''<section class="section" id="work">
  <div class="container">
    <div class="section__head"><h2>Portfolio</h2><p>Recent work &amp; projects</p></div>
    <div class="work-grid">{projects}</div>
  </div>
</section>''' if projects else ''}

<section class="section" id="contact">
  <div class="container">
    <div class="section__head"><h2>Contact Me</h2><p>Let&rsquo;s build something together</p></div>
    <div class="contact__grid">
      <div class="contact__card">{contact_html}</div>
      <div class="contact__card">
        <p><strong>Message</strong></p>
        <p class="muted">Reach out via email to discuss opportunities, collaborations, or freelance work.</p>
        {f'<a class="hero__cta" href="mailto:{d["email"]}">Send email</a>' if d['email'] else ''}
      </div>
    </div>
  </div>
</section>

<footer class="footer container">
  <p>&copy; {name} · Built with <a href="https://github.com/bedimcode/responsive-portfolio-website-Alexa" target="_blank" rel="noopener">Alexa template</a> inspiration</p>
</footer>

<script>
document.querySelectorAll('.skills__tab').forEach(function(btn){{
  btn.addEventListener('click',function(){{
    var tab=btn.getAttribute('data-tab');
    document.querySelectorAll('.skills__tab').forEach(function(b){{b.classList.remove('skills__tab--active');}});
    document.querySelectorAll('.skills__panel').forEach(function(p){{p.classList.remove('skills__panel--active');}});
    btn.classList.add('skills__tab--active');
    var panel=document.querySelector('[data-panel="'+tab+'"]');
    if(panel) panel.classList.add('skills__panel--active');
  }});
}});
var sections=document.querySelectorAll('section[id]');
window.addEventListener('scroll',function(){{
  var y=window.scrollY+120;
  sections.forEach(function(sec){{
    var id=sec.getAttribute('id');
    var link=document.querySelector('.nav a[href="#'+id+'"]');
    if(!link) return;
    if(y>=sec.offsetTop && y<sec.offsetTop+sec.offsetHeight) link.classList.add('active');
    else link.classList.remove('active');
  }});
}});
</script>
</body>
</html>"""
