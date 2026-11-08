export const CHARACTER = {
  hello: { webm: '/character/hello-wave.webm', webp: '/character/hello-wave.webp' },
  namaste: { webm: '/character/namaste.webm', webp: '/character/namaste.webp' },
  neutral: '/character/neutral-pose.png',
} as const;

/**
 * Animated WebP fires no "ended" event, so the Safari sequence is timed.
 * Measured from the files in public/character (sum of ANMF frame durations):
 * 121 frames at ~24 fps each. Re-measure if the files are replaced.
 */
export const WEBP_DURATION_MS = { hello: 5041, namaste: 5041 } as const;

/**
 * Swap this long before a WebP clip's measured end. The current files loop forever,
 * so swapping a little early stops frame 0 of the next loop from flashing.
 */
export const WEBP_SWAP_LEAD_MS = 60;

/** If the sequence hasn't finished by now (slow network, stalled decode), show the still. */
export const SEQUENCE_TIMEOUT_MS = 16000;

export const GREETING = "Namaste! I'm Luffy, Divyesh's guide. Let me show you around!";

export const MEDIA_CLASS = 'absolute inset-0 h-full w-full object-contain select-none';
