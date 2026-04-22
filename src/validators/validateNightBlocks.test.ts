import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { validateNightBlocks } from './validateNightBlocks';

test('validateNightBlocks flags non-3-night sequences', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'N' },
    2: { n1: 'N' },
    3: { n1: 'O' },
  });
  const issues = validateNightBlocks(schedule, baseConfig);
  expect(issues.some((i) => i.code === 'NIGHT_BLOCK_VIOLATION')).toBe(true);
});
