import { useMemo } from 'react';
import { Candidate } from '../App';
import { PhaseConfig } from '../phaseConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { Users, UserCheck, UserX, Award, Percent, MapPin, Calendar } from 'lucide-react';

interface StatisticsProps {
  data: Candidate[];
  phase: PhaseConfig;
}

const parseScore = (val: any): number => {
  if (!val || val === '---' || val === '#N/A' || val === '#N/D') return -1;
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? -1 : n;
};

export default function Statistics({ data, phase }: StatisticsProps) {
  const isFase1y2 = phase.id === 'fase1y2-prov';

  const stats = useMemo(() => {
    const convocados = data.length;

    // ── Fase 1 helpers ──────────────────────────────────────────────────────
    const isPresentadoF1 = (d: Candidate) => {
      const est = d['ESTADO DEFINITIVO']?.trim().toUpperCase();
      return est === 'APTO/A' || est === 'NO APTO/A';
    };
    const isAprobadoF1 = (d: Candidate) =>
      d['ESTADO DEFINITIVO']?.trim().toUpperCase() === 'APTO/A';

    // ── Fase 2 helpers (only meaningful in fase1y2-prov) ────────────────────
    const isPresentadoF2 = (d: Candidate) => {
      const est = d['ESTADO PROVISIONAL FASE 2']?.trim().toUpperCase();
      return est === 'APTO/A' || est === 'NO APTO/A';
    };
    const isAprobadoF2 = (d: Candidate) =>
      d['ESTADO PROVISIONAL FASE 2']?.trim().toUpperCase() === 'APTO/A';

    // ── Generic helpers (for non-fase1y2 phases) ───────────────────────────
    const scoreCol = phase.scoreColumn;
    const statusCol = phase.statusColumn;
    const isPresentadoGeneric = (d: Candidate) => {
      const estado = statusCol ? d[statusCol]?.trim().toUpperCase() : '';
      const totalScore = scoreCol ? d[scoreCol]?.trim() : '';
      return (totalScore && totalScore !== '---' && totalScore !== '#N/A' && totalScore !== '') ||
        estado === 'APTO/A' || estado === 'NO APTO/A';
    };
    const isAprobadoGeneric = (d: Candidate) =>
      statusCol ? d[statusCol]?.trim().toUpperCase() === 'APTO/A' : false;

    // ── Compute KPIs based on phase ─────────────────────────────────────────
    let presentados: number;
    let noPresentados: number;
    let aprobados: number;
    let aprobadosF1 = 0;
    let aprobadosF2 = 0;
    let suspensos: number;
    let tasaPresentacion: string;
    let tasaAprobados: string;
    let estadoPie: { name: string; value: number; color: string }[];

    if (isFase1y2) {
      const presentadosF1Count = data.filter(isPresentadoF1).length;
      aprobadosF1 = data.filter(isAprobadoF1).length;
      aprobadosF2 = data.filter(isAprobadoF2).length;
      const suspensosF1 = presentadosF1Count - aprobadosF1;

      presentados = presentadosF1Count;
      noPresentados = convocados - presentados;
      aprobados = aprobadosF2; // primary aprobados = F2
      suspensos = presentados - aprobados;
      tasaPresentacion = convocados > 0 ? ((presentados / convocados) * 100).toFixed(1) : '0';
      tasaAprobados = presentados > 0 ? ((aprobados / presentados) * 100).toFixed(1) : '0';

      // Pie based on Fase 1
      estadoPie = [
        { name: 'Aprobados F1', value: aprobadosF1, color: '#10b981' },
        { name: 'Suspensos F1', value: suspensosF1, color: '#f43f5e' },
        { name: 'No Presentados', value: noPresentados, color: '#94a3b8' },
      ];
    } else {
      const presentadosData = data.filter(isPresentadoGeneric);
      presentados = presentadosData.length;
      noPresentados = convocados - presentados;
      aprobados = data.filter(isAprobadoGeneric).length;
      suspensos = presentados - aprobados;
      tasaPresentacion = convocados > 0 ? ((presentados / convocados) * 100).toFixed(1) : '0';
      tasaAprobados = presentados > 0 ? ((aprobados / presentados) * 100).toFixed(1) : '0';
      estadoPie = [
        { name: 'Aprobados', value: aprobados, color: '#10b981' },
        { name: 'Suspensos', value: suspensos, color: '#f43f5e' },
        { name: 'No Presentados', value: noPresentados, color: '#94a3b8' },
      ];
    }

    // ── Por Sedes (F1 based) ────────────────────────────────────────────────
    const sedes = Array.from(new Set(data.map(d => d['SEDE DE EXAMEN FASE 1']?.trim()).filter(Boolean)));
    const bySede = sedes.map(sede => {
      const sData = data.filter(d => d['SEDE DE EXAMEN FASE 1']?.trim() === sede);
      const sPresentados = sData.filter(isFase1y2 ? isPresentadoF1 : isPresentadoGeneric).length;
      const sAprobados = sData.filter(isFase1y2 ? isAprobadoF1 : isAprobadoGeneric).length;
      return {
        name: sede,
        Convocados: sData.length,
        Presentados: sPresentados,
        Aprobados: sAprobados,
        Suspensos: sPresentados - sAprobados,
        '% Aprobados': sPresentados > 0 ? Math.round((sAprobados / sPresentados) * 100) : 0,
      };
    }).sort((a, b) => b.Convocados - a.Convocados);

    // ── Por Días — Fase 1 ───────────────────────────────────────────────────
    const diasF1 = Array.from(new Set(data.map(d => d['DIA EXAMEN FASE 1']?.trim()).filter(Boolean)));
    const byDiaF1 = diasF1.map(dia => {
      const dData = data.filter(d => d['DIA EXAMEN FASE 1']?.trim() === dia);
      const dPresentados = dData.filter(isFase1y2 ? isPresentadoF1 : isPresentadoGeneric).length;
      const dAprobados = dData.filter(isFase1y2 ? isAprobadoF1 : isAprobadoGeneric).length;
      return {
        name: dia,
        Presentados: dPresentados,
        Aprobados: dAprobados,
        '% Aprobados': dPresentados > 0 ? Math.round((dAprobados / dPresentados) * 100) : 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // ── Por Días — Fase 2 (solo en fase1y2-prov) ───────────────────────────
    const diasF2 = isFase1y2
      ? Array.from(new Set(data.map(d => d['FECHA EXAMEN FASE 2']?.trim()).filter(s => s && s !== '---')))
      : [];
    const byDiaF2 = diasF2.map(dia => {
      const dData = data.filter(d => d['FECHA EXAMEN FASE 2']?.trim() === dia);
      const dPresentados = dData.filter(isPresentadoF2).length;
      const dAprobados = dData.filter(isAprobadoF2).length;
      return {
        name: dia,
        Presentados: dPresentados,
        Aprobados: dAprobados,
        '% Aprobados': dPresentados > 0 ? Math.round((dAprobados / dPresentados) * 100) : 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      convocados, presentados, noPresentados, aprobados, aprobadosF1, aprobadosF2, suspensos,
      tasaPresentacion, tasaAprobados,
      bySede, byDiaF1, byDiaF2, estadoPie,
    };
  }, [data, phase]);

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
        {subtitle && <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rowData = payload[0]?.payload;
      const alreadyInPayload = payload.some((e: any) => e.name === '% Aprobados');
      const hasPassRate = rowData && '% Aprobados' in rowData && !alreadyInPayload;
      return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-medium" style={{ color: entry.color || entry.fill }}>
                  {entry.name}:
                </span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  {entry.value.toLocaleString('es-ES')}{entry.name.includes('%') ? '%' : ''}
                </span>
              </div>
            ))}
            {hasPassRate && (
              <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-[11px] font-medium text-amber-500">% Aprobados:</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  {rowData['% Aprobados']}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const DayChart = ({ chartData, title }: { chartData: any[]; title: string }) => (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Calendar size={16} className="text-[#0099cc]" />
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="left" dataKey="Presentados" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="Aprobados" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="% Aprobados" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Convocados"
          value={stats.convocados.toLocaleString('es-ES')}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title={isFase1y2 ? 'Presentados Fase 1' : 'Presentados'}
          value={stats.presentados.toLocaleString('es-ES')}
          subtitle={`${stats.tasaPresentacion}% de asistencia`}
          icon={UserCheck}
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        {isFase1y2 ? (
          <>
            <StatCard
              title="Aprobados Fase 1"
              value={stats.aprobadosF1.toLocaleString('es-ES')}
              subtitle={`${stats.presentados > 0 ? ((stats.aprobadosF1 / stats.presentados) * 100).toFixed(1) : '0'}% de los presentados`}
              icon={Award}
              colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
            <StatCard
              title="Aprobados Fase 2"
              value={stats.aprobadosF2.toLocaleString('es-ES')}
              subtitle={`${stats.aprobadosF1 > 0 ? ((stats.aprobadosF2 / stats.aprobadosF1) * 100).toFixed(1) : '0'}% de los aprobados F1`}
              icon={Award}
              colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Aprobados"
              value={stats.aprobados.toLocaleString('es-ES')}
              subtitle={`${stats.tasaAprobados}% de los presentados`}
              icon={Award}
              colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
            <StatCard
              title="No Presentados"
              value={stats.noPresentados.toLocaleString('es-ES')}
              subtitle={`${(100 - parseFloat(stats.tasaPresentacion)).toFixed(1)}% de absentismo`}
              icon={UserX}
              colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Estados — siempre basado en Fase 1 */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Percent size={16} className="text-[#0099cc]" />
            Distribución Global {isFase1y2 ? '— Fase 1' : ''}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.estadoPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.estadoPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico por Sedes */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <MapPin size={16} className="text-[#0099cc]" />
            Resultados por Sede{isFase1y2 ? ' — Fase 1' : ''}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bySede} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Presentados" fill="#0099cc" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Aprobados" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos por Días */}
        {isFase1y2 ? (
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DayChart chartData={stats.byDiaF1} title="Análisis por Día — Fase 1" />
            <DayChart chartData={stats.byDiaF2} title="Análisis por Día — Fase 2" />
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Calendar size={16} className="text-[#0099cc]" />
              Análisis por Día de Examen
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.byDiaF1} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="Presentados" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="Aprobados" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="% Aprobados" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
