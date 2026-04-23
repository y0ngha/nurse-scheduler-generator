// src/validators/validateEveningToDay.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateEveningToDay(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  if (!config.forbidEveningToNextDay) return [];
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    if (nurse.id === 'HELPER') continue;

    for (let day = 1; day < days; day += 1) {
      const currentShift = schedule[day][nurse.id];
      const nextShift = schedule[day + 1][nurse.id];
      
      // 현재 날짜가 E 또는 DE인 경우 다음 날 D 또는 DE 배정 불가
      const isEvening = currentShift === 'E' || currentShift === 'DE';
      const isNextDay = nextShift === 'D' || nextShift === 'DE';

      if (isEvening && isNextDay) {
        issues.push({
          severity: 'error',
          code: 'EVENING_TO_DAY_VIOLATION',
          message: `${nurse.name} 간호사는 저녁(E) 근무 다음 날 바로 낮(D) 근무를 수행할 수 없습니다.`,
          nurseId: nurse.id,
          day: day + 1,
        });
      }
    }
  }

  return issues;
}
