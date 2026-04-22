// src/engine/buildNightSpecialistBlocks.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule, SchedulerConfig } from '../domain/types';

export function buildNightSpecialistBlocks(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const specialist = config.nurses.find((nurse) => nurse.nurseType === 'nightSpecialist');

  if (!specialist) {
    return next;
  }

  let placedNights = 0;
  const target = specialist.maxNightShifts;
  const days = Object.keys(next).length;

  for (let start = 1; start <= days && placedNights < target; start += 1) {
    const blockDays = [start, start + 1, start + 2];
    const recoveryDays = [
      start + 3,
      start + 4,
      start + 5,
    ].slice(0, specialist.nightRecoveryOffDays);

    const fits = blockDays.every((day) => day <= days);
    const mandatoryCollision = blockDays.some((day) => specialist.mandatoryOffDates.includes(day));
    const assignmentCollision = blockDays.some(
      (day) => next[day][specialist.id] !== null && next[day][specialist.id] !== 'O'
    );

    if (!fits || mandatoryCollision || assignmentCollision) {
      continue;
    }

    blockDays.forEach((day) => {
      next[day][specialist.id] = 'N';
      placedNights += 1;
    });

    recoveryDays.forEach((day) => {
      if (day <= days) {
        if (next[day][specialist.id] === null) next[day][specialist.id] = 'O';
      }
    });
    
    // Jump forward to avoid overlapping blocks
    start += blockDays.length + recoveryDays.length - 1;
  }

  for (const day of specialist.mandatoryOffDates) {
    next[day][specialist.id] = 'O';
  }

  return next;
}
