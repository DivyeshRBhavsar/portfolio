/**
 * TEMPORARY: logs each intro step to the browser console as "[luffy] <step>".
 *
 * To silence: set INTRO_DEBUG to false.
 * To remove entirely: delete this file, then delete every `logStep(...)` call and
 * `import { logStep } from './introDebug'` line (search components/character for "logStep").
 *
 * Note: `npm run dev` runs React Strict Mode, so effect-based steps may log twice there.
 */
export const INTRO_DEBUG = true;

export function logStep(step: string, detail?: string): void {
  if (!INTRO_DEBUG) return;
  console.log(`[luffy] ${step}${detail ? ` (${detail})` : ''}`);
}
