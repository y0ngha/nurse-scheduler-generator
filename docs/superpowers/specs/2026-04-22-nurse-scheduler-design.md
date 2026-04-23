# Nurse Scheduler PRD and Design

## 1. Document Purpose

This document defines the product requirements and system design for a monthly nurse shift scheduler.

This version intentionally ignores the previous implementation and redefines the product from scratch based on the currently confirmed requirements.

Target implementation assumptions:

- Language: TypeScript
- UI: React 19 only
- Testing: Jest

---

## 2. Product Goal

Build a scheduler that generates a monthly nurse roster for a small ward team with the following priorities:

1. Ensure minimum daily operating coverage.
2. Respect all hard scheduling rules.
3. Minimize undesirable but allowed assignments.
4. Produce a schedule that is easy to validate, inspect, and adjust later.

The product is a monthly scheduling tool, not a general hospital workforce platform.

---

## 3. Scope

### In Scope

- Monthly schedule generation
- Day-by-day assignments for each nurse
- Hard constraint validation
- Warning-level quality checks
- Manual entry of nurse configuration and required days off
- Rendering the monthly result in a React 19 UI
- Automated tests with Jest

### Out of Scope

- Weekend fairness
- Holiday-specific rules
- Vacation, training, sick leave, or external assignments as separate leave types
- Skill mix or grade mix constraints
- Multiple required headcount per shift
- Preference optimization
- Multi-ward scheduling
- Long-term rotation balancing across multiple months

---

## 4. Operating Model

The current scheduling model assumes four nurses:

- 3 general nurses
- 1 dedicated night specialist

Supported shift codes:

- `D`: Day
- `E`: Evening
- `N`: Night
- `O`: Off

Each nurse can have only one assignment per day.

---

## 5. Core Business Rules

### 5.1 Daily Minimum Coverage

For every day in the month:

- At least 1 nurse must be assigned `D`
- At least 1 nurse must be assigned `E`
- At least 1 nurse must be assigned `N`

More than 1 nurse per shift is allowed, but the baseline target is minimum coverage only.

### 5.2 Nurse Types

#### General Nurse

- Primarily works `D` and `E`
- Can work `N` only when necessary
- `N` should be avoided whenever possible
- A general nurse may cover `N` only when the night specialist is off

#### Night Specialist

- Works only `N` and `O`
- Does not receive `D` or `E`
- Is the primary source of night coverage

### 5.3 Mandatory Offs

Each nurse may have fixed dates that must be assigned `O`.

This rule has the highest priority among schedule content rules.

### 5.4 Evening to Day Restriction

The same nurse cannot work:

- `E` on day `d`
- `D` on day `d + 1`

### 5.5 Consecutive Work Limit for General Nurses

General nurses may work at most 4 consecutive days.

The following count as work days:

- `D`
- `E`
- `N`

`O` resets the consecutive-work counter.

### 5.6 Night Pattern Rule

Night work is handled as a 3-night block.

Allowed night pattern start:

- `N N N`

Night duty must not be assigned as isolated single-night or two-night fragments.

### 5.7 Recovery Off After Night Block

After `N N N`, mandatory off days must follow:

- General nurse: `N N N O O`
- Night specialist: `N N N O O O`

### 5.8 Monthly Off Count for General Nurses

Each general nurse must have:

- Minimum 9 off days
- Maximum 11 off days

### 5.9 Monthly Night Limit

For the first version:

- General nurse: up to 6 night shifts per month
- Night specialist: configured monthly target

The night specialist is expected to absorb almost all night duty.

---

## 6. Rule Priority

When constraints conflict, the system should resolve them with the following priority order:

1. Mandatory off dates
2. Allowed shift type per nurse
3. Night block structure and recovery off
4. Daily minimum coverage
5. Maximum consecutive work limit
6. Evening to next-day Day prohibition
7. Monthly off-range compliance
8. Quality optimization and load balancing

If a valid schedule cannot satisfy priorities 1 through 6, the generator may fail instead of forcing an invalid result.

---

## 7. Product Requirements

### 7.1 Required User Inputs

The UI must allow input of:

- Target year and month
- Nurse list
- Nurse type per nurse
- Allowed shifts per nurse
- Mandatory off dates per nurse
- Monthly night limit per nurse
- Monthly off-range per nurse
- Night recovery off length per nurse

For the first version, a simple hard-coded or local-state-backed configuration is acceptable.

### 7.2 Required System Outputs

The system must produce:

- Monthly schedule table
- Per-nurse shift totals
- Validation result
- Detailed violation list when generation fails
- Warning list for non-fatal quality issues

### 7.3 Failure Behavior

If the scheduler cannot generate a valid schedule, it must return structured failure information instead of a partial silent failure.

Example failure reasons:

- No eligible night replacement exists on a specialist off day
- Mandatory off and minimum coverage are structurally incompatible
- Monthly off-range cannot be satisfied with current staffing model

---

## 8. Architecture Overview

The system should be divided into four logical layers.

### 8.1 Domain Layer

Pure TypeScript types and rule definitions.

Responsibilities:

- Shift enums and type aliases
- Nurse configuration types
- Schedule matrix types
- Validation result structures

