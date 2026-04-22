// src/validators/validateMonthlyOffRange.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMonthlyOffRange(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    if (!nurse.offRange) continue;

    let offCount = 0;
    for (const dailyAssignments of Object.values(schedule)) {
      if (dailyAssignments[nurse.id] === 'O') {
        offCount += 1;
      }
    }

    if (offCount < nurse.offRange.min || offCount > nurse.offRange.max) {
      issues.push({
        severity: 'error',
        code: 'OFF_RANGE_VIOLATION',
        message: `${nurse.name} has ${offCount} off days, which is outside the range [${nurse.offRange.min}, ${nurse.offRange.max}]`,
        nurseId: nurse.id,
      });
    }
  }

  return issues;
}
