import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateMonthlyOffRange } from './validateMonthlyOffRange';

test('validateMonthlyOffRange flags general nurse outside 9-11 off range', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D' }, 2: { n1: 'D' }, 3: { n1: 'D' }, 4: { n1: 'D' },
    5: { n1: 'O' }, 6: { n1: 'D' }, 7: { n1: 'D' }, 8: { n1: 'D' },
    9: { n1: 'D' }, 10: { n1: 'O' }, 11: { n1: 'D' }, 12: { n1: 'D' },
    13: { n1: 'D' }, 14: { n1: 'D' }, 15: { n1: 'O' }, 16: { n1: 'D' },
    17: { n1: 'D' }, 18: { n1: 'D' }, 19: { n1: 'D' }, 20: { n1: 'O' },
    21: { n1: 'D' }, 22: { n1: 'D' }, 23: { n1: 'O' }, 24: { n1: 'O' },
    25: { n1: 'D' }, 26: { n1: 'D' }, 27: { n1: 'D' }, 28: { n1: 'D' },
    29: { n1: 'O' }, 30: { n1: 'O' }, 31: { n1: 'D' }
  });
  // Nurse n1 has 7 'O' days. Range is 9-11.
  const issues = validateMonthlyOffRange(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'OFF_RANGE_VIOLATION')).toBe(true);
});
