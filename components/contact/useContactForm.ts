'use client';

import { useEffect, useRef, useState } from 'react';
import { contactErrors } from '@/components/character/luffyLines';
import {
  EMPTY_VALUES,
  LIMITS,
  clean,
  domId,
  fieldKey,
  findPurpose,
  validate,
  type CommonKey,
  type ContactConfig,
  type ContactValues,
  type FieldErrors,
} from './rules';

export type Status = 'idle' | 'sending' | 'sent' | 'error';
export type Mode = 'chat' | 'full';

const DRAFT_KEY = 'luffy-contact-draft';
const MODE_KEY = 'luffy-contact-mode';
const SAVE_DELAY_MS = 600;

// ── Browser storage (any of it can be unavailable: private windows, blocked storage) ──

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: nothing to do */
  }
}

function hasContent(v: ContactValues): boolean {
  return !!(v.purpose || Object.keys(v.fields).length || v.name || v.email || v.message || v.linkedin);
}

// ── Prefill from the URL ──

/**
 * ?purpose=, ?service= (freelance + its project type), ?<field id>= for the purpose's own
 * fields (?role=, ?about=), and ?plan=. Unknown values are ignored. Applied on top of a
 * restored draft: the link wins for whatever it sets.
 */
export function applyPrefill(config: ContactConfig, base: ContactValues, params: URLSearchParams): ContactValues {
  let v = { ...base, fields: { ...base.fields } };
  const switchTo = (purposeId: string) => {
    if (v.purpose !== purposeId) v = { ...v, purpose: purposeId, fields: {} };
  };

  const service = params.get('service');
  if (service) {
    for (const purpose of config.purposes) {
      for (const field of purpose.fields) {
        const option = field.options.find((o) => o.service === service);
        if (option) {
          switchTo(purpose.id);
          v.fields[field.id] = option.value;
        }
      }
    }
  }

  const purposeParam = params.get('purpose');
  if (purposeParam && findPurpose(config, purposeParam)) switchTo(purposeParam);

  const purpose = findPurpose(config, v.purpose);
  for (const field of purpose?.fields ?? []) {
    const value = params.get(field.id);
    if (!value) continue;
    const ok = field.options.length > 0 ? field.options.some((o) => o.value === value) : value.length <= field.maxLength;
    if (ok) v.fields[field.id] = value;
  }

  const plan = params.get('plan');
  if (plan && plan.trim()) v.plan = plan.trim().slice(0, LIMITS.plan);
  return v;
}

/** Focus the control for the first error, in form order. */
export function focusFirstError(errors: FieldErrors): void {
  const key = Object.keys(errors)[0];
  if (!key) return;
  const el = document.getElementById(domId(key));
  if (!el) return;
  const target = el.matches('input, select, textarea, button, [tabindex]')
    ? el
    : el.querySelector<HTMLElement>('[tabindex="0"], input, select, textarea, button');
  target?.focus();
}

/**
 * The contact form's single state, shared by the chat and the full form so both show and
 * send exactly the same thing: values, errors, draft, undo for a purpose change, mode,
 * and sending.
 */
export function useContactForm(config: ContactConfig, params: URLSearchParams | null) {
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [undo, setUndo] = useState<{ purpose: string; fields: Record<string, string>; label: string } | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [mode, setModeState] = useState<Mode>('chat');
  const startedAt = useRef(0);
  const honeypot = useRef('');
  const paramString = params?.toString() ?? '';

  // Once, after hydration: restore the draft, apply the link's prefill, and the saved mode.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const draft = readJson(DRAFT_KEY);
      const restored = draft && typeof draft === 'object' ? clean(config, draft) : null;
      // clean() drops fields of an unknown purpose; keep the plan as it was.
      const base = restored ? { ...restored, plan: restored.plan.slice(0, LIMITS.plan) } : EMPTY_VALUES;
      setValues(applyPrefill(config, base, new URLSearchParams(paramString)));
      setDraftRestored(!!restored && hasContent(restored));
      const savedMode = readJson(MODE_KEY);
      if (savedMode === 'full' || savedMode === 'chat') setModeState(savedMode);
      startedAt.current = Date.now();
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
    // Only on first load: later URL changes don't overwrite what the visitor typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save the draft a moment after the visitor stops typing (not after it's been sent).
  useEffect(() => {
    if (!ready || status === 'sent') return;
    const timer = setTimeout(() => {
      write(DRAFT_KEY, hasContent(values) ? JSON.stringify(values) : null);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [values, ready, status]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev) && !('form' in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });

  const setPurpose = (id: string) => {
    if (id === values.purpose) return;
    const old = findPurpose(config, values.purpose);
    if (old && Object.keys(values.fields).length > 0) {
      setUndo({ purpose: old.id, fields: values.fields, label: old.label });
    } else {
      setUndo(null);
    }
    setValues((v) => ({ ...v, purpose: id, fields: {} }));
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== 'purpose' && !k.startsWith('fields.'))));
  };

  const undoPurpose = () => {
    if (!undo) return;
    setValues((v) => ({ ...v, purpose: undo.purpose, fields: undo.fields }));
    setUndo(null);
  };

  const setField = (id: string, value: string) => {
    setValues((v) => ({ ...v, fields: { ...v.fields, [id]: value } }));
    clearError(fieldKey(id));
  };

  const setCommon = (key: CommonKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(key);
  };

  const clearDraft = () => {
    write(DRAFT_KEY, null);
    setValues(applyPrefill(config, EMPTY_VALUES, new URLSearchParams(paramString)));
    setErrors({});
    setUndo(null);
    setDraftRestored(false);
  };

  const setMode = (next: Mode) => {
    setModeState(next);
    write(MODE_KEY, JSON.stringify(next));
  };

  /** Check and send. Returns the errors to show (empty on success or a sending failure). */
  const submit = async (): Promise<FieldErrors> => {
    const cleaned = clean(config, values);
    const problems = validate(config, cleaned);
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      return problems;
    }
    setStatus('sending');
    setErrors({});
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleaned, startedAt: startedAt.current, website: honeypot.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: FieldErrors };
      if (res.ok) {
        write(DRAFT_KEY, null);
        setUndo(null);
        setDraftRestored(false);
        setStatus('sent');
        return {};
      }
      const serverErrors = data.errors && typeof data.errors === 'object' ? data.errors : { form: contactErrors.failed };
      if (res.status >= 500) {
        setErrors(serverErrors);
        setStatus('error');
        return {};
      }
      // Something to fix (a field, too fast, cooldown): back to the form with it marked.
      setErrors(serverErrors);
      setStatus('idle');
      return serverErrors;
    } catch {
      setErrors({ form: contactErrors.failed });
      setStatus('error');
      return {};
    }
  };

  const retry = () => {
    setStatus('idle');
    setErrors({});
  };

  return {
    values,
    errors,
    setErrors,
    ready,
    draftRestored,
    undo,
    status,
    mode,
    setHoneypot: (value: string) => {
      honeypot.current = value;
    },
    setPurpose,
    undoPurpose,
    dismissUndo: () => setUndo(null),
    setField,
    setCommon,
    removePlan: () => setCommon('plan', ''),
    clearDraft,
    setMode,
    submit,
    retry,
  };
}

export type ContactForm = ReturnType<typeof useContactForm>;
