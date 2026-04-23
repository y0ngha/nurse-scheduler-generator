// src/validators/validateNightRecoveryOff.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateNightRecoveryOff(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    if (nurse.id === 'HELPER') continue;
    for (let day = 1; day <= days; day += 1) {
      if (schedule[day][nurse.id] === 'N') {
        let currentDay = day;
        while (currentDay <= days && schedule[currentDay][nurse.id] === 'N') {
          currentDay += 1;
        }
        const blockEnd = currentDay - 1;
        const recoveryDaysNeeded = nurse.nightRecoveryOffDays;
        for (let r = 1; r <= recoveryDaysNeeded; r += 1) {
          const recoveryDay = blockEnd + r;
          if (recoveryDay <= days) {
            if (schedule[recoveryDay][nurse.id] !== 'O') {
              issues.push({
                severity: 'error',
                code: 'NIGHT_RECOVERY_OFF_VIOLATION',
                message: `${nurse.name} 간호사는 밤번(N) 근무 후 최소 ${recoveryDaysNeeded}일의 회복 휴식이 필요합니다.`,
                nurseId: nurse.id,
                day: recoveryDay,
              });
            }
          }
        }
        day = blockEnd;
      }
    }
  }

  return issues;
}
