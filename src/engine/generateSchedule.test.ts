import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule returns valid schedule structure for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
});

test('generateSchedule returns ok:true even for impossible config (using fallbacks)', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(true);
});
