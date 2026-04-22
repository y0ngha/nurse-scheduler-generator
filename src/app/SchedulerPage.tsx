// src/app/SchedulerPage.tsx
import { useState } from 'react';
import type { SchedulerConfig, ScheduleGenerationResult } from '../domain/types';
import { baseConfig } from '../test/fixtures/baseConfig';
import { generateSchedule } from '../engine/generateSchedule';
import { SchedulerConfigForm } from '../components/SchedulerConfigForm';
import { ScheduleActions } from '../components/ScheduleActions';
import { ValidationPanel } from '../components/ValidationPanel';
import { ScheduleSummary } from '../components/ScheduleSummary';
import { ScheduleTable } from '../components/ScheduleTable';

export function SchedulerPage() {
  const [config, setConfig] = useState<SchedulerConfig>(baseConfig);
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);

  return (
    <main>
      <h1>Nurse Scheduler</h1>
      <SchedulerConfigForm config={config} onChange={setConfig} />
      <ScheduleActions onGenerate={() => setResult(generateSchedule(config))} />
      <ValidationPanel result={result} />
      {result?.ok ? (
        <>
          <ScheduleSummary schedule={result.data.schedule} nurses={config.nurses} />
          <ScheduleTable schedule={result.data.schedule} nurses={config.nurses} />
        </>
      ) : (
        <p>No schedule generated</p>
      )}
    </main>
  );
}
