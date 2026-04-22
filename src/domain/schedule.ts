import { getMonthLength } from './calendar';
import type { DailyAssignments, MonthlySchedule, NurseConfig, SchedulerConfig } from './types';

export function createEmptySchedule(config: SchedulerConfig): MonthlySchedule {
  const days = getMonthLength(config.year, config.month);
  const schedule = {} as MonthlySchedule;

  for (let day = 1; day <= days; day += 1) {
    schedule[day] = {} as DailyAssignments;
    for (const nurse of config.nurses) {
      schedule[day][nurse.id] = null;
    }
  }

  return schedule;
}

export function cloneSchedule(schedule: MonthlySchedule): MonthlySchedule {
  return JSON.parse(JSON.stringify(schedule));
}

export function summarizeSchedule(
  schedule: MonthlySchedule,
  nurses: NurseConfig[]
): Record<string, { totalD: number; totalE: number; totalN: number; totalO: number }> {
  const summary: Record<string, { totalD: number; totalE: number; totalN: number; totalO: number }> = {};

  for (const nurse of nurses) {
    summary[nurse.id] = { totalD: 0, totalE: 0, totalN: 0, totalO: 0 };
  }

  for (const dailyAssignments of Object.values(schedule)) {
    for (const nurse of nurses) {
      const shift = dailyAssignments[nurse.id];
      if (shift === 'D') summary[nurse.id].totalD += 1;
      if (shift === 'E') summary[nurse.id].totalE += 1;
      if (shift === 'N') summary[nurse.id].totalN += 1;
      if (shift === 'O') summary[nurse.id].totalO += 1;
    }
  }

  return summary;
}

export { getMonthLength };
