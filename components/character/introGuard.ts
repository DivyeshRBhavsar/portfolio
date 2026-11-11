// Plain module (no 'use client') so the server-rendered root layout can import the script.

export const SEEN_KEY = 'luffy-intro-seen';
export const SKIP_STYLE_ID = 'luffy-intro-skip';
export const SKIP_CSS = '.luffy-overlay{display:none!important}';
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Inline at the top of <body> (app/layout.tsx), so it runs during parsing, before the
 * overlay's markup. On a same-session revisit or with reduced motion it hides the
 * intro overlay up front, so the overlay never flashes before React hydrates.
 */
export const OVERLAY_GUARD_SCRIPT = `try{if(sessionStorage.getItem('${SEEN_KEY}')==='1'||matchMedia('${REDUCED_QUERY}').matches){var s=document.createElement('style');s.id='${SKIP_STYLE_ID}';s.textContent='${SKIP_CSS}';document.head.appendChild(s)}}catch(e){}`;

/** Used inside <noscript>: without JS there's no intro, so never show the overlay. */
export const NO_SCRIPT_CSS = SKIP_CSS;
