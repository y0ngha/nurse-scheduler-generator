// src/validators/validateDailyCoverage.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateDailyCoverage(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = [
    ['D', 'MISSING_DAY_COVERAGE', 'day'],
    ['E', 'MISSING_EVENING_COVERAGE', 'evening'],
    ['N', 'MISSING_NIGHT_COVERAGE', 'night'],
  ] as const;

  for (const [dayText, assignments] of Object.entries(schedule)) {
    const day = Number(dayText);
    const shifts = config.nurses.map((nurse) => assignments[nurse.id]);

    for (const [shift, code, label] of required) {
      if (!shifts.includes(shift)) {
        issues.push({
          severity: 'error',
          code,
          message: `Missing ${label} coverage on day ${day}`,
          day,
        });
      }
    }
  }

  return issues;
}
