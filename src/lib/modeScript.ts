/** Where the puzzle / horror choice is kept (lib/mode.ts). Plain module: app/layout.tsx is a server component. */
export const MODE_KEY = 'unlocked_mode';

/** Set once the homepage cold open has played (HorrorIntro.tsx): it never plays again. */
export const INTRO_KEY = 'unlocked_intro_seen';

/** Paths and subdomains that keep their own look whatever side the player picked. */
export const MODE_FREE_PATHS = ['/company/', '/photos-app', '/embed/', '/coming-soon'];

/**
 * Before paint, marks <html> for the effects (globals.css, HorrorFX.tsx):
 *  - data-android: Chrome on Android blinks big blend layers, they are left out
 *  - data-lite: phones and tablets (no mouse), weak devices (4 GB memory or
 *    less, 2 cores or less) and people who ask for less motion; the
 *    atmosphere stays but stands still
 *  - data-intro-seen: the cold open already played once
 */
const FX_SCRIPT = `try{var d=document.documentElement,n=navigator,mm=function(q){return !!window.matchMedia&&window.matchMedia(q).matches};if(n.userAgent.indexOf('Android')>-1)d.setAttribute('data-android','');if(mm('(pointer: coarse)')||mm('(hover: none)')||mm('(prefers-reduced-motion: reduce)')||(n.deviceMemory&&n.deviceMemory<=4)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2))d.setAttribute('data-lite','');if(localStorage.getItem('${INTRO_KEY}'))d.setAttribute('data-intro-seen','')}catch(e){}`;

/**
 * Runs in <head> before paint; keep it tiny and dependency free (no regex, no
 * escapes: it is a template string). The company portal and photo app are left alone.
 */
export const MODE_SCRIPT = FX_SCRIPT + `try{var p=location.pathname,h=location.hostname,m=localStorage.getItem('${MODE_KEY}'),skip=p==='/company'||${JSON.stringify(MODE_FREE_PATHS)}.some(function(x){return p.indexOf(x)===0})||h.indexOf('business.')===0||h.indexOf('photos.')===0;if(!skip&&(m==='puzzle'||m==='horror'))document.documentElement.setAttribute('data-mode',m)}catch(e){}`;
