import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMonthlyOffRange(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    // 헬퍼 및 야간 전담은 휴무 일수 검증에서 제외
    if (nurse.id === 'HELPER' || nurse.nurseType === 'nightSpecialist') continue;

    const minRequired = nurse.minOffDays ?? config.globalMinOffDays;
    
    let offCount = 0;
    for (const dailyAssignments of Object.values(schedule)) {
      if (dailyAssignments[nurse.id] === 'O') {
        offCount += 1;
      }
    }

    if (offCount < minRequired) {
      issues.push({
        severity: 'error',
        code: 'OFF_RANGE_VIOLATION',
        message: `${nurse.name} 간호사의 휴무가 ${offCount}일로, 최소 보장 휴무(${minRequired}일)보다 부족합니다.`,
        nurseId: nurse.id,
      });
    }
  }

  return issues;
}
