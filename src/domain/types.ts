export type ShiftCode = 'D' | 'E' | 'N' | 'O' | 'DE';
export type NurseType = 'general' | 'nightSpecialist';
export type NurseId = string;
export type DayOfMonth = number;

export interface NurseConfig {
  id: NurseId;
  name: string;
  nurseType: NurseType;
  allowedShifts: ShiftCode[];
  mandatoryOffDates: number[];
  maxNightShifts: number;
  minOffDays: number | null;
  nightRecoveryOffDays: number;
}

export interface OffRange { min: number; max: number; }

export interface SchedulerConfig {
  year: number;
  month: number;
  nurses: NurseConfig[];
  maxConsecutiveWorkDays: number;
  nightBlockLength: number;
  forbidEveningToNextDay: boolean;
  globalMinOffDays: number;
}

export type DailyAssignments = Record<NurseId, ShiftCode | null>;
export type MonthlySchedule = Record<DayOfMonth, DailyAssignments>;

export type ValidationSeverity = 'error' | 'warning';
export type ValidationCode =
  | 'MANDATORY_OFF_VIOLATION'
  | 'DISALLOWED_SHIFT'
  | 'MISSING_DAY_COVERAGE'
  | 'MISSING_EVENING_COVERAGE'
  | 'MISSING_NIGHT_COVERAGE'
  | 'EVENING_TO_DAY_VIOLATION'
  | 'MAX_CONSECUTIVE_WORK_VIOLATION'
  | 'NIGHT_BLOCK_VIOLATION'
  | 'NIGHT_RECOVERY_OFF_VIOLATION'
  | 'OFF_RANGE_VIOLATION'
  | 'MONTHLY_NIGHT_LIMIT_VIOLATION'
  | 'UNNECESSARY_GENERAL_NIGHT_ASSIGNMENT'
  | 'HELPER_USED';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: ValidationCode;
  message: string;
  nurseId?: NurseId;
  day?: DayOfMonth;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface GenerationFailure {
  reason: string;
  errors: ValidationIssue[];
}

export interface GenerationSuccess {
  schedule: MonthlySchedule;
  validation: ValidationResult;
}

export type ScheduleGenerationResult =
  | { ok: true; data: GenerationSuccess }
  | { ok: false; error: GenerationFailure };
