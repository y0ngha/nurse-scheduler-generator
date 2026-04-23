import { baseConfig } from '../test/fixtures/baseConfig';
import { createEmptySchedule } from './schedule';
import { buildSchedule } from '../test/builders/scheduleBuilder';

test('buildSchedule sets explicit shifts', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D' as const },
  });
  expect(schedule[1].n1).toBe('D');
});

test('createEmptySchedule initializes all nurse/day cells to null', () => {
    const schedule = createEmptySchedule(baseConfig);
    expect(schedule[1]['n1']).toBeNull();
});
