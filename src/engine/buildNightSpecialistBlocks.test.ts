import { baseConfig } from '../test/fixtures/baseConfig';
import { createEmptySchedule } from '../domain/schedule';
import { buildNightSpecialistBlocks } from './buildNightSpecialistBlocks';

test('buildNightSpecialistBlocks places only N and O for the specialist', () => {
  const schedule = createEmptySchedule(baseConfig);
  const result = buildNightSpecialistBlocks(schedule, baseConfig);

  for (const assignments of Object.values(result)) {
    expect(['N', 'O', null]).toContain(assignments.n3);
  }
});

test('buildNightSpecialistBlocks avoids mandatory off collisions', () => {
  const schedule = createEmptySchedule(baseConfig);
  const result = buildNightSpecialistBlocks(schedule, baseConfig);
  // n3 has mandatory off on days 2 and 3
  expect(result[2].n3).toBe('O');
  expect(result[3].n3).toBe('O');
});
