/**
 * Date-range filter helpers for timestamp fields (e.g. Payment.date).
 *
 * Calendar-date inputs ("YYYY-MM-DD") are treated as inclusive local reporting
 * days: startDate matches from local midnight of that day and endDate covers the
 * whole end day. Full datetime inputs keep exact-instant semantics ($gte/$lte),
 * preserving backwards compatibility for callers that pass timestamps.
 */

export function rangeStartFor(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function rangeEndFilterFor(value: string): { $lt: Date } | { $lte: Date } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    // Day+1 overflow rolls over to the next month/year automatically.
    return { $lt: new Date(year, month - 1, day + 1) };
  }
  return { $lte: new Date(value) };
}
