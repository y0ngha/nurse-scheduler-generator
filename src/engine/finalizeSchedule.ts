// src/engine/finalizeSchedule.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule } from '../domain/types';

export function finalizeSchedule(schedule: MonthlySchedule): MonthlySchedule {
  const next = cloneSchedule(schedule);

  for (const assignments of Object.values(next)) {
    for (const nurseId of Object.keys(assignments)) {
      if (assignments[nurseId] === null) {
        assignments[nurseId] = 'O';
      }
    }
  }

  return next;
}
