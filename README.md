# Divyesh Bhavsar — Portfolio

Next.js 16 (App Router) + TypeScript + Tailwind. Built with four dynamic features:

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

## Luffy's knowledge base (chatbot)

Luffy answers questions from the site's own public content: project stories
(`content/project_stories/`), blog posts (`content/blog/`), the home page life story
(`content/life-story.json`, without the email address or anything still marked TODO) and the Work
with me page (`content/services.json`). That content is split into short chunks, turned into
vectors with `Qwen/Qwen3-Embedding-0.6B` (1024 dimensions) through Hugging Face Inference
Providers, and stored in an Upstash Vector index (dimension 1024, cosine). A keyword index for
hybrid search is saved to `data/luffy-keywords.json`.

Set these in `.env.local` (see `.env.example`): `HF_TOKEN` (a token with the "Make calls to
Inference Providers" permission), `HF_CHAT_MODEL` (optional, default `Qwen/Qwen3.5-9B`),
`UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`, `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`.

```bash
npm run knowledge:build            # gather → chunk → embed → update Upstash → keyword index
npm run knowledge:build -- --dry-run   # gather and chunk only (no Hugging Face or Upstash)
npm run knowledge:search           # try retrieval on a fixed set of questions
npm run knowledge:search -- "Does he build websites?"   # or your own questions
npm run luffy:ask -- "Which projects used CatBoost?"     # ask the local /api/chat (keeps the session)
npm run luffy:ask -- --new --base http://localhost:3123 "Hi!" "…"   # fresh session, other port
```

The answering API is `app/api/chat/route.ts` (logic in `lib/luffy/`). Every limit, cap and threshold
is in `lib/luffy/config.ts`; it also needs `LUFFY_HASH_SALT` (a long random secret for hashing IPs).

**Rerun `npm run knowledge:build` whenever you add or edit a project story, a blog post,
`content/life-story.json` or `content/services.json`**, otherwise Luffy answers from the old
content. It's incremental: unchanged chunks are skipped, changed ones are re-embedded, and chunks
that no longer exist are deleted. It checks that the index dimension matches the model before
writing anything, and never prints tokens. Commit the updated `data/luffy-keywords.json`.

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
