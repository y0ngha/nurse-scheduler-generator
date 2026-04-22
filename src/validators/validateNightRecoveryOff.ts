// src/validators/validateNightRecoveryOff.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateNightRecoveryOff(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    for (let day = 1; day <= days; day += 1) {
      if (schedule[day][nurse.id] === 'N') {
        // Find end of night block
        let currentDay = day;
        while (currentDay <= days && schedule[currentDay][nurse.id] === 'N') {
          currentDay += 1;
        }
        const blockEnd = currentDay - 1;
        
        // Check recovery off days
        const recoveryDaysNeeded = nurse.nightRecoveryOffDays;
        for (let r = 1; r <= recoveryDaysNeeded; r += 1) {
          const recoveryDay = blockEnd + r;
          if (recoveryDay <= days) {
            if (schedule[recoveryDay][nurse.id] !== 'O') {
              issues.push({
                severity: 'error',
                code: 'NIGHT_RECOVERY_OFF_VIOLATION',
                message: `${nurse.name} must be off for recovery on day ${recoveryDay} after night block ending on day ${blockEnd}`,
                nurseId: nurse.id,
                day: recoveryDay,
              });
            }
          }
        }
        // Skip the block we just processed
        day = blockEnd;
      }
    }
  }

  return issues;
}
