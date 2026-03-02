import { useMemo } from 'react';
import { Candidate } from '../App';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { Users, UserCheck, UserX, Award, Percent, MapPin, Calendar } from 'lucide-react';

interface StatisticsProps {
  data: Candidate[];
}

export default function Statistics({ data }: StatisticsProps) {
  const stats = useMemo(() => {
    const convocados = data.length;
    
    const isPresentado = (d: Candidate) => {
      const estado = d['ESTADO PROVISIONAL']?.trim().toUpperCase();
      const totalF1 = d['TOTAL FASE 1']?.trim();
      return (totalF1 && totalF1 !== '---' && totalF1 !== '#N/A' && totalF1 !== '') || 
             estado === 'APTO/A' || 
             estado === 'NO APTO/A';
    };

    const isAprobado = (d: Candidate) => {
      return d['ESTADO PROVISIONAL']?.trim().toUpperCase() === 'APTO/A';
    };

    const presentadosData = data.filter(isPresentado);
    const presentados = presentadosData.length;
    const noPresentados = convocados - presentados;
    
    const aprobadosData = data.filter(isAprobado);
    const aprobados = aprobadosData.length;
    const suspensos = presentados - aprobados;

    const tasaPresentacion = convocados > 0 ? ((presentados / convocados) * 100).toFixed(1) : '0';
    const tasaAprobados = presentados > 0 ? ((aprobados / presentados) * 100).toFixed(1) : '0';

    // Por Sedes
    const sedes = Array.from(new Set(data.map(d => d['SEDE DE EXAMEN']?.trim()).filter(Boolean)));
    const bySede = sedes.map(sede => {
      const sData = data.filter(d => d['SEDE DE EXAMEN']?.trim() === sede);
      const sConvocados = sData.length;
      const sPresentados = sData.filter(isPresentado).length;
      const sAprobados = sData.filter(isAprobado).length;
      const sSuspensos = sPresentados - sAprobados;
      
      return {
        name: sede,
        Convocados: sConvocados,
        Presentados: sPresentados,
        Aprobados: sAprobados,
        Suspensos: sSuspensos,
        '% Aprobados': sPresentados > 0 ? Math.round((sAprobados / sPresentados) * 100) : 0
      };
    }).sort((a, b) => b.Convocados - a.Convocados);

    // Por Días
    const dias = Array.from(new Set(data.map(d => d['DIA EXAMEN']?.trim()).filter(Boolean)));
    const byDia = dias.map(dia => {
      const dData = data.filter(d => d['DIA EXAMEN']?.trim() === dia);
      const dConvocados = dData.length;
      const dPresentados = dData.filter(isPresentado).length;
      const dAprobados = dData.filter(isAprobado).length;
      
      return {
        name: dia,
        Convocados: dConvocados,
        Presentados: dPresentados,
        Aprobados: dAprobados,
        '% Aprobados': dPresentados > 0 ? Math.round((dAprobados / dPresentados) * 100) : 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Distribución de Estados
    const estadoPie = [
      { name: 'Aprobados', value: aprobados, color: '#10b981' }, // emerald-500
      { name: 'Suspensos', value: suspensos, color: '#f43f5e' }, // rose-500
      { name: 'No Presentados', value: noPresentados, color: '#94a3b8' } // slate-400
    ];

    return {
      convocados, presentados, noPresentados, aprobados, suspensos,
      tasaPresentacion, tasaAprobados,
      bySede, byDia, estadoPie
    };
  }, [data]);

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
                <span className="text-[11px] font-medium text-amber-500">
                  % Aprobados:
                </span>
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
          title="Presentados" 
          value={stats.presentados.toLocaleString('es-ES')} 
          subtitle={`${stats.tasaPresentacion}% de asistencia`}
          icon={UserCheck}
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Estados */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Percent size={16} className="text-[#0099cc]" />
            Distribución Global
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
            Resultados por Sede
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

        {/* Gráfico por Días */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Calendar size={16} className="text-[#0099cc]" />
            Análisis por Día de Examen
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.byDia} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
      </div>
    </div>
  );
}
