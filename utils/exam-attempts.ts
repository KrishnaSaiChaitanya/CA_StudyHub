import { StudentLevel } from "@/utils/supabase/types";

/** Attempt months for each CA level */
export const ATTEMPT_MONTHS: Record<StudentLevel, number[]> = {
  foundation: [1, 5, 9],    // January, May, September
  intermediate: [1, 5, 9],  // January, May, September
  final: [5, 11],           // May, November
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type AttemptOption = {
  /** Month number 1-12 */
  month: number;
  /** Display label e.g. "Sep 2026" */
  label: string;
  /** Target date (1st of month) */
  targetDate: Date;
};

/**
 * Generate upcoming attempt options for a given student level.
 * Returns the next 3-4 upcoming attempt windows with labels including year.
 */
export function getUpcomingAttempts(level: StudentLevel, count = 4): AttemptOption[] {
  const months = ATTEMPT_MONTHS[level] || [1, 5, 9];
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  todayMidnight.setHours(0, 0, 0, 0);

  const attempts: AttemptOption[] = [];
  const currentYear = now.getFullYear();

  for (let i = 0; i < 4 && attempts.length < count; i++) {
    const year = currentYear + i;
    for (const m of months) {
      if (attempts.length >= count) break;

      const targetDate = new Date(year, m - 1, 1);
      targetDate.setHours(0, 0, 0, 0);

      // Only include attempts that are strictly in the future
      if (targetDate.getTime() <= todayMidnight.getTime()) {
        continue;
      }

      attempts.push({
        month: m,
        label: `${MONTH_NAMES[m - 1]} ${year}`,
        targetDate,
      });
    }
  }

  return attempts;
}

/**
 * Compute target date for countdown given an exam_attempt_month.
 * If year is provided, targets that year. Otherwise, returns the 1st of the next occurrence of that month in the future.
 */
export function getTargetDateForMonth(month: number, year?: number | null): Date {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  todayMidnight.setHours(0, 0, 0, 0);

  if (year) {
    const target = new Date(year, month - 1, 1);
    target.setHours(0, 0, 0, 0);
    return target;
  }

  let targetYear = now.getFullYear();
  let targetDate = new Date(targetYear, month - 1, 1);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() <= todayMidnight.getTime()) {
    targetDate = new Date(targetYear + 1, month - 1, 1);
    targetDate.setHours(0, 0, 0, 0);
  }

  return targetDate;
}

/**
 * Calculate remaining days until targetDate (normalized to midnight to prevent timezone offsets).
 */
export function calculateDaysLeft(targetDate: Date, fromDate = new Date()): number {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}
