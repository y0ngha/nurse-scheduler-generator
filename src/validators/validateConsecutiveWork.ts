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
      // D, E, N, DE 모두 근무일로 산정
      if (shift === 'D' || shift === 'E' || shift === 'N' || shift === 'DE') {
        consecutive += 1;
        if (consecutive > config.maxConsecutiveWorkDays) {
          issues.push({
            severity: 'error',
            code: 'MAX_CONSECUTIVE_WORK_VIOLATION',
            message: `${nurse.name} 간호사가 최대 연속 근무 제한(${config.maxConsecutiveWorkDays}일)을 초과했습니다.`,
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
