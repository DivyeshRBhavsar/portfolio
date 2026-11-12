import type { Metadata } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { OVERLAY_GUARD_SCRIPT } from '@/components/character/introGuard';
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
        {/* Both run during parsing, before any content paints: the theme first (no flash of
            the wrong colours), then the intro guard (revisits never flash the overlay). */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script id="luffy-intro-guard" dangerouslySetInnerHTML={{ __html: OVERLAY_GUARD_SCRIPT }} />
        <ThemeController />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
