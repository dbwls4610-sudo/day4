// 감귤이: 이 사이트의 마스코트 (SVG)
export default function Mascot({ size = 120, className = '' }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`mascot ${className}`} role="img" aria-label="감귤이">
      <ellipse cx="60" cy="68" rx="46" ry="42" fill="#ff8a10" />
      <ellipse cx="44" cy="50" rx="14" ry="9" fill="#ffb35a" opacity=".6" />
      <path d="M60 28 C58 18 66 12 74 14 C72 22 66 28 60 28Z" fill="#3fbf4a" />
      <path d="M60 28 C50 20 42 22 38 26 C44 32 54 32 60 28Z" fill="#2fa83a" />
      <circle cx="44" cy="66" r="7" fill="#1a1030" />
      <circle cx="76" cy="66" r="7" fill="#1a1030" />
      <circle cx="46" cy="64" r="2.5" fill="#fff" />
      <circle cx="78" cy="64" r="2.5" fill="#fff" />
      <path d="M50 82 Q60 92 70 82" stroke="#1a1030" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="78" r="6" fill="#ff6f8f" opacity=".6" />
      <circle cx="87" cy="78" r="6" fill="#ff6f8f" opacity=".6" />
    </svg>
  );
}
