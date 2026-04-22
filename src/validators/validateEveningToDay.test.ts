import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateEveningToDay } from './validateEveningToDay';

test('validateEveningToDay flags E then next-day D for same nurse', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'E' },
    2: { n1: 'D' },
  });
  const issues = validateEveningToDay(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'EVENING_TO_DAY_VIOLATION')).toBe(true);
});
