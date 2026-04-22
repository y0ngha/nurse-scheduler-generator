// src/validators/validateSchedule.ts
import type { MonthlySchedule, SchedulerConfig, ValidationResult } from '../domain/types';
import { validateMandatoryOffs } from './validateMandatoryOffs';
import { validateAllowedShiftTypes } from './validateAllowedShiftTypes';
import { validateDailyCoverage } from './validateDailyCoverage';
import { validateEveningToDay } from './validateEveningToDay';
import { validateConsecutiveWork } from './validateConsecutiveWork';
import { validateNightBlocks } from './validateNightBlocks';
import { validateNightRecoveryOff } from './validateNightRecoveryOff';
import { validateMonthlyOffRange } from './validateMonthlyOffRange';
import { validateMonthlyNightLimit } from './validateMonthlyNightLimit';
import { validateWarnings } from './validateWarnings';

export function validateSchedule(schedule: MonthlySchedule, config: SchedulerConfig): ValidationResult {
  const errors = [
    ...validateMandatoryOffs(schedule, config),
    ...validateAllowedShiftTypes(schedule, config),
    ...validateDailyCoverage(schedule, config),
    ...validateEveningToDay(schedule, config),
    ...validateConsecutiveWork(schedule, config),
    ...validateNightBlocks(schedule, config),
    ...validateNightRecoveryOff(schedule, config),
    ...validateMonthlyOffRange(schedule, config),
    ...validateMonthlyNightLimit(schedule, config),
  ];

  const warnings = validateWarnings(schedule, config);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
