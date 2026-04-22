// src/validators/validateMonthlyNightLimit.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMonthlyNightLimit(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    let nightCount = 0;
    for (const dailyAssignments of Object.values(schedule)) {
      if (dailyAssignments[nurse.id] === 'N') {
        nightCount += 1;
      }
    }

    if (nightCount > nurse.maxNightShifts) {
      issues.push({
        severity: 'error',
        code: 'MONTHLY_NIGHT_LIMIT_VIOLATION',
        message: `${nurse.name} has ${nightCount} night shifts, which exceeds the limit of ${nurse.maxNightShifts}`,
        nurseId: nurse.id,
      });
    }
  }

  return issues;
}
