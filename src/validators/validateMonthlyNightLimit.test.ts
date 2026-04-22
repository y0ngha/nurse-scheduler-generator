import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateMonthlyNightLimit } from './validateMonthlyNightLimit';

test('validateMonthlyNightLimit flags excess monthly night count', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'N' }, 2: { n1: 'N' }, 3: { n1: 'N' },
    10: { n1: 'N' }, 11: { n1: 'N' }, 12: { n1: 'N' },
    20: { n1: 'N' }, 21: { n1: 'N' }, 22: { n1: 'N' },
  });
  // n1 has 9 nights. maxNightShifts is 6.
  const issues = validateMonthlyNightLimit(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'MONTHLY_NIGHT_LIMIT_VIOLATION')).toBe(true);
});
