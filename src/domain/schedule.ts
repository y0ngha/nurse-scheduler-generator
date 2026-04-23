import type { MonthlySchedule, NurseConfig, NurseId } from './types';
import { getMonthLength } from './calendar';

export { getMonthLength } from './calendar';

export function createEmptySchedule(config: { year: number; month: number; nurses: NurseConfig[] }): MonthlySchedule {
  const days = getMonthLength(config.year, config.month);
  const schedule: MonthlySchedule = {};

  for (let day = 1; day <= days; day += 1) {
    schedule[day] = {};
    for (const nurse of config.nurses) {
      schedule[day][nurse.id] = null;
    }
    schedule[day]['HELPER'] = null;
    schedule[day]['HELPER_2'] = null;
  }

  return schedule;
}

export function cloneSchedule(schedule: MonthlySchedule): MonthlySchedule {
  return JSON.parse(JSON.stringify(schedule));
}

export function summarizeSchedule(
  schedule: MonthlySchedule,
  nurses: NurseConfig[]
): Record<NurseId, { totalD: number; totalE: number; totalN: number; totalO: number }> {
  const summary: Record<NurseId, { totalD: number; totalE: number; totalN: number; totalO: number }> = {};
  const allNurseIds = [...nurses.map(n => n.id), 'HELPER', 'HELPER_2'];
  for (const id of allNurseIds) {
    summary[id] = { totalD: 0, totalE: 0, totalN: 0, totalO: 0 };
  }

  for (const daily of Object.values(schedule)) {
    for (const [nurseId, shift] of Object.entries(daily)) {
      if (!summary[nurseId]) continue;
      
      if (shift === 'D') summary[nurseId].totalD += 1;
      else if (shift === 'E') summary[nurseId].totalE += 1;
      else if (shift === 'N') summary[nurseId].totalN += 1;
      else if (shift === 'O') summary[nurseId].totalO += 1;
      else if (shift === 'DE') {
        summary[nurseId].totalD += 1;
        summary[nurseId].totalE += 1;
      }
    }
  }
  return summary;
}
