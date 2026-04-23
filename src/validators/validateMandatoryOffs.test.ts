import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateMandatoryOffs } from './validateMandatoryOffs';

describe('validateMandatoryOffs', () => {
  test('reports fixed off violations', () => {
    const schedule = buildSchedule(baseConfig, { 23: { n1: 'D' } });
    const issues = validateMandatoryOffs(schedule, baseConfig);
    expect(issues.some(i => i.code === 'MANDATORY_OFF_VIOLATION' && i.nurseId === 'n1' && i.day === 23)).toBe(true);
  });

  test('does not report violation when nurse is off on mandatory off date', () => {
    const schedule = buildSchedule(baseConfig, { 23: { n1: 'O' }, 24: { n1: 'O' } });
    const issues = validateMandatoryOffs(schedule, baseConfig);
    const n1Issues = issues.filter(i => i.nurseId === 'n1' && (i.day === 23 || i.day === 24));
    expect(n1Issues.length).toBe(0);
  });

  test('reports violations for multiple nurses', () => {
    const schedule = buildSchedule(baseConfig, { 23: { n1: 'D' }, 2: { n3: 'N' } });
    const issues = validateMandatoryOffs(schedule, baseConfig);
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues.some(i => i.nurseId === 'n1' && i.day === 23)).toBe(true);
    expect(issues.some(i => i.nurseId === 'n3' && i.day === 2)).toBe(true);
  });
});
