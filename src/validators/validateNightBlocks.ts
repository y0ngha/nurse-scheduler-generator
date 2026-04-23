// src/validators/validateNightBlocks.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateNightBlocks(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const days = Object.keys(schedule).length;

  for (const nurse of config.nurses) {
    if (nurse.id === 'HELPER') continue;
    for (let day = 1; day <= days; day += 1) {
      if (schedule[day][nurse.id] === 'N') {
        if (day === 1 || schedule[day - 1][nurse.id] !== 'N') {
          let sequenceLength = 0;
          let currentDay = day;
          while (currentDay <= days && schedule[currentDay][nurse.id] === 'N') {
            sequenceLength += 1;
            currentDay += 1;
          }

          // 예외 처리: 월말에 걸쳐 있어서 3일을 채울 수 없는 경우는 오류에서 제외
          const isEndOfMonth = (day + sequenceLength - 1) === days;
          
          if (sequenceLength !== config.nightBlockLength && !isEndOfMonth) {
            issues.push({
              severity: 'error',
              code: 'NIGHT_BLOCK_VIOLATION',
              message: `${nurse.name} 간호사의 밤번(N) 근무 블록이 ${config.nightBlockLength}일 연속 규정을 위반했습니다. (현재: ${sequenceLength}일)`,
              nurseId: nurse.id,
              day,
            });
          }
          day = currentDay - 1;
        }
      }
    }
  }

  return issues;
}
