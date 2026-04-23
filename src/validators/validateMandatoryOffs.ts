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
          message: `${nurse.name} 간호사는 해당 일자에 반드시 휴무해야 합니다.`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
