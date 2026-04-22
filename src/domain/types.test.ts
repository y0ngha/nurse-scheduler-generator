import type {
  DailyAssignments,
  GenerationFailure,
  GenerationSuccess,
  MonthlySchedule,
  NurseConfig,
  SchedulerConfig,
  ScheduleGenerationResult,
  ValidationIssue,
  ValidationResult,
} from './types';

test('core domain types accept the expected shape', () => {
  const nurse: NurseConfig = {
    id: 'n1',
    name: 'Nurse 1',
    nurseType: 'general',
    allowedShifts: ['D', 'E', 'N', 'O'],
    mandatoryOffDates: [23, 24],
    maxNightShifts: 6,
    offRange: { min: 9, max: 11 },
    nightRecoveryOffDays: 2,
  };

  const config: SchedulerConfig = {
    year: 2026,
    month: 8,
    nurses: [nurse],
    maxConsecutiveWorkDays: 4,
    nightBlockLength: 3,
    forbidEveningToNextDay: true,
  };

  const daily: DailyAssignments = { n1: 'D' };
  const schedule: MonthlySchedule = { 1: daily };
  const issue: ValidationIssue = {
    severity: 'error',
    code: 'MANDATORY_OFF_VIOLATION',
    message: 'example',
    nurseId: 'n1',
    day: 1,
  };
  const validation: ValidationResult = {
    isValid: false,
    errors: [issue],
    warnings: [],
  };
  const success: GenerationSuccess = {
    schedule,
    validation,
  };
  const failure: GenerationFailure = {
    reason: 'example',
    errors: [issue],
  };
  const result: ScheduleGenerationResult = {
    ok: true,
    data: success,
  };

  expect(config.nurses[0].allowedShifts).toContain('N');
  expect(success.schedule[1].n1).toBe('D');
  expect(failure.errors[0].code).toBe('MANDATORY_OFF_VIOLATION');
  expect(result.ok).toBe(true);
});
