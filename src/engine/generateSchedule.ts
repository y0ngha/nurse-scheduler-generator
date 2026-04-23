import { createEmptySchedule } from '../domain/schedule';
import type { ScheduleGenerationResult, SchedulerConfig, MonthlySchedule } from '../domain/types';
import { buildNightSpecialistBlocks } from './buildNightSpecialistBlocks';
import { buildReplacementNightBlocks } from './buildReplacementNightBlocks';
import { assignDayAndEveningCoverage } from './assignDayAndEveningCoverage';
import { finalizeSchedule } from './finalizeSchedule';
import { validateSchedule } from '../validators/validateSchedule';

export function generateSchedule(config: SchedulerConfig): ScheduleGenerationResult {
  const empty = createEmptySchedule(config);
  
  // Stage 2: Specialist blocks
  const withSpecialist = buildNightSpecialistBlocks(empty, config);
  
  // Stage 3: Replacement night blocks
  const replacementResult = buildReplacementNightBlocks(withSpecialist, config);
  
  // 타입 가드 명시적 적용
  let withNight: MonthlySchedule;
  if ('data' in replacementResult) {
    withNight = replacementResult.data.schedule;
  } else {
    withNight = empty;
  }

  // Stage 4: Day and Evening coverage
  const withCoverage = assignDayAndEveningCoverage(withNight, config);
  
  // Stage 5: Finalize
  const finalized = finalizeSchedule(withCoverage);
  
  // Stage 6: Validation
  const validation = validateSchedule(finalized, config);

  const usedHelper = Object.values(finalized).some(day => 
    day['HELPER'] !== null || day['HELPER_2'] !== null
  );

  if (usedHelper) {
    validation.warnings.push({
      severity: 'warning',
      code: 'HELPER_USED',
      message: '인력 부족으로 인해 외부 헬퍼가 투입되었습니다.'
    });
  }

  return {
    ok: true,
    data: {
      schedule: finalized,
      validation,
    },
  };
}
