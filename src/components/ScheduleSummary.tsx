// src/components/ScheduleSummary.tsx
import type { MonthlySchedule, NurseConfig } from '../domain/types';
import { summarizeSchedule } from '../domain/schedule';

interface Props {
  schedule: MonthlySchedule;
  nurses: NurseConfig[];
}

export function ScheduleSummary({ schedule, nurses }: Props) {
  const summary = summarizeSchedule(schedule, nurses);

  return (
    <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>이름</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>유형</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>낮(D)</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>저녁(E)</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>밤(N)</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>휴무(O)</th>
            <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>합계</th>
          </tr>
        </thead>
        <tbody>
          {nurses.map(nurse => {
            const stats = summary[nurse.id] || { totalD: 0, totalE: 0, totalN: 0, totalO: 0 };
            const total = stats.totalD + stats.totalE + stats.totalN + stats.totalO;
            return (
              <tr key={nurse.id}>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontWeight: 'bold' }}>{nurse.name}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>
                  {nurse.nurseType === 'nightSpecialist' ? '야간전담' : '일반'}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>{stats.totalD}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>{stats.totalE}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>{stats.totalN}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>{stats.totalO}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: '#f1f3f5' }}>{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
