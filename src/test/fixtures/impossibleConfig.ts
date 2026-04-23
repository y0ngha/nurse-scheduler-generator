import type { SchedulerConfig } from '../../domain/types';
import { baseConfig } from './baseConfig';

export const impossibleConfig: SchedulerConfig = {
  ...baseConfig,
  globalMinOffDays: 9,
  nurses: baseConfig.nurses.map((nurse) =>
    nurse.id === 'n3'
      ? { ...nurse, mandatoryOffDates: Array.from({ length: 31 }, (_, index) => index + 1) }
      : nurse
  ),
};
