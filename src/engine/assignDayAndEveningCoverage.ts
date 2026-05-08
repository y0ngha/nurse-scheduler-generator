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

function getConsecutiveWorkDaysAfter(schedule: MonthlySchedule, nurseId: string, fromDayExclusive: number): number {
  let count = 0;
  const days = Object.keys(schedule).length;
  for (let day = fromDayExclusive + 1; day <= days; day += 1) {
    if (isWorkShift(schedule[day][nurseId])) count += 1;
    else break;
  }
  return count;
}

function wouldRespectConsecutiveWorkLimit(
  schedule: MonthlySchedule,
  nurseId: string,
  day: number,
  config: SchedulerConfig
): boolean {
  const consecutiveDaysIncludingTarget =
    getConsecutiveWorkDays(schedule, nurseId, day) +
    1 +
    getConsecutiveWorkDaysAfter(schedule, nurseId, day);

  return consecutiveDaysIncludingTarget <= config.maxConsecutiveWorkDays;
}

function canAssign(
  schedule: MonthlySchedule, 
  nurse: NurseConfig, 
  day: number, 
  targetShift: 'D' | 'E', 
  config: SchedulerConfig
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
  if (!wouldRespectConsecutiveWorkLimit(schedule, nurse.id, day, config)) return false;

  if (targetShift === 'D' && day > 1) {
    const prev = schedule[day - 1][nurse.id];
    if (prev === 'E' || prev === 'DE') return false;
  }

  return true;
}

function canUpgradeToDouble(
  schedule: MonthlySchedule,
  nurse: NurseConfig,
  day: number,
  missingShift: 'D' | 'E',
  config: SchedulerConfig
): boolean {
  if (!nurse.allowedShifts.includes(missingShift)) return false;
  if (!wouldRespectConsecutiveWorkLimit(schedule, nurse.id, day, config)) return false;

  if (missingShift === 'D' && day > 1) {
    const prev = schedule[day - 1][nurse.id];
    if (prev === 'E' || prev === 'DE') return false;
  }

  return true;
}

function assignHelperShift(schedule: MonthlySchedule, day: number, shift: 'D' | 'E'): void {
  const helperId = ['HELPER', 'HELPER_2'].find((id) => schedule[day][id] === null);
  if (helperId) {
    schedule[day][helperId] = shift;
  }
}

export function assignDayAndEveningCoverage(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;
  const generalNurses = config.nurses.filter(n => n.nurseType === 'general');

  for (let day = 1; day <= days; day += 1) {
    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
      const summary = summarizeSchedule(next, config.nurses);
      const candidates = generalNurses
        .filter(n => next[day][n.id] === null && canAssign(next, n, day, 'D', config))
        .sort((a, b) => (summary[a.id].totalD + summary[a.id].totalE + summary[a.id].totalN) - (summary[b.id].totalD + summary[b.id].totalE + summary[b.id].totalN));

      if (candidates.length > 0) {
        next[day][candidates[0].id] = 'D';
      }
    }

    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
      const summary = summarizeSchedule(next, config.nurses);
      const candidates = generalNurses
        .filter(n => next[day][n.id] === null && canAssign(next, n, day, 'E', config))
        .sort((a, b) => (summary[a.id].totalD + summary[a.id].totalE + summary[a.id].totalN) - (summary[b.id].totalD + summary[b.id].totalE + summary[b.id].totalN));

      if (candidates.length > 0) {
        next[day][candidates[0].id] = 'E';
      }
    }

    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
        const eNurse = generalNurses.find(nurse => next[day][nurse.id] === 'E' && canUpgradeToDouble(next, nurse, day, 'D', config));
        if (eNurse) next[day][eNurse.id] = 'DE';
    }
    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
        const dNurse = generalNurses.find(nurse => next[day][nurse.id] === 'D' && canUpgradeToDouble(next, nurse, day, 'E', config));
        if (dNurse) next[day][dNurse.id] = 'DE';
    }

    if (!Object.values(next[day]).some(s => s === 'D' || s === 'DE')) {
        assignHelperShift(next, day, 'D');
    }
    if (!Object.values(next[day]).some(s => s === 'E' || s === 'DE')) {
        assignHelperShift(next, day, 'E');
    }
  }

  return next;
}
