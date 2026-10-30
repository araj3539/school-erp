/**
 * Parse an ERP calendar date (YYYY-MM-DD) without local-timezone drift.
 *
 * Attendance is a school-day concept, so the stored instant is normalized to
 * UTC midnight for the requested calendar date. This avoids a server/browser
 * timezone changing the represented school day.
 */
export function parseCalendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid calendar date; expected YYYY-MM-DD");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }
  return date;
}

export function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** UTC calendar-day range [start, start+1d) for the current UTC date. */
export function utcTodayRange(): { start: Date; end: Date } {
  const start = parseCalendarDate(new Date().toISOString().slice(0, 10));
  return { start, end: addCalendarDays(start, 1) };
}

/**
 * Server-local calendar key (YYYY-MM-DD). Portal widgets compare against
 * date-only string fields (e.g. Homework.dueDate) with lexicographic range
 * queries; MongoDB never matches a String field against Date bounds, so the
 * range must be expressed with string keys.
 */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDateKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}
