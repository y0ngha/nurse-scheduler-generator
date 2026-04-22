import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { buildReplacementNightBlocks } from './buildReplacementNightBlocks';

test('buildReplacementNightBlocks adds general-nurse N block only when specialist is off and night is uncovered', () => {
  // specialist n3 is off on day 1. Let's see if a general nurse covers it with a 3-night block.
  // Other days are covered by n3.
  const assignments: Record<number, Record<string, any>> = {};
  for (let d = 1; d <= 31; d++) {
    if (d >= 1 && d <= 3) {
      assignments[d] = { n3: 'O' }; // Gap!
    } else {
      assignments[d] = { n3: (d % 6 >= 1 && d % 6 <= 3) ? 'N' : 'O' };
    }
  }
  // All days are either covered by n3 or the gap 1-3.
  const schedule = buildSchedule(baseConfig, assignments);
  const result = buildReplacementNightBlocks(schedule, baseConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.schedule[1].n1 === 'N' || result.data.schedule[1].n2 === 'N' || result.data.schedule[1].n4 === 'N').toBe(true);
    expect(result.data.schedule[2].n1 === 'N' || result.data.schedule[2].n2 === 'N' || result.data.schedule[2].n4 === 'N').toBe(true);
    expect(result.data.schedule[3].n1 === 'N' || result.data.schedule[3].n2 === 'N' || result.data.schedule[3].n4 === 'N').toBe(true);
  }
});

test('buildReplacementNightBlocks does not add speculative general-nurse N blocks', () => {
  // Specialist n3 covers the ENTIRE month with nights.
  const assignments: Record<number, Record<string, any>> = {};
  for (let d = 1; d <= 31; d++) {
    assignments[d] = { n3: 'N' };
  }
  // All days are covered by n3.
  const schedule = buildSchedule(baseConfig, assignments);
  const result = buildReplacementNightBlocks(schedule, baseConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    // Should not have added any general nurse nights
    for (let d = 1; d <= 31; d++) {
      expect(result.data.schedule[d].n1).toBeNull();
      expect(result.data.schedule[d].n2).toBeNull();
      expect(result.data.schedule[d].n4).toBeNull();
    }
  }
});

test('buildReplacementNightBlocks fails when no eligible replacement exists', () => {
  const tightConfig = {
    ...baseConfig,
    nurses: baseConfig.nurses.map(n => n.nurseType === 'general' ? { ...n, allowedShifts: ['D', 'E', 'O'] } : n)
  };
  const schedule = buildSchedule(tightConfig, {
    1: { n3: 'O' },
  });
  const result = buildReplacementNightBlocks(schedule, tightConfig);
  expect(result.ok).toBe(false);
});
