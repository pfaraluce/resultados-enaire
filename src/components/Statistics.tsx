import { useMemo, useState, useEffect } from 'react';
import { Candidate } from '../App';
import { PhaseConfig } from '../phaseConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Cell
} from 'recharts';
import { 
  Users, UserCheck, UserX, Award, MapPin, Calendar, 
  BookOpen, Languages, Brain, HeartHandshake, TrendingUp 
} from 'lucide-react';

interface StatisticsProps {
  data: Candidate[];
  phase: PhaseConfig;
}

export default function Statistics({ data, phase }: StatisticsProps) {
  const [shouldRenderChart, setShouldRenderChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderChart(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const convocados = data.length;

    // Helper functions for Phase 1 Sub-tests
    const isPresentadoF1 = (d: Candidate) => {
      const st = d['ESTADO DEFINITIVO FASE 1']?.trim().toUpperCase();
      return st === 'APTO/A' || st === 'NO APTO/A';
    };
    const isAprobadoF1 = (d: Candidate) => d['ESTADO DEFINITIVO FASE 1']?.trim().toUpperCase() === 'APTO/A';

    const isAprobadoCG = (d: Candidate) => {
      const val = d['CONOCIMIENTOS GENERALES']?.trim();
      return val && val !== '---' && val !== 'NO APTO/A' && val !== '';
    };
    const isAprobadoING = (d: Candidate) => {
      const val = d['CONOCIMIENTOS IDIOMA INGLÉS']?.trim();
      return val && val !== '---' && val !== 'NO APTO/A' && val !== '';
    };
    const isAprobadoAPT = (d: Candidate) => {
      const val = d['APTITUDES']?.trim();
      return val && val !== '---' && val !== 'NO APTO/A' && val !== '';
    };
    const isAprobadoPERS = (d: Candidate) => {
      const val = d['PERSONALIDAD']?.trim().toUpperCase();
      return val === 'APTO/A' || val === 'APTO';
    };

    // Phase 2 Helper
    const isPresentadoF2 = (d: Candidate) => {
      const st = (d['ESTADO DEFINITIVO FASE 2'] || d['ESTADO PROVISIONAL FASE 2'])?.trim().toUpperCase();
      return st === 'APTO/A' || st === 'NO APTO/A';
    };
    const isAprobadoF2 = (d: Candidate) =>
      (d['ESTADO DEFINITIVO FASE 2'] || d['ESTADO PROVISIONAL FASE 2'])?.trim().toUpperCase() === 'APTO/A';

    // Phase 3 Helper
    const isAprobadoF3 = (d: Candidate) => {
      const s3A = d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase();
      const s3B = d['RESULTADO 3 B)']?.trim().toUpperCase();
      const s3C = d['RESULTADO 3 C)']?.trim().toUpperCase();
      return s3A === 'APTO/A' && s3B === 'APTO/A' && s3C === 'APTO/A';
    };

    // Core Metrics
    const presentadosF1 = data.filter(isPresentadoF1).length;
    const noPresentadosF1 = convocados - presentadosF1;
    const aprobadosF1 = data.filter(isAprobadoF1).length;
    
    // Aptos in F2 (we count APTO/A in F2 columns)
    const aprobadosF2 = data.filter(isAprobadoF2).length;

    // Aptos in F3
    const aprobadosF3 = data.filter(isAprobadoF3).length;

    // Sub-test passes among presentees
    const cgAptos = data.filter(d => isPresentadoF1(d) && isAprobadoCG(d)).length;
    const ingAptos = data.filter(d => isPresentadoF1(d) && isAprobadoING(d)).length;
    const aptAptos = data.filter(d => isPresentadoF1(d) && isAprobadoAPT(d)).length;
    const persAptos = data.filter(d => isPresentadoF1(d) && isAprobadoPERS(d)).length;

    // By Sede
    const sedeCol = 'SEDE DE EXAMEN FASE 1';
    const sedes = Array.from(new Set(data.map(d => d[sedeCol]?.trim()).filter(Boolean)));
    const bySede = sedes.map(sede => {
      const sData = data.filter(d => d[sedeCol]?.trim() === sede);
      const sPresentados = sData.filter(isPresentadoF1).length;
      const sAprobadosF1 = sData.filter(isAprobadoF1).length;
      const sAprobadosF2 = sData.filter(isAprobadoF2).length;
      const sAprobadosF3 = sData.filter(isAprobadoF3).length;
      return {
        name: sede,
        Convocados: sData.length,
        Presentados: sPresentados,
        AprobadosF1: sAprobadosF1,
        AprobadosF2: sAprobadosF2,
        AprobadosF3: sAprobadosF3,
        '% Asistencia': sData.length > 0 ? Math.round((sPresentados / sData.length) * 100) : 0,
        '% Aprobados F1': sPresentados > 0 ? Math.round((sAprobadosF1 / sPresentados) * 100) : 0,
        '% Aprobados F2': sAprobadosF1 > 0 ? Math.round((sAprobadosF2 / sAprobadosF1) * 100) : 0,
        '% Aprobados F3': sAprobadosF2 > 0 ? Math.round((sAprobadosF3 / sAprobadosF2) * 100) : 0
      };
    }).sort((a, b) => b.Convocados - a.Convocados);

    // By Day - Phase 1
    const dayCol1 = 'DIA EXAMEN FASE 1';
    const dias1 = Array.from(new Set(data.map(d => d[dayCol1]?.trim()).filter(Boolean)));
    const byDiaF1 = dias1.map(dia => {
      const dData = data.filter(d => d[dayCol1]?.trim() === dia);
      const dPresentados = dData.filter(isPresentadoF1).length;
      const dAprobadosF1 = dData.filter(isAprobadoF1).length;

      const dCgAptos = dData.filter(d => isPresentadoF1(d) && isAprobadoCG(d)).length;
      const dIngAptos = dData.filter(d => isPresentadoF1(d) && isAprobadoING(d)).length;
      const dAptAptos = dData.filter(d => isPresentadoF1(d) && isAprobadoAPT(d)).length;
      const dPersAptos = dData.filter(d => isPresentadoF1(d) && isAprobadoPERS(d)).length;

      return {
        name: dia,
        Convocados: dData.length,
        Presentados: dPresentados,
        AprobadosF1: dAprobadosF1,
        '% C. Grales': dPresentados > 0 ? Math.round((dCgAptos / dPresentados) * 100) : 0,
        '% Inglés': dPresentados > 0 ? Math.round((dIngAptos / dPresentados) * 100) : 0,
        '% Aptitudes': dPresentados > 0 ? Math.round((dAptAptos / dPresentados) * 100) : 0,
        '% Personalidad': dPresentados > 0 ? Math.round((dPersAptos / dPresentados) * 100) : 0,
        '% Aprobados F1': dPresentados > 0 ? Math.round((dAprobadosF1 / dPresentados) * 100) : 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      convocados,
      presentadosF1,
      noPresentadosF1,
      aprobadosF1,
      aprobadosF2,
      aprobadosF3,
      cgAptos,
      ingAptos,
      aptAptos,
      persAptos,
      bySede,
      byDiaF1
    };
  }, [data]);

  const subtests = [
    { 
      title: 'Conocimientos Generales', 
      aptos: stats.cgAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.cgAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-blue-500 to-sky-400',
      lightColor: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
      icon: BookOpen,
      desc: 'Evaluación de temario técnico aeronáutico y cartografía'
    },
    { 
      title: 'Conocimientos Inglés', 
      aptos: stats.ingAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.ingAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-indigo-500 to-violet-400',
      lightColor: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30',
      icon: Languages,
      desc: 'Prueba eliminatoria escrita de gramática y comprensión'
    },
    { 
      title: 'Test de Aptitudes', 
      aptos: stats.aptAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.aptAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-purple-500 to-fuchsia-400',
      lightColor: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30',
      icon: Brain,
      desc: 'Capacidad espacial, razonamiento lógico y orientación'
    },
    { 
      title: 'Test de Personalidad', 
      aptos: stats.persAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.persAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-emerald-500 to-teal-400',
      lightColor: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30',
      icon: HeartHandshake,
      desc: 'Evaluación conductual y adecuación al perfil ATC'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. FUNNEL DE RECLUTAMIENTO */}
      <section className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#0099cc]" />
          Funnel de Selección Acumulado
        </h2>

        <div className={`grid grid-cols-1 ${
          phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0
            ? 'sm:grid-cols-2 lg:grid-cols-5'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        } gap-4 relative`}>
          
          {/* Step 1: Convocados */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Convocados</span>
                <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Users size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.convocados.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Inscripciones totales registradas en el proceso</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Ratio Inicial</span>
              <span className="text-[#0099cc]">100%</span>
            </div>
          </div>

          {/* Step 2: Presentados */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Presentados F1</span>
                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <UserCheck size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.presentadosF1.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Aspirantes que asistieron al examen presencial</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Asistencia</span>
              <span className="text-indigo-500">{((stats.presentadosF1 / stats.convocados) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 3: Aptos F1 */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Aptos Fase 1</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Award size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.aprobadosF1.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Aprobaron las 4 sub-pruebas simultáneamente</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Tasa de Aprobados</span>
              <span className="text-emerald-500">{((stats.aprobadosF1 / stats.presentadosF1) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 4: Aptos F2 */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Aptos Fase 2</span>
                <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                  <Award size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.aprobadosF2.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Superaron la segunda fase (FEAST 1 + FEAST 2)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Tasa de Aprobados F2</span>
              <span className="text-teal-500">{stats.aprobadosF1 > 0 ? ((stats.aprobadosF2 / stats.aprobadosF1) * 100).toFixed(1) : '0'}%</span>
            </div>
          </div>

          {/* Step 5: Aptos F3 */}
          {(phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0) && (
            <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {phase.id === 'fase3a-prov' ? '5. Aptos Fase 3A' : '5. Aptos Fase 3'}
                  </span>
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    <Award size={16} />
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {phase.id === 'fase3a-prov'
                    ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length.toLocaleString('es-ES')
                    : stats.aprobadosF3.toLocaleString('es-ES')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {phase.id === 'fase3a-prov'
                    ? 'Superaron la prueba oral de inglés (Fase 3A)'
                    : 'Aprobados en Inglés Oral, Conductual y Clínica'}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Tasa de Aprobados F3</span>
                <span className="text-emerald-500">
                  {stats.aprobadosF2 > 0
                    ? `${(( (phase.id === 'fase3a-prov' ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length : stats.aprobadosF3) / stats.aprobadosF2) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 2. DIFICULTAD FASE 1 - RENDER DE SUBPRUEBAS */}
      <section className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Brain size={16} className="text-[#0099cc]" />
          Dificultad por Sub-prueba de la Fase 1 (Tasa de Aptos sobre Presentados)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subtests.map((test, index) => {
            const Icon = test.icon;
            return (
              <div key={index} className={`rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1 ${test.lightColor}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${test.color} text-white`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{test.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Fase 1 Sub-test</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{test.rate}%</span>
                    <span className="text-[10px] font-bold text-slate-500">{test.aptos.toLocaleString('es-ES')} Aptos</span>
                  </div>
                  
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`bg-gradient-to-r ${test.color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${test.rate}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium mt-1">{test.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DIFICULTAD POR DÍA - MULTI BAR CHARTS */}
      <section className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-[#0099cc]" />
              Análisis de Sub-pruebas por Día de Examen
            </h2>
            <p className="text-xs text-slate-500 mt-1">Compara qué días fueron más o menos difíciles y la tasa de aprobación global en cada jornada.</p>
          </div>
        </div>

        <div className="h-96 w-full min-w-0">
          {shouldRenderChart ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={stats.byDiaF1} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'medium' }} />
                
                <Bar name="Aptos C. Grales" dataKey="% C. Grales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Inglés" dataKey="% Inglés" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Aptitudes" dataKey="% Aptitudes" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Personalidad" dataKey="% Personalidad" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                
                <Line name="Tasa Aprobados F1 Global" type="monotone" dataKey="% Aprobados F1" stroke="#f59e0b" strokeWidth={3.5} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-50/50 dark:bg-zinc-900/10 border border-slate-100 dark:border-zinc-800 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#0099cc] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400 font-medium">Cargando gráfico interactivo...</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. RENDIMIENTO POR SEDE */}
      <section className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <MapPin size={16} className="text-[#0099cc]" />
          Distribución de Resultados por Sede de Examen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.bySede.map((sede, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <MapPin size={16} className="text-[#0099cc]" />
                <span className="font-bold text-sm tracking-wide">{sede.name}</span>
              </div>

              <div className="space-y-4">
                <div className={`grid ${
                  phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0
                    ? 'grid-cols-4'
                    : 'grid-cols-3'
                } gap-2 text-center`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Convocados</span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-300">{sede.Convocados}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Presentados</span>
                    <span className="text-base font-black text-indigo-500">{sede.Presentados}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Aprobados F1</span>
                    <span className="text-base font-black text-[#0099cc]">{sede.AprobadosF1}</span>
                  </div>
                  {(phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0) && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Aprobados F3</span>
                      <span className="text-base font-black text-emerald-500">{sede.AprobadosF3}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>Tasa Asistencia</span>
                      <span className="text-indigo-500">{sede['% Asistencia']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${sede['% Asistencia']}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>Tasa Aprobados F1</span>
                      <span className="text-emerald-500">{sede['% Aprobados F1']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#0099cc] h-full rounded-full" style={{ width: `${sede['% Aprobados F1']}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>Aptos F2 (sobre F1)</span>
                      <span className="text-teal-500">{sede['% Aprobados F2']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${sede['% Aprobados F2']}%` }} />
                    </div>
                  </div>

                  {(phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0) && (
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                        <span>Aptos F3 (sobre F2)</span>
                        <span className="text-emerald-500">{sede['% Aprobados F3']}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sede['% Aprobados F3']}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
