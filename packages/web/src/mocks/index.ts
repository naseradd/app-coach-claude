export { mockProgram } from './program.mock.js';
export { mockReports } from './reports.mock.js';
export { mockProfile } from './profile.mock.js';

/**
 * Helpers for date formatting / relative time without dependencies.
 */
export function formatDateFR(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatDayMonthFR(d: Date | string): { day: string; month: string } {
  const date = typeof d === 'string' ? new Date(d) : d;
  const day = String(date.getDate());
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(date)
    .replace('.', '');
  return { day, month };
}

export function formatMonthYearFR(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

export function relativeDays(d: Date | string, ref: Date = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diffMs = ref.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days}j`;
}