### 8.2 Scheduling Engine

Pure functions that generate schedules from input data.

Responsibilities:

- Pre-assign fixed constraints
- Build night blocks
- Fill day and evening shifts
- Validate feasibility
- Return success or failure

### 8.3 Validation Engine

Pure functions that inspect a generated schedule.

Responsibilities:

- Hard rule checking
- Warning generation
- Explanation generation

### 8.4 React 19 Presentation Layer

React components responsible for rendering and user interaction.

Responsibilities:

- Configuration form
- Schedule table
- Summary panel
- Validation result panel

The UI should not contain scheduling logic. All scheduling and validation logic must live in pure TypeScript modules so that Jest can test them directly.

---

## 9. TypeScript Data Model

### 9.1 Core Types

```ts
export type ShiftCode = 'D' | 'E' | 'N' | 'O';

export type NurseType = 'general' | 'nightSpecialist';

export interface OffRange {
  min: number;
  max: number;
}

export interface NurseConfig {
  id: string;
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
```

### 9.2 Schedule Representation

The schedule should use a normalized matrix structure.

```ts
export type NurseId = string;
export type DayOfMonth = number;

export type DailyAssignments = Record<NurseId, ShiftCode | null>;

export type MonthlySchedule = Record<DayOfMonth, DailyAssignments>;
```

Rationale:

- Easy to read in tests
- Easy to render in a table
- Easy to validate per day and per nurse

### 9.3 Generation State

Use a separate internal state for generator bookkeeping.

```ts
export interface NurseStats {
  totalD: number;
  totalE: number;
  totalN: number;
  totalO: number;
  consecutiveWorkDays: number;
}

export interface GenerationState {
  schedule: MonthlySchedule;
  statsByNurseId: Record<NurseId, NurseStats>;
  hardViolations: ValidationIssue[];
  warnings: ValidationIssue[];
}
```

### 9.4 Validation Types

```ts
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
```

### 9.5 Generator Result Type

```ts
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

---

## 10. Scheduling Algorithm Design

### 10.1 Strategy Choice

This system should use a deterministic staged generator with validation checkpoints instead of full search or constraint programming for the first version.

Recommended approach:

1. Pre-assign fixed values
2. Build specialist-driven night structure
3. Add replacement night blocks only when required
4. Fill day and evening shifts
5. Fill remaining unassigned cells with off days
6. Run final validation

Reason:

- Easier to debug than backtracking-heavy solutions
- Easier to explain with Jest tests
- Good fit for the current small-team scheduling model

If future rules become significantly more complex, a second-generation backtracking or constraint-solver approach can be added later.

### 10.2 Generation Pipeline

#### Stage 0: Initialize Empty Schedule

Create a full month matrix where all cells are `null`.

#### Stage 1: Apply Mandatory Off Dates

For each nurse:

- Set configured mandatory off dates to `O`

If a mandatory off conflicts with an already assigned non-off value, fail immediately.

#### Stage 2: Place Night Specialist Blocks

Generate the night specialist's monthly pattern first.

Rules:

- Only `N` and `O`
- Use `N N N O O O` as the preferred block
- Attempt to meet the specialist monthly night target
- Avoid overlap with mandatory off dates

This stage defines the backbone of the schedule.

#### Stage 3: Fill Required Replacement Nights

For each day where no `N` is available after Stage 2:

- Check whether the night specialist is off
- If yes, select a general nurse to cover a replacement night block
- Replacement must use `N N N O O`

Candidate eligibility:

- Nurse must be a general nurse
- Nurse must allow `N`
- Nurse must have enough remaining monthly night capacity
- Nurse must not violate mandatory off dates
- Nurse must not break existing assignments
- Night block plus recovery off must fit in the month

Candidate ranking:

1. Fewest current night assignments
2. Fewest total work assignments
3. Lowest current consecutive-work pressure near the block start

This stage enforces the rule that general nurses only work nights when the specialist is off.

#### Stage 4: Fill Daily Day and Evening Minimum Coverage

For each day:

- If no `D` exists, choose one eligible general nurse for `D`
- If no `E` exists, choose one eligible general nurse for `E`

Eligibility checks:

- Allowed shift includes target shift
- Cell is still unassigned
- Not in mandatory off
- Does not create `E -> D` violation
- Does not exceed max consecutive work
- Does not overlap with recovery off after a night block

Selection heuristic:

1. Lowest current total assigned work days
2. Lowest count of same shift type
3. Lowest consecutive-work streak

#### Stage 5: Convert Remaining Null Cells to Off

After required shifts are placed:

- Any remaining `null` becomes `O`

#### Stage 6: Final Validation

Run all hard-rule validators.

If any hard validation fails:

- Return failure with full error set

If hard validation passes:

- Return success
- Include warning-level quality issues

---

## 11. Night Block Placement Design

Because the system depends heavily on night structure, the block logic must be explicit.

### 11.1 Specialist Block Builder

Input:

- Empty or partially pre-filled schedule
- Night specialist config
- Month length

Output:

- A schedule with specialist `N/O` pattern applied

Recommended behavior:

- Iterate through candidate start days
- Try to place `N N N O O O`
- Skip any start that collides with mandatory off
- Continue until monthly night target is satisfied or no legal slot remains

### 11.2 Replacement Night Block Builder

Replacement blocks should only be created for uncovered days.

The engine should never place general-nurse night blocks speculatively.

This prevents unnecessary night assignment to general nurses and aligns with the stated staffing policy.

---

## 12. Validation Engine Design

The validation engine must be separate from generation.

### 12.1 Hard Validators

Implement validators as pure functions.

Suggested modules:

- `validateMandatoryOffs`
- `validateAllowedShiftTypes`
- `validateDailyCoverage`
- `validateEveningToDay`
- `validateConsecutiveWork`
- `validateNightBlocks`
- `validateNightRecoveryOff`
- `validateMonthlyOffRange`
- `validateMonthlyNightLimit`

Each validator should return `ValidationIssue[]`.

### 12.2 Warning Validators

Warning-level checks:

- General nurse received night assignment while a specialist night could have covered it
- Work distribution is noticeably skewed
- Shift distribution is imbalanced

Warnings do not invalidate the schedule.

---

## 13. React 19 UI Design

### 13.1 UI Requirements

The UI should contain:

- Scheduler configuration panel
- Generate button
- Validation button
- Schedule grid
- Per-nurse summary panel
- Error and warning panel

### 13.2 Suggested Component Structure

```ts
App
  SchedulerPage
    SchedulerConfigForm
    ScheduleActions
    ValidationPanel
    ScheduleSummary
    ScheduleTable
