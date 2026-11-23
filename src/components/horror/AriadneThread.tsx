/**
 * Ariadne's thread for the hero: two red threads wind down from the corners
 * toward the door, over slowly turning labyrinth rings. Purely decorative.
 * `horror-still`: people who ask for less motion see it standing still (globals.css).
 */
export function AriadneThread() {
  return (
    <div aria-hidden className="horror-motion horror-still absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        fill="none"
      >
        <g className="ariadne-spin" style={{ stroke: 'rgba(var(--glow),0.22)' }} strokeWidth="1.5">
          <circle cx="500" cy="430" r="150" strokeDasharray="520 140" />
          <circle cx="500" cy="430" r="230" strokeDasharray="780 190" />
          <circle cx="500" cy="430" r="310" strokeDasharray="1100 220" />
        </g>
        <g className="ariadne-spin-rev" style={{ stroke: 'rgba(var(--glow),0.14)' }} strokeWidth="1.5">
          <circle cx="500" cy="430" r="390" strokeDasharray="1500 300" />
          <circle cx="500" cy="430" r="470" strokeDasharray="1900 330" />
        </g>
        <path
          className="ariadne-thread stroke-brand-red-light"
          d="M -20 120 C 200 80, 120 380, 330 420 S 430 700, 500 790"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(var(--glow),0.9))' }}
        />
        <path
          className="ariadne-thread stroke-brand-red-light"
          d="M 1020 140 C 800 100, 880 400, 670 440 S 570 700, 500 790"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(var(--glow),0.9))', animationDelay: '-4s' }}
        />
      </svg>
    </div>
  );
}

/** Minotaur horns with eyes that pulse in the dark. Sits above the hero title. */
export function MinotaurMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden width="84" height="60" viewBox="0 0 84 60" fill="none" className={className}>
      {/* Colours come from the brand tokens (classes, not SVG attributes) so the puzzle side turns them gold */}
      <path d="M26 38C8 36 4 18 12 6" className="stroke-brand-red-light" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 38C76 36 80 18 72 6" className="stroke-brand-red-light" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 34C26 56 58 56 58 34C58 26 26 26 26 34Z" fill="#0b0606" className="stroke-brand-red-light" strokeWidth="2.5" />
      <circle className="ariadne-eye fill-brand-red-light" cx="35" cy="40" r="3" />
      <circle className="ariadne-eye fill-brand-red-light" cx="49" cy="40" r="3" style={{ animationDelay: '-1.2s' }} />
    </svg>
  );
}
