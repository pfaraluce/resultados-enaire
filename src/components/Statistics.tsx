import { useMemo, useState, useEffect } from 'react';
import { Candidate } from '../App';
import { PhaseConfig } from '../phaseConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Cell, Sankey
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
  const [funnelView, setFunnelView] = useState<'cards' | 'sankey'>('cards');

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

    // Phase 3B (Conductual) average pass rate per day
    const f3Dates = data.map(d => d['FECHA FASE 3']?.trim()).filter(Boolean);
    const validF3Dates = Array.from(new Set(f3Dates)).filter(d => d !== '---' && d !== '#N/A' && d !== '#N/D');

    let totalAprobados3B = 0;
    data.forEach(d => {
      const date = d['FECHA FASE 3']?.trim();
      const resultado3B = d['RESULTADO 3 B)']?.trim().toUpperCase();
      if (date && date !== '---' && date !== '#N/A' && date !== '#N/D' && resultado3B === 'APTO/A') {
        totalAprobados3B++;
      }
    });

    const totalDiasF3 = validF3Dates.length;
    const mediaAprobados3BDia = totalDiasF3 > 0 ? totalAprobados3B / totalDiasF3 : 0;

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
      byDiaF1,
      mediaAprobados3BDia,
      totalDiasF3
    };
  }, [data]);

  const sankeyData = useMemo(() => {
    const nodes = [
      { name: 'Convocados' },      // 0
      { name: 'Presentados F1' },  // 1
      { name: 'No Presentados' },  // 2
      { name: 'Aptos Fase 1' },    // 3
      { name: 'No Aptos Fase 1' }  // 4
    ];

    const links = [
      { source: 0, target: 1, value: stats.presentadosF1 },
      { source: 0, target: 2, value: Math.max(0, stats.convocados - stats.presentadosF1) },
      { source: 1, target: 3, value: stats.aprobadosF1 },
      { source: 1, target: 4, value: Math.max(0, stats.presentadosF1 - stats.aprobadosF1) }
    ];

    const hasF2 = stats.aprobadosF2 > 0 || phase.id === 'fase2' || phase.id === 'fase3a-prov' || phase.id === 'fase3-prov';
    if (hasF2) {
      nodes.push({ name: 'Aptos Fase 2' });      // 5
      nodes.push({ name: 'No Aptos Fase 2' });   // 6
      links.push({ source: 3, target: 5, value: stats.aprobadosF2 });
      links.push({ source: 3, target: 6, value: Math.max(0, stats.aprobadosF1 - stats.aprobadosF2) });
    }

    const isF3Active = phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0;
    if (isF3Active && hasF2) {
      const aptosF3Label = phase.id === 'fase3a-prov' ? 'Aptos Fase 3A' : 'Aptos Fase 3';
      const noAptosF3Label = phase.id === 'fase3a-prov' ? 'No Aptos Fase 3A' : 'No Aptos Fase 3';
      nodes.push({ name: aptosF3Label });      // 7
      nodes.push({ name: noAptosF3Label });   // 8
      
      const valF3 = phase.id === 'fase3a-prov'
        ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length
        : stats.aprobadosF3;

      links.push({ source: 5, target: 7, value: valF3 });
      links.push({ source: 5, target: 8, value: Math.max(0, stats.aprobadosF2 - valF3) });
    }

    return { nodes, links };
  }, [data, phase, stats]);

  // Custom Node component for Sankey flow
  const CustomSankeyNode = ({ x, y, width, height, depth, payload }: any) => {
    // Position labels on the left ONLY for the rightmost column to prevent clipping on the right edge.
    // For all other columns, render labels on the right to prevent overlapping with previous stages.
    const isRightmost = depth === (sankeyData.nodes.length > 7 ? 4 : sankeyData.nodes.length > 5 ? 3 : 2);
    const textX = isRightmost ? x - 8 : x + width + 8;
    const textAnchor = isRightmost ? 'end' : 'start';

    let fill = '#94a3b8'; // Slate grey for inactive/failure flows
    if (payload.name.startsWith('Aptos') || payload.name === 'Presentados F1' || payload.name === 'Convocados') {
      fill = '#0099cc'; // Accent brand blue for passing flows
    } else if (payload.name.startsWith('No ')) {
      fill = '#cbd5e1'; // Soft desaturated slate-300
    }

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(4, height)}
          fill={fill}
          fillOpacity={0.85}
          rx={3}
          ry={3}
          className="transition-all duration-300 hover:fill-opacity-100"
        />
        <text
          x={textX}
          y={y + height / 2 + 4}
          textAnchor={textAnchor}
          fontSize="10"
          fontWeight="bold"
          fill="#475569"
          className="dark:fill-zinc-300"
        >
          {payload.name} ({payload.value.toLocaleString('es-ES')})
        </text>
      </g>
    );
  };

  // Custom Link component for Sankey flow
  const CustomSankeyLink = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    payload
  }: any) => {
    if (!linkWidth) return null;

    const targetName = payload.target.name;
    const isSuccess = targetName.startsWith('Aptos') || targetName.startsWith('Presentados');
    const strokeColor = isSuccess ? '#0099cc' : '#94a3b8';
    const strokeOpacity = isSuccess ? 0.35 : 0.12;

    const path = `
      M${sourceX},${sourceY}
      C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
    `;

    return (
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={Math.max(1.5, linkWidth)}
        fill="none"
        strokeOpacity={strokeOpacity}
        className="transition-all duration-350 hover:stroke-opacity-70"
      />
    );
  };

  const subtests = [
    { 
      title: 'Conocimientos Generales', 
      aptos: stats.cgAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.cgAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-slate-400 to-slate-500',
      lightColor: 'bg-slate-50/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-800/50',
      icon: BookOpen,
      desc: 'Evaluación de temario técnico aeronáutico y cartografía'
    },
    { 
      title: 'Conocimientos Inglés', 
      aptos: stats.ingAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.ingAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-[#0099cc]/75 to-sky-500/70',
      lightColor: 'bg-sky-50/20 dark:bg-sky-950/10 border-[#0099cc]/20 dark:border-sky-900/30',
      icon: Languages,
      desc: 'Prueba eliminatoria escrita de gramática y comprensión'
    },
    { 
      title: 'Test de Aptitudes', 
      aptos: stats.aptAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.aptAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-slate-500 to-slate-600',
      lightColor: 'bg-slate-50/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-800/50',
      icon: Brain,
      desc: 'Capacidad espacial, razonamiento lógico y orientación'
    },
    { 
      title: 'Test de Personalidad', 
      aptos: stats.persAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.persAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-slate-600 to-slate-700',
      lightColor: 'bg-slate-50/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-800/50',
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0099cc]" />
            Funnel de Selección Acumulado
          </h2>
          <div className="flex bg-slate-100 dark:bg-zinc-850 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-800/80 self-start sm:self-auto">
            <button
              onClick={() => setFunnelView('cards')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                funnelView === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Vista Resumen
            </button>
            <button
              onClick={() => setFunnelView('sankey')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                funnelView === 'sankey'
                  ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Flujo del Proceso (Sankey)
            </button>
          </div>
        </div>

        {funnelView === 'sankey' ? (
          <div className="h-[380px] w-full mt-4 bg-slate-50/20 dark:bg-zinc-900/10 border border-slate-100 dark:border-zinc-800/50 rounded-2xl p-6 flex items-center justify-center min-w-0">
            {shouldRenderChart ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <Sankey
                  data={sankeyData}
                  node={<CustomSankeyNode />}
                  link={<CustomSankeyLink />}
                  nodePadding={24}
                  nodeWidth={12}
                  margin={{ top: 15, right: 130, left: 15, bottom: 15 }}
                >
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        if (d.source && d.target) {
                          return (
                            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-slate-700 dark:text-slate-300">
                                {d.source.name} → {d.target.name}
                              </p>
                              <p className="text-[#0099cc] font-black mt-1 text-sm">
                                {d.value.toLocaleString('es-ES')} candidatos
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-3 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-slate-700 dark:text-slate-300">{d.name}</p>
                            <p className="text-[#0099cc] font-black mt-1 text-sm">
                              {d.value.toLocaleString('es-ES')} candidatos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#0099cc] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-medium">Generando diagrama de flujo...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
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
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
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
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
                  <UserCheck size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.presentadosF1.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Aspirantes que asistieron al examen presencial</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Asistencia</span>
              <span className="text-slate-500 dark:text-slate-400">{((stats.presentadosF1 / stats.convocados) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 3: Aptos F1 */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Aptos Fase 1</span>
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
                  <Award size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.aprobadosF1.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Aprobaron las 4 sub-pruebas simultáneamente</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Tasa de Aprobados</span>
              <span className="text-slate-500 dark:text-slate-400">{((stats.aprobadosF1 / stats.presentadosF1) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 4: Aptos F2 */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Aptos Fase 2</span>
                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
                  <Award size={16} />
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.aprobadosF2.toLocaleString('es-ES')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Superaron la segunda fase (PDEA + FEAST)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Tasa de Aprobados F2</span>
              <span className="text-slate-500 dark:text-slate-400">{stats.aprobadosF1 > 0 ? ((stats.aprobadosF2 / stats.aprobadosF1) * 100).toFixed(1) : '0'}%</span>
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
                  <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
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
                <span className="text-slate-500 dark:text-slate-400">
                  {stats.aprobadosF2 > 0
                    ? `${(( (phase.id === 'fase3a-prov' ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length : stats.aprobadosF3) / stats.aprobadosF2) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

        {/* Media Aprobados por Día en Conductual (Fuera del funnel) */}
        {phase.id === 'fase3-prov' && (
          <div className="mt-5 p-4 bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-150 dark:border-zinc-800/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[#0099cc]">
                <Calendar size={18} />
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block text-sm">Media de Aprobados por Día en Conductual (3B)</span>
                <span className="text-[11px] text-slate-400">Promedio de candidatos aptos por jornada de evaluación en la prueba conductual.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
              <div className="bg-slate-105 dark:bg-zinc-850 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-zinc-750 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jornadas</span>
                <span className="font-black text-slate-800 dark:text-slate-150 text-sm mt-0.5">{stats.totalDiasF3}</span>
              </div>
              <div className="bg-[#0099cc]/5 dark:bg-[#0099cc]/5 px-3 py-2 rounded-lg border border-[#0099cc]/15 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] text-[#0099cc] font-bold uppercase tracking-wider">Media de Aptos</span>
                <span className="font-black text-[#0099cc] text-base mt-0.5">
                  {stats.mediaAprobados3BDia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
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
                
                <Bar name="Aptos C. Grales" dataKey="% C. Grales" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Inglés" dataKey="% Inglés" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Aptitudes" dataKey="% Aptitudes" fill="#64748b" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Aptos Personalidad" dataKey="% Personalidad" fill="#475569" radius={[4, 4, 0, 0]} barSize={12} />
                
                <Line name="Tasa Aprobados F1 Global" type="monotone" dataKey="% Aprobados F1" stroke="#0099cc" strokeWidth={3.5} dot={{ r: 5, fill: '#0099cc', strokeWidth: 2, stroke: '#fff' }} />
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
                    <span className="text-base font-black text-slate-600 dark:text-slate-300">{sede.Presentados}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Aprobados F1</span>
                    <span className="text-base font-black text-slate-700 dark:text-slate-200">{sede.AprobadosF1}</span>
                  </div>
                  {(phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0) && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Aprobados F3</span>
                      <span className="text-base font-black text-[#0099cc]">{sede.AprobadosF3}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                      <span>Tasa Asistencia</span>
                      <span className="text-slate-500">{sede['% Asistencia']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-slate-400 h-full rounded-full" style={{ width: `${sede['% Asistencia']}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                      <span>Tasa Aprobados F1</span>
                      <span className="text-slate-500">{sede['% Aprobados F1']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${sede['% Aprobados F1']}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                      <span>Aptos F2 (sobre F1)</span>
                      <span className="text-slate-500">{sede['% Aprobados F2']}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-slate-600 h-full rounded-full" style={{ width: `${sede['% Aprobados F2']}%` }} />
                    </div>
                  </div>

                  {(phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0) && (
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                        <span>Aptos F3 (sobre F2)</span>
                        <span className="text-[#0099cc]">{sede['% Aprobados F3']}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-zinc-850 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#0099cc] h-full rounded-full" style={{ width: `${sede['% Aprobados F3']}%` }} />
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
