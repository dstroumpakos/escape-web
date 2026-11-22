/** Where the puzzle / horror choice is kept (lib/mode.ts). Plain module: app/layout.tsx is a server component. */
export const MODE_KEY = 'unlocked_mode';

/** Runs in <head> before paint; keep it tiny and dependency free. */
export const MODE_SCRIPT = `try{var m=localStorage.getItem('${MODE_KEY}');if(m==='puzzle'||m==='horror')document.documentElement.setAttribute('data-mode',m)}catch(e){}`;
