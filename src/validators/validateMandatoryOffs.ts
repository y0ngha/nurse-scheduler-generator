// src/validators/validateMandatoryOffs.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMandatoryOffs(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    for (const day of nurse.mandatoryOffDates) {
      if (schedule[day]?.[nurse.id] !== 'O') {
        issues.push({
          severity: 'error',
          code: 'MANDATORY_OFF_VIOLATION',
          message: `${nurse.name} must be off on day ${day}`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
