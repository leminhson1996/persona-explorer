/** Draws the Moon's lit portion for a phase angle (0 = new, 180 = full). */
export default function MoonGlyph({ angle, size = 96 }: { angle: number; size?: number }) {
  const r = 50;
  const a = (angle * Math.PI) / 180;
  // Terminator ellipse half-width; sign flips which side the bulge faces.
  const k = Math.cos(a) * r;
  const waxing = angle < 180;
  // Lit limb is on the right while waxing (northern-hemisphere view), left while waning.
  const limbSweep = waxing ? 1 : 0;
  const termSweep = (k > 0) === waxing ? 0 : 1;
  const d = `M50 0 A${r} ${r} 0 0 ${limbSweep} 50 100 A${Math.abs(k)} ${r} 0 0 ${termSweep} 50 0 Z`;
  return (
    <svg width={size} height={size} viewBox="-4 -4 108 108" role="img" aria-label={`Moon phase ${Math.round(angle)}°`} className="moon-glyph">
      <defs>
        <radialGradient id="moonLit" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fffbea" />
          <stop offset="100%" stopColor="#e8dcb5" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="52" fill="none" stroke="var(--accent)" strokeOpacity="0.25" />
      <circle cx="50" cy="50" r={r} fill="var(--moon-dark)" />
      <path d={d} fill="url(#moonLit)" />
    </svg>
  );
}
