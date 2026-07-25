/** UTC date helpers used by analytics burndown and shared formatting. */

export function toDateKey(isoOrDate: string | Date): string {
  if (typeof isoOrDate === 'string') {
    return isoOrDate.slice(0, 10);
  }
  return isoOrDate.toISOString().slice(0, 10);
}

export function startOfDayUtc(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Formats an ISO timestamp or Date to a display string.
 * Default pattern: YYYY-MM-DD (UTC). Pass locale for localized short date.
 */
export function formatDate(
  value: string | Date,
  locale: string = 'en-GB',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }

  if (options) {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  return toDateKey(date);
}

/** Short tick label DD.MM from YYYY-MM-DD date key */
export function formatDateKeyShort(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  if (!month || !day) {
    return dateKey;
  }
  return `${day}.${month}`;
}
