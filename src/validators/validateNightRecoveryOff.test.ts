import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateNightRecoveryOff } from './validateNightRecoveryOff';

test('validateNightRecoveryOff flags missing recovery off after N N N', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'N' },
    2: { n1: 'N' },
    3: { n1: 'N' },
    4: { n1: 'D' },
  });
  const issues = validateNightRecoveryOff(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'NIGHT_RECOVERY_OFF_VIOLATION')).toBe(true);
});
