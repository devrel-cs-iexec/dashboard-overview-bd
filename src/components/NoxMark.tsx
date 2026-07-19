type Tone = "lavender" | "accent";

const GRADIENTS: Record<Tone, [string, string]> = {
  lavender: ["#92a1ff", "#6e7edf"],
  accent: ["#fcd15a", "#fdb40e"],
};

/**
 * The Nox wordmark glyph. Gradient ids are keyed by tone: two marks of the
 * same tone on one page emit identical <defs>, which is harmless, while
 * different tones stay isolated.
 */
export function NoxMark({
  tone = "lavender",
  size = 22,
}: {
  tone?: Tone;
  size?: number;
}) {
  const [from, to] = GRADIENTS[tone];
  const id = `nox-mark-${tone}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M6 4h4l12 16V4h4v24h-4L10 12v16H6V4Z" fill={`url(#${id})`} />
    </svg>
  );
}
