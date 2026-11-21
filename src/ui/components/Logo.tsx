export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="logo">
      <defs>
        <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#38d6ff" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="#0d1236" stroke="url(#lg-a)" strokeWidth="2" />
      <path d="M12 16 L28 26 L12 36" fill="none" stroke="#38d6ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 16 L36 26" fill="none" stroke="#ff5fb4" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 26 L52 36" fill="none" stroke="#ff5fb4" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 26 q2 -4 4 0 t4 0" fill="none" stroke="#ffc53d" strokeWidth="3" strokeLinecap="round" />
      <circle cx="28" cy="26" r="3.2" fill="#fff" />
      <circle cx="36" cy="26" r="3.2" fill="#fff" />
      <path d="M14 48 h36" stroke="#ffc53d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
    </svg>
  );
}
