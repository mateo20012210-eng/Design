export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', opts);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function relativeDays(iso: string, now: Date = new Date()): string {
  const diff = Math.round((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (diff <= 0) return 'due now';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
