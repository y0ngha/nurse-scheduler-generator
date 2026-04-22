// src/validators/validateEveningToDay.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateEveningToDay(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  if (!config.forbidEveningToNextDay) return [];
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    if (!nurse.allowedShifts.includes('D') || !nurse.allowedShifts.includes('E')) continue;

    for (let day = 1; day < days; day += 1) {
      if (schedule[day][nurse.id] === 'E' && schedule[day + 1][nurse.id] === 'D') {
        issues.push({
          severity: 'error',
          code: 'EVENING_TO_DAY_VIOLATION',
          message: `${nurse.name} cannot work Day after Evening on day ${day}`,
          nurseId: nurse.id,
          day: day + 1,
        });
      }
    }
  }

  return issues;
}
