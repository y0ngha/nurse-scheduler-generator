interface Props {
  onGenerate: () => void;
  onExportExcel: () => void;
  canGenerate: boolean;
  hasResult: boolean;
}

export function ScheduleActions({ onGenerate, onExportExcel, canGenerate, hasResult }: Props) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
      <button 
        onClick={onGenerate}
        disabled={!canGenerate}
        style={{ 
          padding: '0.8rem 2rem', 
          backgroundColor: canGenerate ? '#007bff' : '#6c757d', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s'
        }}
      >
        근무 스케줄 생성
      </button>

      {hasResult && (
        <button 
          onClick={onExportExcel}
          style={{ 
            padding: '0.8rem 2rem', 
            backgroundColor: '#17a2b8', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          엑셀 다운로드
        </button>
      )}
    </div>
  );
}
