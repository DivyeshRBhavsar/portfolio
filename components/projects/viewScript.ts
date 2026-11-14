// Plain module (no 'use client'): the root layout imports the pre-paint script from here.

/**
 * /projects has two views: the repo list and story mode with Luffy. The visitor's last
 * choice is saved in localStorage, and <html data-projects-view> shows the right one
 * (CSS in app/globals.css), set before first paint so the list never flashes first.
 */
export type ProjectsViewName = 'list' | 'story';

export const VIEW_KEY = 'luffy-projects-view';
export const VIEW_ATTR = 'data-projects-view';

/**
 * Runs inline in app/layout.tsx (with the stage guard) on full page loads only: on
 * /projects…, a story URL, the picker (#stories) or a saved "story" → story (the
 * story-mode overlay shows, scrolling locked), else list. Client-side navigation
 * doesn't re-run it, so ProjectsView sets the attribute itself (useLayoutEffect, before
 * paint). Pre-paint scripts live only in the root layout: React never runs a <script>
 * rendered on the client, and warns about it.
 */
export const PROJECTS_VIEW_SCRIPT = `(function(){var p=location.pathname;if(p!=='/projects'&&p.indexOf('/projects/')!==0)return;var v='list';try{if(p.indexOf('/projects/')===0||location.hash==='#stories'||localStorage.getItem('${VIEW_KEY}')==='story')v='story'}catch(e){}document.documentElement.setAttribute('${VIEW_ATTR}',v)})()`;
