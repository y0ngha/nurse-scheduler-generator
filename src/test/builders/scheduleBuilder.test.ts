import { baseConfig } from '../fixtures/baseConfig';
import { buildSchedule } from './scheduleBuilder';

test('buildSchedule sets explicit shifts and keeps other cells null', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D', n2: 'E', n3: 'N', n4: 'O' },
  });

  expect(schedule[1].n1).toBe('D');
  expect(schedule[2].n1).toBeNull();
});
