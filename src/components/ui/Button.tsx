import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-accent)]',
  secondary: 'border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-border-strong)]',
  ghost: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-raised)] hover:text-[var(--color-ink)]',
  danger: 'border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-soft)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'primary', size = 'md', className = '', children, ...props }: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </a>
  );
}
