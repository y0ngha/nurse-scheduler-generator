import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateMandatoryOffs } from './validateMandatoryOffs';

test('validateMandatoryOffs reports fixed off violations', () => {
  const schedule = buildSchedule(baseConfig, { 23: { n1: 'D' } });
  expect(validateMandatoryOffs(schedule, baseConfig).at(0)?.code).toBe('MANDATORY_OFF_VIOLATION');
});
