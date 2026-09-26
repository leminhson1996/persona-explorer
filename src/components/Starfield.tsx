import { useMemo } from "react";

/** Decorative, static star background. */
export default function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.6 + 0.2,
        d: Math.random() * 6,
      })),
    [],
  );
  return (
    <svg className="starfield" aria-hidden="true" preserveAspectRatio="none">
      {stars.map((s) => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} opacity={s.o} style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
}
