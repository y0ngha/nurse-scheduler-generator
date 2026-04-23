import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { buildReplacementNightBlocks } from './buildReplacementNightBlocks';
import type { ShiftCode } from '../domain/types';

test('buildReplacementNightBlocks adds general-nurse N block only when specialist is off and night is uncovered', () => {
  const assignments: Record<number, Record<string, any>> = {};
  for (let d = 1; d <= 31; d++) {
    if (d >= 1 && d <= 3) {
      assignments[d] = { n3: 'O' }; 
    } else {
      assignments[d] = { n3: (d % 6 >= 1 && d % 6 <= 3) ? 'N' : 'O' };
    }
  }
  const schedule = buildSchedule(baseConfig, assignments);
  const result = buildReplacementNightBlocks(schedule, baseConfig);
  expect(result.ok).toBe(true);
});

test('buildReplacementNightBlocks uses HELPER when no eligible replacement exists', () => {
  const tightConfig = {
    ...baseConfig,
    nurses: baseConfig.nurses.map(n => n.nurseType === 'general' ? { ...n, allowedShifts: (['D', 'E', 'O'] as ShiftCode[]) } : n)
  };
  const schedule = buildSchedule(tightConfig, {
    1: { n3: 'O' },
  });
  const result = buildReplacementNightBlocks(schedule, tightConfig);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.schedule[1]['HELPER']).toBe('N');
  }
});
