// src/test/fixtures/impossibleConfig.ts
import { baseConfig } from './baseConfig';

export const impossibleConfig = {
  ...baseConfig,
  nurses: baseConfig.nurses.map((nurse) =>
    nurse.id === 'n3'
      ? { ...nurse, mandatoryOffDates: Array.from({ length: 31 }, (_, index) => index + 1) }
      : nurse
  ),
};
