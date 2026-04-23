import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateDailyCoverage } from './validateDailyCoverage';

describe('validateDailyCoverage', () => {
  test('reports missing D, E, and N separately', () => {
    const schedule = buildSchedule(baseConfig, {});
    const issues = validateDailyCoverage(schedule, baseConfig);
    expect(issues.some((issue) => issue.code === 'MISSING_DAY_COVERAGE')).toBe(true);
    expect(issues.some((issue) => issue.code === 'MISSING_EVENING_COVERAGE')).toBe(true);
    expect(issues.some((issue) => issue.code === 'MISSING_NIGHT_COVERAGE')).toBe(true);
  });

  test('does not report violation when all shifts are covered', () => {
    const schedule = buildSchedule(baseConfig, {
      1: { n1: 'D', n2: 'E', n3: 'N' }
    });
    const issues = validateDailyCoverage(schedule, baseConfig).filter(i => i.day === 1);
    expect(issues.length).toBe(0);
  });

  test('reports partial missing coverage', () => {
    const schedule = buildSchedule(baseConfig, {
      1: { n1: 'D', n2: 'O', n3: 'N' }
    });
    const issues = validateDailyCoverage(schedule, baseConfig).filter(i => i.day === 1);
    expect(issues.length).toBe(1);
    expect(issues[0].code).toBe('MISSING_EVENING_COVERAGE');
  });
});
