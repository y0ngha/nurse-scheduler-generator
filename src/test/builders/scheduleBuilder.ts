// src/test/builders/scheduleBuilder.ts
import { createEmptySchedule } from '../../domain/schedule';
import type { MonthlySchedule, SchedulerConfig, ShiftCode } from '../../domain/types';

type PartialScheduleInput = Record<number, Record<string, ShiftCode>>;

export function buildSchedule(config: SchedulerConfig, input: PartialScheduleInput): MonthlySchedule {
  const schedule = createEmptySchedule(config);

  for (const [dayText, assignments] of Object.entries(input)) {
    const day = Number(dayText);
    for (const [nurseId, shift] of Object.entries(assignments)) {
      schedule[day][nurseId] = shift;
    }
  }

  return schedule;
}
