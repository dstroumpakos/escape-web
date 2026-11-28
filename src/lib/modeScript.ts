/** Where the puzzle / horror choice is kept (lib/mode.ts). Plain module: app/layout.tsx is a server component. */
export const MODE_KEY = 'unlocked_mode';

/** Paths and subdomains that keep their own look whatever side the player picked. */
export const MODE_FREE_PATHS = ['/company/', '/photos-app', '/embed/', '/coming-soon'];

/**
 * Runs in <head> before paint; keep it tiny and dependency free (no regex, no
 * escapes: it is a template string). The company portal and photo app are left alone.
 */
export const MODE_SCRIPT = `try{if(/Android/i.test(navigator.userAgent))document.documentElement.setAttribute('data-android','')}catch(e){}try{var p=location.pathname,h=location.hostname,m=localStorage.getItem('${MODE_KEY}'),skip=p==='/company'||${JSON.stringify(MODE_FREE_PATHS)}.some(function(x){return p.indexOf(x)===0})||h.indexOf('business.')===0||h.indexOf('photos.')===0;if(!skip&&(m==='puzzle'||m==='horror'))document.documentElement.setAttribute('data-mode',m)}catch(e){}`;
