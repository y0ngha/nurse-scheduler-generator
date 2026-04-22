// src/engine/assignDayAndEveningCoverage.ts
import { cloneSchedule, summarizeSchedule } from '../domain/schedule';
import type { MonthlySchedule, NurseConfig, SchedulerConfig } from '../domain/types';

function isWorkShift(shift: string | null): boolean {
  return shift === 'D' || shift === 'E' || shift === 'N';
}

function getConsecutiveWorkDays(schedule: MonthlySchedule, nurseId: string, upToDayExclusive: number): number {
  let count = 0;

  for (let day = upToDayExclusive - 1; day >= 1; day -= 1) {
    if (isWorkShift(schedule[day][nurseId])) count += 1;
    else break;
  }

  return count;
}

function canAssignShift(schedule: MonthlySchedule, nurse: NurseConfig, day: number, shift: 'D' | 'E', config: SchedulerConfig): boolean {
  if (!nurse.allowedShifts.includes(shift)) return false;
  if (schedule[day][nurse.id] !== null) return false;
  if (nurse.mandatoryOffDates.includes(day)) return false;
  if (getConsecutiveWorkDays(schedule, nurse.id, day) >= config.maxConsecutiveWorkDays) return false;
  if (shift === 'D' && day > 1 && schedule[day - 1][nurse.id] === 'E') return false;
  
  // Also check if any future mandatory constraints prevent this.
  // For example, if we assign a shift on Day X, does it violate the night recovery rules or consecutive work later?
  // For now, let's keep it simple as per the plan.
  return true;
}

export function assignDayAndEveningCoverage(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;

  for (let day = 1; day <= days; day += 1) {
    const summary = summarizeSchedule(next, config.nurses);
    const generalCandidates = config.nurses.filter((nurse) => nurse.nurseType === 'general');

    // Assign Day Coverage if missing
    if (!Object.values(next[day]).includes('D')) {
      const candidates = generalCandidates
        .filter((nurse) => canAssignShift(next, nurse, day, 'D', config))
        .sort((a, b) => {
          const sumA = summary[a.id];
          const sumB = summary[b.id];
          // Heuristic: Prefer nurse with fewer total work days (D+E+N)
          const totalWorkA = sumA.totalD + sumA.totalE + sumA.totalN;
          const totalWorkB = sumB.totalD + sumB.totalE + sumB.totalN;
          return totalWorkA - totalWorkB || sumA.totalD - sumB.totalD;
        });

      const candidate = candidates[0];
      if (candidate) {
        next[day][candidate.id] = 'D';
      }
    }

    // Assign Evening Coverage if missing
    if (!Object.values(next[day]).includes('E')) {
      const candidates = generalCandidates
        .filter((nurse) => canAssignShift(next, nurse, day, 'E', config))
        .sort((a, b) => {
          const sumA = summary[a.id];
          const sumB = summary[b.id];
          const totalWorkA = sumA.totalD + sumA.totalE + sumA.totalN;
          const totalWorkB = sumB.totalD + sumB.totalE + sumB.totalN;
          return totalWorkA - totalWorkB || sumA.totalE - sumB.totalE;
        });

      const candidate = candidates[0];
      if (candidate) {
        next[day][candidate.id] = 'E';
      }
    }
  }

  return next;
}
