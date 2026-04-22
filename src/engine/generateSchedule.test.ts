import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule returns valid schedule for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.validation.isValid).toBe(true);
  }
});

test('generateSchedule returns failure for impossible config', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(false);
});
