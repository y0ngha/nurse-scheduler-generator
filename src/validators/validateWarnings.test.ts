import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateWarnings } from './validateWarnings';

test('validateWarnings flags unnecessary general night assignment', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n3: 'O', n1: 'N' }, // Specialist n3 is off, n1 covers night (OK)
    10: { n3: 'N', n1: 'N' }, // Specialist n3 is already on night, n1 also on night (Unnecessary)
  });
  const warnings = validateWarnings(schedule, baseConfig);
  expect(warnings.some(w => w.code === 'UNNECESSARY_GENERAL_NIGHT_ASSIGNMENT')).toBe(true);
});
