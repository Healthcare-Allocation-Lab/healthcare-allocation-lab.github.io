# Parker Healthcare Allocation Lab Website

## Overview
Static website for the Parker Healthcare Allocation (HCA) Lab at the University of Chicago, led by Dr. William F. Parker, MD, PhD. Hosted on GitHub Pages at `https://healthcare-allocation-lab.github.io/`.

## Tech Stack
- **Jekyll** static site generator with Liquid templating
- **Vanilla CSS + JS** — no frameworks, no preprocessors
- **One external API**: PubMed NCBI E-utilities (client-side fetch, no API key needed)
- **Hosting**: GitHub Pages (free, automatic Jekyll build)
- **Fonts**: System font stack (no external font loads)
- **Plugins**: `jekyll-sitemap` (auto-generates sitemap.xml)
- **CMS**: Decap CMS at `/admin/` with GitHub OAuth via Cloudflare Worker
- **OAuth Proxy**: Cloudflare Worker at `https://hca-cms-oauth.wparker.workers.dev`

## File Structure
```
hca_lab_website/
├── _config.yml                 # Jekyll site config (title, url, plugins, excludes)
├── _layouts/
│   ├── default.html            # HTML shell: <head>, nav include, footer include, scripts
│   ├── home.html               # Extends default — for homepage (hero section)
│   ├── page.html               # Extends default — maroon page-header + <main> wrapper
│   └── profile.html            # Extends default — individual team member profile page
├── _includes/
│   ├── nav.html                # Site nav with Liquid active-class logic
│   ├── footer.html             # Site footer (copyright year auto-updated)
│   ├── pubmed_widget.html      # Reusable PubMed widget (used on index + research)
│   ├── member_card.html        # Reusable team member card (links to profile if slug present)
│   └── structured_data.html    # JSON-LD schemas (included only on homepage)
├── _data/
│   ├── team.yml                # Team members by category (staff, collaborators, etc.)
│   └── spotlights.yml          # Research spotlights (reusable across member profiles)
├── _team_members/              # Jekyll collection — one .md per member → auto-generates /team/:slug/
├── index.html                  # Homepage content (layout: home)
├── research.html               # Research page content (layout: page)
├── team.html                   # Team page, loops over _data/team.yml (layout: page)
├── join.md                     # Markdown recruitment page (layout: page)
├── contact.html                # Contact page content (layout: page)
├── assets/
│   ├── css/style.css           # Single stylesheet (~920 lines)
│   └── js/main.js              # Mobile nav, alumni collapse, PubMed widget (~210 lines)
├── images/                     # All images (logos, headshot, diagrams, funder logos)
├── robots.txt                  # Has Jekyll front matter so it gets processed
├── Gemfile                     # Ruby dependencies (jekyll + jekyll-sitemap)
├── admin/
│   ├── index.html              # Decap CMS entry point (loads from CDN)
│   └── config.yml              # CMS config (backend, collections, fields)
├── oauth-proxy/                # Cloudflare Worker for GitHub OAuth (excluded from Jekyll build)
│   ├── src/index.js            # Worker code: /auth, /callback routes
│   ├── wrangler.toml           # Cloudflare deployment config
│   └── README.md               # Setup instructions
├── .gitignore                  # Excludes _site/, .jekyll-cache/, Gemfile.lock, .wrangler/, references/
├── CLAUDE.md                   # This file
└── references/                 # Private working docs — excluded from build via _config.yml
```

## Local Development
```bash
bundle install              # Install dependencies (first time)
bundle exec jekyll serve    # Build + serve at http://localhost:4000
bundle exec jekyll build    # Build to _site/ without serving
```

## Deployment
- **GitHub repo**: `Healthcare-Allocation-Lab/healthcare-allocation-lab.github.io`
- **Branch**: `main` — pushes auto-deploy via GitHub Pages (legacy build)
- **OAuth proxy**: Deployed on Cloudflare Workers (account: `wparker.workers.dev`)
  - Secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) stored as Cloudflare Worker secrets
  - GitHub OAuth App: "Parker HCA Lab CMS" (in org developer settings)
  - Deploy changes: `cd oauth-proxy && wrangler deploy`

## How to Edit Content

### Edit text on a page
- **join.md**: Edit Markdown directly — headings, lists, links
- **Other pages**: Edit HTML in the page file (index.html, research.html, etc.)
- Nav/footer changes: Edit `_includes/nav.html` or `_includes/footer.html` (applies to all pages)

### Add/remove a team member
1. Edit `_data/team.yml`. Each category (staff, collaborators, postdocs, trainees, alumni) is a list. Include a `slug` field to link to a profile page:
```yaml
staff:
  - name: "New Person, MS"
    role: "Data Scientist"
    description: "Optional description."  # omit if not needed
    slug: "new-person"                    # links card to /team/new-person/
    photo: "images/team/new-person.jpg"   # optional — shows circular photo on team card
```
2. Create a matching `_team_members/new-person.md` with front matter (`member_name`, `role`, `slug`, `title`, `description`) and bio as Markdown body. Optional fields: `photo`, `pmids` (list of PubMed IDs), `spotlights` (list of spotlight IDs from `_data/spotlights.yml`).

