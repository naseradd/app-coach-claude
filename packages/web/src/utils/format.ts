/**
 * Centralized French formatters. Pages MUST import from here, not from
 * `mocks/index.ts` — mocks survive only for the design playground.
 */

const toDate = (d: Date | string): Date => (typeof d === 'string' ? new Date(d) : d);

export const formatDateFR = (d: Date | string): string =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }).format(
    toDate(d),
  );

export const formatMonthYearFR = (d: Date | string): string =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(toDate(d));

export const formatDayMonthFR = (d: Date | string): { day: string; month: string } => {
  const date = toDate(d);
  const day = String(date.getDate());
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(date)
    .replace('.', '');
  return { day, month };
};

export const relativeDays = (d: Date | string, ref: Date = new Date()): string => {
  const diffMs = ref.getTime() - toDate(d).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days}j`;
};

export const fmtDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

export const fmtKg = (kg: number): string => {
  const v = Number(kg.toFixed(1));
  const str = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
  return `${str} kg`;
};
