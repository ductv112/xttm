import { formatDistance, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const MS_PER_DAY = 86_400_000;

export const daysAgo = (n: number): Date => new Date(Date.now() - n * MS_PER_DAY);

export const daysFromNow = (n: number): Date => new Date(Date.now() + n * MS_PER_DAY);

export const formatRelative = (d: Date | string): string => {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatDistance(date, new Date(), { locale: vi, addSuffix: true });
};
