// src/validators/validateAllowedShiftTypes.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateAllowedShiftTypes(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    for (const [dayText, assignments] of Object.entries(schedule)) {
      const day = Number(dayText);
      const shift = assignments[nurse.id];
      if (shift === null || shift === 'O') continue;

      // DE의 경우 D와 E 모두 허용되어야 함
      if (shift === 'DE') {
        if (!nurse.allowedShifts.includes('D') || !nurse.allowedShifts.includes('E')) {
          issues.push({
            severity: 'error',
            code: 'DISALLOWED_SHIFT',
            message: `${nurse.name} 간호사는 더블 근무(DE)를 수행할 수 없습니다. (낮 또는 저녁 근무 권한 없음)`,
            nurseId: nurse.id,
            day,
          });
        }
      } else if (!nurse.allowedShifts.includes(shift)) {
        issues.push({
          severity: 'error',
          code: 'DISALLOWED_SHIFT',
          message: `${nurse.name} 간호사는 해당 근무(${shift})를 수행할 수 없습니다.`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
