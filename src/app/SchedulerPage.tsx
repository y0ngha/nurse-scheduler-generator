import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import type {
  SchedulerConfig,
  ScheduleGenerationResult,
  NurseConfig,
} from "../domain/types";
import { baseConfig } from "../test/fixtures/baseConfig";
import { generateSchedule } from "../engine/generateSchedule";
import { SchedulerConfigForm } from "../components/SchedulerConfigForm";
import { ScheduleActions } from "../components/ScheduleActions";
import { ScheduleSummary } from "../components/ScheduleSummary";
import { ScheduleTable } from "../components/ScheduleTable";
import { summarizeSchedule } from "../domain/schedule";

export function SchedulerPage() {
  const [config, setConfig] = useState<SchedulerConfig>(baseConfig);
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);

  useEffect(() => { setResult(null); }, [config]);

  const handleGenerate = () => setResult(generateSchedule(config));

  const handleExportExcel = () => {
    if (!result || !result.ok) return;
    const { schedule } = result.data;
    const days = Object.keys(schedule).map(Number).sort((a, b) => a - b);
    
    const summary = summarizeSchedule(schedule, config.nurses);
    const hasHelper = summary['HELPER'].totalD + summary['HELPER'].totalE + summary['HELPER'].totalN > 0 ||
                      summary['HELPER_2'].totalD + summary['HELPER_2'].totalE + summary['HELPER_2'].totalN > 0;
    
    const displayNurses = [...config.nurses];
    if (hasHelper) displayNurses.push({ id: 'HELPER_TOTAL', name: '외부 헬퍼(합계)' } as any);

    const data = displayNurses.map((nurse) => {
      const row: Record<string, string> = { "간호사 이름": nurse.name };
      days.forEach((day) => {
        if (nurse.id === 'HELPER_TOTAL') {
          const h1 = schedule[day]['HELPER'] || '-';
          const h2 = schedule[day]['HELPER_2'] || '-';
          row[`${day}일`] = [h1, h2].filter(s => s !== null && s !== 'O' && s !== '-').join(' & ');
        } else {
          row[`${day}일`] = schedule[day][nurse.id] || "-";
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "근무표");
    XLSX.writeFile(workbook, `근무표_${config.year}_${config.month}.xlsx`);
  };

  const addNurse = () => {
    setConfig({ ...config, nurses: [...config.nurses, { id: `n${Date.now()}`, name: '신규 간호사', nurseType: 'general', allowedShifts: ['D','E','N','O'], mandatoryOffDates: [], maxNightShifts: 6, minOffDays: config.globalMinOffDays, nightRecoveryOffDays: 2 } as NurseConfig] });
    setResult(null);
  };
  const removeNurse = (id: string) => { 
    setConfig({ ...config, nurses: config.nurses.filter(n => n.id !== id) });
    setResult(null);
  };
  const updateNurse = (n: NurseConfig) => { 
    setConfig({ ...config, nurses: config.nurses.map(curr => curr.id === n.id ? n : curr) });
    setResult(null);
  };
  const setConfigFull = (newConfig: SchedulerConfig) => {
      setConfig(newConfig);
      setResult(null);
  };

  const specialistCount = config.nurses.filter(n => n.nurseType === "nightSpecialist").length;

  const getDisplayNurses = () => {
    if (!result || !result.ok) return config.nurses;
    const helperUsed = Object.values(result.data.schedule).some(d => d['HELPER'] !== 'O' || d['HELPER_2'] !== 'O');
    return helperUsed ? [...config.nurses, { id: 'HELPER', name: '외부 헬퍼', nurseType: 'general' } as any] : config.nurses;
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", color: "#213547" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>간호사 근무 스케줄 생성기</h1>
        <div style={{ padding: '0.8rem', backgroundColor: '#e3f2fd', borderRadius: '30px', display: 'inline-block' }}>
          💡 권장: {specialistCount > 0 ? '전담 포함 최소 5명' : '일반 간호사 최소 6명'}
        </div>
      </header>

      <section style={{ backgroundColor: "#f8f9fa", padding: "1.5rem", borderRadius: "12px", border: "1px solid #dee2e6" }}>
        <SchedulerConfigForm config={config} onChange={setConfigFull} onAddNurse={addNurse} onRemoveNurse={removeNurse} onUpdateNurse={updateNurse} />
        <ScheduleActions onGenerate={handleGenerate} onExportExcel={handleExportExcel} canGenerate={true} hasResult={!!(result && result.ok)} />
      </section>

      {result?.ok && (
        <div style={{ marginTop: '2rem' }}>
          {result.data.validation.errors.length > 0 && (
            <div style={{ padding: '1rem', backgroundColor: '#fff2f0', color: '#cf1322', borderRadius: '8px', marginBottom: '1rem' }}>
              <strong>❌ 검증 위반 사항:</strong> 
              <ul>{result.data.validation.errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
            </div>
          )}
          <h2>생성된 근무표</h2>
          <ScheduleTable schedule={result.data.schedule} nurses={getDisplayNurses()} />
          <h2>간호사별 근무 요약</h2>
          <ScheduleSummary schedule={result.data.schedule} nurses={getDisplayNurses()} />
        </div>
      )}
    </div>
  );
}
