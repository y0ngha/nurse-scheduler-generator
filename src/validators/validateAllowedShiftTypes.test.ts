import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateAllowedShiftTypes } from './validateAllowedShiftTypes';

test('validateAllowedShiftTypes reports disallowed shift assignments', () => {
  const schedule = buildSchedule(baseConfig, { 1: { n3: 'D' } });
  expect(validateAllowedShiftTypes(schedule, baseConfig).at(0)?.code).toBe('DISALLOWED_SHIFT');
});
