// src/engine/assignDayAndEveningCoverage.ts
import { cloneSchedule, summarizeSchedule } from '../domain/schedule';
import type { MonthlySchedule, NurseConfig, SchedulerConfig, ShiftCode } from '../domain/types';
import { getMonthLength } from '../domain/calendar';

function isWorkShift(shift: ShiftCode | null): boolean {
  return shift === 'D' || shift === 'E' || shift === 'N' || shift === 'DE';
}

function getConsecutiveWorkDays(schedule: MonthlySchedule, nurseId: string, upToDayExclusive: number): number {
  let count = 0;
  for (let day = upToDayExclusive - 1; day >= 1; day -= 1) {
    if (isWorkShift(schedule[day][nurseId])) count += 1;
    else break;
  }
  return count;
}

function canAssign(
  schedule: MonthlySchedule, 
  nurse: NurseConfig, 
  day: number, 
  targetShift: 'D' | 'E', 
  config: SchedulerConfig,
  _currentSummary: Record<string, any>
): boolean {
  if (!nurse.allowedShifts.includes(targetShift)) return false;
  if (nurse.mandatoryOffDates.includes(day)) return false;
  if (schedule[day][nurse.id] === 'N') return false;

  const monthLength = getMonthLength(config.year, config.month);
  const minOff = nurse.minOffDays ?? config.globalMinOffDays;
  const maxWork = monthLength - minOff;
  
  let workCount = 0;
  for(let d=1; d<=monthLength; d++) {
    if(isWorkShift(schedule[d][nurse.id])) workCount++;
  }
  if (workCount >= maxWork) return false;
  if (getConsecutiveWorkDays(schedule, nurse.id, day) >= config.maxConsecutiveWorkDays) return false;

  if (targetShift === 'D' && day > 1) {
    const prev = schedule[day - 1][nurse.id];
    if (prev === 'E' || prev === 'DE') return false;
  }

  return true;
}

export function assignDayAndEveningCoverage(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;
  const generalNurses = config.nurses.filter(n => n.nurseType === 'general');

  for (let day = 1; day <= days; day += 1) {
    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
      const summary = summarizeSchedule(next, config.nurses);
      const candidates = generalNurses
        .filter(n => next[day][n.id] === null && canAssign(next, n, day, 'D', config, summary))
        .sort((a, b) => (summary[a.id].totalD + summary[a.id].totalE + summary[a.id].totalN) - (summary[b.id].totalD + summary[b.id].totalE + summary[b.id].totalN));

      if (candidates.length > 0) {
        next[day][candidates[0].id] = 'D';
      }
    }

    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
      const summary = summarizeSchedule(next, config.nurses);
      const candidates = generalNurses
        .filter(n => next[day][n.id] === null && canAssign(next, n, day, 'E', config, summary))
        .sort((a, b) => (summary[a.id].totalD + summary[a.id].totalE + summary[a.id].totalN) - (summary[b.id].totalD + summary[b.id].totalE + summary[b.id].totalN));

      if (candidates.length > 0) {
        next[day][candidates[0].id] = 'E';
      }
    }

    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
        const eNurseId = Object.keys(next[day]).find(id => next[day][id] === 'E' && id !== 'HELPER' && id !== 'HELPER_2');
        if (eNurseId) next[day][eNurseId] = 'DE';
    }
    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
        const dNurseId = Object.keys(next[day]).find(id => next[day][id] === 'D' && id !== 'HELPER' && id !== 'HELPER_2');
        if (dNurseId) next[day][dNurseId] = 'DE';
    }

    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
        next[day]['HELPER'] = 'D';
    }
    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
        if (next[day]['HELPER'] === 'D') next[day]['HELPER_2'] = 'E';
        else next[day]['HELPER'] = 'E';
    }
  }

  return next;
}
