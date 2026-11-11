'use client';

/* eslint-disable @next/next/no-img-element -- no-JS fallback only. */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import CharacterFigure from './CharacterFigure';
import IdleCharacter from './IdleCharacter';
import IntroClip from './IntroClip';
import LoadingLabel from './LoadingLabel';
import SpeechBubble, { type BubbleState, type MessageKey } from './SpeechBubble';
import WaitingClip from './WaitingClip';
import { CHARACTER, GLIDE, MEDIA_CLASS, MESSAGES, OVERLAY_FADE_S } from './introAssets';
import { logStep } from './introDebug';
import { NO_SCRIPT_CSS } from './introGuard';
import { useIntroSetup, type IntroSetup } from './useIntroSetup';
import { useWaitingClip } from './useWaitingClip';

type Stage =
  | { phase: 'playing' }
  | { phase: 'gliding' }
  | { phase: 'idle'; typing: boolean; glided: boolean; skipped: boolean };

const LAYOUT_ID = 'luffy';
/** If the glide's completion callback never fires (e.g. tab hidden), settle anyway. */
const GLIDE_FALLBACK_MS = GLIDE.duration * 1000 + 600;

/** Same box in the overlay's two layers, so Luffy and the label line up exactly. */
const OVERLAY_FIGURE = 'w-[min(78vw,420px,calc((100svh_-_9rem)/1.2))]';
const OVERLAY_COLUMN = 'fixed inset-0 flex flex-col items-center justify-center gap-6 px-6';

function initialStage(setup: IntroSetup): Stage {
  if (setup.reducedMotion || setup.seenThisSession) {
    return { phase: 'idle', typing: false, glided: false, skipped: false };
  }
  return { phase: 'playing' };
}

/**
 * Luffy's spot in the homepage hero, plus the full-screen intro overlay.
 * First visit per session: overlay + welcome clip → overlay fades while he glides and
 * shrinks into the hero (shared layoutId) → idle + typed first message → every so often
 * the waiting clip, which also swaps in the second message the first time.
 * Skip, same-session revisits and reduced motion land directly on the end state.
 */
