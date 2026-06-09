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
  const [funnelView, setFunnelView] = useState<'sankey' | 'cards'>('sankey');
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);

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

  const columns = useMemo(() => {
    const cols = [
      {
        index: 0,
        success: { name: 'Convocados', value: stats.convocados, pct: '100% Ratio Inicial' }
      },
      {
        index: 1,
        success: { name: 'Presentados F1', value: stats.presentadosF1, pct: `${((stats.presentadosF1 / stats.convocados) * 100).toFixed(1)}% asistencia` },
        dropout: { name: 'No Presentados', value: Math.max(0, stats.convocados - stats.presentadosF1), pct: `${(((stats.convocados - stats.presentadosF1) / stats.convocados) * 100).toFixed(1)}% no asiste` }
      },
      {
        index: 2,
        success: { name: 'Aptos Fase 1', value: stats.aprobadosF1, pct: `${((stats.aprobadosF1 / stats.presentadosF1) * 100).toFixed(1)}% aprobado` },
        dropout: { name: 'No Aptos Fase 1', value: Math.max(0, stats.presentadosF1 - stats.aprobadosF1), pct: `${(((stats.presentadosF1 - stats.aprobadosF1) / stats.presentadosF1) * 100).toFixed(1)}% descarte` }
      }
    ];

    const hasF2 = stats.aprobadosF2 > 0 || phase.id === 'fase2' || phase.id === 'fase3a-prov' || phase.id === 'fase3-prov';
    if (hasF2) {
      cols.push({
        index: 3,
        success: { name: 'Aptos Fase 2', value: stats.aprobadosF2, pct: `${stats.aprobadosF1 > 0 ? ((stats.aprobadosF2 / stats.aprobadosF1) * 100).toFixed(1) : '0'}% de F1` },
        dropout: { name: 'No Aptos Fase 2', value: Math.max(0, stats.aprobadosF1 - stats.aprobadosF2), pct: `${stats.aprobadosF1 > 0 ? (((stats.aprobadosF1 - stats.aprobadosF2) / stats.aprobadosF1) * 100).toFixed(1) : '0'}% descarte` }
      });
    }

    const isF3Active = phase.id === 'fase3-prov' || phase.id === 'fase3a-prov' || stats.aprobadosF3 > 0;
    if (isF3Active && hasF2) {
      const aptosF3Label = phase.id === 'fase3a-prov' ? 'Aptos Fase 3A' : 'Aptos Fase 3';
      const noAptosF3Label = phase.id === 'fase3a-prov' ? 'No Aptos Fase 3A' : 'No Aptos Fase 3';
      const valF3 = phase.id === 'fase3a-prov'
        ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length
        : stats.aprobadosF3;

      cols.push({
        index: 4,
        success: { name: aptosF3Label, value: valF3, pct: `${stats.aprobadosF2 > 0 ? ((valF3 / stats.aprobadosF2) * 100).toFixed(1) : '0'}% de F2` },
        dropout: { name: noAptosF3Label, value: Math.max(0, stats.aprobadosF2 - valF3), pct: `${stats.aprobadosF2 > 0 ? (((stats.aprobadosF2 - valF3) / stats.aprobadosF2) * 100).toFixed(1) : '0'}% descarte` }
      });
    }

    return cols;
  }, [data, phase, stats]);

  // Coordinate helper functions
  const getX = (colIndex: number) => {
    const numCols = columns.length;
    const colSpacing = (960 - 156) / (numCols - 1);
    return 20 + colIndex * colSpacing;
  };

  const getBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
    const controlX1 = startX + (endX - startX) * 0.45;
    const controlX2 = startX + (endX - startX) * 0.55;
    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  };

  const getThickness = (value: number) => {
    return Math.max(3, (value / stats.convocados) * 32);
  };

  // Tooltip content & style helpers
  const getTooltipStyle = (flowId: string) => {
    const parts = flowId.split('-');
    const sourceIndex = parseInt(parts[1], 10);
    const type = parts[2];
    
    const startX = getX(sourceIndex) + 156;
    const endX = getX(sourceIndex + 1);
    const posX = (startX + endX) / 2;
    
    const startY = (sourceIndex === 0 ? 110 : 34) + 38;
    const endY = (type === 'success' ? 34 : 210) + 38;
    const posY = (startY + endY) / 2;

    return {
      left: `${posX}px`,
      top: `${posY - 50}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: 20
    };
  };

  const getTooltipContent = (flowId: string) => {
    const parts = flowId.split('-');
    const sourceIndex = parseInt(parts[1], 10);
    const type = parts[2];
    
    if (sourceIndex === 0) {
      if (type === 'success') {
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Convocados → Presentados F1</p>
            <p className="text-[#0099cc] font-black mt-1 text-xs">
              {stats.presentadosF1.toLocaleString('es-ES')} asistentes ({((stats.presentadosF1 / stats.convocados) * 100).toFixed(1)}%)
            </p>
          </div>
        );
      } else {
        const val = Math.max(0, stats.convocados - stats.presentadosF1);
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Convocados → No Presentados</p>
            <p className="text-slate-500 dark:text-zinc-400 font-black mt-1 text-xs">
              {val.toLocaleString('es-ES')} no asistieron ({((val / stats.convocados) * 100).toFixed(1)}%)
            </p>
          </div>
        );
      }
    }
    
    if (sourceIndex === 1) {
      if (type === 'success') {
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Presentados F1 → Aptos Fase 1</p>
            <p className="text-[#0099cc] font-black mt-1 text-xs">
              {stats.aprobadosF1.toLocaleString('es-ES')} aptos ({((stats.aprobadosF1 / stats.presentadosF1) * 100).toFixed(1)}%)
            </p>
          </div>
        );
      } else {
        const val = Math.max(0, stats.presentadosF1 - stats.aprobadosF1);
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Presentados F1 → No Aptos Fase 1</p>
            <p className="text-slate-500 dark:text-zinc-400 font-black mt-1 text-xs">
              {val.toLocaleString('es-ES')} descartes ({((val / stats.presentadosF1) * 100).toFixed(1)}%)
            </p>
          </div>
        );
      }
    }

    if (sourceIndex === 2) {
      if (type === 'success') {
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Aptos Fase 1 → Aptos Fase 2</p>
            <p className="text-[#0099cc] font-black mt-1 text-xs">
              {stats.aprobadosF2.toLocaleString('es-ES')} aptos ({stats.aprobadosF1 > 0 ? ((stats.aprobadosF2 / stats.aprobadosF1) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        );
      } else {
        const val = Math.max(0, stats.aprobadosF1 - stats.aprobadosF2);
        return (
          <div>
            <p className="font-bold text-slate-705 dark:text-zinc-300">Aptos Fase 1 → No Aptos Fase 2</p>
            <p className="text-slate-500 dark:text-zinc-400 font-black mt-1 text-xs">
              {val.toLocaleString('es-ES')} descartes ({stats.aprobadosF1 > 0 ? ((val / stats.aprobadosF1) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        );
      }
    }

    if (sourceIndex === 3) {
      const valF3 = phase.id === 'fase3a-prov'
        ? data.filter(d => d['ESTADO PROVISIONAL FASE 3A']?.trim().toUpperCase() === 'APTO/A').length
        : stats.aprobadosF3;
      const label = phase.id === 'fase3a-prov' ? 'Fase 3A' : 'Fase 3';
      if (type === 'success') {
        return (
          <div>
            <p className="font-bold text-slate-750 dark:text-zinc-300">Aptos Fase 2 → Aptos {label}</p>
            <p className="text-[#0099cc] font-black mt-1 text-xs">
              {valF3.toLocaleString('es-ES')} aptos ({stats.aprobadosF2 > 0 ? ((valF3 / stats.aprobadosF2) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        );
      } else {
        const val = Math.max(0, stats.aprobadosF2 - valF3);
        return (
          <div>
            <p className="font-bold text-slate-750 dark:text-zinc-300">Aptos Fase 2 → No Aptos {label}</p>
            <p className="text-slate-500 dark:text-zinc-400 font-black mt-1 text-xs">
              {val.toLocaleString('es-ES')} descartes ({stats.aprobadosF2 > 0 ? ((val / stats.aprobadosF2) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        );
      }
    }
    
    return null;
  };

  const subtests = [
    { 
      title: 'Conocimientos Generales', 
      aptos: stats.cgAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.cgAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-slate-300 to-slate-400',
      lightColor: 'bg-slate-50/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-800/50',
      icon: BookOpen,
      desc: 'Evaluación de temario técnico aeronáutico y cartografía'
    },
    { 
      title: 'Conocimientos Inglés', 
      aptos: stats.ingAptos, 
      presentados: stats.presentadosF1,
      rate: stats.presentadosF1 > 0 ? ((stats.ingAptos / stats.presentadosF1) * 100).toFixed(1) : '0',
      color: 'from-slate-400 to-slate-500',
      lightColor: 'bg-slate-50/40 dark:bg-zinc-900/10 border-slate-200/50 dark:border-zinc-800/50',
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
              Flujo del Proceso
            </button>
          </div>
        </div>

        {funnelView === 'sankey' ? (
          <div className="w-full mt-4">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 -mx-6 px-6">
              <div className="min-w-[880px] h-[320px] relative">
                {/* SVG connection lines and HTML nodes */}
                <svg className="w-full h-full" viewBox="0 0 1000 320" style={{ overflow: 'visible' }}>
                  {/* Flows (Paths) */}
                  {columns.slice(1).map((col) => {
                    const prevCol = columns[col.index - 1];
                    const startX = getX(prevCol.index) + 156;
                    const startY = (prevCol.index === 0 ? 110 : 34) + 38;
                    
                    const endX = getX(col.index);
                    const successEndY = 34 + 38;
                    const dropoutEndY = 210 + 38;

                    const successThickness = getThickness(col.success.value);
                    const dropoutThickness = col.dropout ? getThickness(col.dropout.value) : 0;

                    const successPath = getBezierPath(startX, startY, endX, successEndY);
                    const dropoutPath = col.dropout ? getBezierPath(startX, startY, endX, dropoutEndY) : null;

                    const successId = `flow-${prevCol.index}-success`;
                    const dropoutId = `flow-${prevCol.index}-dropout`;

                    return (
                      <g key={col.index}>
                        {/* Success flow connection */}
                        <path
                          d={successPath}
                          fill="none"
                          stroke="#0099cc"
                          strokeWidth={successThickness}
                          strokeOpacity={
                            hoveredFlow === null
                              ? 0.22
                              : hoveredFlow === successId
                              ? 0.55
                              : 0.06
                          }
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredFlow(successId)}
                          onMouseLeave={() => setHoveredFlow(null)}
                        />

                        {/* Dropout flow connection */}
                        {dropoutPath && col.dropout && (
                          <path
                            d={dropoutPath}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth={dropoutThickness}
                            strokeOpacity={
                              hoveredFlow === null
                                ? 0.12
                                : hoveredFlow === dropoutId
                                ? 0.35
                                : 0.04
                            }
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredFlow(dropoutId)}
                            onMouseLeave={() => setHoveredFlow(null)}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes (HTML inside foreignObject) */}
                  {columns.map((col) => {
                    const x = getX(col.index);
                    const hasDropout = !!col.dropout;
                    
                    const successY = col.index === 0 ? 110 : 34;
                    const dropoutY = 210;

                    const successId = `flow-${col.index - 1}-success`;
                    const dropoutId = `flow-${col.index - 1}-dropout`;

                    return (
                      <g key={col.index}>
                        {/* Success Node Card */}
                        <foreignObject
                          x={x}
                          y={successY}
                          width={156}
                          height={76}
                          className="overflow-visible"
                        >
                          <div
                            className={`bg-white dark:bg-zinc-900 border ${
                              hoveredFlow && hoveredFlow === successId
                                ? 'border-[#0099cc]/70 shadow-md ring-1 ring-[#0099cc]/20'
                                : 'border-slate-200 dark:border-zinc-800 shadow-sm'
                            } rounded-xl py-1.5 px-2.5 h-full flex flex-col justify-between select-none hover:border-[#0099cc]/40 hover:shadow-md transition-all duration-200 border-l-4 border-l-[#0099cc]`}
                          >
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                                {col.success.name}
                              </span>
                              <span className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight mt-0.5 block">
                                {col.success.value.toLocaleString('es-ES')}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#0099cc] font-bold block truncate mt-0.5">
                              {col.success.pct}
                            </span>
                          </div>
                        </foreignObject>

                        {/* Dropout Node Card */}
                        {hasDropout && col.dropout && (
                          <foreignObject
                            x={x}
                            y={dropoutY}
                            width={156}
                            height={76}
                            className="overflow-visible"
                          >
                            <div
                              className={`bg-slate-50/50 dark:bg-zinc-950/40 border ${
                                hoveredFlow && hoveredFlow === dropoutId
                                  ? 'border-slate-400 dark:border-zinc-650 shadow-md ring-1 ring-slate-300/20'
                                  : 'border-slate-200/60 dark:border-zinc-850 shadow-sm'
                              } rounded-xl py-1.5 px-2.5 h-full flex flex-col justify-between select-none hover:border-slate-400/50 hover:shadow-md transition-all duration-200 border-l-4 border-l-slate-350 dark:border-l-zinc-700`}
                            >
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                                  {col.dropout.name}
                                </span>
                                <span className="text-base font-black text-slate-650 dark:text-zinc-400 leading-tight mt-0.5 block">
                                  {col.dropout.value.toLocaleString('es-ES')}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold block truncate mt-0.5">
                                {col.dropout.pct}
                              </span>
                            </div>
                          </foreignObject>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Custom interactive tooltip overlay */}
                {hoveredFlow && (
                  <div
                    className="absolute bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 p-3 rounded-xl shadow-xl text-xs pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 duration-150"
                    style={getTooltipStyle(hoveredFlow)}
                  >
                    {getTooltipContent(hoveredFlow)}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile swipe helper */}
            <div className="flex items-center gap-1.5 justify-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2 sm:hidden animate-pulse">
              <span>↔ Desliza lateralmente para explorar el flujo</span>
            </div>
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
              <p className="text-[11px] text-slate-400 mt-1">Aprobaron las 4 pruebas simultáneamente</p>
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

      </section>

      {/* 2. DIFICULTAD FASE 1 - RENDER DE PRUEBAS */}
      <section className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Brain size={16} className="text-[#0099cc]" />
          Dificultad por Prueba de la Fase 1 (Tasa de Aptos sobre Presentados)
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
                    <p className="text-[10px] text-slate-400 font-medium">Prueba Fase 1</p>
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
              Análisis de Pruebas por Día de Examen
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
