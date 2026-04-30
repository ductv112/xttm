/**
 * CSV export helpers for Vietnamese-content tables.
 *
 * - BOM UTF-8 prepended to every output so Excel renders dấu Việt correctly
 *   (without BOM, Excel interprets the file as Windows-1252 and breaks ã/ô/đ).
 * - CSV-injection mitigation (T-02-03-03 / OWASP CSV Injection):
 *   any cell starting with `=`, `+`, `-`, `@`, tab, or carriage-return is
 *   prefixed with a leading single-quote (`'`) so spreadsheet engines
 *   treat it as text instead of a formula.
 * - Caller is responsible for filtering rows BEFORE calling toCSV
 *   (server-side RBAC + redact PII at action layer — Task 1 thread T-02-03-02).
 */

export type CSVColumn<T> = {
  /** Object key OR arbitrary string id when `format` is provided */
  key: keyof T | string;
  /** Header label rendered in row 0 */
  header: string;
  /** Custom formatter — receives row, returns display string. Overrides direct key access. */
  format?: (row: T) => string;
};

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // CSV-injection guard — prefix with apostrophe so Excel treats as text
  if (FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }

  // Quote-wrap if contains delimiter, quote, newline, or carriage return
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize rows to a CSV string.
 *
 * @example
 *   const csv = toCSV(users, [
 *     { key: 'fullName', header: 'Họ và tên' },
 *     { key: 'createdAt', header: 'Ngày tạo', format: (u) => formatDate(u.createdAt) },
 *   ]);
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: CSVColumn<T>[]
): string {
  const BOM = '﻿'; // 0xFEFF UTF-8 BOM marker for Excel compatibility

  const headerLine = columns.map((c) => escapeCell(c.header)).join(',');

  const dataLines = rows.map((row) =>
    columns
      .map((c) => {
        if (c.format) return escapeCell(c.format(row));
        const value = row[c.key as keyof T];
        return escapeCell(value);
      })
      .join(',')
  );

  return BOM + [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a browser download of a CSV string.
 * Must be called from a user-gesture handler (button click) — browsers
 * block synthetic anchor clicks outside of trusted events.
 */
export function downloadCSV(filename: string, csv: string): void {
  // Guard for SSR / non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  // `display:none` keeps Firefox from flickering the anchor on insert
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Free memory; some browsers retain the URL until reload otherwise
  URL.revokeObjectURL(url);
}