### Add a new page
1. Create `newpage.html` or `newpage.md` at root
2. Add front matter with `layout: page`, `title`, `description`, `heading`, `subtitle`, `permalink`
3. Add nav link in `_includes/nav.html`
4. Add footer link in `_includes/footer.html`

## UChicago Brand Colors (CSS Variables)
- `--maroon: #800000` — primary brand color
- `--maroon-dark: #600000` — hover states
- `--maroon-light: #a00000` — hover variant
- `--dark-gray: #58595B`
- `--light-gray: #D6D6CE`
- `--off-white: #F7F7F5` — alternating section backgrounds
- `--text: #333333` — body text
- `--text-light: #555555` — secondary text

## Naming Conventions
- **Full name**: "Parker Healthcare Allocation Lab" (titles, footers, structured data)
- **Short name**: "Parker HCA Lab" (nav brand text)
- **PI name**: "Dr. William F. Parker, MD, PhD" or "William F. Parker, MD, PhD" — ALWAYS include middle initial "F.", never write "William Parker" without it
- **External links**: Always use `target="_blank" rel="noopener"`
- **Internal links**: Relative paths only (`index.html`, `research.html`, etc.)

## Key Patterns

### Layouts
- `home.html` extends `default.html` — used only by `index.html` (hero section, no page-header)
- `page.html` extends `default.html` — renders maroon `<header class="page-header">` from `heading` and `subtitle` front matter, then wraps content in `<main><div class="container">`
- `profile.html` extends `default.html` — individual team member profile pages. Shows maroon header (name/role), optional photo + bio, optional PubMed publications (by PMID via JS), optional research spotlights (from `_data/spotlights.yml`), and back-to-team link
- `default.html` — full HTML shell with `<head>` meta tags from front matter, nav include, footer include

### Team member profiles (Jekyll collection)
- `_team_members/*.md` files auto-generate pages at `/team/:slug/`
- Configured in `_config.yml` under `collections: team_members` with `output: true`
- Each member in `_data/team.yml` has a `slug` field matching their collection document filename
- `_includes/member_card.html` renders linked cards (with "View profile" link) when slug is present

### Nav active state
Handled automatically via Liquid in `_includes/nav.html` using `page.url` comparison. Team nav link is active for both `/team.html` and `/team/*` profile pages.

### PubMed Widget
Shared via `{% include pubmed_widget.html %}`. Accepts optional parameters:
- `title` (default: "Publications")
- `style` (inline styles on container)
- `subtitle_style` (inline styles on subtitle)

### Section alternation
Sections alternate `class="section"` (white bg) and `class="section section-alt"` (off-white bg).

### Responsive Breakpoints
- `900px` — multi-column grids collapse to 1 column
- `768px` — hamburger nav activates, hero stacks vertically
- `480px` — reduced font sizes and padding

## SEO
- Every page has front matter for: `title`, `description`, `canonical`, `og_*`, `twitter_*`
- `index.html` sets `structured_data: true` to include JSON-LD (ResearchOrganization, WebSite, Person)
- Sitemap auto-generated by `jekyll-sitemap` plugin
- All URLs preserved with `.html` extensions via `permalink` front matter

## External Accounts
| Resource | URL |
|---|---|
| GitHub Pages | `https://healthcare-allocation-lab.github.io/` |
| GitHub (lab) | `https://github.com/Healthcare-Allocation-Lab` |
| GitHub (CLIF) | `https://github.com/Common-Longitudinal-ICU-data-Format` |
| Google Scholar | `https://scholar.google.com/citations?user=jaBF4DEAAAAJ&hl=en` |
| MyNCBI | `https://www.ncbi.nlm.nih.gov/myncbi/william.parker.3/bibliography/public/` |
| X / Twitter | `https://x.com/WF_Parker` |
| Bluesky | `https://bsky.app/profile/hcalab.bsky.social` |
| OAuth Proxy | `https://hca-cms-oauth.wparker.workers.dev` |
| Cloudflare Dashboard | `https://dash.cloudflare.com` (account: wparker.workers.dev) |
| Decap CMS Admin | `https://healthcare-allocation-lab.github.io/admin/` |
| CLIF site | `https://clif-icu.com/` |
| Lab email | `healthallocate@bsd.uchicago.edu` |
| PI email | `william.parker@bsd.uchicago.edu` |

## Important Notes
- **No favicon** is defined — browser shows blank tab icon
- `lab_logo.png` is 2.2 MB and appears on every page (nav) — candidate for optimization
- `references/` directory contains private working documents — excluded from build via `_config.yml`
- Copyright year in footer is **auto-generated** via `{{ site.time | date: '%Y' }}`
- Sitemap is auto-generated by `jekyll-sitemap` plugin — no manual `sitemap.xml` needed
