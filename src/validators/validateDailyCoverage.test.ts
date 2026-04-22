import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateDailyCoverage } from './validateDailyCoverage';

test('validateDailyCoverage reports missing D, E, and N separately', () => {
  const schedule = buildSchedule(baseConfig, {});
  const issues = validateDailyCoverage(schedule, baseConfig);
  expect(issues.some((issue) => issue.code === 'MISSING_DAY_COVERAGE')).toBe(true);
  expect(issues.some((issue) => issue.code === 'MISSING_EVENING_COVERAGE')).toBe(true);
  expect(issues.some((issue) => issue.code === 'MISSING_NIGHT_COVERAGE')).toBe(true);
});
