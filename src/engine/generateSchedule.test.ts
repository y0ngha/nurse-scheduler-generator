import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule returns valid schedule structure for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.validation.isValid).toBe(true);
    expect(result.data.validation.errors).toHaveLength(0);
  }
});

test('generateSchedule returns ok:true even for impossible config (using fallbacks)', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(true);
});

test('generateSchedule returns ok:false when finalized schedule violates hard validation', () => {
  const result = generateSchedule({
    ...baseConfig,
    globalMinOffDays: 32,
    nurses: baseConfig.nurses.map((nurse) =>
      nurse.nurseType === 'general' ? { ...nurse, minOffDays: 32 } : nurse
    ),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.errors.some((error) => error.code === 'OFF_RANGE_VIOLATION')).toBe(true);
  }
});
