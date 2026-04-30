import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const toDate = (d: Date | string): Date => (typeof d === 'string' ? parseISO(d) : d);

export const formatDate = (d: Date | string): string =>
  format(toDate(d), 'dd/MM/yyyy', { locale: vi });

export const formatDateTime = (d: Date | string): string =>
  format(toDate(d), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });

export const formatDateLong = (d: Date | string): string =>
  format(toDate(d), "'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi });

const numberFormatter = new Intl.NumberFormat('vi-VN');
export const formatNumber = (n: number): string => numberFormatter.format(n);

const vndFormatter = new Intl.NumberFormat('vi-VN');
export const formatVND = (n: number): string => `${vndFormatter.format(n)} đồng`;

export const formatVNDCompact = (n: number): string => {
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  }
  if (n >= 1_000_000) {
    return `${Math.round(n / 1_000_000)} triệu`;
  }
  return formatVND(n);
};