export default function WelcomeIntro() {
  const setup = useIntroSetup();
  const [override, setOverride] = useState<Stage | null>(null);
  const [firstMessageDone, setFirstMessageDone] = useState(false);
  const [message, setMessage] = useState<MessageKey>('first');

  const stage: Stage | null = override ?? (setup ? initialStage(setup) : null);
  const phase = stage?.phase ?? 'pending';
  const reducedMotion = setup?.reducedMotion ?? false;
  const idle = stage?.phase === 'idle';

  // Stable so IntroClip's effects don't restart. Ignored if Skip already ran.
  const handleClipDone = useCallback(() => {
    setOverride((current) => current ?? { phase: 'gliding' });
  }, []);

  const handleGlideDone = useCallback(() => {
    setOverride((current) =>
      current?.phase === 'gliding'
        ? { phase: 'idle', typing: true, glided: true, skipped: false }
        : current
    );
  }, []);

  const handleSkip = () => {
    logStep('skipped');
    setOverride({ phase: 'idle', typing: false, glided: false, skipped: true });
  };

  const handleFirstMessageDone = useCallback(() => setFirstMessageDone(true), []);
  const handleFirstWait = useCallback(() => setMessage('second'), []);

  const waiting = useWaitingClip({
    enabled: idle && firstMessageDone && !reducedMotion,
    format: setup?.format ?? 'webm',
    onFirstPlay: handleFirstWait,
  });

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    if (phase === 'gliding' || phase === 'idle') logStep(phase);
  }, [phase]);

  // While the overlay is up: start at the top, lock scrolling, and decode the still
  // so the swap from the clip's last frame is instant.
  const overlayActive = phase === 'playing' || phase === 'gliding';
  useEffect(() => {
    if (!overlayActive) return;
    window.scrollTo(0, 0);
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const still = new Image();
    still.src = CHARACTER.neutral;
    still.decode().catch(() => {});
    return () => {
      root.style.overflow = previous;
    };
  }, [overlayActive]);

  useEffect(() => {
    if (phase !== 'gliding') return;
    const fallback = setTimeout(handleGlideDone, GLIDE_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [phase, handleGlideDone]);

  const inHero = phase === 'gliding' || idle;
  const glided = phase === 'gliding' || (stage?.phase === 'idle' && stage.glided);
  const bubbleState: BubbleState =
    stage?.phase === 'idle' ? (stage.typing ? 'typing' : 'full') : 'hidden';
  // Waiting clip: mounted (and so preloaded) only once the intro is over.
  const showWaitingClip = idle && !reducedMotion && !waiting.broken && setup !== null;
  const clipShowing = waiting.mode === 'playing';

  return (
    <>
      <noscript>
        <style>{NO_SCRIPT_CSS}</style>
      </noscript>

      {/* Peach backdrop with the loading label. Shown from the first paint on a first
          visit (hidden up front by the guard script otherwise); fades out, label and
          all, while Luffy glides. */}
      {(phase === 'pending' || overlayActive) && (
        <motion.div
          aria-hidden={phase === 'gliding'}
          className={`luffy-overlay ${OVERLAY_COLUMN} z-[60] bg-peach`}
          initial={false}
          animate={{ opacity: phase === 'gliding' ? 0 : 1 }}
          transition={{ duration: OVERLAY_FADE_S, ease: 'easeOut' }}
        >
          <div className={`${OVERLAY_FIGURE} aspect-[5/6]`} />
          <LoadingLabel animate={!reducedMotion} />
        </motion.div>
      )}

      {stage?.phase === 'playing' && setup && (
        <div className={`luffy-overlay ${OVERLAY_COLUMN} z-[61]`}>
          <div className={OVERLAY_FIGURE}>
            <CharacterFigure layoutId={LAYOUT_ID} floating={false}>
              <IntroClip format={setup.format} onDone={handleClipDone} />
            </CharacterFigure>
          </div>
          {/* Same height as the label underneath, so the two layers line up. */}
          <div aria-hidden="true" className="invisible">
            <LoadingLabel animate={false} />
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-full border-2 border-ink bg-surface px-4 py-2 font-mono text-sm text-ink transition-all hover:-translate-y-0.5 hover:bg-sun hover:shadow-sticker sm:right-6 sm:top-6"
          >
            Skip intro
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Fixed-size slot: the glide's target must not move. */}
        <div className="w-[min(56vw,240px)] sm:w-[260px]">
          {inHero ? (
            <CharacterFigure
              layoutId={glided ? LAYOUT_ID : undefined}
              floating={idle && !reducedMotion && waiting.mode === 'still'}
              raised={phase === 'gliding'}
              onLayoutAnimationComplete={handleGlideDone}
            >
              <IdleCharacter
                animate={idle && !reducedMotion && waiting.mode === 'still'}
                hidden={clipShowing}
              />
              {showWaitingClip && setup && (
                <WaitingClip
                  format={setup.format}
                  mode={waiting.mode}
                  plays={waiting.plays}
                  videoRef={waiting.videoRef}
                  onPlaying={waiting.handlePlaying}
                  onEnded={waiting.handleEnded}
                  onError={waiting.handleError}
                />
              )}
            </CharacterFigure>
          ) : (
            <div className="relative aspect-[5/6] w-full">
              <noscript>
                <img src={CHARACTER.neutral} alt="Luffy, Divyesh's guide" className={MEDIA_CLASS} />
              </noscript>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm">
          <noscript>
            <p className="mb-4 text-base leading-relaxed text-ink">{MESSAGES.first}</p>
          </noscript>
          <SpeechBubble
            state={bubbleState}
            message={message}
            animate={!reducedMotion}
            focusOnReveal={stage?.phase === 'idle' && stage.skipped}
            onAbout={scrollToAbout}
            onFirstMessageDone={handleFirstMessageDone}
          />
        </div>
      </div>
    </>
  );
}
