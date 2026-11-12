/**
 * The site header's visibility on the home stage, as <html data-header>, read by CSS
 * (.site-header in app/globals.css). Hidden during the welcome comes from data-stage;
 * this adds the faint state after the lights come up, until the visitor's first choice.
 */
export type HeaderState = 'faint' | 'full';

export function setHeader(state: HeaderState): void {
  const root = document.documentElement;
  if (state === 'full') root.removeAttribute('data-header');
  else root.setAttribute('data-header', state);
}
