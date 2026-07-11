# Analytical Tools Hub Landing Page

Production-ready static landing page and working tool pages for Analytical Tools Hub (ATH).

## Folder Structure

```text
.
|-- index.html
|-- styles.css
|-- script.js
|-- tool-theme.css
|-- robots.txt
|-- sitemap.xml
|-- assets/
|   |-- ath-logo-horizontal.png
|   |-- ath-logo-stacked.png
|   |-- ath-symbol.png
|   |-- ath-badge.png
|   |-- ath-favicon.png
|   `-- ath-logo-dark.png
|-- ABC Analysis/
|-- Exponential Smoothing/
|-- Kraljic Matrix/
`-- Gantt Chart/
```

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

This is a static site. Deploy the full folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any standard web host.

Before launch, update the canonical, sitemap, and metadata URLs if the production domain differs from:

```text
https://AnalyticalToolsHub.com/
```

## Placeholder Content

- Legal content is currently shown in an on-page overlay.
- Contact, feedback, and update interest currently use `mailto:analyticaltoolshub@gmail.com`.
- Some featured tools are labelled as coming soon until their working pages exist.

## URL Strategy

The current static files use the existing local folder paths. For production, prefer clean routes such as:

- `/abc-analysis/`
- `/exponential-smoothing/`
- `/kraljic-matrix/`
- `/gantt-chart/`

Add redirects from the current file paths before changing canonical URLs and sitemap entries.

## Launch Recommendations

- Create real pages for featured tools, categories, methodology standards, privacy policy, terms, cookie policy, and disclaimer.
- Replace mailto-based update interest with a proper email service when the project is ready.
- Add visible FAQ content before adding FAQ schema.
- Confirm which tools run fully in-browser before making stronger privacy claims.
- Compress exported logo assets further before production if your hosting pipeline does not optimize images.
- Add analytics only after defining a privacy policy and cookie approach.
