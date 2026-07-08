# Divyesh Bhavsar — Portfolio

Next.js 14 (App Router) + TypeScript + Tailwind. Built with four dynamic features:

1. **Live GitHub project gallery** — `/projects` fetches your repos directly from the GitHub API
   at build/request time (`lib/github.ts`), so new repos show up automatically. Filterable by
   language.
2. **Working contact form** — `/contact` posts to a serverless API route (`app/api/contact/route.ts`)
   that emails you via [Resend](https://resend.com).
3. **Blog / markdown section** — `/blog` reads `.mdx` files from `content/blog/`. Add a new file
   there to publish a new post, no code changes needed.
4. **Animated terminal hero** on the homepage — a signature touch tying the visual identity back
   to your SQL/data background.

## Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Set up the contact form (2 minutes)

The form works end-to-end once you add a free Resend API key:

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day, 3,000/month).
2. Copy your API key from the dashboard.
3. Copy `.env.example` to `.env.local` and paste your key:
   ```
   RESEND_API_KEY=re_your_key_here
   ```
4. Restart `npm run dev`. Test the form — the email arrives at the address set in
   `app/api/contact/route.ts` (`TO_EMAIL`).

Until you add a key, the form will show a friendly "not configured yet" error instead of failing
silently — that's expected, not a bug.

## Add a blog post

Create a new file in `content/blog/your-post-slug.mdx`:

```mdx
---
title: "Your Post Title"
date: "2026-07-08"
summary: "One sentence shown on the blog index."
tags: ["tag-one", "tag-two"]
---

Your content here, in Markdown.
```

It'll appear on `/blog` automatically, newest first.

## Customize the project gallery

`lib/github.ts` pulls every public, non-forked repo from your GitHub account. Two things you can
tune:

- `FEATURED_ORDER` — list repo names here to pin them to the top, ahead of most-recently-updated
  sorting.
- If you want richer descriptions than what's in your repo's GitHub metadata, edit the repo's
  "About" description on GitHub directly — it flows straight through, no rebuild needed beyond the
  hourly cache.

## Deploy for free (Vercel)

1. Push this project to a new GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import that repo.
3. Add the `RESEND_API_KEY` environment variable in the Vercel project settings (same value as
   your `.env.local`).
4. Deploy. Vercel gives you a free `yourproject.vercel.app` URL, and you can attach a custom domain
   later if you buy one.

Every push to your main branch auto-redeploys.

## Where things live

```
app/
  page.tsx              → homepage
  projects/page.tsx      → live GitHub project gallery
  blog/page.tsx           → blog index
  blog/[slug]/page.tsx    → individual post
  contact/page.tsx        → contact page
  api/contact/route.ts    → serverless email endpoint
components/               → Nav, Footer, ProjectGallery, ContactForm, TerminalHero
content/blog/              → your .mdx posts
lib/                       → github.ts (repo fetching), posts.ts (blog file reading)
```
