// src/validators/validateAllowedShiftTypes.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateAllowedShiftTypes(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    for (const [dayText, assignments] of Object.entries(schedule)) {
      const day = Number(dayText);
      const shift = assignments[nurse.id];
      if (shift !== null && !nurse.allowedShifts.includes(shift)) {
        issues.push({
          severity: 'error',
          code: 'DISALLOWED_SHIFT',
          message: `${nurse.name} cannot work ${shift} on day ${day}`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
