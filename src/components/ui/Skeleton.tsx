export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-[var(--color-paper-raised)] ${className}`} />;
}
