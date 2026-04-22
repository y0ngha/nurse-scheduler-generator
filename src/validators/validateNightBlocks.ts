// src/validators/validateNightBlocks.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateNightBlocks(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    for (let day = 1; day <= days; day += 1) {
      if (schedule[day][nurse.id] === 'N') {
        // Check if this is the start of a sequence
        if (day === 1 || schedule[day - 1][nurse.id] !== 'N') {
          let sequenceLength = 0;
          let currentDay = day;
          while (currentDay <= days && schedule[currentDay][nurse.id] === 'N') {
            sequenceLength += 1;
            currentDay += 1;
          }

          if (sequenceLength !== config.nightBlockLength) {
            issues.push({
              severity: 'error',
              code: 'NIGHT_BLOCK_VIOLATION',
              message: `${nurse.name} has an invalid night block length of ${sequenceLength} starting on day ${day}`,
              nurseId: nurse.id,
              day,
            });
          }
          // Skip the rest of this sequence
          day = currentDay - 1;
        }
      }
    }
  }

  return issues;
}
