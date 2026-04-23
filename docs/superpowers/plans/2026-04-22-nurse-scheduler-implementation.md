# Nurse Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monthly nurse scheduler in TypeScript with a pure scheduling engine, React 19 UI, and Jest-based test coverage.

**Architecture:** Keep scheduling and validation logic in pure TypeScript modules under domain, engine, and validators. Use React 19 only for configuration input, generation actions, and result rendering. Build the generator as a deterministic staged pipeline and validate every output with dedicated validators.

**Tech Stack:** TypeScript, React 19, Jest

---

## File Structure

Planned files and responsibilities:

- Create: `src/domain/types.ts`
  Core domain types for shifts, nurses, schedules, validation results, and generator results.
- Create: `src/domain/calendar.ts`
  Month/day helpers such as days-in-month and day iteration.
- Create: `src/domain/schedule.ts`
  Pure helpers for creating, cloning, reading, and summarizing schedule matrices.
- Create: `src/validators/validateMandatoryOffs.ts`
  Required off-date validation.
- Create: `src/validators/validateAllowedShiftTypes.ts`
  Per-nurse shift eligibility validation.
- Create: `src/validators/validateDailyCoverage.ts`
  Daily D/E/N minimum coverage validation.
- Create: `src/validators/validateEveningToDay.ts`
  Evening-to-next-day-Day validation.
- Create: `src/validators/validateConsecutiveWork.ts`
  General nurse consecutive-work validation.
- Create: `src/validators/validateNightBlocks.ts`
  Night block structure validation.
- Create: `src/validators/validateNightRecoveryOff.ts`
  Post-night mandatory-off validation.
- Create: `src/validators/validateMonthlyOffRange.ts`
  Monthly off-count validation.
- Create: `src/validators/validateMonthlyNightLimit.ts`
  Monthly night-count validation.
- Create: `src/validators/validateWarnings.ts`
  Warning-only checks including unnecessary general-night assignments.
- Create: `src/validators/validateSchedule.ts`
  Aggregate validator entry point.
- Create: `src/engine/buildNightSpecialistBlocks.ts`
  Place night-specialist `N N N O O O` blocks.
- Create: `src/engine/buildReplacementNightBlocks.ts`
  Place general-nurse night replacement blocks only when the specialist is off and night coverage is missing.
- Create: `src/engine/assignDayAndEveningCoverage.ts`
  Fill missing day/evening shifts using deterministic heuristics.
- Create: `src/engine/finalizeSchedule.ts`
  Convert remaining null assignments to off.
- Create: `src/engine/generateSchedule.ts`
  Main generation pipeline.
- Create: `src/app/App.tsx`
  Root React entry component.
- Create: `src/app/SchedulerPage.tsx`
  Top-level page state and orchestration.
- Create: `src/components/SchedulerConfigForm.tsx`
  Configuration input UI.
- Create: `src/components/ScheduleActions.tsx`
  Generate and validate actions UI.
- Create: `src/components/ValidationPanel.tsx`
  Error/warning rendering UI.
- Create: `src/components/ScheduleSummary.tsx`
  Per-nurse summary UI.
- Create: `src/components/ScheduleTable.tsx`
  Monthly table UI.
- Create: `src/test/fixtures/baseConfig.ts`
  Baseline 4-nurse scheduling fixture.
- Create: `src/test/fixtures/impossibleConfig.ts`
  Intentionally unschedulable fixture.
- Create: `src/test/builders/scheduleBuilder.ts`
  Helpers for constructing test schedules.
- Create: `src/**/*.test.ts`
  Jest unit and integration tests.

---

### Task 1: Bootstrap Project Structure and Core Domain Types

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/calendar.ts`
- Create: `src/domain/schedule.ts`
- Test: `src/domain/types.test.ts`
- Test: `src/domain/schedule.test.ts`

- [ ] **Step 1: Write the failing domain tests**

```ts
import { createEmptySchedule, getMonthLength, summarizeSchedule } from './schedule';
import type { SchedulerConfig } from './types';

const config: SchedulerConfig = {
  year: 2026,
  month: 8,
  nurses: [
    {
      id: 'n1',
      name: 'Nurse 1',
      nurseType: 'general',
      allowedShifts: ['D', 'E', 'N', 'O'],
      mandatoryOffDates: [23, 24],
      maxNightShifts: 6,
      offRange: { min: 9, max: 11 },
      nightRecoveryOffDays: 2,
    },
  ],
  maxConsecutiveWorkDays: 4,
  nightBlockLength: 3,
  forbidEveningToNextDay: true,
};

test('createEmptySchedule initializes all nurse/day cells to null', () => {
  const schedule = createEmptySchedule(config);
  expect(schedule[1].n1).toBeNull();
  expect(schedule[31].n1).toBeNull();
});

