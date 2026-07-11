# Analytical Tools Hub Landing Page

Production-ready static landing page for Analytical Tools Hub (ATH).

## Folder Structure

```text
.
├── index.html
├── styles.css
├── script.js
├── Logo.png
└── assets/
    ├── ath-logo-horizontal.png
    ├── ath-logo-stacked.png
    ├── ath-symbol.png
    ├── ath-badge.png
    ├── ath-favicon.png
    └── ath-logo-dark.png
```

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

This is a static site. Deploy the full folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any standard web host.

Before launch, update the canonical and metadata URLs if the production domain differs from:

```text
https://AnalyticalToolsHub.com/
```

## Placeholder Content

- Tool counts in category cards.
- Legal pages linked from the footer.
- Contact and feedback destinations.
- Search results currently link to the featured tools section.
- Newsletter form currently validates locally and needs an email provider integration.
- Individual tool pages are not included in this static landing page.
- SoftwareApplication schema should be added on individual tool pages once those pages exist.
- Methodology standards link currently points to the methodology section.

## Launch Recommendations

- Replace tool count placeholders with real counts.
- Connect global search to the live tools index.
- Create real pages for featured tools, categories, methodology standards, privacy policy, terms, cookie policy, and disclaimer.
- Add visible FAQ content before adding FAQ schema.
- Confirm which tools run fully in-browser before making stronger privacy claims.
- Compress exported logo assets further before production if your hosting pipeline does not optimize images.
- Add analytics only after defining a privacy policy and cookie approach.
