import type { Metadata } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import VisitTracker from '@/components/character/VisitTracker';
import { STAGE_SCRIPT } from '@/components/character/introGuard';
import { PROJECTS_VIEW_SCRIPT } from '@/components/projects/viewScript';
import { BLOG_READER_SCRIPT } from '@/components/blog/readerSettings';
import ThemeController from '@/components/theme/ThemeController';
import { THEME_SCRIPT } from '@/components/theme/themes';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

/**
 * The site's address, so link previews get absolute URLs (og:image etc.): NEXT_PUBLIC_SITE_URL
 * if set, else the Vercel production domain (set automatically on Vercel, previews included),
 * else localhost for local builds.
 */
function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL('http://localhost:3000');
}

const SITE_TITLE = 'Divyesh Bhavsar · AI Engineer & Data Scientist';
const SITE_DESCRIPTION =
  'Meet Luffy, my guide. Explore my projects as short stories, ask questions about my work, and see how I can help your team.';

// The link preview image comes from the file convention: app/opengraph-image.png and
// app/twitter-image.png, with their .alt.txt files (not set here, so nothing overrides them).
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme on <html> before React loads.
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        {/* Pre-paint scripts live here only (React never runs a <script> it renders on the
            client). Both run during parsing, before any content paints: the theme first (no
            flash of the wrong colours), then each page's starting state: the home stage
            (and its failsafe timer), the projects page's view, and the blog's reader
            settings (and the /blog filter's hidden-until-ready list). Client-side navigation
            doesn't re-run them; those components set the same attributes before paint. */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          id="luffy-stage-guard"
          dangerouslySetInnerHTML={{ __html: `${STAGE_SCRIPT};${PROJECTS_VIEW_SCRIPT};${BLOG_READER_SCRIPT}` }}
        />
        <ThemeController />
        <VisitTracker />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
