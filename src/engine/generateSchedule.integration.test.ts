import { baseConfig } from '../test/fixtures/baseConfig';
import { impossibleConfig } from '../test/fixtures/impossibleConfig';
import { generateSchedule } from './generateSchedule';

test('generateSchedule succeeds for baseline config', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);
});

test('general nurses only receive N when specialist off makes replacement necessary', () => {
  const result = generateSchedule(baseConfig);
  expect(result.ok).toBe(true);

  if (!result.ok) return;

  const specialistId = 'n3';
  const generalNurseIds = ['n1', 'n2', 'n4', 'n5'];

  for (const [dayText, assignments] of Object.entries(result.data.schedule)) {
    const specialistShift = assignments[specialistId];
    const generalNightCount = generalNurseIds.filter((nurseId) => assignments[nurseId] === 'N').length;

    if (specialistShift === 'N') {
      // If specialist is on night, NO general nurse should be on night (as per our Stage 3 logic)
      expect(generalNightCount).toBe(0);
    }
  }
});

test('generateSchedule fails for impossible config', () => {
  const result = generateSchedule(impossibleConfig);
  expect(result.ok).toBe(false);
});
