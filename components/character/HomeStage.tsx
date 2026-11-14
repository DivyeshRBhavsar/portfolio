'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import type { CurrentRepo } from '@/lib/github';
import type { StorySummary } from '@/lib/storyTypes';
import StageBackdrop from '@/components/theme/StageBackdrop';
import { applyMode } from '@/components/theme/themeStore';
import AskLuffyPanel, { type PanelPlacement } from './AskLuffyPanel';
import CharacterFigure from './CharacterFigure';
import ChatBubble from './ChatBubble';
import IdleCharacter from './IdleCharacter';
import IntentChips, { type Chip } from './IntentChips';
import LoadingScreen from './LoadingScreen';
import MiniLuffy from './MiniLuffy';
import NameForm from './NameForm';
import ReactionLayer from './ReactionLayer';
import Spotlight from './Spotlight';
import WelcomeClip, { type WelcomeVariant } from './WelcomeClip';
import WorkingOnBadge from './WorkingOnBadge';
import { setHeader } from './headerState';
import {
  CLIPS,
  LIGHTS_UP_S,
  LOADING_GIVE_UP_MS,
  MESSAGE_TALK_CLIP,
  NEUTRAL_POSE,
  SAFETY_MARGIN_MS,
  STAGE_FAILSAFE_MS,
  WEEKEND_LINE_CHANCE,
  type ClipName,
} from './introAssets';
import { logStep } from './introDebug';
import { armFailsafe, disarmFailsafe, setStageAttr, type StageAttr } from './introGuard';
import {
  askNameLines,
  chipLabels,
  forgetMeLabel,
  idleNudgeLines,
  intentQuestionNew,
  intentQuestionReturning,
  lastVisitLines,
  lastVisitStoryLines,
  nameSkippedLines,
  nameThanksLines,
  newVisitorGreetings,
  replayWelcomeLabel,
  returningGreetings,
  returningNoNameGreetings,
  skipIntroLabel,
  skipToPortfolioLabel,
  stageLabel,
  storyPageName,
  weekendLines,
} from './luffyLines';
import { fill, isWeekend, pick, timeSlot, timeZoneLine } from './speech';
import { useConversation } from './useConversation';
import { useIdle } from './useIdle';
import { useReactionClips } from './useReactionClips';
import { useStageSetup, type StageSetup } from './useStageSetup';
import {
  beginSession,
  continuePath,
  forgetEverything,
  markHomeSeen,
  saveName,
  setQuiet,
  type VisitedPage,
} from './visitorMemory';

/**
 * pending → before the browser setup is known (server HTML; CSS shows the right thing)
 * loading → welcome clip downloading (the loading screen appears only after 300 ms)
 * welcome → spotlight, clip playing, header hidden, scrolling locked
 * lights  → spotlight widens, background and header fade in (1.2 s)
 * chat    → the conversation
 * quiet   → "Skip to portfolio" (now or on an earlier visit): stage collapsed to a band
 *           with "Replay welcome 👋", Mini Luffy docked bottom-right
 */
type Phase = 'pending' | 'loading' | 'welcome' | 'lights' | 'chat' | 'quiet';

/** Which conversation runs: full new-visitor one, returning one, or same-visit chips only. */
type Script = 'new' | 'returning' | 'same';

/** The first section below the stage: Tour and Skip to portfolio scroll here. */
const CONTENT_ID = 'about';

/**
 * Mini Luffy shows when less than ~20% of the stage is on screen. Two thresholds (out
 * below 15%, back above 25%) plus a short settle time stop it flickering while the
 * visitor scrolls slowly around the edge.
 */
const STAGE_OUT_BELOW = 0.15;
const STAGE_BACK_ABOVE = 0.25;
const STAGE_SETTLE_MS = 150;

const cornerButton =
  'rounded-full border-2 border-ink bg-surface px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:bg-sun hover:text-on-sun sm:text-sm';

function isIntro(phase: Phase): boolean {
  return phase === 'pending' || phase === 'loading' || phase === 'welcome';
}

/**
 * The home page's centred stage: Luffy's welcome, the lights coming up, and the
 * chat-style conversation. All text comes from luffyLines.ts.
 */
