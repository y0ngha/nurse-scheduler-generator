import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule succeeds for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
});

test('generateSchedule succeeds even for difficult config (using HELPER)', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.validation.warnings.some(w => w.code === 'HELPER_USED')).toBe(true);
  }
});
