import { baseConfig } from '../test/fixtures/baseConfig';
import { buildSchedule } from '../test/builders/scheduleBuilder';
import { finalizeSchedule } from './finalizeSchedule';

test('finalizeSchedule converts remaining null cells to off', () => {
  const schedule = buildSchedule(baseConfig, {
    1: { n1: 'D' },
  });
  const result = finalizeSchedule(schedule);
  expect(result[1].n2).toBe('O');
  expect(result[2].n1).toBe('O');
});