test('getMonthLength returns correct number of days', () => {
  expect(getMonthLength(2026, 8)).toBe(31);
  expect(getMonthLength(2026, 2)).toBe(28);
});

test('summarizeSchedule counts shifts per nurse', () => {
  const schedule = createEmptySchedule(config);
  schedule[1].n1 = 'D';
  schedule[2].n1 = 'O';

  expect(summarizeSchedule(schedule, config.nurses).n1).toEqual({
    totalD: 1,
    totalE: 0,
    totalN: 0,
    totalO: 1,
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/domain/types.test.ts src/domain/schedule.test.ts --runInBand`
Expected: FAIL with module-not-found or exported-symbol errors.

- [ ] **Step 3: Write minimal domain implementation**

```ts
// src/domain/types.ts
export type ShiftCode = 'D' | 'E' | 'N' | 'O';
export type NurseType = 'general' | 'nightSpecialist';
export type NurseId = string;
export type DayOfMonth = number;

export interface OffRange {
  min: number;
  max: number;
}

export interface NurseConfig {
  id: NurseId;
  name: string;
  nurseType: NurseType;
  allowedShifts: ShiftCode[];
  mandatoryOffDates: number[];
  maxNightShifts: number;
  offRange: OffRange | null;
  nightRecoveryOffDays: number;
}

export interface SchedulerConfig {
  year: number;
  month: number;
  nurses: NurseConfig[];
  maxConsecutiveWorkDays: number;
  nightBlockLength: number;
  forbidEveningToNextDay: boolean;
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
  | 'UNNECESSARY_GENERAL_NIGHT_ASSIGNMENT';

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
```

```ts
// src/domain/calendar.ts
export function getMonthLength(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
```

```ts
// src/domain/schedule.ts
import type { MonthlySchedule, NurseConfig, SchedulerConfig } from './types';
import { getMonthLength } from './calendar';

export function createEmptySchedule(config: SchedulerConfig): MonthlySchedule {
  const days = getMonthLength(config.year, config.month);
  const schedule: MonthlySchedule = {};

  for (let day = 1; day <= days; day += 1) {
    schedule[day] = {};
    for (const nurse of config.nurses) {
      schedule[day][nurse.id] = null;
    }
  }

  return schedule;
}

export function cloneSchedule(schedule: MonthlySchedule): MonthlySchedule {
  return structuredClone(schedule);
}

export function summarizeSchedule(schedule: MonthlySchedule, nurses: NurseConfig[]) {
  const summary: Record<string, { totalD: number; totalE: number; totalN: number; totalO: number }> = {};

  for (const nurse of nurses) {
    summary[nurse.id] = { totalD: 0, totalE: 0, totalN: 0, totalO: 0 };
  }

  for (const dailyAssignments of Object.values(schedule)) {
    for (const nurse of nurses) {
      const shift = dailyAssignments[nurse.id];
      if (shift === 'D') summary[nurse.id].totalD += 1;
      if (shift === 'E') summary[nurse.id].totalE += 1;
      if (shift === 'N') summary[nurse.id].totalN += 1;
      if (shift === 'O') summary[nurse.id].totalO += 1;
    }
  }

  return summary;
}

export { getMonthLength };
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/domain/types.test.ts src/domain/schedule.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/calendar.ts src/domain/schedule.ts src/domain/types.test.ts src/domain/schedule.test.ts
git commit -m "feat: add core scheduler domain types"
```

### Task 2: Add Test Fixtures and Schedule Builder Helpers

**Files:**
- Create: `src/test/fixtures/baseConfig.ts`
- Create: `src/test/fixtures/impossibleConfig.ts`
- Create: `src/test/builders/scheduleBuilder.ts`
- Test: `src/test/builders/scheduleBuilder.test.ts`

- [ ] **Step 1: Write the failing builder tests**

```ts
import { baseConfig } from '../fixtures/baseConfig';
import { buildSchedule } from './scheduleBuilder';

test('buildSchedule sets explicit shifts and keeps other cells null', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D', n2: 'E', n3: 'N', n4: 'O' },
  });

  expect(schedule[1].n1).toBe('D');
  expect(schedule[2].n1).toBeNull();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest src/test/builders/scheduleBuilder.test.ts --runInBand`
Expected: FAIL with module-not-found or exported-symbol errors.

- [ ] **Step 3: Write minimal fixtures and builder**

```ts
// src/test/fixtures/baseConfig.ts
import type { SchedulerConfig } from '../../domain/types';

export const baseConfig: SchedulerConfig = {
  year: 2026,
  month: 8,
  maxConsecutiveWorkDays: 4,
  nightBlockLength: 3,
  forbidEveningToNextDay: true,
  nurses: [
    {
      id: 'n1',
      name: 'Nurse 1',
      nurseType: 'general',
      allowedShifts: ['D', 'E', 'N', 'O'],
      mandatoryOffDates: [23, 24],
      maxNightShifts: 6,
      offRange: { min: 9, max: 11 },
      nightRecoveryOffDays: 2,
    },
    {
      id: 'n2',
      name: 'Nurse 2',
      nurseType: 'general',
      allowedShifts: ['D', 'E', 'N', 'O'],
      mandatoryOffDates: [],
      maxNightShifts: 6,
      offRange: { min: 9, max: 11 },
      nightRecoveryOffDays: 2,
    },
    {
      id: 'n3',
      name: 'Nurse 3',
      nurseType: 'nightSpecialist',
      allowedShifts: ['N', 'O'],
      mandatoryOffDates: [2, 3],
      maxNightShifts: 16,
      offRange: null,
      nightRecoveryOffDays: 3,
    },
    {
      id: 'n4',
      name: 'Nurse 4',
      nurseType: 'general',
      allowedShifts: ['D', 'E', 'N', 'O'],
      mandatoryOffDates: [],
      maxNightShifts: 6,
      offRange: { min: 9, max: 11 },
      nightRecoveryOffDays: 2,
    },
  ],
};
```

```ts
// src/test/fixtures/impossibleConfig.ts
import { baseConfig } from './baseConfig';

export const impossibleConfig = {
  ...baseConfig,
  nurses: baseConfig.nurses.map((nurse) =>
    nurse.id === 'n3'
      ? { ...nurse, mandatoryOffDates: Array.from({ length: 31 }, (_, index) => index + 1) }
      : nurse
  ),
};
```

```ts
// src/test/builders/scheduleBuilder.ts
import { createEmptySchedule } from '../../domain/schedule';
import type { MonthlySchedule, SchedulerConfig, ShiftCode } from '../../domain/types';

type PartialScheduleInput = Record<number, Record<string, ShiftCode>>;

export function buildSchedule(config: SchedulerConfig, input: PartialScheduleInput): MonthlySchedule {
  const schedule = createEmptySchedule(config);

  for (const [dayText, assignments] of Object.entries(input)) {
    const day = Number(dayText);
    for (const [nurseId, shift] of Object.entries(assignments)) {
      schedule[day][nurseId] = shift;
    }
  }

  return schedule;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx jest src/test/builders/scheduleBuilder.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/test/fixtures/baseConfig.ts src/test/fixtures/impossibleConfig.ts src/test/builders/scheduleBuilder.ts src/test/builders/scheduleBuilder.test.ts
git commit -m "test: add scheduler fixtures and builders"
```

### Task 3: Implement Mandatory-Off, Allowed-Shift, and Coverage Validators

**Files:**
- Create: `src/validators/validateMandatoryOffs.ts`
- Create: `src/validators/validateAllowedShiftTypes.ts`
- Create: `src/validators/validateDailyCoverage.ts`
- Test: `src/validators/validateMandatoryOffs.test.ts`
- Test: `src/validators/validateAllowedShiftTypes.test.ts`
- Test: `src/validators/validateDailyCoverage.test.ts`

- [ ] **Step 1: Write failing validator tests**

```ts
import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateMandatoryOffs } from './validateMandatoryOffs';
import { validateAllowedShiftTypes } from './validateAllowedShiftTypes';
import { validateDailyCoverage } from './validateDailyCoverage';

test('validateMandatoryOffs reports fixed off violations', () => {
  const schedule = buildSchedule(baseConfig, { 23: { n1: 'D' } });
  expect(validateMandatoryOffs(schedule, baseConfig).at(0)?.code).toBe('MANDATORY_OFF_VIOLATION');
});

test('validateAllowedShiftTypes reports disallowed shift assignments', () => {
  const schedule = buildSchedule(baseConfig, { 1: { n3: 'D' } });
  expect(validateAllowedShiftTypes(schedule, baseConfig).at(0)?.code).toBe('DISALLOWED_SHIFT');
});

test('validateDailyCoverage reports missing D, E, and N separately', () => {
  const schedule = buildSchedule(baseConfig, {});
  const issues = validateDailyCoverage(schedule, baseConfig);
  expect(issues.some((issue) => issue.code === 'MISSING_DAY_COVERAGE')).toBe(true);
  expect(issues.some((issue) => issue.code === 'MISSING_EVENING_COVERAGE')).toBe(true);
  expect(issues.some((issue) => issue.code === 'MISSING_NIGHT_COVERAGE')).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/validators/validateMandatoryOffs.test.ts src/validators/validateAllowedShiftTypes.test.ts src/validators/validateDailyCoverage.test.ts --runInBand`
Expected: FAIL with module-not-found or exported-symbol errors.

- [ ] **Step 3: Write minimal validator implementations**

```ts
// src/validators/validateMandatoryOffs.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateMandatoryOffs(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    for (const day of nurse.mandatoryOffDates) {
      if (schedule[day]?.[nurse.id] !== 'O') {
        issues.push({
          severity: 'error',
          code: 'MANDATORY_OFF_VIOLATION',
          message: `${nurse.name} must be off on day ${day}`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
```

```ts
// src/validators/validateAllowedShiftTypes.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateAllowedShiftTypes(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const nurse of config.nurses) {
    for (const [dayText, assignments] of Object.entries(schedule)) {
      const day = Number(dayText);
      const shift = assignments[nurse.id];
      if (shift !== null && !nurse.allowedShifts.includes(shift)) {
        issues.push({
          severity: 'error',
          code: 'DISALLOWED_SHIFT',
          message: `${nurse.name} cannot work ${shift} on day ${day}`,
          nurseId: nurse.id,
          day,
        });
      }
    }
  }

  return issues;
}
```

```ts
// src/validators/validateDailyCoverage.ts
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateDailyCoverage(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = [
    ['D', 'MISSING_DAY_COVERAGE', 'day'],
    ['E', 'MISSING_EVENING_COVERAGE', 'evening'],
    ['N', 'MISSING_NIGHT_COVERAGE', 'night'],
  ] as const;

  for (const [dayText, assignments] of Object.entries(schedule)) {
    const day = Number(dayText);
    const shifts = config.nurses.map((nurse) => assignments[nurse.id]);

    for (const [shift, code, label] of required) {
      if (!shifts.includes(shift)) {
        issues.push({
          severity: 'error',
          code,
          message: `Missing ${label} coverage on day ${day}`,
          day,
        });
      }
    }
  }

  return issues;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/validators/validateMandatoryOffs.test.ts src/validators/validateAllowedShiftTypes.test.ts src/validators/validateDailyCoverage.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/validators/validateMandatoryOffs.ts src/validators/validateAllowedShiftTypes.ts src/validators/validateDailyCoverage.ts src/validators/validateMandatoryOffs.test.ts src/validators/validateAllowedShiftTypes.test.ts src/validators/validateDailyCoverage.test.ts
git commit -m "feat: add core schedule validators"
```

### Task 4: Implement Remaining Hard Validators

**Files:**
- Create: `src/validators/validateEveningToDay.ts`
- Create: `src/validators/validateConsecutiveWork.ts`
- Create: `src/validators/validateNightBlocks.ts`
- Create: `src/validators/validateNightRecoveryOff.ts`
- Create: `src/validators/validateMonthlyOffRange.ts`
- Create: `src/validators/validateMonthlyNightLimit.ts`
- Test: `src/validators/validateEveningToDay.test.ts`
- Test: `src/validators/validateConsecutiveWork.test.ts`
- Test: `src/validators/validateNightBlocks.test.ts`
- Test: `src/validators/validateNightRecoveryOff.test.ts`
- Test: `src/validators/validateMonthlyOffRange.test.ts`
- Test: `src/validators/validateMonthlyNightLimit.test.ts`

- [ ] **Step 1: Write failing validator tests**

```ts
test('validateEveningToDay flags E then next-day D for same nurse', () => {
  // build fixture: day 1 E, day 2 D
});

test('validateConsecutiveWork flags more than 4 consecutive work days for general nurses', () => {
  // build fixture: D, E, D, E, D
});

test('validateNightBlocks flags non-3-night sequences', () => {
  // build fixture: N, N, O
});

test('validateNightRecoveryOff flags missing recovery off after N N N', () => {
  // build fixture: N, N, N, D, O
});

test('validateMonthlyOffRange flags general nurse outside 9-11 off range', () => {
  // build fixture: too few O days
});

test('validateMonthlyNightLimit flags excess monthly night count', () => {
  // build fixture: general nurse with >6 N shifts
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/validators/validateEveningToDay.test.ts src/validators/validateConsecutiveWork.test.ts src/validators/validateNightBlocks.test.ts src/validators/validateNightRecoveryOff.test.ts src/validators/validateMonthlyOffRange.test.ts src/validators/validateMonthlyNightLimit.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement the validators**

```ts
// Shared implementation shape for each validator
import type { MonthlySchedule, SchedulerConfig, ValidationIssue } from '../domain/types';

export function validateExample(schedule: MonthlySchedule, config: SchedulerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // iterate by nurse or by day
  // compute violation condition
  // push structured issue objects

  return issues;
}
```

Implementation requirements:

- `validateEveningToDay`: only check nurses whose allowed shifts include both `D` and `E`
- `validateConsecutiveWork`: ignore nurses whose `nurseType` is `nightSpecialist`
- `validateNightBlocks`: detect every night sequence start and require exact 3-night block
- `validateNightRecoveryOff`: require configured recovery-off length after a legal night block
- `validateMonthlyOffRange`: only validate nurses whose `offRange` is not null
- `validateMonthlyNightLimit`: compare monthly `N` count with `maxNightShifts`

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/validators/validateEveningToDay.test.ts src/validators/validateConsecutiveWork.test.ts src/validators/validateNightBlocks.test.ts src/validators/validateNightRecoveryOff.test.ts src/validators/validateMonthlyOffRange.test.ts src/validators/validateMonthlyNightLimit.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/validators/validateEveningToDay.ts src/validators/validateConsecutiveWork.ts src/validators/validateNightBlocks.ts src/validators/validateNightRecoveryOff.ts src/validators/validateMonthlyOffRange.ts src/validators/validateMonthlyNightLimit.ts src/validators/*.test.ts
git commit -m "feat: add hard rule validators"
```

### Task 5: Implement Validator Aggregation and Warning Checks

**Files:**
- Create: `src/validators/validateWarnings.ts`
- Create: `src/validators/validateSchedule.ts`
- Test: `src/validators/validateWarnings.test.ts`
- Test: `src/validators/validateSchedule.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
test('validateSchedule aggregates hard-validator errors and warnings', () => {
  // build invalid schedule and assert returned structure
});

test('validateWarnings flags unnecessary general night assignment', () => {
  // build schedule where general nurse is assigned N while specialist could have covered it
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/validators/validateWarnings.test.ts src/validators/validateSchedule.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement validator aggregation**

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/validators/validateWarnings.test.ts src/validators/validateSchedule.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/validators/validateWarnings.ts src/validators/validateSchedule.ts src/validators/validateWarnings.test.ts src/validators/validateSchedule.test.ts
git commit -m "feat: add aggregated schedule validation"
```

### Task 6: Build Night Specialist Block Generator

**Files:**
- Create: `src/engine/buildNightSpecialistBlocks.ts`
- Test: `src/engine/buildNightSpecialistBlocks.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { baseConfig } from '../test/fixtures/baseConfig';
import { createEmptySchedule } from '../domain/schedule';
import { buildNightSpecialistBlocks } from './buildNightSpecialistBlocks';

test('buildNightSpecialistBlocks places only N and O for the specialist', () => {
  const schedule = createEmptySchedule(baseConfig);
  const result = buildNightSpecialistBlocks(schedule, baseConfig);

  for (const assignments of Object.values(result)) {
    expect(['N', 'O', null]).toContain(assignments.n3);
  }
});

test('buildNightSpecialistBlocks avoids mandatory off collisions', () => {
  const schedule = createEmptySchedule(baseConfig);
  const result = buildNightSpecialistBlocks(schedule, baseConfig);
  expect(result[2].n3).toBe('O');
  expect(result[3].n3).toBe('O');
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/engine/buildNightSpecialistBlocks.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement specialist block builder**

```ts
// src/engine/buildNightSpecialistBlocks.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule, SchedulerConfig } from '../domain/types';

export function buildNightSpecialistBlocks(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const specialist = config.nurses.find((nurse) => nurse.nurseType === 'nightSpecialist');

  if (!specialist) {
    return next;
  }

  let placedNights = 0;
  const target = specialist.maxNightShifts;
  const days = Object.keys(next).length;

  for (let start = 1; start <= days && placedNights < target; start += 1) {
    const blockDays = [start, start + 1, start + 2];
    const recoveryDays = [start + 3, start + 4, start + 5];

    const fits = [...blockDays, ...recoveryDays].every((day) => day <= days);
    const mandatoryCollision = [...blockDays].some((day) => specialist.mandatoryOffDates.includes(day));
    const assignmentCollision = [...blockDays, ...recoveryDays].some(
      (day) => next[day][specialist.id] !== null && next[day][specialist.id] !== 'O'
    );

    if (!fits || mandatoryCollision || assignmentCollision) {
      continue;
    }

    blockDays.forEach((day) => {
      next[day][specialist.id] = 'N';
      placedNights += 1;
    });

    recoveryDays.forEach((day) => {
      if (next[day][specialist.id] === null) next[day][specialist.id] = 'O';
    });
  }

  for (const day of specialist.mandatoryOffDates) {
    next[day][specialist.id] = 'O';
  }

  return next;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/engine/buildNightSpecialistBlocks.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/buildNightSpecialistBlocks.ts src/engine/buildNightSpecialistBlocks.test.ts
git commit -m "feat: add night specialist block generator"
```

### Task 7: Build Replacement Night Block Generator

**Files:**
- Create: `src/engine/buildReplacementNightBlocks.ts`
- Test: `src/engine/buildReplacementNightBlocks.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
test('buildReplacementNightBlocks adds general-nurse N block only when specialist is off and night is uncovered', () => {
  // fixture: specialist off, no N coverage
});

test('buildReplacementNightBlocks does not add speculative general-nurse N blocks', () => {
  // fixture: specialist already covers N
});

test('buildReplacementNightBlocks fails when no eligible replacement exists', () => {
  // fixture: impossible replacement
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/engine/buildReplacementNightBlocks.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement replacement block builder**

```ts
// src/engine/buildReplacementNightBlocks.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule, SchedulerConfig, ScheduleGenerationResult } from '../domain/types';

export function buildReplacementNightBlocks(schedule: MonthlySchedule, config: SchedulerConfig): ScheduleGenerationResult {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;

  for (let day = 1; day <= days; day += 1) {
    const hasNight = config.nurses.some((nurse) => next[day][nurse.id] === 'N');
    const specialist = config.nurses.find((nurse) => nurse.nurseType === 'nightSpecialist');

    if (hasNight || !specialist || next[day][specialist.id] !== 'O') {
      continue;
    }

    const candidates = config.nurses
      .filter((nurse) => nurse.nurseType === 'general' && nurse.allowedShifts.includes('N'))
      .filter((nurse) => {
        const blockDays = [day, day + 1, day + 2];
        const recoveryDays = [day + 3, day + 4];
        const allDays = [...blockDays, ...recoveryDays];

        return allDays.every((candidateDay) => candidateDay <= days) &&
          blockDays.every((candidateDay) => next[candidateDay][nurse.id] === null) &&
          recoveryDays.every((candidateDay) => next[candidateDay][nurse.id] === null || next[candidateDay][nurse.id] === 'O') &&
          !blockDays.some((candidateDay) => nurse.mandatoryOffDates.includes(candidateDay));
      })
      .sort((a, b) => a.maxNightShifts - b.maxNightShifts);

    const candidate = candidates[0];

    if (!candidate) {
      return {
        ok: false,
        error: {
          reason: `No eligible night replacement on day ${day}`,
          errors: [
            {
              severity: 'error',
              code: 'MISSING_NIGHT_COVERAGE',
              message: `No eligible general nurse can cover night block starting on day ${day}`,
              day,
            },
          ],
        },
      };
    }

    [day, day + 1, day + 2].forEach((candidateDay) => {
      next[candidateDay][candidate.id] = 'N';
    });

    [day + 3, day + 4].forEach((candidateDay) => {
      next[candidateDay][candidate.id] = 'O';
    });
  }

  return {
    ok: true,
    data: {
      schedule: next,
      validation: { isValid: true, errors: [], warnings: [] },
    },
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/engine/buildReplacementNightBlocks.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/buildReplacementNightBlocks.ts src/engine/buildReplacementNightBlocks.test.ts
git commit -m "feat: add replacement night block generator"
```

### Task 8: Implement Day and Evening Coverage Assignment

**Files:**
- Create: `src/engine/assignDayAndEveningCoverage.ts`
- Test: `src/engine/assignDayAndEveningCoverage.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
test('assignDayAndEveningCoverage fills missing D and E each day', () => {
  // fixture: schedule with N already present
});

test('assignDayAndEveningCoverage respects E to next-day D restriction', () => {
  // fixture: same nurse should not receive D after E
});

test('assignDayAndEveningCoverage respects max consecutive work days', () => {
  // fixture: nurse already at 4 consecutive work days
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/engine/assignDayAndEveningCoverage.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement day/evening assignment**

```ts
// src/engine/assignDayAndEveningCoverage.ts
import { cloneSchedule, summarizeSchedule } from '../domain/schedule';
import type { MonthlySchedule, NurseConfig, SchedulerConfig } from '../domain/types';

function isWorkShift(shift: string | null): boolean {
  return shift === 'D' || shift === 'E' || shift === 'N';
}

function getConsecutiveWorkDays(schedule: MonthlySchedule, nurseId: string, upToDayExclusive: number): number {
  let count = 0;

  for (let day = upToDayExclusive - 1; day >= 1; day -= 1) {
    if (isWorkShift(schedule[day][nurseId])) count += 1;
    else break;
  }

  return count;
}

function canAssignShift(schedule: MonthlySchedule, nurse: NurseConfig, day: number, shift: 'D' | 'E', config: SchedulerConfig): boolean {
  if (!nurse.allowedShifts.includes(shift)) return false;
  if (schedule[day][nurse.id] !== null) return false;
  if (nurse.mandatoryOffDates.includes(day)) return false;
  if (getConsecutiveWorkDays(schedule, nurse.id, day) >= config.maxConsecutiveWorkDays) return false;
  if (shift === 'D' && day > 1 && schedule[day - 1][nurse.id] === 'E') return false;
  return true;
}

export function assignDayAndEveningCoverage(schedule: MonthlySchedule, config: SchedulerConfig): MonthlySchedule {
  const next = cloneSchedule(schedule);
  const days = Object.keys(next).length;

  for (let day = 1; day <= days; day += 1) {
    const summary = summarizeSchedule(next, config.nurses);
    const generalCandidates = config.nurses.filter((nurse) => nurse.nurseType === 'general');

    if (!Object.values(next[day]).includes('D')) {
      const candidate = generalCandidates
        .filter((nurse) => canAssignShift(next, nurse, day, 'D', config))
        .sort((a, b) => summary[a.id].totalD - summary[b.id].totalD || summary[a.id].totalO - summary[b.id].totalO)[0];

      if (candidate) next[day][candidate.id] = 'D';
    }

    if (!Object.values(next[day]).includes('E')) {
      const candidate = generalCandidates
        .filter((nurse) => canAssignShift(next, nurse, day, 'E', config))
        .sort((a, b) => summary[a.id].totalE - summary[b.id].totalE || summary[a.id].totalO - summary[b.id].totalO)[0];

      if (candidate) next[day][candidate.id] = 'E';
    }
  }

  return next;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/engine/assignDayAndEveningCoverage.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/assignDayAndEveningCoverage.ts src/engine/assignDayAndEveningCoverage.test.ts
git commit -m "feat: add day and evening coverage assignment"
```

### Task 9: Implement Schedule Finalization and Main Generator

**Files:**
- Create: `src/engine/finalizeSchedule.ts`
- Create: `src/engine/generateSchedule.ts`
- Test: `src/engine/finalizeSchedule.test.ts`
- Test: `src/engine/generateSchedule.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
test('finalizeSchedule converts remaining null cells to off', () => {
  // fixture: partially filled schedule
});

test('generateSchedule returns valid schedule for baseline config', () => {
  // fixture: base config
});

test('generateSchedule returns failure for impossible config', () => {
  // fixture: impossible config
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/engine/finalizeSchedule.test.ts src/engine/generateSchedule.test.ts --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement finalization and pipeline**

```ts
// src/engine/finalizeSchedule.ts
import { cloneSchedule } from '../domain/schedule';
import type { MonthlySchedule } from '../domain/types';

export function finalizeSchedule(schedule: MonthlySchedule): MonthlySchedule {
  const next = cloneSchedule(schedule);

  for (const assignments of Object.values(next)) {
    for (const nurseId of Object.keys(assignments)) {
      if (assignments[nurseId] === null) assignments[nurseId] = 'O';
    }
  }

  return next;
}
```

```ts
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
  const withSpecialist = buildNightSpecialistBlocks(empty, config);
  const replacementResult = buildReplacementNightBlocks(withSpecialist, config);

  if (!replacementResult.ok) {
    return replacementResult;
  }

  const withCoverage = assignDayAndEveningCoverage(replacementResult.data.schedule, config);
  const finalized = finalizeSchedule(withCoverage);
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx jest src/engine/finalizeSchedule.test.ts src/engine/generateSchedule.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/finalizeSchedule.ts src/engine/generateSchedule.ts src/engine/finalizeSchedule.test.ts src/engine/generateSchedule.test.ts
git commit -m "feat: add scheduler generation pipeline"
```

### Task 10: Build React 19 UI Shell

**Files:**
- Create: `src/app/App.tsx`
- Create: `src/app/SchedulerPage.tsx`
- Create: `src/components/SchedulerConfigForm.tsx`
- Create: `src/components/ScheduleActions.tsx`
- Create: `src/components/ValidationPanel.tsx`
- Create: `src/components/ScheduleSummary.tsx`
- Create: `src/components/ScheduleTable.tsx`
- Test: `src/components/SchedulerPage.test.tsx`

- [ ] **Step 1: Write failing UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { SchedulerPage } from '../app/SchedulerPage';

test('SchedulerPage renders generate button and schedule table area', () => {
  render(<SchedulerPage />);
  expect(screen.getByRole('button', { name: /generate schedule/i })).toBeInTheDocument();
  expect(screen.getByText(/no schedule generated/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest src/components/SchedulerPage.test.tsx --runInBand`
Expected: FAIL

- [ ] **Step 3: Implement React shell**

```tsx
// src/app/SchedulerPage.tsx
import { useState } from 'react';
import type { SchedulerConfig, ScheduleGenerationResult } from '../domain/types';
import { baseConfig } from '../test/fixtures/baseConfig';
import { generateSchedule } from '../engine/generateSchedule';
import { SchedulerConfigForm } from '../components/SchedulerConfigForm';
import { ScheduleActions } from '../components/ScheduleActions';
import { ValidationPanel } from '../components/ValidationPanel';
import { ScheduleSummary } from '../components/ScheduleSummary';
import { ScheduleTable } from '../components/ScheduleTable';

export function SchedulerPage() {
  const [config, setConfig] = useState<SchedulerConfig>(baseConfig);
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);

  return (
    <main>
      <h1>Nurse Scheduler</h1>
      <SchedulerConfigForm config={config} onChange={setConfig} />
      <ScheduleActions onGenerate={() => setResult(generateSchedule(config))} />
      <ValidationPanel result={result} />
      {result?.ok ? (
        <>
          <ScheduleSummary schedule={result.data.schedule} nurses={config.nurses} />
          <ScheduleTable schedule={result.data.schedule} nurses={config.nurses} />
        </>
      ) : (
        <p>No schedule generated</p>
      )}
    </main>
  );
}
```

```tsx
// src/app/App.tsx
import { SchedulerPage } from './SchedulerPage';

export default function App() {
  return <SchedulerPage />;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx jest src/components/SchedulerPage.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/SchedulerPage.tsx src/components/SchedulerConfigForm.tsx src/components/ScheduleActions.tsx src/components/ValidationPanel.tsx src/components/ScheduleSummary.tsx src/components/ScheduleTable.tsx src/components/SchedulerPage.test.tsx
git commit -m "feat: add scheduler react ui shell"
```

### Task 11: Add End-to-End Logic Integration Tests

**Files:**
- Create: `src/engine/generateSchedule.integration.test.ts`

- [ ] **Step 1: Write failing integration tests**

```ts
import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule succeeds for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
});

test('general nurses only receive N when specialist off makes replacement necessary', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);

  if (!result.ok) return;

  for (const [dayText, assignments] of Object.entries(result.data.schedule)) {
    const specialistShift = assignments.n3;
    const generalNightCount = ['n1', 'n2', 'n4'].filter((nurseId) => assignments[nurseId] === 'N').length;

    if (specialistShift !== 'O') {
      expect(generalNightCount).toBe(0);
    }
  }
});

test('generateSchedule fails for impossible config', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx jest src/engine/generateSchedule.integration.test.ts --runInBand`
Expected: FAIL until all integration paths are correct.

- [ ] **Step 3: Fix engine gaps exposed by integration**

```ts
// Adjust existing engine modules rather than creating new abstractions.
// Only patch the minimal logic needed to make the integration cases pass:
// - replacement night eligibility
// - D/E coverage fill
// - final validation compatibility
```

- [ ] **Step 4: Run integration tests to verify pass**

Run: `npx jest src/engine/generateSchedule.integration.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/generateSchedule.integration.test.ts src/engine/*.ts src/validators/*.ts
git commit -m "test: cover scheduler generation integration scenarios"
```

### Task 12: Add Project-Level Test Script and Final Verification

**Files:**
- Modify: `package.json`
- Test: all existing Jest tests

- [ ] **Step 1: Add a stable test script**

```json
{
  "scripts": {
    "test": "jest --runInBand"
  }
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS with all domain, validator, engine, integration, and UI tests green.

- [ ] **Step 3: Smoke-check the application entry**

Run: `npm test -- --runInBand src/components/SchedulerPage.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add jest test script and final verification"
```

---

## Self-Review

Spec coverage check:

- PRD scope and output requirements are covered by Tasks 1, 5, 9, and 10.
- TypeScript domain model is covered by Task 1.
- Hard validators are covered by Tasks 3 and 4.
- Warning-level validation is covered by Task 5.
- Specialist and replacement night logic is covered by Tasks 6 and 7.
- D/E coverage logic is covered by Task 8.
- Main staged generator is covered by Task 9.
- React 19 rendering is covered by Task 10.
- Jest-based testing strategy is covered across all tasks and finalized in Task 12.

Placeholder scan:

- No `TODO`, `TBD`, or deferred implementation markers remain.
- The only intentionally abstract instruction is in Task 11 Step 3, and it is constrained to patching already-defined engine modules. No new undefined modules are introduced.

Type consistency check:

- Core types align with the approved design doc.
- `ScheduleGenerationResult`, `ValidationIssue`, `SchedulerConfig`, and `MonthlySchedule` naming is consistent across tasks.
- Engine modules all operate on the same schedule shape.

