import type { SchedulerConfig, NurseConfig } from './types';

const baseConfig: SchedulerConfig = {
  year: 2026,
  month: 8,
  maxConsecutiveWorkDays: 4,
  nightBlockLength: 3,
  forbidEveningToNextDay: true,
  globalMinOffDays: 9,
  nurses: []
};

test('Type validation', () => {
  const nurse: NurseConfig = {
    id: 'n1',
    name: 'Nurse',
    nurseType: 'general',
    allowedShifts: ['D'],
    mandatoryOffDates: [],
    maxNightShifts: 6,
    minOffDays: 9,
    nightRecoveryOffDays: 2,
  };
  expect(nurse.id).toBe('n1');
});

test('Config validation', () => {
  const config: SchedulerConfig = {
    ...baseConfig,
    nurses: []
  };
  expect(config.year).toBe(2026);
});
