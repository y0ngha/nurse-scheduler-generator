import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { assignDayAndEveningCoverage } from './assignDayAndEveningCoverage';

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