export default function HomeStage({
  latestPostHref,
  currentRepo,
  currentStory,
}: {
  latestPostHref: string;
  /** "Currently working on" (null when GitHub failed: the badge is hidden). */
  currentRepo: CurrentRepo | null;
  /** The current repo's project story, if it has one. */
  currentStory: StorySummary | null;
}) {
  const router = useRouter();
  const stageRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const miniButtonRef = useRef<HTMLButtonElement>(null);

  const [phaseOverride, setPhaseOverride] = useState<Phase | null>(null);
  const [welcomeStartedAt, setWelcomeStartedAt] = useState<number | null>(null);
  const [loadingGone, setLoadingGone] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  /** Chip set: by visitor type (same-visit uses the visitor's type too). */
  const [chipSet, setChipSet] = useState<'new' | 'returning'>('new');
  const [lastPage, setLastPage] = useState<VisitedPage | null>(null);
  /** Messages appear at once (reduced motion, same-visit). */
  const [instant, setInstant] = useState(false);
  /** The Ask Luffy panel: above Mini Luffy, or under the bubble (from the chip). */
  const [panel, setPanel] = useState<PanelPlacement | null>(null);
  /** The stage is scrolled (mostly) out of view: Mini Luffy shows. Not saved. */
  const [stageOut, setStageOut] = useState(false);

  const setupRef = useRef<StageSetup | null>(null);
  const phaseRef = useRef<Phase>('pending');
  const ready = useRef({ clip: false, still: false });
  const skipRequested = useRef(false);
  const conversationStarted = useRef(false);
  const instantRef = useRef(false);
  const firstChoiceMade = useRef(false);
  const nudged = useRef(false);
  const stageVisible = useRef(true);

  /* ---------- Setup ---------- */

  const onSetupRef = useRef<(setup: StageSetup) => void>(() => {});
  const handleSetup = useCallback((next: StageSetup) => onSetupRef.current(next), []);
  const setup = useStageSetup(handleSetup);

  const reducedMotion = setup?.reducedMotion ?? false;
  const welcomeMode = setup !== null && !setup.quiet && !setup.reducedMotion && !setup.sameVisit;
  const initialPhase: Phase = !setup
    ? 'pending'
    : setup.quiet
      ? 'quiet'
      : welcomeMode
        ? 'loading'
        : 'chat';
  const phase: Phase = phaseOverride ?? initialPhase;
  const variant: WelcomeVariant =
    setup?.session.type === 'returning' ? 'welcomeShort' : 'welcome';
  const format = setup?.format ?? 'webm';

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ---------- Luffy's reactions and the conversation ---------- */

  const reactions = useReactionClips({ format, enabled: setup !== null && !reducedMotion });
  const { play: playClip } = reactions;
  const conversation = useConversation({
    // Clips stay paused while the stage is out of view (the chat itself carries on).
    onMessageStart: useCallback(() => {
      if (stageVisible.current) playClip(MESSAGE_TALK_CLIP);
    }, [playClip]),
  });
  const { say, clearPrompt, reset: resetConversation } = conversation;

  /** First choice in the conversation: the header comes up to full strength. */
  const choose = useCallback(() => {
    firstChoiceMade.current = true;
    setHeader('full');
  }, []);

  const startConversation = useCallback(
    (kind: Script, current: StageSetup, name: string) => {
      const now = new Date();
      const slot = timeSlot(now.getHours());
      const visitorType = current.session.type;
      instantRef.current = current.reducedMotion || kind === 'same';
      setInstant(instantRef.current);
      setScript(kind);
      setChipSet(visitorType);
      setLastPage(current.session.lastPage);
      logStep('conversation', kind);

      if (kind === 'same') {
        const question = visitorType === 'returning' ? intentQuestionReturning : intentQuestionNew;
        say([pick(question)], 'chips', true);
        return;
      }
      if (kind === 'new') {
        const lines = [pick(newVisitorGreetings[slot])];
        if (isWeekend(now) && Math.random() < WEEKEND_LINE_CHANCE) lines.push(pick(weekendLines));
        lines.push(timeZoneLine(now), pick(askNameLines));
        say(lines, 'name', instantRef.current);
        return;
      }
      const lines = [
        name
          ? fill(pick(returningGreetings[slot]), { name })
          : pick(returningNoNameGreetings[slot]),
      ];
      const previous = current.session.lastPage;
      if (previous?.kind === 'story') {
        const storyName = fill(storyPageName, { title: previous.label });
        lines.push(fill(pick(lastVisitStoryLines), { lastPage: storyName }));
      } else if (previous) {
        lines.push(fill(pick(lastVisitLines), { lastPage: previous.label }));
      }
      lines.push(pick(intentQuestionReturning));
      say(lines, 'chips', instantRef.current);
    },
    [say]
  );

  const startConversationOnce = useCallback(() => {
    const current = setupRef.current;
    if (!current || conversationStarted.current) return;
    conversationStarted.current = true;
    const kind: Script = current.sameVisit ? 'same' : current.session.type;
    startConversation(kind, current, current.name);
  }, [startConversation]);

  /* ---------- Phase changes (all from callbacks and timers) ---------- */

  const toLights = useCallback((reason: string) => {
    if (!isIntro(phaseRef.current)) return;
    logStep('lights up', reason);
    phaseRef.current = 'lights';
    setPhaseOverride('lights');
  }, []);

  const maybeStartWelcome = useCallback(() => {
    if (phaseRef.current !== 'loading' || !ready.current.clip || !ready.current.still) return;
    logStep('welcome', 'clip and still ready');
    phaseRef.current = 'welcome';
    setPhaseOverride('welcome');
  }, []);

  /** Decode the still now, so the swap from the clip's last frame is instant. */
  const prepareWelcome = useCallback(() => {
    ready.current = { clip: false, still: false };
    const still = new Image();
    still.src = NEUTRAL_POSE;
    const done = () => {
      ready.current.still = true;
      maybeStartWelcome();
    };
    still.decode().then(done, done);
  }, [maybeStartWelcome]);

  useEffect(() => {
    onSetupRef.current = (next: StageSetup) => {
      setupRef.current = next;
      logStep(
        'setup',
        `${next.format}, ${next.session.type}${next.sameVisit ? ', same visit' : ''}${next.quiet ? ', quiet' : ''}`
      );
      // Quiet mode (saved, or "Skip to portfolio" clicked before this point): nothing runs.
      if (next.quiet || phaseRef.current === 'quiet') return;
      const welcome = !next.reducedMotion && !next.sameVisit;
      if (!welcome) {
        startConversationOnce();
        return;
      }
      phaseRef.current = 'loading';
      if (skipRequested.current) {
        toLights('skipped before setup');
        return;
      }
      prepareWelcome();
    };
  }, [prepareWelcome, startConversationOnce, toLights]);

  const handleClipReady = useCallback(
    (ok: boolean) => {
      if (!ok) {
        toLights('welcome clip failed to load');
        return;
      }
      ready.current.clip = true;
      maybeStartWelcome();
    },
    [maybeStartWelcome, toLights]
  );

  const handleWelcomeStarted = useCallback(() => {
    logStep('welcome: playing', format);
    armFailsafe(); // the 10 s limit counts again from here
    setWelcomeStartedAt(Date.now());
  }, [format]);

  const handleWelcomeEnded = useCallback((reason: string) => toLights(reason), [toLights]);
  const handleLoadingGone = useCallback(() => setLoadingGone(true), []);

  // <html data-stage> follows the phase (CSS: header, scroll lock, overlays).
  useEffect(() => {
    if (phase === 'pending') return;
    const attr: StageAttr = phase === 'loading' || phase === 'welcome' ? 'welcome' : phase;
    setStageAttr(attr);
  }, [phase]);

  // Leaving the home page: never leave the header hidden or scrolling locked.
  useEffect(
    () => () => {
      disarmFailsafe();
      setStageAttr(null);
      setHeader('full');
      document.documentElement.removeAttribute('data-stage-failsafe');
    },
    []
  );

  // While the intro holds the page: start at the top.
  useEffect(() => {
    if (phase === 'loading' || phase === 'welcome') window.scrollTo(0, 0);
  }, [phase]);

  // Loading: give up on the welcome clip after a while.
  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => toLights('loading took too long'), LOADING_GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [phase, toLights]);

  // Welcome: safety net (length + 1 s, restarted when it really starts) and a hard limit.
  useEffect(() => {
    if (phase !== 'welcome') return;
    const lengthMs = CLIPS[variant].ms[format];
    const safety = setTimeout(() => toLights('safety net'), lengthMs + SAFETY_MARGIN_MS);
    return () => clearTimeout(safety);
  }, [phase, variant, format, welcomeStartedAt, toLights]);

  useEffect(() => {
    if (phase !== 'welcome') return;
    const limit = setTimeout(() => toLights('failsafe'), STAGE_FAILSAFE_MS);
    return () => clearTimeout(limit);
  }, [phase, toLights]);

  // Lights up, then the conversation.
  useEffect(() => {
    if (phase !== 'lights') return;
    disarmFailsafe();
    if (!firstChoiceMade.current) setHeader('faint');
    const timer = setTimeout(() => {
      phaseRef.current = 'chat';
      setPhaseOverride('chat');
      startConversationOnce();
    }, LIGHTS_UP_S * 1000);
    return () => clearTimeout(timer);
  }, [phase, startConversationOnce]);

  /* ---------- Skips ---------- */

  /** Before the setup is known, just note it (setup then goes straight to the lights). */
  const requestSkip = useCallback(
    (reason: string) => {
      setStageAttr('lights'); // unlock scrolling and start fading the overlays right away
      if (setupRef.current) toLights(reason);
      else skipRequested.current = true;
    },
    [toLights]
  );

  const skipIntro = useCallback(() => {
    requestSkip('skipped');
    // The focused Skip button disappears; keep keyboard focus on the conversation.
    bubbleRef.current?.focus({ preventScroll: true });
  }, [requestSkip]);

  // Esc = Skip intro.
  useEffect(() => {
    if (!isIntro(phase)) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skipIntro();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skipIntro]);

  const scrollToContent = useCallback(() => {
    document.getElementById(CONTENT_ID)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reducedMotion]);

  /**
   * Stop everything, collapse the stage, dock Mini Luffy, scroll to the content, and
   * remember it (quiet mode) so the next visit starts this way.
   */
  const skipToPortfolio = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    logStep('skip to portfolio', phaseRef.current);
    choose();
    setQuiet(true);
    disarmFailsafe();
    reactions.stop();
    resetConversation();
    conversationStarted.current = true; // nothing starts behind the collapsed stage
    setPanel(null);
    phaseRef.current = 'quiet';
    setPhaseOverride('quiet');
    setStageAttr('quiet'); // right away: overlays gone, scrolling unlocked
    // After the collapse has laid out, so the target position is final. Keyboard focus
    // follows (the link that had it is gone).
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        scrollToContent();
        document.getElementById(CONTENT_ID)?.focus({ preventScroll: true });
      })
    );
  };

  /** "Replay welcome 👋": clear quiet mode and run the stage again from the welcome. */
  const replayWelcome = () => {
    const current = setupRef.current;
    if (!current) return;
    logStep('replay welcome');
    setQuiet(false);
    setPanel(null);
    reactions.stop();
    resetConversation();
    conversationStarted.current = false;
    skipRequested.current = false;
    nudged.current = false;
    firstChoiceMade.current = false;
    setupRef.current = { ...current, quiet: false, sameVisit: false };
    setWelcomeStartedAt(null);
    setLoadingGone(false);

    if (current.reducedMotion) {
      // No welcome clip: straight to the conversation.
      phaseRef.current = 'chat';
      setPhaseOverride('chat');
      startConversationOnce();
      return;
    }
    phaseRef.current = 'loading';
    setPhaseOverride('loading');
    setStageAttr('welcome');
    armFailsafe();
    prepareWelcome();
  };

  /* ---------- Answers ---------- */

  const handleName = (raw: string) => {
    choose();
    clearPrompt();
    const name = saveName(raw);
    if (!name) {
      say([pick(nameSkippedLines), pick(intentQuestionNew)], 'chips', instantRef.current);
      return;
    }
    playClip('celebrate', { queue: true });
    say(
      [fill(pick(nameThanksLines), { name }), pick(intentQuestionNew)],
      'chips',
      instantRef.current
    );
  };

  const handleNameSkip = () => {
    choose();
    clearPrompt();
    say([pick(nameSkippedLines), pick(intentQuestionNew)], 'chips', instantRef.current);
  };

  const forgetMe = () => {
    const current = setupRef.current;
    if (!current) return;
    logStep('forget me');
    forgetEverything();
    applyMode('auto');
    const session = beginSession(); // starts over as a new visitor
    markHomeSeen();
    reactions.stop();
    resetConversation();
    nudged.current = false;
    const fresh: StageSetup = { ...current, sameVisit: false, session, name: '' };
    setupRef.current = fresh;
    startConversation('new', fresh, '');
  };

  const go = (href: string) => () => {
    choose();
    router.push(href);
  };

  const tour = () => {
    choose();
    scrollToContent();
  };

  // The same panel as Mini Luffy's, opened under the bubble.
  const askLuffy = () => {
    choose();
    logStep('ask luffy', 'stage');
    setPanel('stage');
  };

  const closePanel = useCallback(() => setPanel(null), []);
  const toggleDockPanel = () => setPanel((open) => (open === 'dock' ? null : 'dock'));

  const chips: Chip[] =
    chipSet === 'new'
      ? [
          { key: 'tour', label: chipLabels.tour, onSelect: tour },
          { key: 'hiring', label: chipLabels.hiring, onSelect: go('/projects') },
          { key: 'ml', label: chipLabels.ml, onSelect: go('/projects?category=data-science') },
          { key: 'blog', label: chipLabels.blog, onSelect: go('/blog') },
          { key: 'ask', label: chipLabels.ask, onSelect: askLuffy },
        ]
      : [
          ...(lastPage
            ? [
                {
                  key: 'continue',
                  label: fill(chipLabels.continue, { lastPage: lastPage.label }),
                  // Read at click time: a story resumes at the last slide viewed.
                  onSelect: () => go(continuePath(lastPage))(),
                },
              ]
            : []),
          { key: 'whatsNew', label: chipLabels.whatsNew, onSelect: go(latestPostHref) },
          { key: 'tourAgain', label: chipLabels.tourAgain, onSelect: tour },
          { key: 'ask', label: chipLabels.ask, onSelect: askLuffy },
        ];

  /* ---------- Idle ---------- */

  // How much of the stage is on screen: pauses clips and nudges, and shows Mini Luffy.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        // Between the two thresholds: keep whatever it was.
        const out = ratio < STAGE_OUT_BELOW ? true : ratio > STAGE_BACK_ABOVE ? false : null;
        if (out === null) return;
        clearTimeout(settle);
        settle = setTimeout(() => {
          stageVisible.current = !out;
          setStageOut(out);
        }, STAGE_SETTLE_MS);
      },
      { threshold: [0, 0.1, STAGE_OUT_BELOW, 0.2, STAGE_BACK_ABOVE, 0.3, 0.5, 1] }
    );
    observer.observe(stage);
    return () => {
      clearTimeout(settle);
      observer.disconnect();
    };
  }, []);

  useIdle({
    enabled:
      phase === 'chat' && panel === null && conversation.prompt !== null && !conversation.busy,
    onIdle: () => {
      if (!stageVisible.current) return; // reading further down: leave them be
      playClip('waiting');
      if (nudged.current) return;
      nudged.current = true;
      say([pick(idleNudgeLines)], 'keep', instantRef.current);
    },
  });

  /* ---------- Render ---------- */

  const intro = isIntro(phase);
  const floating = (phase === 'lights' || phase === 'chat') && !reducedMotion && !reactions.busy;
  const stillHidden =
    (phase === 'welcome' && welcomeStartedAt !== null) || reactions.current?.mode === 'playing';
  const preload: ClipName[] =
    phase === 'chat'
      ? [MESSAGE_TALK_CLIP, 'waiting', ...(script === 'new' ? (['celebrate'] as const) : [])]
      : [MESSAGE_TALK_CLIP];
  const showReactions =
    setup !== null && !reducedMotion && (phase === 'welcome' || phase === 'lights' || phase === 'chat');
  const showBubble = conversation.visible.length > 0 || conversation.prompt !== null;
  const animate = !instant;
  const quiet = phase === 'quiet';
  // Before setup both are in the HTML; <html data-stage> (set before paint) picks one.
  const showCollapsed = phase === 'pending' || quiet;
  // Quiet mode, scrolled past the stage (after the intro), or its own panel open.
  const miniVisible = quiet || panel === 'dock' || (stageOut && phase === 'chat');

  return (
    <>
      <section ref={stageRef} aria-label={stageLabel} className="relative overflow-hidden bg-peach">
        <StageBackdrop />

        {showCollapsed && (
          <div className="stage-collapsed relative">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-7 sm:flex-row sm:justify-center sm:gap-6">
              <button type="button" onClick={replayWelcome} className={cornerButton}>
                {replayWelcomeLabel}
              </button>
              {currentRepo && <WorkingOnBadge repo={currentRepo} story={currentStory} />}
            </div>
          </div>
        )}

        {!quiet && (
          <div className="stage-full">
            <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-3xl flex-col items-center px-4 pb-14 pt-16 sm:pt-20">
              <div ref={figureRef} className="w-[min(56vw,230px)] sm:w-[280px]">
                <CharacterFigure floating={floating}>
                  <IdleCharacter animate={floating} hidden={stillHidden} />
                  {setup && (phase === 'loading' || phase === 'welcome') && (
                    <WelcomeClip
                      format={setup.format}
                      variant={variant}
                      play={phase === 'welcome'}
                      onReady={handleClipReady}
                      onStarted={handleWelcomeStarted}
                      onEnded={handleWelcomeEnded}
                    />
                  )}
                  {showReactions && (
                    <ReactionLayer
                      format={format}
                      preload={preload}
                      current={reactions.current}
                      onPlaying={reactions.handlePlaying}
                      onEnded={reactions.handleEnded}
                      onError={reactions.handleError}
                    />
                  )}
                </CharacterFigure>
              </div>

              <div ref={bubbleRef} tabIndex={-1} className="mt-6 w-full max-w-md outline-none">
                {showBubble && (
                  <ChatBubble
                    messages={conversation.visible}
                    announced={conversation.log}
                    animate={animate}
                    footer={
                      script === 'returning' && (
                        <button
                          type="button"
                          onClick={forgetMe}
                          className="mx-auto mt-4 block text-xs text-ink-muted underline underline-offset-4 hover:text-red-deep"
                        >
                          {forgetMeLabel}
                        </button>
                      )
                    }
                  >
                    {conversation.prompt === 'name' && (
                      <NameForm onSubmit={handleName} onSkip={handleNameSkip} />
                    )}
                    {conversation.prompt === 'chips' && <IntentChips chips={chips} animate={animate} />}
                  </ChatBubble>
                )}
              </div>

              {panel === 'stage' && (
                <AskLuffyPanel
                  placement="stage"
                  reducedMotion={reducedMotion}
                  onClose={closePanel}
                  returnFocus={() => bubbleRef.current}
                />
              )}

              {currentRepo && phase === 'chat' && (
                <motion.div
                  initial={animate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: animate ? 0.4 : 0 }}
                  className="mt-8"
                >
                  <WorkingOnBadge repo={currentRepo} story={currentStory} />
                </motion.div>
              )}
            </div>

            {/* Above the dim layer and the loading screen, clickable from the very start. */}
            <a
              href={`#${CONTENT_ID}`}
              onClick={skipToPortfolio}
              className={`${cornerButton} absolute left-4 top-4 z-[71]`}
            >
              {skipToPortfolioLabel}
            </a>
            {intro && (
              <button
                type="button"
                onClick={skipIntro}
                className={`${cornerButton} stage-skip-intro absolute right-4 top-4 z-[71]`}
              >
                {skipIntroLabel}
              </button>
            )}

            {(intro || phase === 'lights') && (
              <Spotlight key={welcomeStartedAt ?? 0} up={phase === 'lights'} target={figureRef} />
            )}
            {!loadingGone && (intro || phase === 'lights') && (
              <LoadingScreen
                done={phase !== 'pending' && phase !== 'loading'}
                onGone={handleLoadingGone}
              />
            )}
          </div>
        )}
      </section>

      {/* Rendered before setup too, so a quiet-mode visitor sees it from the first paint. */}
      <MiniLuffy
        visible={miniVisible}
        beforeSetup={phase === 'pending'}
        open={panel === 'dock'}
        onToggle={toggleDockPanel}
        buttonRef={miniButtonRef}
        reducedMotion={reducedMotion}
      />
      {panel === 'dock' && (
        <AskLuffyPanel
          placement="dock"
          reducedMotion={reducedMotion}
          onClose={closePanel}
          returnFocus={() => miniButtonRef.current}
        />
      )}
    </>
  );
}
