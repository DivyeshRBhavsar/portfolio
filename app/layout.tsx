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

export const metadata: Metadata = {
  title: 'Divyesh Bhavsar — Data Analyst & AI Resident',
  description:
    'Portfolio of Divyesh Bhavsar: data analytics, machine learning projects, and applied AI work.',
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
