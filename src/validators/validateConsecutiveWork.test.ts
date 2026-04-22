import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateConsecutiveWork } from './validateConsecutiveWork';

test('validateConsecutiveWork flags more than 4 consecutive work days for general nurses', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D' },
    2: { n1: 'E' },
    3: { n1: 'D' },
    4: { n1: 'E' },
    5: { n1: 'D' },
  });
  const issues = validateConsecutiveWork(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'MAX_CONSECUTIVE_WORK_VIOLATION')).toBe(true);
});
