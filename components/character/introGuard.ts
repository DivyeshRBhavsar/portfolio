// Plain module (no 'use client') so the server-rendered root layout can import the script.

import { STAGE_FAILSAFE_MS } from './introAssets';
import { HOME_SEEN_KEY } from './visitorMemory';

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * <html data-stage> drives the home stage's CSS (app/globals.css):
 *   welcome → loading screen allowed, spotlight dim, header hidden, scrolling locked
 *   lights  → spotlight widening, header fading in
 *   chat    → normal page
 * <html data-stage-failsafe> → the loading screen and dim layer are gone for good.
 */
export type StageAttr = 'welcome' | 'lights' | 'chat';

declare global {
  interface Window {
    /** Defined by STAGE_SCRIPT; restarts / cancels the failsafe timer. */
    __luffyStage?: { arm: (ms: number) => void; disarm: () => void };
  }
}

/**
 * Inline at the top of <body> (app/layout.tsx), so it runs before the stage's markup.
 * On the home page it picks the stage's starting state, so nothing flashes before React
 * loads. It also owns the failsafe: if the welcome is still holding the page after 10 s
 * (counted from page load, re-armed when the clip starts), it unlocks scrolling and
 * removes the overlays, without needing React.
 */
export const STAGE_SCRIPT = `(function(){var d=document.documentElement,t;function release(){if(d.getAttribute('data-stage')!=='chat')d.setAttribute('data-stage','chat');d.setAttribute('data-stage-failsafe','')}window.__luffyStage={arm:function(ms){clearTimeout(t);d.removeAttribute('data-stage-failsafe');t=setTimeout(release,ms)},disarm:function(){clearTimeout(t)}};if(location.pathname!=='/')return;var m='welcome';try{if(matchMedia('${REDUCED_QUERY}').matches||sessionStorage.getItem('${HOME_SEEN_KEY}')==='1')m='chat'}catch(e){}d.setAttribute('data-stage',m);if(m==='welcome')window.__luffyStage.arm(${STAGE_FAILSAFE_MS})})()`;

export function setStageAttr(stage: StageAttr | null): void {
  const root = document.documentElement;
  if (stage) root.setAttribute('data-stage', stage);
  else root.removeAttribute('data-stage');
}

export function armFailsafe(): void {
  window.__luffyStage?.arm(STAGE_FAILSAFE_MS);
}

export function disarmFailsafe(): void {
  window.__luffyStage?.disarm();
}
