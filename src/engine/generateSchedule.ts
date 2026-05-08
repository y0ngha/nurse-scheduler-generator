import { createEmptySchedule } from '../domain/schedule';
import type { ScheduleGenerationResult, SchedulerConfig, MonthlySchedule } from '../domain/types';
import { buildNightSpecialistBlocks } from './buildNightSpecialistBlocks';
import { buildReplacementNightBlocks } from './buildReplacementNightBlocks';
import { assignDayAndEveningCoverage } from './assignDayAndEveningCoverage';
import { finalizeSchedule } from './finalizeSchedule';
import { validateSchedule } from '../validators/validateSchedule';
import type { ShiftCode } from '../domain/types';

function isWorkShift(shift: ShiftCode | null): boolean {
  return shift === 'D' || shift === 'E' || shift === 'N' || shift === 'DE';
}

export function generateSchedule(config: SchedulerConfig): ScheduleGenerationResult {
  const empty = createEmptySchedule(config);
  
  // Stage 2: Specialist blocks
  const withSpecialist = buildNightSpecialistBlocks(empty, config);
  
  // Stage 3: Replacement night blocks
  const replacementResult = buildReplacementNightBlocks(withSpecialist, config);
  if (!replacementResult.ok) {
    return replacementResult;
  }
  
  const withNight: MonthlySchedule = replacementResult.data.schedule;

  // Stage 4: Day and Evening coverage
  const withCoverage = assignDayAndEveningCoverage(withNight, config);
  
  // Stage 5: Finalize
  const finalized = finalizeSchedule(withCoverage);
  
  // Stage 6: Validation
  const validation = validateSchedule(finalized, config);

  const usedHelper = Object.values(finalized).some(day =>
    isWorkShift(day['HELPER']) || isWorkShift(day['HELPER_2'])
  );

  if (usedHelper) {
    validation.warnings.push({
      severity: 'warning',
      code: 'HELPER_USED',
      message: '인력 부족으로 인해 외부 헬퍼가 투입되었습니다.'
    });
  }

  if (!validation.isValid) {
    return {
      ok: false,
      error: {
        reason: '생성된 근무표가 필수 검증 규칙을 통과하지 못했습니다.',
        errors: validation.errors,
      },
    };
  }

  return {
    ok: true,
    data: {
      schedule: finalized,
      validation,
    },
  };
}
