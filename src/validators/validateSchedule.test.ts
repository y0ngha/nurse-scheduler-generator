import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateSchedule } from './validateSchedule';

test('validateSchedule aggregates hard-validator errors and warnings', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'E' },
    2: { n1: 'D' }, // Evening to Day violation
    23: { n1: 'D' }, // Mandatory off violation
  });
  const result = validateSchedule(schedule, baseConfig);
  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThanOrEqual(2);
  expect(result.errors.some(e => e.code === 'EVENING_TO_DAY_VIOLATION')).toBe(true);
  expect(result.errors.some(e => e.code === 'MANDATORY_OFF_VIOLATION')).toBe(true);
});
