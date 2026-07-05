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
  const months = ATTEMPT_MONTHS[level];
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentYear = now.getFullYear();

  const attempts: AttemptOption[] = [];
  let year = currentYear;
  let startMonth = currentMonth;

  // Generate enough attempts
  for (let i = 0; i < 3 && attempts.length < count; i++) {
    for (const m of months) {
      if (attempts.length >= count) break;

      let targetYear = year + i;
      // For the first iteration, skip months that have already passed
      if (i === 0 && m < startMonth) continue;

      const targetDate = new Date(targetYear, m - 1, 1); // 1st of the month
      // Only include dates in the future
      if (targetDate <= now) continue;

      attempts.push({
        month: m,
        label: `${MONTH_NAMES[m - 1]} ${targetYear}`,
        targetDate,
      });
    }
  }

  return attempts;
}

/**
 * Compute target date for countdown given an exam_attempt_month.
 * Returns the 1st of the next occurrence of that month from today.
 */
export function getTargetDateForMonth(month: number): Date {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let targetYear = currentYear;
  // If the month is <= current month, it means next year
  if (month <= currentMonth) {
    targetYear = currentYear + 1;
  }

  return new Date(targetYear, month - 1, 1);
}
