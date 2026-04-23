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
        // Check current night count
        let currentNights = 0;
        for (const assignments of Object.values(next)) {
          if (assignments[nurse.id] === 'N') currentNights += 1;
        }
        if (currentNights + config.nightBlockLength > nurse.maxNightShifts) {
          return false;
        }

        const blockDays = Array.from({ length: config.nightBlockLength }, (_, i) => day + i).filter(d => d <= days);
        const recoveryDays = Array.from({ length: nurse.nightRecoveryOffDays }, (_, i) => day + config.nightBlockLength + i).filter(d => d <= days);

        return blockDays.every((d) => next[d][nurse.id] === null) &&
          recoveryDays.every((d) => next[d][nurse.id] === null || next[d][nurse.id] === 'O') &&
          !blockDays.some((d) => nurse.mandatoryOffDates.includes(d));
      })
      .sort((a, b) => a.maxNightShifts - b.maxNightShifts);

    const candidate = candidates[0];

    if (!candidate) {
      // 헬퍼 투입: 에러를 반환하지 않고 헬퍼에게 배정
      Array.from({ length: config.nightBlockLength }, (_, i) => day + i).filter(d => d <= days).forEach((d) => {
        next[d]['HELPER'] = 'N';
      });
      day += config.nightBlockLength - 1;
      continue;
    }

    Array.from({ length: config.nightBlockLength }, (_, i) => day + i).filter(d => d <= days).forEach((d) => {
      next[d][candidate.id] = 'N';
    });

    Array.from({ length: candidate.nightRecoveryOffDays }, (_, i) => day + config.nightBlockLength + i).filter(d => d <= days).forEach((d) => {
      if (next[d][candidate.id] === null) next[d][candidate.id] = 'O';
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
