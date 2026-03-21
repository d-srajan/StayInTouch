export type UrgencyLevel = "ok" | "soon" | "overdue";

export interface UrgencyResult {
  score: number;
  level: UrgencyLevel;
  daysSince: number;
  overdueness: number;
}

export function getUrgencyScore(
  lastContactDate: Date | null,
  thresholdDays: number,
  upcomingOccasionDays: number | null // null if no occasion soon
): UrgencyResult {
  const today = new Date();
  const daysSince = lastContactDate
    ? Math.floor(
        (today.getTime() - lastContactDate.getTime()) / 86_400_000
      )
    : thresholdDays * 2; // never contacted = treat as very overdue

  const overdueness = daysSince / thresholdDays;

  // occasion boost: max +1.0 if occasion is tomorrow, 0 if 7+ days away
  const occasionBoost =
    upcomingOccasionDays !== null
      ? Math.max(0, 1 - upcomingOccasionDays / 7)
      : 0;

  const score = overdueness + occasionBoost;

  const level: UrgencyLevel =
    score >= 1.5 ? "overdue" : score >= 1.0 ? "soon" : "ok";

  return { score, level, daysSince, overdueness };
}

// Sort contacts by urgency descending
export function sortByUrgency<T extends { urgency: UrgencyResult }>(
  contacts: T[]
): T[] {
  return [...contacts].sort((a, b) => b.urgency.score - a.urgency.score);
}
