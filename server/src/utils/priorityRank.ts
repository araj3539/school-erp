/**
 * Numeric rank for the low/normal/high/urgent priority enums.
 *
 * Priority strings must never be sorted lexicographically: descending string
 * order is urgent > normal > low > high, which would process/display "high"
 * items last. Sort by the numeric rank instead (higher = more important).
 */
export const PRIORITY_RANKS: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };

export function priorityRank(priority: string | null | undefined): number {
  return PRIORITY_RANKS[priority ?? "normal"] ?? PRIORITY_RANKS.normal;
}
