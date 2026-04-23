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
            message: `야간 전담 간호사가 이미 배치된 날(${day}일)에 일반 간호사(${nurse.name})가 추가로 밤번(N) 근무를 수행합니다.`,
            nurseId: nurse.id,
            day,
          });
        }
      }
    }
  }

  return issues;
}
