/**
 * The UNLOCKED mark: an eye peering out through a keyhole.
 *
 * - `onRed` (default): black keyhole, for the red logo tile.
 * - `onDark`: the keyhole takes `currentColor`, for dark backgrounds.
 * `blink` makes the eye close now and then (CSS `eye-blink`, off for reduced motion).
 *
 * The favicon and app icons draw the same shapes in src/lib/brandIcon.tsx.
 */
export function EyeKeyhole({
  className = 'w-5 h-5',
  variant = 'onRed',
  blink = false,
}: {
  className?: string;
  variant?: 'onRed' | 'onDark';
  blink?: boolean;
}) {
  const keyhole = variant === 'onRed' ? '#0a0000' : 'currentColor';
  return (
    <svg viewBox="9 9.5 30 30" className={className} aria-hidden focusable="false">
      <circle cx="24" cy="19" r="9" fill={keyhole} />
      <path d="M20 25 L16.5 39 H31.5 L28 25 Z" fill={keyhole} />
      <g
        style={
          blink
            ? { transformBox: 'fill-box', transformOrigin: 'center', animation: 'eye-blink 6s ease-in-out 2s infinite' }
            : undefined
        }
      >
        <path d="M17 19 Q24 12.5 31 19 Q24 25.5 17 19 Z" fill="#ece2d6" />
        <circle
          cx="24"
          cy="19"
          r="2.8"
          style={{ fill: variant === 'onRed' ? 'var(--color-brand-red-light)' : 'var(--color-brand-red)' }}
        />
        <ellipse cx="24" cy="19" rx="0.9" ry="2.3" fill="#0a0000" />
      </g>
    </svg>
  );
}
