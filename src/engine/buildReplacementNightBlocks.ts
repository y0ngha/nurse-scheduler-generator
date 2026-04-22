// src/engine/buildReplacementNightBlocks.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule, SchedulerConfig, ScheduleGenerationResult } from '../domain/types';

export function buildReplacementNightBlocks(schedule: MonthlySchedule, config: SchedulerConfig): ScheduleGenerationResult {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;

  for (let day = 1; day <= days; day += 1) {
    const hasNight = config.nurses.some((nurse) => next[day][nurse.id] === 'N');
    const specialist = config.nurses.find((nurse) => nurse.nurseType === 'nightSpecialist');

    // Only attempt replacement if night coverage is missing AND specialist is definitely off
    if (hasNight || (specialist && next[day][specialist.id] === 'N')) {
      continue;
    }

    const candidates = config.nurses
      .filter((nurse) => nurse.nurseType === 'general' && nurse.allowedShifts.includes('N'))
      .filter((nurse) => {
        const blockDays = Array.from({ length: config.nightBlockLength }, (_, i) => day + i);
        const recoveryDays = Array.from({ length: nurse.nightRecoveryOffDays }, (_, i) => day + config.nightBlockLength + i);
        const allDays = [...blockDays, ...recoveryDays];

        return blockDays.every((d) => d <= days) &&
          blockDays.every((d) => next[d][nurse.id] === null) &&
          recoveryDays.every((d) => d > days || next[d][nurse.id] === null || next[d][nurse.id] === 'O') &&
          !blockDays.some((d) => nurse.mandatoryOffDates.includes(d));
      })
      .sort((a, b) => a.maxNightShifts - b.maxNightShifts);

    const candidate = candidates[0];

    if (!candidate) {
      return {
        ok: false,
        error: {
          reason: `No eligible night replacement on day ${day}`,
          errors: [
            {
              severity: 'error',
              code: 'MISSING_NIGHT_COVERAGE',
              message: `No eligible general nurse can cover night block starting on day ${day}`,
              day,
            },
          ],
        },
      };
    }

    Array.from({ length: config.nightBlockLength }, (_, i) => day + i).forEach((d) => {
      next[d][candidate.id] = 'N';
    });

    Array.from({ length: candidate.nightRecoveryOffDays }, (_, i) => day + config.nightBlockLength + i).forEach((d) => {
      if (d <= days) {
        if (next[d][candidate.id] === null) next[d][candidate.id] = 'O';
      }
    });
    
    // Jump forward after placing a block
    day += config.nightBlockLength - 1;
  }

  return {
    ok: true,
    data: {
      schedule: next,
      validation: { isValid: true, errors: [], warnings: [] },
    },
  };
}
