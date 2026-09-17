# Nero & Partners

Production-ready single-page site for Nero & Partners, an independent consultancy, mediation and arbitration practice. The information architecture is organised as anchor sections so the full practice story is accessible from one focused landing page.

## Structure

- `index.html` — visual home page and overview
- `about.html`, `services.html`, `team.html`, `why-us.html`, `insights.html`, `contact.html` — separate practice pages with editable content placeholders
- `assets/js/site.js` — lightweight interaction layer (navigation, menu and scroll reveals)
- `assets/css/site.css`, `assets/css/pages.css` — responsive visual system and multi-page layouts
- `assets/media/` — locally served editorial imagery, including the bespoke consultation hero
- `assets/fonts/` — bundled font assets retained for future brand typography
- `images/` — brand mark and social card
- `404.html`, `403.html`, `500.html`, `503.html` — branded error fallbacks for hosting platforms
- `vercel.json`, `_headers` — deployment headers, cache policy and baseline browser security policy
- `site.webmanifest`, `robots.txt`, `sitemap.xml` — deployment metadata

## Local preview

Serve this directory with any static web server (for example, `python3 -m http.server`) and open the root URL. The router is configured for `/`, so the same output can be deployed directly to a static host.

Before launch, replace the contact placeholders in the site content, connect the enquiry form to the approved secure form endpoint, and set the final canonical domain in `index.html` and `sitemap.xml`.
