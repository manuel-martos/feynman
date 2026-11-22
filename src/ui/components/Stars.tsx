import { t } from '../../i18n';
export function Star({ filled, size = 20, delay = 0, animate = false }: { filled: boolean; size?: number; delay?: number; animate?: boolean }) {
  return (
    <svg
      className={`star ${filled ? 'is-filled' : ''} ${animate ? 'is-pop' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden
    >
      <path d="M12 2.6l2.83 5.74 6.33.92-4.58 4.47 1.08 6.3L12 17.05l-5.66 2.98 1.08-6.3L2.84 9.26l6.33-.92z" />
    </svg>
  );
}

export function Stars({ value, size = 16, animate = false }: { value: number; size?: number; animate?: boolean }) {
  return (
    <span className="stars" role="img" aria-label={t.stars(value)}>
      {[0, 1, 2].map((i) => (
        <Star key={i} filled={i < value} size={size} animate={animate} delay={animate ? 350 + i * 260 : 0} />
      ))}
    </span>
  );
}
