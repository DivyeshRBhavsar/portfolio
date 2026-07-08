# Divyesh Bhavsar — Portfolio

A dynamic, interactive portfolio site built with plain HTML/CSS/JS (no framework, no build step,
no third-party trackers). It pulls live GitHub stats for each project client-side and falls back
to static summaries if the API is unavailable.

## What's inside

```
portfolio/
├── index.html      # Page structure + a Content-Security-Policy meta tag
├── css/styles.css   # Theming (light/dark), layout, animations
├── js/main.js        # Project/skill data, GitHub API fetch, filters, form handling
└── README.md
```

## Why it's "secure" for a static site

- Strict `Content-Security-Policy`: only same-origin scripts/styles run; only `api.github.com`
  can be called; no inline `<script>` tags anywhere.
- No third-party fonts, analytics, or ad/tracking scripts — the whole page is self-contained.
- All dynamic content (GitHub stats) is inserted with `textContent`, never `innerHTML`, so the
  page can't be XSS'd even if an API response were ever malformed.
- The contact form validates and length-limits input, includes a honeypot field against bots,
  and hands off to the visitor's own email client (`mailto:`) instead of silently POSTing data
  somewhere — there's no backend to leak from because there isn't a backend at all.
- `X-Content-Type-Options: nosniff` and a restrictive `frame-ancestors 'none'` prevent MIME
  sniffing and clickjacking.

## Run it locally

No build step needed.

```bash
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy — GitHub Pages (recommended, free)

1. Create a new repo, e.g. `DivyeshRBhavsar/portfolio` (or `DivyeshRBhavsar.github.io` for a
   root domain site).
2. Push the contents of this `portfolio/` folder to the repo's root:
   ```bash
   cd portfolio
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/DivyeshRBhavsar/portfolio.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
4. Your site goes live at `https://DivyeshRBhavsar.github.io/portfolio/`
   (or `https://DivyeshRBhavsar.github.io/` if you used the `.github.io` repo name).

> Note: GitHub Pages doesn't let you set custom HTTP response headers, so the CSP above is
> delivered via the `<meta>` tag in `index.html`, which still works for `script-src`,
> `style-src`, `connect-src`, etc.

## Deploy — Vercel (custom headers supported)

1. `npm install -g vercel` (or use the Vercel dashboard's "Import Project").
2. From the `portfolio/` folder: `vercel --prod`.
3. Optional: add a `vercel.json` if you'd like the CSP enforced as a real HTTP header (stronger
   than the meta tag, since it also covers non-HTML responses):
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
         ]
       }
     ]
   }
   ```

## Deploy — Netlify

1. Drag-and-drop the `portfolio/` folder into the Netlify dashboard, **or**:
2. `npm install -g netlify-cli` then from `portfolio/`: `netlify deploy --prod`.

## Updating project content

Everything content-related — project descriptions, tech tags, skills — lives in the `PROJECTS`
and `SKILLS` arrays at the top of `js/main.js`. Edit those arrays; no HTML changes needed.

## Notes

- Live GitHub stats (stars, last updated) are fetched unauthenticated from `api.github.com`,
  which has a 60 requests/hour/IP rate limit for anonymous calls. That's more than enough for a
  single visitor loading the page, but if you ever see "Static summary" badges instead of live
  data, it's most likely that limit (or an offline API) — the page still works fine either way.
- The contact form requires the visitor to have a configured email client, since there is
  intentionally no backend to send mail through. If you'd rather have a real inbox-delivered
  form, wire `js/main.js`'s `setupContactForm` to a service like Formspree or a small serverless
  function, and update `connect-src`/`form-action` in the CSP meta tag accordingly.
