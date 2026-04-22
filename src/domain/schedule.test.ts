import { cloneSchedule, createEmptySchedule, getMonthLength, summarizeSchedule } from './schedule';
import type { SchedulerConfig } from './types';

const config: SchedulerConfig = {
  year: 2026,
  month: 8,
  nurses: [
    {
      id: 'n1',
      name: 'Nurse 1',
      nurseType: 'general',
      allowedShifts: ['D', 'E', 'N', 'O'],
      mandatoryOffDates: [23, 24],
      maxNightShifts: 6,
      offRange: { min: 9, max: 11 },
      nightRecoveryOffDays: 2,
    },
  ],
  maxConsecutiveWorkDays: 4,
  nightBlockLength: 3,
  forbidEveningToNextDay: true,
};

test('createEmptySchedule initializes all nurse/day cells to null', () => {
  const schedule = createEmptySchedule(config);
  expect(schedule[1].n1).toBeNull();
  expect(schedule[31].n1).toBeNull();
});

test('getMonthLength returns correct number of days', () => {
  expect(getMonthLength(2026, 8)).toBe(31);
  expect(getMonthLength(2026, 2)).toBe(28);
});

test('getMonthLength rejects invalid month values', () => {
  expect(() => getMonthLength(2026, 0)).toThrow('Invalid month "0". Expected an integer from 1 to 12.');
  expect(() => getMonthLength(2026, 13)).toThrow('Invalid month "13". Expected an integer from 1 to 12.');
  expect(() => getMonthLength(2026, 2.5)).toThrow('Invalid month "2.5". Expected an integer from 1 to 12.');
});

test('summarizeSchedule counts shifts per nurse', () => {
  const schedule = createEmptySchedule(config);
  schedule[1].n1 = 'D';
  schedule[2].n1 = 'O';

  expect(summarizeSchedule(schedule, config.nurses).n1).toEqual({
    totalD: 1,
    totalE: 0,
    totalN: 0,
    totalO: 1,
  });
});

test('cloneSchedule returns a deep, mutation-safe copy', () => {
  const schedule = createEmptySchedule(config);
  schedule[1].n1 = 'D';

  const cloned = cloneSchedule(schedule);
  cloned[1].n1 = 'O';

  expect(cloned).not.toBe(schedule);
  expect(cloned[1]).not.toBe(schedule[1]);
  expect(schedule[1].n1).toBe('D');
  expect(cloned[1].n1).toBe('O');
});
