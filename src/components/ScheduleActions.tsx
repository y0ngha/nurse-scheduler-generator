// src/components/ScheduleActions.tsx
export function ScheduleActions({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div>
      <button onClick={onGenerate}>Generate Schedule</button>
    </div>
  );
}
