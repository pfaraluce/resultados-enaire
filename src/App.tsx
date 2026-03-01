import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Search, Filter, ChevronDown, ChevronUp, MapPin, User, Info, Settings2, Trophy, BarChart3, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Statistics from './components/Statistics';

export interface Candidate {
  IDENTIFICADOR: string;
  'APELLIDOS Y NOMBRE': string;
  'DIA EXAMEN': string;
  'SEDE DE EXAMEN': string;
  'AULA/SALA': string;
  'CONOCIMIENTOS GENERALES': string;
  'CONOCIMIENTOS IDIOMA INGLÉS': string;
  'APTITUDES': string;
  'PERSONALIDAD': string;
  'TOTAL FASE 1': string;
  'ESTADO PROVISIONAL': string;
  ranking?: number;
}

// Load from Vite define config (process.env.CSV_URL) or default fallback
const CSV_URL = process.env.CSV_URL;

const ALL_COLUMNS: { key: keyof Candidate; label: string }[] = [
  { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
  { key: 'SEDE DE EXAMEN', label: 'Sede' },
  { key: 'TOTAL FASE 1', label: 'Total F1' },
  { key: 'ESTADO PROVISIONAL', label: 'Estado' },
  { key: 'DIA EXAMEN', label: 'Día' },
  { key: 'AULA/SALA', label: 'Aula' },
  { key: 'CONOCIMIENTOS GENERALES', label: 'C. Grales' },
  { key: 'CONOCIMIENTOS IDIOMA INGLÉS', label: 'Inglés' },
  { key: 'APTITUDES', label: 'Aptitudes' },
  { key: 'PERSONALIDAD', label: 'Pers.' },
];

export default function App() {
  const [data, setData] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sedeFilter, setSedeFilter] = useState('Todas');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [visibleColumns, setVisibleColumns] = useState<(keyof Candidate)[]>(['APELLIDOS Y NOMBRE', 'TOTAL FASE 1', 'ESTADO PROVISIONAL', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES']);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Candidate | 'ranking'; direction: 'asc' | 'desc' }>({ key: 'ranking', direction: 'asc' });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [view, setView] = useState<'buscador' | 'estadisticas'>('buscador');

  useEffect(() => {
    setVisibleCount(100);
  }, [searchTerm, sedeFilter, estadoFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data as Candidate[];

            // Calculate ranking based on Total Fase 1
            const parseScore = (s: string) => {
              if (!s || s === '---' || s === '#N/A') return -1;
              return parseFloat(s.replace(',', '.'));
            };

            const sortedForRanking = [...rawData].sort((a, b) => {
              const scoreA = parseScore(a['TOTAL FASE 1']);
              const scoreB = parseScore(b['TOTAL FASE 1']);
              return scoreB - scoreA;
            });

            // Create a map for O(1) rank lookup
            const rankMap = new Map();
            sortedForRanking.forEach((item, index) => {
              const score = parseScore(item['TOTAL FASE 1']);
              if (score !== -1) {
                rankMap.set(item, index + 1);
              }
            });

            const rankedData = rawData.map(item => ({
              ...item,
              ranking: rankMap.get(item)
            }));

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
    const uniqueSedes = Array.from(new Set(data.map(item => item['SEDE DE EXAMEN']).filter(Boolean)));
    return ['Todas', ...uniqueSedes.sort()];
  }, [data]);

  const estados = useMemo(() => {
    const uniqueEstados = Array.from(new Set(data.map(item => item['ESTADO PROVISIONAL']).filter(Boolean)));
    return ['Todos', ...uniqueEstados.sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const normalizedSearchWords = normalize(searchTerm).split(/\s+/).filter(word => word.length > 0);

    let filtered = data.filter(item => {
      const normalizedName = normalize(item['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
      const matchesSearch = normalizedSearchWords.every(word => normalizedName.includes(word));
      const matchesSede = sedeFilter === 'Todas' || item['SEDE DE EXAMEN'] === sedeFilter;
      const matchesEstado = estadoFilter === 'Todos' || item['ESTADO PROVISIONAL'] === estadoFilter;
      return matchesSearch && matchesSede && matchesEstado;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const key = sortConfig.key;
        const aValueRaw = a[key as keyof Candidate] ?? (key === 'ranking' ? a.ranking : '');
        const bValueRaw = b[key as keyof Candidate] ?? (key === 'ranking' ? b.ranking : '');

        // Define numeric columns for proper numeric sorting
        const numericColumns = [
          'TOTAL FASE 1',
          'CONOCIMIENTOS GENERALES',
          'CONOCIMIENTOS IDIOMA INGLÉS',
          'APTITUDES',
          'ranking'
        ];

        if (numericColumns.includes(key as string)) {
          const parse = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val || val === '---' || val === '#N/A') return null;
            const num = parseFloat(val.toString().replace(',', '.'));
            return isNaN(num) ? null : num;
          };

          const numA = parse(aValueRaw);
          const numB = parse(bValueRaw);

          // Always put nulls at the bottom
          if (numA === null && numB === null) return 0;
          if (numA === null) return 1;
          if (numB === null) return -1;

          if (numA === numB) return 0;
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        // Default string sorting with localeCompare for correct accent handling
        const strA = String(aValueRaw || '');
        const strB = String(bValueRaw || '');

        return sortConfig.direction === 'asc'
          ? strA.localeCompare(strB, 'es', { sensitivity: 'accent' })
          : strB.localeCompare(strA, 'es', { sensitivity: 'accent' });
      });
    }

    return filtered;
  }, [data, searchTerm, sedeFilter, estadoFilter, sortConfig]);

  const handleSort = (key: keyof Candidate | 'ranking') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (key: keyof Candidate) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

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
          <Statistics data={data} />
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
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Info size={14} />
                  Fase 1 - Resultados Provisionales
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Escriba apellidos o nombre..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#0099cc] focus:border-transparent transition-all outline-none text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
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

                <div className="md:col-span-1 flex justify-end">
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
                          className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 p-4"
                        >
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Columnas Visibles</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {ALL_COLUMNS.map(col => (
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
                        <th className="w-16 px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Pos
                        </th>
                        {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => {
                          const isSortable = [
                            'TOTAL FASE 1',
                            'CONOCIMIENTOS GENERALES',
                            'CONOCIMIENTOS IDIOMA INGLÉS',
                            'APTITUDES'
                          ].includes(col.key);

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
                            <td className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                              {candidate.ranking ? `${candidate.ranking}.` : '-'}
                            </td>
                            {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                              <td key={col.key} className="px-3 py-1.5 text-[11px] truncate">
                                {col.key === 'ESTADO PROVISIONAL' ? (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${candidate[col.key] === 'APTO/A'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : candidate[col.key] === 'NO APTO/A'
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {candidate[col.key]}
                                  </span>
                                ) : col.key === 'TOTAL FASE 1' ? (
                                  <span className="font-bold text-[#0099cc] tabular-nums">
                                    {candidate[col.key] === '---' ? '-' : candidate[col.key]}
                                  </span>
                                ) : (
                                  <span className={col.key === 'APELLIDOS Y NOMBRE' ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}>
                                    {candidate[col.key] || '-'}
                                  </span>
                                )}
                              </td>
                            ))}
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
