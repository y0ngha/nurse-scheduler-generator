// src/validators/validateDailyCoverage.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateDailyCoverage(schedule: MonthlySchedule, _config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [dayText, assignments] of Object.entries(schedule)) {
    const day = Number(dayText);
    const shifts = Object.values(assignments);

    if (!shifts.includes('D') && !shifts.includes('DE')) {
      issues.push({ severity: 'error', code: 'MISSING_DAY_COVERAGE', message: `낮(D) 근무자가 부족합니다.`, day });
    }
    if (!shifts.includes('E') && !shifts.includes('DE')) {
      issues.push({ severity: 'error', code: 'MISSING_EVENING_COVERAGE', message: `저녁(E) 근무자가 부족합니다.`, day });
    }
    if (!shifts.includes('N')) {
      issues.push({ severity: 'error', code: 'MISSING_NIGHT_COVERAGE', message: `밤(N) 근무자가 부족합니다.`, day });
    }
  }

  return issues;
}
