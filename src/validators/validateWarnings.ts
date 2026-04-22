// src/validators/validateWarnings.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateWarnings(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const specialist = config.nurses.find((nurse) => nurse.nurseType === 'nightSpecialist');

  for (const [dayText, assignments] of Object.entries(schedule)) {
    const day = Number(dayText);
    const hasSpecialistNight = specialist && assignments[specialist.id] === 'N';

    if (hasSpecialistNight) {
      for (const nurse of config.nurses) {
        if (nurse.nurseType === 'general' && assignments[nurse.id] === 'N') {
          issues.push({
            severity: 'warning',
            code: 'UNNECESSARY_GENERAL_NIGHT_ASSIGNMENT',
            message: `General nurse ${nurse.name} was assigned a night shift on day ${day} while a night specialist was already covering it.`,
            nurseId: nurse.id,
            day,
          });
        }
      }
    }
  }

  return issues;
}
