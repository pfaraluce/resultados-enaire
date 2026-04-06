import { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { Search, Filter, ChevronDown, ChevronUp, MapPin, User, Info, Settings2, Trophy, BarChart3, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Statistics from './components/Statistics';
import Aulas from './components/Aulas';
import { detectPhase, PhaseConfig } from './phaseConfig';

// Generic candidate record — fields vary per phase CSV.
export interface Candidate {
  [key: string]: any;
  ranking?: number;
}

// Load from Vite define config (process.env.CSV_URL) or default fallback
const CSV_URL = process.env.CSV_URL;

export default function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Candidate[]>([]);
  const [phase, setPhase] = useState<PhaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sedeFilter, setSedeFilter] = useState('Todas');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'ranking', direction: 'asc' });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [view, setView] = useState<'buscador' | 'estadisticas' | 'aulas'>('buscador');

  useEffect(() => {
    setVisibleCount(100);
  }, [searchTerm, sedeFilter, estadoFilter]);

  // Intercept Ctrl+F to focus the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setView('buscador');
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!CSV_URL) {
          setError('CSV_URL no está definida. Comprueba el fichero .env y reinicia el servidor.');
          setLoading(false);
          return;
        }
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data as Candidate[];
            const headers = results.meta.fields || [];

            // Auto-detect phase from headers
            const detectedPhase = detectPhase(headers);
            setPhase(detectedPhase);
            setVisibleColumns(detectedPhase.defaultVisibleColumns);

            // Calculate ranking based on the phase's score column
            const scoreCol = detectedPhase.scoreColumn;

            const parseScore = (s: string) => {
              if (!s || s === '---' || s === '#N/A' || s === '#N/D') return -1;
              return parseFloat(s.replace(',', '.'));
            };

            let rankedData: Candidate[];

            if (scoreCol) {
              const sortedForRanking = [...rawData].sort((a, b) => {
                const scoreA = parseScore(a[scoreCol]);
                const scoreB = parseScore(b[scoreCol]);
                return scoreB - scoreA;
              });

              const rankMap = new Map();
              sortedForRanking.forEach((item, index) => {
                const score = parseScore(item[scoreCol]);
                if (score !== -1) {
                  rankMap.set(item, index + 1);
                }
              });

              // For fase1y2-prov: also compute a secondary ranking by TOTAL FASE 1 alone
              let rankF1Map = new Map();
              if (detectedPhase.id === 'fase1y2-prov') {
                const sortedByF1 = [...rawData].sort((a, b) => {
                  const sA = parseScore(a['TOTAL FASE 1']);
                  const sB = parseScore(b['TOTAL FASE 1']);
                  return sB - sA;
                });
                sortedByF1.forEach((item, index) => {
                  if (parseScore(item['TOTAL FASE 1']) !== -1) {
                    rankF1Map.set(item, index + 1);
                  }
                });
              }

              rankedData = rawData.map(item => ({
                ...item,
                ranking: rankMap.get(item),
                rankingF1: rankF1Map.size > 0 ? rankF1Map.get(item) : undefined,
              }));
            } else {
              rankedData = rawData;
            }

            setData(rankedData);
            setLoading(false);
          },
          error: (err: Error) => {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error al cargar los datos. Por favor, inténtelo de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sedes = useMemo(() => {
    const uniqueSedes = Array.from(new Set(data.map(item => item['SEDE DE EXAMEN FASE 1']).filter(Boolean)));
    return ['Todas', ...uniqueSedes.sort()];
  }, [data]);

  const estados = useMemo(() => {
    const statusCol = phase?.statusColumn || '';
    if (!statusCol) return ['Todos'];
    const uniqueEstados = Array.from(new Set(data.map(item => item[statusCol]).filter(Boolean)));
    return ['Todos', ...uniqueEstados.sort()];
  }, [data, phase]);

  const filteredData = useMemo(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const normalizedSearchWords = normalize(searchTerm).split(/\s+/).filter(word => word.length > 0);
    const statusCol = phase?.statusColumn || '';

    let filtered = data.filter(item => {
      const normalizedName = normalize(item['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
      const matchesSearch = normalizedSearchWords.every(word => normalizedName.includes(word));
      const matchesSede = sedeFilter === 'Todas' || item['SEDE DE EXAMEN FASE 1'] === sedeFilter;
      const matchesEstado = estadoFilter === 'Todos' || !statusCol || item[statusCol] === estadoFilter;
      return matchesSearch && matchesSede && matchesEstado;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const key = sortConfig.key;
        const aValueRaw = key === 'ranking' ? a.ranking : a[key];
        const bValueRaw = key === 'ranking' ? b.ranking : b[key];

        // Sortable columns from phase config + ranking are treated as numeric
        const numericColumns = [...(phase?.sortableColumns || []), 'ranking'];

        if (numericColumns.includes(key)) {
          const parse = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val || val === '---' || val === '#N/A' || val === '#N/D') return null;
            const num = parseFloat(val.toString().replace(',', '.'));
            return isNaN(num) ? null : num;
          };

          const numA = parse(aValueRaw);
          const numB = parse(bValueRaw);

          if (numA === null && numB === null) return 0;
          if (numA === null) return 1;
          if (numB === null) return -1;

          if (numA === numB) return 0;
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(aValueRaw || '');
        const strB = String(bValueRaw || '');

        return sortConfig.direction === 'asc'
          ? strA.localeCompare(strB, 'es', { sensitivity: 'accent' })
          : strB.localeCompare(strA, 'es', { sensitivity: 'accent' });
      });
    }

    return filtered;
  }, [data, searchTerm, sedeFilter, estadoFilter, sortConfig, phase]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  // Derived: all columns and visible columns from phase config
  const allColumns = phase?.columns || [];
  const scoreColumn = phase?.scoreColumn || '';
  const statusColumn = phase?.statusColumn || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Section */}
      <header className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#0099cc] p-2 rounded-lg text-white">
                <Trophy size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Resultados <span className="text-[#0099cc]">Controladores 2025</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Consulta No Oficial</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                  onClick={() => setView('buscador')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'buscador' ? 'bg-white dark:bg-zinc-800 text-[#0099cc] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <List size={16} />
                  <span className="hidden sm:inline">Buscador</span>
                </button>
                <button
                  onClick={() => setView('estadisticas')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'estadisticas' ? 'bg-white dark:bg-zinc-800 text-[#0099cc] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <BarChart3 size={16} />
                  <span className="hidden sm:inline">Estadísticas</span>
                </button>
                <button
                  onClick={() => setView('aulas')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'aulas' ? 'bg-white dark:bg-zinc-800 text-[#0099cc] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <MapPin size={16} />
                  <span className="hidden sm:inline">Aulas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#0099cc] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-20 text-center">
            <p className="text-red-500 font-medium text-sm">{error}</p>
          </div>
        ) : view === 'estadisticas' ? (
          <Statistics data={data} phase={phase!} />
        ) : view === 'aulas' ? (
          <Aulas data={data} phase={phase!} />
        ) : (
          <>
            {/* Info Card */}
            <div className="mb-6">
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origen de datos</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <a href="https://empleo.enaire.es/empleo" target="blank">Convocatoria externa de controladores 2025 de Enaire</a>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                  <Info size={14} />
                  {phase?.badgeText || 'Resultados'}
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <section className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Buscar Candidato
                  </label>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Escriba apellidos o nombre... (Ctrl+F)"
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all outline-none text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label="Borrar búsqueda"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Sede
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#0099cc] outline-none text-sm cursor-pointer"
                    value={sedeFilter}
                    onChange={(e) => setSedeFilter(e.target.value)}
                  >
                    {sedes.map(sede => (
                      <option key={sede} value={sede}>{sede}</option>
                    ))}
                  </select>
                </div>

                {statusColumn && (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Estado
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#0099cc] outline-none text-sm cursor-pointer"
                      value={estadoFilter}
                      onChange={(e) => setEstadoFilter(e.target.value)}
                    >
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`${statusColumn ? 'md:col-span-1' : 'md:col-span-4'} flex justify-end`}>
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnPicker(!showColumnPicker)}
                      className={`p-2 rounded-lg border transition-colors ${showColumnPicker ? 'bg-[#0099cc] text-white border-[#0099cc]' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                      title="Configurar columnas"
                    >
                      <Settings2 size={20} />
                    </button>

                    <AnimatePresence>
                      {showColumnPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-4"
                        >
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Columnas Visibles</h3>
                          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                            {(['other', 'fase1', 'fase2', 'fase3'] as const).map(group => {
                              const groupCols = allColumns.filter(c => (c.group ?? 'other') === group);
                              if (groupCols.length === 0) return null;
                              const groupLabel = group === 'fase1' ? 'Fase 1' : group === 'fase2' ? 'Fase 2' : group === 'fase3' ? 'Fase 3' : 'General';
                              return (
                                <div key={group}>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 border-b border-slate-100 dark:border-zinc-800 pb-1">{groupLabel}</p>
                                  <div className="space-y-1.5">
                                    {groupCols.map(col => (
                                      <label key={col.key} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          checked={visibleColumns.includes(col.key)}
                                          onChange={() => toggleColumn(col.key)}
                                          className="w-4 h-4 rounded border-slate-300 text-[#0099cc] focus:ring-[#0099cc]"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#0099cc] transition-colors">{col.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>

            {/* Results Table */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden relative">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#0099cc] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando resultados...</p>
                </div>
              ) : error ? (
                <div className="p-20 text-center">
                  <p className="text-red-500 font-medium text-sm">{error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                        {scoreColumn && (
                          <th className="w-16 px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Pos
                          </th>
                        )}
                        {visibleColumns.map((colKey) => {
                          const col = allColumns.find(c => c.key === colKey);
                          if (!col) return null;
                          const isSortable = phase?.sortableColumns.includes(col.key) || false;

                          return (
                            <th
                              key={col.key}
                              className={`px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.key === 'APELLIDOS Y NOMBRE' ? 'w-64' : 'w-32'} ${isSortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors' : ''}`}
                              onClick={() => isSortable && handleSort(col.key)}
                            >
                              <div className="flex items-center gap-1">
                                {col.label}
                                {isSortable && sortConfig.key === col.key && (
                                  sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[#0099cc]" /> : <ChevronDown size={12} className="text-[#0099cc]" />
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      <AnimatePresence>
                        {filteredData.slice(0, visibleCount).map((candidate) => (
                          <motion.tr
                            key={candidate.IDENTIFICADOR + candidate['APELLIDOS Y NOMBRE']}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                            className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                          >
                            {scoreColumn && (
                              <td className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                                <div className="flex items-center gap-1">
                                  <span>{candidate.ranking ? `${candidate.ranking}.` : '-'}</span>
                                  {candidate.ranking && candidate.rankingF1 && (() => {
                                    const delta = candidate.rankingF1 - candidate.ranking; // positive = moved up
                                    if (delta === 0) return <span className="text-[9px] font-bold text-slate-400">＝</span>;
                                    if (delta > 0) return <span className="text-[9px] font-bold text-emerald-500">+{delta}</span>;
                                    return <span className="text-[9px] font-bold text-rose-500">{delta}</span>;
                                  })()}
                                </div>
                              </td>
                            )}
                            {visibleColumns.map((colKey) => {
                              const col = allColumns.find(c => c.key === colKey);
                              if (!col) return null;
                              return (
                                <td key={col.key} className="px-3 py-1.5 text-[11px] truncate">
                                  {col.key === statusColumn ? (
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${candidate[col.key] === 'APTO/A'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : candidate[col.key] === 'NO APTO/A'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400'
                                      }`}>
                                      {candidate[col.key]}
                                    </span>
                                  ) : col.key === scoreColumn ? (
                                    <span className="font-bold text-[#0099cc] tabular-nums">
                                      {candidate[col.key] === '---' ? '-' : candidate[col.key]}
                                    </span>
                                  ) : (
                                    <span className={col.key === 'APELLIDOS Y NOMBRE' ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}>
                                      {candidate[col.key] || '-'}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {visibleCount < filteredData.length && (
                    <div className="p-4 flex justify-center border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
                      <button
                        onClick={() => setVisibleCount(prev => prev + 100)}
                        className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#0099cc] transition-colors group"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">Mostrar siguientes 100</span>
                        <ChevronDown size={24} className="group-hover:translate-y-1 transition-transform" />
                      </button>
                    </div>
                  )}
                  {filteredData.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No se encontraron resultados.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 text-center">
              Mostrando {Math.min(filteredData.length, visibleCount)} de {filteredData.length} resultados filtrados.
            </div>
          </>
        )}
      </main>

      {/* Footer Disclaimer Only */}
      <footer className="py-8 border-t border-slate-200 dark:border-zinc-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Esta es una herramienta independiente para la consulta de resultados de la convocatoria de Controladores 2025.
            No tiene vinculación oficial con Enaire. Para información vinculante, consulte siempre los canales oficiales.
          </p>
        </div>
      </footer>
    </div >
  );
}
