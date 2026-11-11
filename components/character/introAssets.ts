/* ---------- Files (public/character) ---------- */

export const CHARACTER = {
  // Wave and greeting joined into one clip.
  welcome: { webm: '/character/welcome.webm', webp: '/character/welcome.webp' },
  waiting: { webm: '/character/waiting-watch.webm', webp: '/character/waiting-watch.webp' },
  neutral: '/character/neutral-pose.png',
} as const;

/**
 * Clip lengths measured from the files (WebM duration header; WebP sum of frame
 * durations). Both WebPs have loop count 1 (play once). Re-measure if the files change.
 */
export const CLIP_MS = {
  welcome: { webm: 8292, webp: 8266 },
  waiting: { webm: 7042, webp: 7066 },
} as const;

/** If a clip hasn't finished by its length + this, carry on anyway. */
export const SAFETY_MARGIN_MS = 1000;

/* ---------- What Luffy says (edit freely) ---------- */

/** Shown under Luffy on the intro overlay; the three dots are animated separately. */
export const LOADING_LABEL = 'Loading page';

export const MESSAGES = {
  /** Typed after the glide into the hero. */
  first:
    "Hi! I'm Luffy, Divyesh's guide. Up top you'll find his Projects, Blog and Contact. Click around, or let me show you!",
  /** Replaces the first message the first time the waiting clip plays, then stays. */
  second: "Take your time and enjoy the fun! I'll be right here if you need me.",
} as const;

/**
 * Words in MESSAGES.first that briefly highlight a Nav link as they're typed.
 * Keep each `word` spelled exactly as it appears in the message (case-sensitive).
 */
export const NAV_MENTIONS: ReadonlyArray<{ word: string; href: string }> = [
  { word: 'Projects', href: '/projects' },
  { word: 'Blog', href: '/blog' },
  { word: 'Contact', href: '/contact' },
];

/** How long a Nav link stays highlighted after its word finishes typing. */
export const NAV_HIGHLIGHT_HOLD_MS = 700;

export const TYPE_INTERVAL_MS = 38;

/* ---------- Timing ---------- */

/** Glide from the overlay into the hero. */
export const GLIDE = { duration: 0.9, ease: [0.22, 1, 0.36, 1] } as const;
export const OVERLAY_FADE_S = 0.6;

/** Idle loop. The ground shadow shares floatS so it shrinks exactly as he rises. */
export const IDLE = { floatS: 4, breatheS: 3.2, tiltS: 6.5, floatPx: 8, settleS: 0.5 } as const;

/** Waiting clip: first play after this much idle (counted once the first message is typed)… */
export const WAITING_FIRST_DELAY_MS = 10000;
/** …then again after a random gap in this range, while the visitor stays. */
export const WAITING_REPEAT_MS = { min: 12000, max: 15000 } as const;
/** Pause the float and let him ease back to rest before the clip starts. */
export const WAITING_SETTLE_MS = 600;

/* ---------- Look ---------- */

/** Very subtle outline shadow so his peach fur stays crisp against the peach background. */
export const CHARACTER_DROP_SHADOW = 'drop-shadow(0 1px 1.5px rgba(26, 26, 26, 0.28))';

export const MEDIA_CLASS = 'absolute inset-0 h-full w-full object-contain select-none';
