import type { MonthlySchedule, NurseConfig, ShiftCode } from '../domain/types';

interface Props {
  schedule: MonthlySchedule;
  nurses: NurseConfig[];
}

const getShiftColor = (shift: ShiftCode | null) => {
  switch (shift) {
    case 'D': return '#e3f2fd'; // Light Blue
    case 'E': return '#fff3e0'; // Light Orange
    case 'N': return '#fce4ec'; // Light Pink
    case 'DE': return '#f3e5f5'; // Light Purple (Double)
    case 'O': return '#f5f5f5'; // Light Grey
    default: return 'transparent';
  }
};

export function ScheduleTable({ schedule, nurses }: Props) {
  const days = Object.keys(schedule).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ 
      overflowX: 'auto', 
      border: '1px solid #dee2e6', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ 
              padding: '0.75rem', 
              border: '1px solid #dee2e6', 
              position: 'sticky', 
              left: 0, 
              backgroundColor: '#f8f9fa',
              zIndex: 2,
              minWidth: '100px'
            }}>간호사</th>
            {days.map(day => (
              <th key={day} style={{ padding: '0.75rem', border: '1px solid #dee2e6', minWidth: '40px' }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nurses.map(nurse => (
            <tr key={nurse.id}>
              <td style={{ 
                padding: '0.75rem', 
                border: '1px solid #dee2e6', 
                fontWeight: 'bold', 
                position: 'sticky', 
                left: 0, 
                backgroundColor: '#fff',
                zIndex: 1
              }}>
                {nurse.name}
                {nurse.nurseType === 'nightSpecialist' && <span style={{ display: 'block', fontSize: '0.7rem', color: '#666' }}>(야간전담)</span>}
              </td>
              {days.map(day => {
                const shift = schedule[day][nurse.id];
                return (
                  <td key={day} style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #dee2e6', 
                    textAlign: 'center',
                    backgroundColor: getShiftColor(shift),
                    fontWeight: shift === 'O' ? 'normal' : 'bold'
                  }}>
                    {shift || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