```

### 13.3 State Design

Keep the scheduling engine outside React state management complexity.

Recommended page state:

```ts
interface SchedulerPageState {
  config: SchedulerConfig;
  generationResult: ScheduleGenerationResult | null;
}
```

Generation should happen in a pure domain/service function and the UI should render the result.

---

## 14. File and Module Design

Suggested initial structure:

```text
src/
  app/
    App.tsx
    SchedulerPage.tsx
  components/
    SchedulerConfigForm.tsx
    ScheduleActions.tsx
    ValidationPanel.tsx
    ScheduleSummary.tsx
    ScheduleTable.tsx
  domain/
    types.ts
    schedule.ts
    validation.ts
  engine/
    generateSchedule.ts
    buildNightSpecialistBlocks.ts
    buildReplacementNightBlocks.ts
    assignDayAndEveningCoverage.ts
    finalizeSchedule.ts
  validators/
    validateMandatoryOffs.ts
    validateAllowedShiftTypes.ts
    validateDailyCoverage.ts
    validateEveningToDay.ts
    validateConsecutiveWork.ts
    validateNightBlocks.ts
    validateNightRecoveryOff.ts
    validateMonthlyOffRange.ts
    validateMonthlyNightLimit.ts
    validateWarnings.ts
  test/
    fixtures/
    builders/
```

This decomposition keeps business logic pure and easy to test.

---

## 15. Jest Test Strategy

Jest should test pure logic first, UI second.

### 15.1 Unit Test Targets

Must-have unit tests:

- Mandatory off validation
- Evening to next-day Day restriction
- Consecutive work counting
- Night block validator
- Night recovery off validator
- Monthly off-range validator
- Monthly night-limit validator
- Specialist block builder
- Replacement night block builder
- Day and evening assignment logic

### 15.2 Integration Test Targets

Must-have integration tests:

- Generate a valid month for the baseline 4-nurse model
- Fail generation when night replacement is impossible
- Fail generation when mandatory off dates break minimum coverage
- Confirm that general nurses receive night only when specialist off makes it necessary

### 15.3 UI Test Targets

With React testing utilities plus Jest:

- Render schedule table after generation
- Render validation errors
- Render summary totals

### 15.4 Fixture Strategy

Use reusable test fixtures:

- Baseline 4-nurse config
- Specialist-off-heavy config
- Impossible-coverage config
- Tight mandatory-off config

This reduces duplication and makes business scenarios explicit.

---

## 16. Non-Functional Requirements

### 16.1 Determinism

Given the same input, the generator should return the same output.

This is important for debugging and testing.

### 16.2 Explainability

Every failure should explain:

- Which rule failed
- Which nurse or day caused it
- Why the generator stopped

### 16.3 Testability

Core scheduling logic must be implemented as side-effect-free functions.

### 16.4 UI Separation

React components must not directly encode scheduling rules.

---

## 17. Open Design Decisions

These are not blockers, but they should be kept explicit:

1. Whether the night specialist monthly target should be exact or preferred
2. Whether the first version should support manual schedule edits after generation
3. Whether the generator should stop at first hard failure or collect all possible hard failures

Recommended defaults:

- Specialist monthly target: exact if feasible, otherwise fail
- Manual edits: not in first version
- Failure reporting: collect as many deterministic errors as possible

---

## 18. Recommended First Version

The first production version should aim for:

- Single-month scheduler
- Four-nurse staffing model
- Deterministic staged generator
- Full hard validation
- Warning-level quality checks
- React 19 schedule viewer/editor shell
- Jest-based logic and component tests

This gives a small, stable core that can be extended later without redesigning the domain model.

