// src/engine/generateSchedule.ts
import { createEmptySchedule } from '../domain/schedule';
import type { ScheduleGenerationResult, SchedulerConfig } from '../domain/types';
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
  if (!replacementResult.ok) {
    return replacementResult;
  }

  // Stage 4: Day and Evening coverage
  const withCoverage = assignDayAndEveningCoverage(replacementResult.data.schedule, config);
  
  // Stage 5: Finalize (fill nulls with O)
  const finalized = finalizeSchedule(withCoverage);
  
  // Stage 6: Final Validation
  const validation = validateSchedule(finalized, config);

  if (!validation.isValid) {
    return {
      ok: false,
      error: {
        reason: 'Generated schedule failed validation',
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
