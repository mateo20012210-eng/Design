import React from 'react';
import { cn } from '@/lib/format';
import { CATEGORY_META } from '@/lib/cards';
import type { Category, Difficulty } from '@/lib/types';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-ring select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  const sizes = { sm: 'text-sm px-3 h-9', md: 'text-[0.95rem] px-4 h-11 tap', lg: 'text-base px-5 h-12 tap' };
  const variants = {
    primary: 'bg-navy-800 text-white hover:bg-navy-700 dark:bg-navy-100 dark:text-navy-900 dark:hover:bg-white',
    accent: 'bg-accent-500 text-white hover:bg-accent-600',
    secondary: 'bg-surface-2 text-fg hover:bg-navy-100 dark:hover:bg-navy-700 border border-base',
    ghost: 'bg-transparent text-fg hover:bg-surface-2',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...rest} />;
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('surface p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CategoryBadge({ category, short = false, className }: { category: Category; short?: boolean; className?: string }) {
  const m = CATEGORY_META[category];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', m.badge, className)}>
      {short ? m.short : m.name}
    </span>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  const cls = difficulty === 'Basic' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' : 'bg-navy-800 text-white dark:bg-navy-200 dark:text-navy-900';
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cls, className)}>{difficulty}</span>;
}

export function Chip({ active, children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 h-9 text-sm font-medium whitespace-nowrap transition-colors focus-ring',
        active ? 'bg-navy-800 text-white border-navy-800 dark:bg-accent-500 dark:border-accent-500' : 'bg-surface border-base text-fg hover:bg-surface-2',
        className,
      )}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-surface-2 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color ?? 'var(--color-accent-500)' }} />
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="muted mt-1 text-[0.95rem]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex min-w-[1.6rem] h-6 items-center justify-center rounded-md border border-base bg-surface-2 px-1.5 text-[11px] font-semibold font-mono">{children}</kbd>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 p-0 sm:p-6" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('surface w-full max-h-[90dvh] overflow-y-auto rounded-b-none sm:rounded-b-2xl p-5 flip-enter', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
        style={{ paddingBottom: 'calc(1.25rem + var(--safe-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="tap rounded-xl hover:bg-surface-2 focus-ring text-xl leading-none" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-4xl mb-3" aria-hidden>
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {body && <p className="muted mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-ring', checked ? 'bg-accent-500' : 'bg-navy-200 dark:bg-navy-600')}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-surface-2 p-1 border border-base">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('px-3 h-9 rounded-lg text-sm font-medium transition-colors focus-ring', value === o.value ? 'bg-surface shadow-sm text-fg' : 'muted hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
