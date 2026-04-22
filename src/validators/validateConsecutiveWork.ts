// src/validators/validateConsecutiveWork.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateConsecutiveWork(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    if (nurse.nurseType === 'nightSpecialist') continue;

    let consecutive = 0;
    for (let day = 1; day <= days; day += 1) {
      const shift = schedule[day][nurse.id];
      if (shift === 'D' || shift === 'E' || shift === 'N') {
        consecutive += 1;
        if (consecutive > config.maxConsecutiveWorkDays) {
          issues.push({
            severity: 'error',
            code: 'MAX_CONSECUTIVE_WORK_VIOLATION',
            message: `${nurse.name} exceeded max consecutive work days on day ${day}`,
            nurseId: nurse.id,
            day,
          });
        }
      } else {
        consecutive = 0;
      }
    }
  }

  return issues;
}
