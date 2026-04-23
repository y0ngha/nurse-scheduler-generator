import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateAllowedShiftTypes } from './validateAllowedShiftTypes';

describe('validateAllowedShiftTypes', () => {
  test('reports disallowed shift assignments', () => {
    // n3 only allows N, O. Trying to assign D.
    const schedule = buildSchedule(baseConfig, { 1: { n3: 'D' } });
    const issues = validateAllowedShiftTypes(schedule, baseConfig);
    expect(issues.some(i => i.code === 'DISALLOWED_SHIFT' && i.nurseId === 'n3' && i.day === 1)).toBe(true);
  });

  test('does not report violation when nurse is assigned an allowed shift', () => {
    // n3 allows N.
    const schedule = buildSchedule(baseConfig, { 1: { n3: 'N' } });
    const issues = validateAllowedShiftTypes(schedule, baseConfig);
    const n3Issues = issues.filter(i => i.nurseId === 'n3' && i.day === 1);
    expect(n3Issues.length).toBe(0);
  });

  test('reports multiple disallowed shift assignments', () => {
    const schedule = buildSchedule(baseConfig, { 1: { n3: 'D' }, 2: { n3: 'E' } });
    const issues = validateAllowedShiftTypes(schedule, baseConfig);
    expect(issues.filter(i => i.nurseId === 'n3').length).toBeGreaterThanOrEqual(2);
  });
});
