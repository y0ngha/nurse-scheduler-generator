// src/components/SchedulerConfigForm.tsx
import { useState, useEffect } from 'react';
import type { SchedulerConfig, NurseConfig } from '../domain/types';

interface Props {
  config: SchedulerConfig;
  onChange: (c: SchedulerConfig) => void;
  onAddNurse: () => void;
  onRemoveNurse: (id: string) => void;
  onUpdateNurse: (nurse: NurseConfig) => void;
}

function MandatoryOffInput({ value, onChange }: { value: number[], onChange: (vals: number[]) => void }) {
  const [text, setText] = useState(value.join(', '));

  useEffect(() => {
    setText(value.join(', '));
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    const dates = newText.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 31);
    onChange(dates);
  };

  return (
    <input 
      value={text} 
      onChange={e => handleChange(e.target.value)}
      placeholder="예: 3, 14, 25"
      style={{ width: '100%', padding: '0.4rem', border: '1px solid #eee', borderRadius: '4px', boxSizing: 'border-box' }}
    />
  );
}

export function SchedulerConfigForm({ config, onChange, onAddNurse, onRemoveNurse, onUpdateNurse }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <label style={{ fontWeight: 'bold' }}>
          년도:
          <input 
            type="number" 
            value={config.year} 
            onChange={e => onChange({...config, year: Number(e.target.value)})}
            style={{ marginLeft: '0.5rem', width: '80px', padding: '0.3rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
        <label style={{ fontWeight: 'bold' }}>
          월 선택:
          <select 
            value={config.month} 
            onChange={e => onChange({...config, month: Number(e.target.value)})}
            style={{ marginLeft: '0.5rem', width: '80px', padding: '0.3rem', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 'bold', marginLeft: '1rem' }}>
          최소 보장 휴무:
          <input 
            type="number" 
            value={config.globalMinOffDays} 
            onChange={e => onChange({...config, globalMinOffDays: Number(e.target.value)})}
            style={{ marginLeft: '0.5rem', width: '50px', padding: '0.3rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>간호사 목록 설정</h3>
          <button 
            type="button"
            onClick={onAddNurse}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + 간호사 추가
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#fdfdfd' }}>
              <th style={{ textAlign: 'left', padding: '0.8rem' }}>이름</th>
              <th style={{ textAlign: 'center', padding: '0.8rem' }}>야간전담 여부</th>
              <th style={{ textAlign: 'left', padding: '0.8rem' }}>지정 휴무일 (쉼표 구분)</th>
              <th style={{ textAlign: 'center', padding: '0.8rem' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {config.nurses.map((nurse) => (
              <tr key={nurse.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.8rem' }}>
                  <input 
                    value={nurse.name} 
                    onChange={e => onUpdateNurse({...nurse, name: e.target.value})}
                    style={{ width: '150px', padding: '0.4rem', border: '1px solid #eee', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ textAlign: 'center', padding: '0.8rem' }}>
                  <input 
                    type="checkbox"
                    checked={nurse.nurseType === 'nightSpecialist'}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    onChange={e => {
                      const isSpecialist = e.target.checked;
                      onUpdateNurse({
                        ...nurse,
                        nurseType: isSpecialist ? 'nightSpecialist' : 'general',
                        allowedShifts: isSpecialist ? ['N', 'O'] : ['D', 'E', 'N', 'O'],
                        maxNightShifts: isSpecialist ? 16 : 6,
                        minOffDays: isSpecialist ? null : config.globalMinOffDays,
                        nightRecoveryOffDays: isSpecialist ? 3 : 2
                      });
                    }}
                  />
                </td>
                <td style={{ padding: '0.8rem' }}>
                  <MandatoryOffInput 
                    value={nurse.mandatoryOffDates} 
                    onChange={dates => onUpdateNurse({...nurse, mandatoryOffDates: dates})}
                  />
                </td>
                <td style={{ textAlign: 'center', padding: '0.8rem' }}>
                  <button 
                    type="button"
                    onClick={() => onRemoveNurse(nurse.id)}
                    style={{ backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
