export function CarGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 14.5h1.15c.28 1.35 1.48 2.35 2.9 2.35s2.62-1 2.9-2.35h4.2c.28 1.35 1.48 2.35 2.9 2.35s2.62-1 2.9-2.35H21v-3.05l-2.15-3.95h-5.2L11.4 5.5H7.15L5.05 11.5H3z" />
      <circle cx="7.05" cy="16.85" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16.95" cy="16.85" r="1.15" fill="currentColor" stroke="none" />
      <path d="M5.2 11.5h13.1" />
    </svg>
  );
}
