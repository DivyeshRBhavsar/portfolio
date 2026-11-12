/* ---------- Files (public/character) ---------- */

export const NEUTRAL_POSE = '/character/neutral-pose.png';
export const LUFFY_HEAD = {
  png: '/character/luffy-head.png',
  webm: '/character/luffy-head.webm',
  webp: '/character/luffy-head.webp', // loops
} as const;

/**
 * Every clip Luffy can play. Lengths are measured from the files (WebM duration header;
 * WebP sum of frame durations); re-measure if a file changes. All WebPs play once.
 * `wide` clips are 625×600 with 125 px extra on the left: shown at 125% width, shifted
 * left by 25%, inside his normal 5:6 box.
 */
export const CLIPS = {
  welcome: { file: 'welcome', ms: { webm: 8292, webp: 8266 } }, // wave + namaste
  welcomeShort: { file: 'welcome-short', ms: { webm: 3500, webp: 3532 } }, // wave only
  talkingShort: { file: 'talking-short', ms: { webm: 3042, webp: 3066 } },
  talking: { file: 'talking', ms: { webm: 7042, webp: 7066 } }, // for longer answers later
  celebrate: { file: 'celebrate', ms: { webm: 4917, webp: 4932 } },
  waiting: { file: 'waiting-watch', ms: { webm: 7042, webp: 7066 } },
  thinking: { file: 'thinking', ms: { webm: 7042, webp: 7066 } },
  pointSide: { file: 'point-side', ms: { webm: 7042, webp: 7066 }, wide: true },
  pointUp: { file: 'point-up', ms: { webm: 7042, webp: 7066 }, wide: true },
} as const satisfies Record<
  string,
  { file: string; ms: { webm: number; webp: number }; wide?: boolean }
>;

export type ClipName = keyof typeof CLIPS;

export function clipSrc(clip: ClipName, format: 'webm' | 'webp'): string {
  return `/character/${CLIPS[clip].file}.${format}`;
}

/** The clip Luffy plays while a message types. Switch to 'talking' for the full 7 s one. */
export const MESSAGE_TALK_CLIP: ClipName = 'talkingShort';

/** If a clip hasn't finished by its length + this, carry on anyway. */
export const SAFETY_MARGIN_MS = 1000;

/* ---------- Loading and welcome ---------- */

/** The loading screen only appears if the welcome isn't ready by then (CSS delay too). */
export const LOADING_SHOW_AFTER_MS = 300;
/** Give up waiting for the welcome clip and go straight to the conversation. */
export const LOADING_GIVE_UP_MS = 8000;
/**
 * Hard limit for the loading screen and spotlight dim layer: after this they remove
 * themselves (CSS animation, plus an inline-script timer that unlocks scrolling), even
 * if React has crashed. Counted from page load, and again from when the welcome starts.
 * Keep it in step with the 10s delays in app/globals.css.
 */
export const STAGE_FAILSAFE_MS = 10000;

/** Lights come up: spotlight widens, stage brightens, header fades in. Matches globals.css. */
export const LIGHTS_UP_S = 1.2;

/* ---------- Conversation ---------- */

/** "• • •" before each message. */
export const TYPING_INDICATOR_MS = 700;
export const TYPE_INTERVAL_MS = 38;
/** Pause between one message finishing and the next one's typing indicator. */
export const MESSAGE_GAP_MS = 350;
/** Messages visible in the bubble (older ones scroll away). */
export const MAX_VISIBLE_MESSAGES = 3;
/** Chance of the weekend line on a Saturday or Sunday. */
export const WEEKEND_LINE_CHANCE = 0.5;

/* ---------- Idle ---------- */

/** Idle loop. The ground shadow shares floatS so it shrinks exactly as he rises. */
export const IDLE = { floatS: 4, breatheS: 3.2, tiltS: 6.5, floatPx: 8, settleS: 0.5 } as const;

/** No interaction for this long → waiting clip + an idle nudge message (first time only)… */
export const IDLE_NUDGE_MS = 10000;
/** …then the waiting clip again after a random gap in this range, while still idle. */
export const IDLE_REPEAT_MS = { min: 12000, max: 15000 } as const;
/** Pause the float and let him ease back to rest before a clip starts. */
export const CLIP_SETTLE_MS = 600;

/* ---------- Look ---------- */

/** Very subtle outline shadow so his peach fur stays crisp against the peach background. */
export const CHARACTER_DROP_SHADOW = 'drop-shadow(0 1px 1.5px rgba(26, 26, 26, 0.28))';

export const MEDIA_CLASS = 'absolute inset-0 h-full w-full object-contain select-none';
/** For `wide` clips (see CLIPS). */
export const WIDE_MEDIA_CLASS =
  'absolute inset-y-0 -left-1/4 h-full w-[125%] max-w-none object-contain select-none';
