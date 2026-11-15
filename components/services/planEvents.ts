/**
 * "Plan this project" on a service card opens the planner (further down the page) with
 * that service chosen. The two are separate parts of the page, so they talk through a
 * window event instead of shared state.
 */
const EVENT = 'work:plan-service';

export const PLANNER_ID = 'plan-my-project';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function requestPlan(serviceId: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: serviceId }));
}

export function onPlanRequest(handler: (serviceId: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/** /contact?purpose=freelance[&service=<id>][&plan=<summary>] (read by the contact page). */
export function contactHref(serviceId?: string, plan?: string): string {
  const params = new URLSearchParams({ purpose: 'freelance' });
  if (serviceId) params.set('service', serviceId);
  if (plan) params.set('plan', plan);
  return `/contact?${params.toString()}`;
}

/** Smooth scroll, or instant with reduced motion. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia(REDUCED_MOTION).matches ? 'auto' : 'smooth';
}
