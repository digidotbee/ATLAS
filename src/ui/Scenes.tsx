// Drawn landscapes used until real photography is added. Pure SVG, no image files.

/** Stable 0–1 value from a string, so each trip keeps the same scene. */
function seed(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Storm-meets-sunset hero: dark clouds, a low sun, a rainbow and palm silhouettes. */
export function StormScene() {
  return (
    <svg className="scene" viewBox="0 0 800 420" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="sun" cx="0.68" cy="0.62" r="0.55">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset="0.12" stopColor="#ffd34a" />
          <stop offset="0.35" stopColor="#f39a2b" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#5a3a1a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#14181c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15191e" />
          <stop offset="0.55" stopColor="#2a2a26" />
          <stop offset="0.8" stopColor="#6b4a1c" />
          <stop offset="1" stopColor="#1b1f1c" />
        </linearGradient>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4d4d" stopOpacity="0" />
          <stop offset="0.15" stopColor="#ff4d4d" stopOpacity="0.55" />
          <stop offset="0.32" stopColor="#ffb43a" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#f6f04a" stopOpacity="0.55" />
          <stop offset="0.66" stopColor="#5fe08a" stopOpacity="0.5" />
          <stop offset="0.83" stopColor="#5a8cff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#a35cff" stopOpacity="0" />
        </linearGradient>
        <filter id="blur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="blur3">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="800" height="420" fill="url(#sky)" />
      <rect width="800" height="420" fill="url(#sun)" />
      {/* sun rays */}
      <g opacity="0.35" filter="url(#blur3)">
        {Array.from({ length: 11 }, (_, i) => {
          const a = (-150 + i * 12) * (Math.PI / 180);
          return <path key={i} d={`M544 262 L${544 + Math.cos(a) * 520} ${262 + Math.sin(a) * 520} L${544 + Math.cos(a + 0.05) * 520} ${262 + Math.sin(a + 0.05) * 520} Z`} fill="#ffe27a" />;
        })}
      </g>
      {/* rainbow */}
      <path d="M470 430 Q 640 120 830 20" stroke="url(#rainbow)" strokeWidth="46" fill="none" filter="url(#blur3)" />
      {/* storm clouds */}
      <g filter="url(#blur8)" fill="#0f1215" opacity="0.92">
        <ellipse cx="120" cy="60" rx="260" ry="90" />
        <ellipse cx="420" cy="40" rx="220" ry="70" />
        <ellipse cx="700" cy="70" rx="200" ry="80" />
        <ellipse cx="260" cy="170" rx="210" ry="60" />
        <ellipse cx="80" cy="250" rx="180" ry="70" />
      </g>
      <g filter="url(#blur3)" fill="#f2a43c" opacity="0.55">
        <ellipse cx="560" cy="150" rx="90" ry="10" />
        <ellipse cx="470" cy="205" rx="70" ry="7" />
        <ellipse cx="640" cy="210" rx="60" ry="6" />
      </g>
      {/* mountains */}
      <path d="M0 345 L120 318 L230 330 L330 300 L420 280 L470 276 L560 300 L650 315 L800 322 L800 420 L0 420 Z" fill="#191d1a" />
      <path d="M0 372 L200 360 L420 366 L620 356 L800 362 L800 420 L0 420 Z" fill="#101311" />
      {/* palms */}
      <g fill="#0b0d0c">
        {[690, 712, 734].map((x, i) => (
          <g key={x} transform={`translate(${x} ${300 - i * 8})`}>
            <rect x="-1.5" y="0" width="3" height={62 + i * 8} />
            <path d="M0 0 Q-16 -6 -26 4 Q-14 -2 0 2 Q14 -2 26 4 Q16 -6 0 0 Q-6 -14 -18 -16 Q-6 -8 0 0 Q6 -8 18 -16 Q6 -14 0 0Z" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** A coastal landscape tinted per destination. */
export function TripScene({ id }: { id: string }) {
  const hue = Math.round(seed(id) * 360);
  const g = (l: number, s = 45, dh = 0) => `hsl(${(hue + dh + 360) % 360} ${s}% ${l}%)`;
  const r1 = 200 + seed(id, 1) * 40;
  const r2 = 140 + seed(id, 2) * 60;
  const sea = seed(id, 3) > 0.25;
  return (
    <svg className="scene" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g(70, 35, 160)} />
          <stop offset="1" stopColor={g(88, 30, 180)} />
        </linearGradient>
        <linearGradient id={`sea-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1fa7b8" />
          <stop offset="1" stopColor="#0b4f7a" />
        </linearGradient>
      </defs>
      <rect width="800" height="300" fill={`url(#sky-${id})`} />
      <g fill="#fff" opacity="0.75">
        <ellipse cx={120 + seed(id, 4) * 200} cy="50" rx="90" ry="18" />
        <ellipse cx={520 + seed(id, 5) * 150} cy="38" rx="120" ry="20" />
      </g>
      <path d={`M0 ${r1} L120 ${r1 - 70} L220 ${r1 - 120} L330 ${r1 - 60} L430 ${r1 - 140} L560 ${r1 - 50} L680 ${r1 - 90} L800 ${r1 - 40} L800 300 L0 300 Z`} fill={g(32, 40, 90)} />
      <path d={`M0 ${r2 + 60} L160 ${r2} L300 ${r2 + 40} L420 ${r2 - 10} L540 ${r2 + 50} L800 ${r2 + 20} L800 300 L0 300 Z`} fill={g(24, 55, 100)} />
      <path d={`M0 ${r2 + 90} L200 ${r2 + 60} L380 ${r2 + 85} L520 ${r2 + 70} L800 ${r2 + 90} L800 300 L0 300 Z`} fill={g(18, 45, 20)} opacity="0.9" />
      {sea && <path d={`M380 300 Q 520 ${r2 + 95} 800 ${r2 + 70} L800 300 Z`} fill={`url(#sea-${id})`} />}
      {sea && <path d={`M380 300 Q 520 ${r2 + 95} 800 ${r2 + 70}`} stroke="#f3ead2" strokeWidth="4" fill="none" opacity="0.8" />}
    </svg>
  );
}
