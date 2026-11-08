'use client';

/* eslint-disable @next/next/no-img-element -- no-JS fallback only. */

import { useCallback, useEffect, useRef, useState } from 'react';
import CharacterSequence from './CharacterSequence';
import IdleCharacter from './IdleCharacter';
import SpeechBubble from './SpeechBubble';
import { CHARACTER, GREETING, MEDIA_CLASS } from './introAssets';
import { useIntroSetup, type IntroSetup } from './useIntroSetup';

type Stage =
  | { phase: 'playing' }
  | { phase: 'idle'; typing: boolean; skipped: boolean };

const BACKGROUND = '#FFF8EC';

function initialStage(setup: IntroSetup): Stage {
  if (setup.reducedMotion || setup.seenThisSession) {
    return { phase: 'idle', typing: false, skipped: false };
  }
  return { phase: 'playing' };
}

/**
 * First visit per session: hello-wave → namaste → idle Luffy with a typed greeting.
 * Later visits, Skip, and reduced motion all land directly on the end state.
 */
export default function WelcomeIntro() {
  const setup = useIntroSetup();
  const sectionRef = useRef<HTMLElement>(null);
  const [override, setOverride] = useState<Stage | null>(null);

  const stage: Stage | null = override ?? (setup ? initialStage(setup) : null);

  // Stable so CharacterSequence's effects don't restart. Ignored if Skip already ran.
  const handleSequenceDone = useCallback(() => {
    setOverride((current) => current ?? { phase: 'idle', typing: true, skipped: false });
  }, []);

  const handleSkip = () => setOverride({ phase: 'idle', typing: false, skipped: true });

  const scrollToAbout = () => {
    sectionRef.current?.nextElementSibling?.scrollIntoView({
      behavior: setup?.reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  // Have the still decoded before namaste ends so the swap is instant.
  const playing = stage?.phase === 'playing';
  useEffect(() => {
    if (!playing) return;
    const img = new Image();
    img.src = CHARACTER.neutral;
    img.decode().catch(() => {});
  }, [playing]);

  return (
    <section
      ref={sectionRef}
      aria-label="Welcome"
      className="relative flex min-h-[calc(100svh-3.8rem)] flex-col items-center justify-center gap-8 py-12 text-slate-800 sm:flex-row sm:gap-12"
      // Full-bleed background out of the max-width container without causing
      // horizontal scroll (box-shadow doesn't add scrollable overflow).
      style={{
        backgroundColor: BACKGROUND,
        boxShadow: `0 0 0 100vmax ${BACKGROUND}`,
        clipPath: 'inset(0 -100vmax)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 45%, rgba(46,191,178,0.16), transparent 55%), radial-gradient(circle at 72% 35%, rgba(232,169,76,0.22), transparent 50%)',
        }}
      />

      {stage?.phase === 'playing' && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-0 top-4 rounded-full border border-slate-300 bg-white/80 px-4 py-1.5 font-mono text-xs text-slate-700 backdrop-blur transition-colors hover:border-teal-500 hover:text-slate-900"
        >
          Skip intro
        </button>
      )}

      <div className="relative aspect-[5/6] w-[min(70vw,320px)] shrink-0">
        {!stage && (
          <noscript>
            <img src={CHARACTER.neutral} alt="Luffy, Divyesh's guide" className={MEDIA_CLASS} />
          </noscript>
        )}
        {stage?.phase === 'playing' && setup && (
          <CharacterSequence format={setup.format} onDone={handleSequenceDone} />
        )}
        {stage?.phase === 'idle' && <IdleCharacter animate={!setup?.reducedMotion} />}
      </div>

      {/* Fixed-size slot so the character doesn't shift when the bubble appears. */}
      <div className="relative w-full max-w-sm sm:min-h-[12rem] sm:self-center">
        {!stage && (
          <noscript>
            <p className="text-lg text-slate-800">{GREETING}</p>
          </noscript>
        )}
        {stage?.phase === 'idle' && (
          <SpeechBubble
            typing={stage.typing}
            animate={!setup?.reducedMotion}
            focusOnReveal={stage.skipped}
            onAbout={scrollToAbout}
          />
        )}
      </div>
    </section>
  );
}
