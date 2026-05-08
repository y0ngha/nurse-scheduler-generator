import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { assignDayAndEveningCoverage } from './assignDayAndEveningCoverage';
import type { ShiftCode } from '../domain/types';

test('assignDayAndEveningCoverage fills missing D and E each day', () => {
  const schedule = buildSchedule(baseConfig, {}); // Completely empty!
  const result = assignDayAndEveningCoverage(schedule, baseConfig);

  for (let d = 1; d <= 31; d++) {
    const shifts = Object.values(result[d]);
    expect(shifts.includes('D')).toBe(true);
    expect(shifts.includes('E')).toBe(true);
  }
});

test('assignDayAndEveningCoverage respects E to next-day D restriction', () => {
  // If we only have 2 nurses for D/E and one has 'E' on Day 1, then the OTHER must have 'D' on Day 2.
  // Wait, I'll just check if it EVER violates it.
  const schedule = buildSchedule(baseConfig, {});
  const result = assignDayAndEveningCoverage(schedule, baseConfig);

  for (let d = 1; d < 31; d++) {
    for (const nurseId of ['n1', 'n2', 'n4']) {
      if (result[d][nurseId] === 'E') {
        expect(result[d+1][nurseId]).not.toBe('D');
      }
    }
  }
});

test('assignDayAndEveningCoverage respects max consecutive work days', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D' },
    2: { n1: 'D' },
    3: { n1: 'D' },
    4: { n1: 'D' },
  });
  // n1 has 4 consecutive 'D's. On Day 5, n1 should NOT be assigned a work shift.
  const result = assignDayAndEveningCoverage(schedule, baseConfig);
  expect(['D', 'E', 'N']).not.toContain(result[5].n1);
});

test('assignDayAndEveningCoverage does not overwrite existing helper night coverage', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { HELPER: 'N' },
  });

  const result = assignDayAndEveningCoverage(schedule, baseConfig);

  expect(result[1].HELPER).toBe('N');
});

test('assignDayAndEveningCoverage does not create DE for nurses missing a required allowed shift', () => {
  const restrictedConfig = {
    ...baseConfig,
    nurses: baseConfig.nurses.map((nurse) =>
      nurse.id === 'n1'
        ? { ...nurse, allowedShifts: ['E', 'O'] as ShiftCode[] }
        : nurse
    ),
  };
  const schedule = buildSchedule(restrictedConfig, {
    1: { n1: 'E' },
  });

  const result = assignDayAndEveningCoverage(schedule, restrictedConfig);

  expect(result[1].n1).toBe('E');
});

test('assignDayAndEveningCoverage respects future preassigned night blocks when checking consecutive work', () => {
  const schedule = buildSchedule(baseConfig, {
    6: { n1: 'E' },
    8: { n1: 'N' },
    9: { n1: 'N' },
    10: { n1: 'N' },
  });

  const result = assignDayAndEveningCoverage(schedule, baseConfig);

  expect(['D', 'E', 'DE']).not.toContain(result[7].n1);
});
