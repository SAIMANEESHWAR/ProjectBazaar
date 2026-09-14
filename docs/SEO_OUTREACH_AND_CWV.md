# CodeXCareer — SEO / AEO outreach & authority checklist

Use this after deploying crawl fixes and pillar pages.

## Week 1–2 (directories & profiles)

- [ ] Google Search Console: add property, verify (DNS or HTML meta), submit `https://codexcareer.com/sitemap.xml`
- [ ] Bing Webmaster Tools: import from GSC or verify; submit sitemap; IndexNow key already at `/b8f4e2c1a9d74f6e8b3c5d7a1e9f0b2d.txt`
- [ ] Product Hunt / BetaList / AlternativeTo: list as “Upwork alternative for students” / “placement prep platform”
- [ ] SaaSHub, Toolify, There’s An AI For That: AI mock interview + ATS resume categories
- [ ] GitHub repo README: clear live product link, comparison badges to `/compare/*`

## Linkable assets to pitch

1. `/guides/ats-resume-format-for-freshers-india`
2. `/guides/campus-placement-30-day-plan`
3. `/compare/codexcareer-vs-upwork` and `/compare/codexcareer-vs-leetcode`
4. `/placement-preparation` pillar

## Outreach angles (5 emails/week)

| Target | Angle |
|--------|--------|
| College placement cells | Free cohort / workshop in exchange for resource page link + case study |
| Campus creators (YouTube/LinkedIn) | Guest tip list: “30-day placement plan” with affiliate-free product mention |
| Career bloggers (India) | Data or checklist guest post; link to ATS fresher guide |
| Open-source / student Discords | Resource list inclusion (brand mention → claim URL) |

## Sample outreach blurb

> We published a free 30-day campus placement plan and ATS resume checklist for engineering freshers (no lead wall). If it’s useful for your students/readers, happy to share a short guest version or a one-pager for your resources page: https://codexcareer.com/guides/campus-placement-30-day-plan

## E-E-A-T next steps

- [ ] Add named author bios when individual contributors publish
- [ ] Add real LinkedIn / X / Instagram `sameAs` URLs in Organization schema (`index.html` + `/about`)
- [ ] Publish one college pilot case study (metrics + quote)
- [ ] Keep `support@codexcareer.com` consistent sitewide (done in footers)

## CWV pass (post-deploy)

- [ ] Run PageSpeed / CrUX on `/`, `/placement-preparation`, `/ats-resume-builder`, `/blog`
- [ ] Confirm LCP image/fonts: homepage now loads 2 font families (was 3)
- [ ] Defer non-critical motion on mobile if TBT remains high
- [ ] Verify `og-image.png` returns `image/png` (not HTML)
- [ ] Verify `/compare/*` and `/blog/*` return static article HTML (not SPA shell)
