// src/validators/validateMonthlyNightLimit.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMonthlyNightLimit(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    if (nurse.id === 'HELPER') continue;
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
        message: `${nurse.name} 간호사의 월간 밤번(N) 횟수(${nightCount}회)가 제한(${nurse.maxNightShifts}회)을 초과했습니다.`,
        nurseId: nurse.id,
      });
    }
  }

  return issues;
}
