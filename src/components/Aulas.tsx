import { useMemo, useState, useEffect } from 'react';
import { Candidate } from '../App';
import { PhaseConfig } from '../phaseConfig';
import { Search, ChevronDown, ChevronRight, Building2, DoorOpen, Users, Bus, Train, Navigation, Info, X, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AulasProps {
    data: Candidate[];
    phase: PhaseConfig;
}

// ─── Venue info per sede ──────────────────────────────────────────────────────

interface Transport { icon: 'bus' | 'train' | 'metro'; lines: string[] }
interface VenueInfo { name: string; address: string; mapsUrl: string; transport: Transport[] }

const VENUE_INFO: Record<string, VenueInfo> = {
    MADRID: {
        name: 'Universidad Autónoma de Madrid',
        address: 'Ciudad Universitaria de Cantoblanco, Madrid',
        mapsUrl: 'https://maps.google.com/?q=Universidad+Autonoma+Madrid+Cantoblanco',
        transport: [
            { icon: 'bus', lines: ['712', '713', '716', '717', '724'] },
            { icon: 'train', lines: ['C4A', 'C4B'] },
            { icon: 'metro', lines: ['M-10'] },
        ],
    },
    Barcelona: {
        name: 'Universidad de Barcelona – Facultad de Derecho',
        address: 'Av. Diagonal, 684 – 08034 Barcelona',
        mapsUrl: 'https://maps.google.com/?q=Facultat+de+Dret+UB+Barcelona',
        transport: [
            { icon: 'bus', lines: ['33', '7', 'L97', 'X79', 'X84'] },
            { icon: 'train', lines: ['R2N', 'S1'] },
            { icon: 'metro', lines: ['L3'] },
        ],
    },
    'Gran Canaria': {
        name: 'ULPGC – Escuela de Ingenierías Industriales y Civiles',
        address: 'Módulo F – Campus Universitario de Tafira, 35017 Las Palmas de Gran Canaria',
        mapsUrl: 'https://maps.google.com/?q=ULPGC+Ingenieria+Industriales+Tafira',
        transport: [
            { icon: 'bus', lines: ['25', '26', 'L303', 'L328', '301'] },
        ],
    },
};

// ─── Phase definitions ────────────────────────────────────────────────────────

type AulaPhaseId = 'fase3' | 'fase2' | 'fase1';
interface AulaPhase {
    id: AulaPhaseId; label: string;
    dateCol: string; sedeCol?: string; edificioCol?: string; aulaCol?: string;
    emptyVal: string[];
}

const AULA_PHASES: AulaPhase[] = [
    {
        id: 'fase3', label: 'Fase 3',
        dateCol: 'FECHA FASE 3',
        emptyVal: ['#N/D', '#N/A', '---', ''],
    },
    {
        id: 'fase2', label: 'Fase 2',
        dateCol: 'FECHA EXAMEN FASE 2',
        edificioCol: 'EDIFICIO FASE 2', aulaCol: 'AULA FASE 2',
        emptyVal: ['#N/D', '#N/A', '---', ''],
    },
    {
        id: 'fase1', label: 'Fase 1',
        dateCol: 'DIA EXAMEN FASE 1', sedeCol: 'SEDE DE EXAMEN FASE 1',
        aulaCol: 'AULA/SALA FASE 1',
        emptyVal: ['#N/D', '#N/A', '---', ''],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEmpty(val: string | undefined, empties: string[]) { return !val || empties.includes(val.trim()); }
function normalize(str: string) { return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

const TRANSPORT_ICON: Record<Transport['icon'], React.ReactNode> = {
    bus: <Bus size={13} className="text-slate-400 shrink-0 mt-0.5" />,
    train: <Train size={13} className="text-slate-400 shrink-0 mt-0.5" />,
    metro: (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" /><path d="M8 12l4-6 4 6" /><path d="M8 17l4-6 4 6" />
        </svg>
    ),
};

// ─── VenueCard ────────────────────────────────────────────────────────────────

function VenueCard({ sedeKey }: { sedeKey: string }) {
    const info = VENUE_INFO[sedeKey.toUpperCase()] ?? null;
    const [open, setOpen] = useState(false);
    if (!info) return null;
    return (
        <div className="mb-3">
            <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0099cc] hover:text-[#007aa3] transition-colors">
                <Info size={12} />
                {open ? 'Ocultar info del recinto' : 'Ver info del recinto'}
                {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{info.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{info.address}</p>
                            <div className="space-y-1">
                                {info.transport.map((t, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        {TRANSPORT_ICON[t.icon]}
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{t.lines.join(', ')}</p>
                                    </div>
                                ))}
                            </div>
                            <a href={info.mapsUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0099cc] hover:underline mt-1">
                                <Navigation size={11} />Ver en Google Maps
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Fase3VenueInfo ───────────────────────────────────────────────────────────

function Fase3VenueInfo() {
    return (
        <div className="space-y-4 mb-6">
            {/* 3A */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0099cc] mb-1">Fase 3A — Inglés oral</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Atribord</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 pt-1">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Calle de Cristóbal Bordiú nº 35, 28003 MADRID
                    </p>
                </div>
                <div className="pt-1">
                    <a href="https://maps.google.com/?q=Calle+Cristobal+Bordiu+35+Madrid"
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099cc] hover:underline">
                        <Navigation size={12} />Ver en Google Maps
                    </a>
                </div>
            </div>

            {/* 3B y 3C */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0099cc] mb-1">Fase 3B y 3C</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">CEGOS – Espacio OneNEXT · Torre Picasso</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 pt-1">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Plaza Pablo Ruiz Picasso nº 1, recepción planta baja, 28020 MADRID
                    </p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-50 dark:border-zinc-900 mt-2">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Hora de citación: 8:45 horas
                    </p>
                </div>
                <div className="pt-1">
                    <a href="https://maps.google.com/?q=Torre+Picasso+Plaza+Pablo+Ruiz+Picasso+1+Madrid"
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099cc] hover:underline">
                        <Navigation size={12} />Ver en Google Maps
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─── AulaCard (controlled) ────────────────────────────────────────────────────

interface AulaCardProps {
    aulaLabel: string;
    candidates: Candidate[];
    phase: PhaseConfig;
    searchWords: string[];
    open: boolean;
    onToggle: () => void;
}

function AulaCard({ aulaLabel, candidates, phase, searchWords, open, onToggle }: AulaCardProps) {
    const filtered = useMemo(() => {
        if (searchWords.length === 0) return candidates;
        return candidates.filter(c => {
            const name = normalize(c['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
            return searchWords.every(w => name.includes(w));
        });
    }, [candidates, searchWords]);

    const scoreCol = phase.scoreColumn;
    const statusCol = phase.statusColumn;

    return (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <button onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors text-left">
                <div className="flex items-center gap-2">
                    <DoorOpen size={15} className="text-[#0099cc]" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{aulaLabel}</span>
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-zinc-700 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                        {candidates.length} alumnos
                    </span>
                </div>
                {open ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800">
                                        {scoreCol && <th className="w-12 px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pos</th>}
                                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                                        {statusCol && <th className="w-32 px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>}
                                        {scoreCol && <th className="w-20 px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-900">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={4} className="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</td></tr>
                                    ) : filtered.map(c => (
                                        <tr key={c.IDENTIFICADOR + c['APELLIDOS Y NOMBRE']}
                                            className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                            {scoreCol && (
                                                <td className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tabular-nums">
                                                    {c.ranking ? `${c.ranking}.` : '-'}
                                                </td>
                                            )}
                                            <td className="px-3 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                                                {c['APELLIDOS Y NOMBRE'] || '-'}
                                            </td>
                                            {statusCol && (
                                                <td className="px-3 py-1.5">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${c[statusCol] === 'APTO/A' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                        : c[statusCol] === 'NO APTO/A' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        {c[statusCol] || '-'}
                                                    </span>
                                                </td>
                                            )}
                                            {scoreCol && (
                                                <td className="px-3 py-1.5 text-[11px] font-bold text-[#0099cc] tabular-nums">
                                                    {(!c[scoreCol] || c[scoreCol] === '---' || c[scoreCol] === '#N/D') ? '-' : c[scoreCol]}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Fase3DayCard ─────────────────────────────────────────────────────────────

interface Fase3DayCardProps {
    date: string;
    candidates: Candidate[];
    searchWords: string[];
    open: boolean;
    onToggle: () => void;
}

function Fase3DayCard({ date, candidates, searchWords, open, onToggle }: Fase3DayCardProps) {
    const filtered = useMemo(() => {
        if (searchWords.length === 0) return candidates;
        return candidates.filter(c => {
            const name = normalize(c['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
            return searchWords.every(w => name.includes(w));
        });
    }, [candidates, searchWords]);

    return (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <button onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors text-left">
                <div className="flex items-center gap-2">
                    <DoorOpen size={15} className="text-[#0099cc]" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{date}</span>
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-zinc-700 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                        {candidates.length} candidatos
                    </span>
                </div>
                {open ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800">
                                        <th className="w-12 px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pos</th>
                                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                                        <th className="w-24 px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hora 3A</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-900">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-xs text-slate-400">Sin resultados</td></tr>
                                    ) : filtered.map(c => (
                                        <tr key={c.IDENTIFICADOR + c['APELLIDOS Y NOMBRE']}
                                            className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                            <td className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tabular-nums">
                                                {c.ranking ? `${c.ranking}.` : '-'}
                                            </td>
                                            <td className="px-3 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                                                {c['APELLIDOS Y NOMBRE'] || '-'}
                                            </td>
                                            <td className="px-3 py-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-300 tabular-nums">
                                                {c['HORA FASE 3A'] && c['HORA FASE 3A'] !== '---' && c['HORA FASE 3A'] !== '#N/D' && c['HORA FASE 3A'] !== '#N/A'
                                                    ? c['HORA FASE 3A'] : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Fase3View ────────────────────────────────────────────────────────────────

function Fase3View({ data, searchWords }: { data: Candidate[]; searchWords: string[] }) {
    const emptyVals = ['#N/D', '#N/A', '---', ''];

    const fase3Data = useMemo(() =>
        data.filter(c => !isEmpty(c['FECHA FASE 3'], emptyVals)),
        [data]
    );

    const dates = useMemo(() => {
        const unique = Array.from(new Set(fase3Data.map(c => c['FECHA FASE 3']?.trim()).filter(Boolean)));
        return unique.sort((a, b) => {
            const parse = (d: string) => { const [day, m, y] = d.split('/'); return new Date(Number(y), Number(m) - 1, Number(day)).getTime(); };
            return parse(a) - parse(b);
        });
    }, [fase3Data]);

    // Group by date
    const byDate = useMemo(() => {
        const map = new Map<string, Candidate[]>();
        const dataToGroup = searchWords.length > 0 ? fase3Data : fase3Data;
        dataToGroup.forEach(c => {
            const date = c['FECHA FASE 3']?.trim() || 'Sin fecha';
            if (!map.has(date)) map.set(date, []);
            map.get(date)!.push(c);
        });
        // sort each by ranking
        map.forEach((cands, key) => map.set(key, [...cands].sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity))));
        return map;
    }, [fase3Data, searchWords]);

    const visibleDates = useMemo(() => {
        if (searchWords.length === 0) return dates;
        return dates.filter(date => {
            const candidates = byDate.get(date) || [];
            return candidates.some(c => {
                const name = normalize(c['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
                return searchWords.every(w => name.includes(w));
            });
        });
    }, [dates, byDate, searchWords]);

    const [openCards, setOpenCards] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (visibleDates.length > 0) setOpenCards(new Set([visibleDates[0]]));
    }, [visibleDates.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (searchWords.length > 0) setOpenCards(new Set(visibleDates));
    }, [searchWords.length, visibleDates]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleCard = (key: string) =>
        setOpenCards(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

    const totalVisible = useMemo(() => {
        if (searchWords.length === 0) return fase3Data.length;
        return fase3Data.filter(c => {
            const name = normalize(c['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
            return searchWords.every(w => name.includes(w));
        }).length;
    }, [fase3Data, searchWords]);

    if (fase3Data.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
                <p className="text-slate-400 text-sm">No hay datos de Fase 3 disponibles todavía.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Madrid header */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0099cc]/10"><Building2 size={16} className="text-[#0099cc]" /></div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Madrid</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Todas las pruebas de Fase 3</p>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <Fase3VenueInfo />
                    {visibleDates.map(date => (
                        <Fase3DayCard
                            key={date}
                            date={date}
                            candidates={byDate.get(date) ?? []}
                            searchWords={searchWords}
                            open={openCards.has(date)}
                            onToggle={() => toggleCard(date)}
                        />
                    ))}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                <Users size={11} className="inline mr-1" />
                {searchWords.length > 0
                    ? `${totalVisible} coincidencias · Fase 3`
                    : `${fase3Data.length} candidatos convocados a Fase 3`}
            </p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Aulas({ data, phase }: AulasProps) {
    const availablePhases = useMemo<AulaPhase[]>(() => {
        return AULA_PHASES.filter(ap => {
            if (ap.id === 'fase3') return data.some(c => !isEmpty(c['FECHA FASE 3'], ap.emptyVal));
            return ap.aulaCol ? data.some(c => !isEmpty(c[ap.aulaCol!], ap.emptyVal)) : false;
        });
    }, [data]);

    const [selectedPhaseId, setSelectedPhaseId] = useState<AulaPhaseId>(() => availablePhases[0]?.id ?? 'fase2');
    const selectedPhase = AULA_PHASES.find(p => p.id === selectedPhaseId) ?? AULA_PHASES[1];

    const phaseData = useMemo(() => {
        if (selectedPhaseId === 'fase3') return [];
        return data.filter(c => selectedPhase.aulaCol ? !isEmpty(c[selectedPhase.aulaCol!], selectedPhase.emptyVal) : false);
    }, [data, selectedPhase, selectedPhaseId]);

    const dates = useMemo(() => {
        if (selectedPhaseId === 'fase3') return [];
        const unique = Array.from(new Set(phaseData.map(c => c[selectedPhase.dateCol]?.trim()).filter(Boolean)));
        return unique.sort((a, b) => {
            const parse = (d: string) => { const [day, m, y] = d.split('/'); return new Date(Number(y), Number(m) - 1, Number(day)).getTime(); };
            return parse(a) - parse(b);
        });
    }, [phaseData, selectedPhase, selectedPhaseId]);

    const defaultDate = useMemo(() => {
        if (dates.length === 0) return '';
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const parseDate = (d: string) => { const [day, m, y] = d.split('/'); return new Date(Number(y), Number(m) - 1, Number(day)).getTime(); };
        const upcoming = dates.find(d => parseDate(d) >= todayTime);
        return upcoming ?? dates[dates.length - 1];
    }, [dates]);

    const [selectedDate, setSelectedDate] = useState('');
    const activeDate = dates.includes(selectedDate) ? selectedDate : defaultDate;

    const dayData = useMemo(() => {
        if (selectedPhaseId === 'fase3') return [];
        return phaseData.filter(c => c[selectedPhase.dateCol]?.trim() === activeDate);
    }, [phaseData, selectedPhase, activeDate, selectedPhaseId]);

    const [searchTerm, setSearchTerm] = useState('');
    const searchWords = useMemo(
        () => normalize(searchTerm).split(/\s+/).filter(w => w.length > 0),
        [searchTerm]
    );

    // ─── Grouping (fase1 / fase2) ─────────────────────────────────────────────
    const hasSede = !!selectedPhase.sedeCol;
    const hasEdificio = !!selectedPhase.edificioCol;

    const grouped = useMemo(() => {
        if (selectedPhaseId === 'fase3') return new Map<string, Map<string, Map<string, Candidate[]>>>();
        const dataToGroup = searchWords.length > 0 ? phaseData : dayData;
        const outerMap = new Map<string, Map<string, Map<string, Candidate[]>>>();
        dataToGroup.forEach(c => {
            const outer = hasSede ? (c[selectedPhase.sedeCol!]?.trim() || 'Sin sede') : 'root';
            const edificio = hasEdificio
                ? (isEmpty(c[selectedPhase.edificioCol!], selectedPhase.emptyVal) ? 'Sin edificio' : c[selectedPhase.edificioCol!]?.trim())
                : 'root';
            let aula = selectedPhase.aulaCol ? (c[selectedPhase.aulaCol]?.trim() || 'Sin aula') : 'Sin aula';
            if (searchWords.length > 0) {
                const dateStr = c[selectedPhase.dateCol]?.trim() || 'Sin fecha';
                aula = `${aula} (${dateStr})`;
            }

            if (!outerMap.has(outer)) outerMap.set(outer, new Map());
            const edMap = outerMap.get(outer)!;
            if (!edMap.has(edificio)) edMap.set(edificio, new Map());
            const aulaMap = edMap.get(edificio)!;
            if (!aulaMap.has(aula)) aulaMap.set(aula, []);
            aulaMap.get(aula)!.push(c);
        });

        if (searchWords.length > 0) {
            for (const [outer, edMap] of outerMap.entries()) {
                for (const [edificio, aulaMap] of edMap.entries()) {
                    for (const [aula, cands] of aulaMap.entries()) {
                        const hasMatch = cands.some(cand => {
                            const name = normalize(cand['APELLIDOS Y NOMBRE'] || '').replace(/,/g, ' ');
                            return searchWords.every(w => name.includes(w));
                        });
                        if (!hasMatch) aulaMap.delete(aula);
                    }
                    if (aulaMap.size === 0) edMap.delete(edificio);
                }
                if (edMap.size === 0) outerMap.delete(outer);
            }
        }

        outerMap.forEach(edMap => edMap.forEach(aulaMap =>
            aulaMap.forEach((cands, key) =>
                aulaMap.set(key, [...cands].sort((a, b) => (a.ranking ?? Infinity) - (b.ranking ?? Infinity)))
            )
        ));
        return outerMap;
    }, [dayData, phaseData, searchWords, selectedPhase, hasSede, hasEdificio, selectedPhaseId]);

    const allAulaKeys = useMemo(() => {
        const keys: string[] = [];
        const sortedOuters = Array.from(grouped.keys()).sort((a, b) => a === 'root' ? -1 : a.localeCompare(b, 'es'));
        sortedOuters.forEach(outer => {
            const edMap = grouped.get(outer)!;
            Array.from(edMap.keys()).sort((a, b) => a.localeCompare(b, 'es')).forEach(edificio => {
                Array.from(edMap.get(edificio)!.keys()).sort((a, b) => a.localeCompare(b, 'es')).forEach(aula => {
                    keys.push(`${outer}::${edificio}::${aula}`);
                });
            });
        });
        return keys;
    }, [grouped]);

    const [openAulas, setOpenAulas] = useState<Set<string>>(new Set());
    useEffect(() => {
        if (searchWords.length > 0) setOpenAulas(new Set(allAulaKeys));
        else setOpenAulas(allAulaKeys.length > 0 ? new Set([allAulaKeys[0]]) : new Set());
    }, [allAulaKeys.join('|'), searchWords.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleAula = (key: string) =>
        setOpenAulas(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

    const outerKeys = useMemo(() => Array.from(grouped.keys()).sort((a, b) => a === 'root' ? -1 : a.localeCompare(b, 'es')), [grouped]);
    const [openOuters, setOpenOuters] = useState<Set<string>>(new Set());
    useEffect(() => { setOpenOuters(new Set(outerKeys)); }, [outerKeys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
    const toggleOuter = (key: string) =>
        setOpenOuters(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

    // ─── Render ────────────────────────────────────────────────────────────────

    if (availablePhases.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-16 text-center">
                <p className="text-slate-400 text-sm">No hay datos de aulas disponibles todavía.</p>
            </div>
        );
    }

    const renderAulaCard = (outer: string, edificio: string, aula: string, cands: Candidate[]) => {
        const key = `${outer}::${edificio}::${aula}`;
        return (
            <AulaCard key={key} aulaLabel={aula} candidates={cands} phase={phase}
                searchWords={searchWords} open={openAulas.has(key)} onToggle={() => toggleAula(key)} />
        );
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">

            {/* Controls */}
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 min-w-0 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input type="text" placeholder="Buscar alumno..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#0099cc] focus:border-transparent outline-none text-sm" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={15} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {availablePhases.length > 1 && (
                        <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                            {availablePhases.map(ap => (
                                <button key={ap.id} onClick={() => { setSelectedPhaseId(ap.id); setSelectedDate(''); }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedPhaseId === ap.id ? 'bg-white dark:bg-zinc-800 text-[#0099cc] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    {ap.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Date selector — only for fase1/fase2 */}
                    {selectedPhaseId !== 'fase3' && (
                        dates.length > 1 ? (
                            <div className="flex gap-1.5 flex-wrap">
                                {dates.map(d => {
                                    const isSearching = searchWords.length > 0;
                                    return (
                                        <button key={d} onClick={() => setSelectedDate(d)} disabled={isSearching}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isSearching ? 'bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                                                : d === activeDate ? 'bg-[#0099cc] text-white border-[#0099cc]'
                                                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-[#0099cc] hover:text-[#0099cc]'
                                                }`}>
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${searchWords.length > 0 ? 'bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-zinc-800 opacity-50' : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}>{activeDate}</span>
                        )
                    )}
                </div>
            </div>

            {/* Fase 3 view */}
            {selectedPhaseId === 'fase3' ? (
                <Fase3View data={data} searchWords={searchWords} />
            ) : outerKeys.length === 0 ? (
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 p-12 text-center">
                    <p className="text-slate-400 text-sm">No hay aulas para la fecha seleccionada.</p>
                </div>
            ) : hasSede ? (
                /* Fase 1: Sede → Aula */
                outerKeys.map(sede => {
                    const edMap = grouped.get(sede)!;
                    const isOpen = openOuters.has(sede);
                    const total = Array.from(edMap.values()).flatMap(m => Array.from(m.values())).flat().length;
                    const aulaCount = Array.from(edMap.values()).flatMap(m => Array.from(m.keys())).length;
                    return (
                        <div key={sede} className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <button onClick={() => toggleOuter(sede)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#0099cc]/10"><Building2 size={16} className="text-[#0099cc]" /></div>
                                    <div>
                                        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">{sede}</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{total} alumnos · {aulaCount} aulas</p>
                                    </div>
                                </div>
                                {isOpen ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                            </button>
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-slate-100 dark:border-zinc-800">
                                        <div className="p-4 space-y-4">
                                            <VenueCard sedeKey={sede} />
                                            {Array.from(edMap.entries()).sort(([a], [b]) => a.localeCompare(b, 'es')).map(([edificio, aulaMap]) => (
                                                <div key={edificio} className="space-y-2">
                                                    {Array.from(aulaMap.entries()).sort(([a], [b]) => a.localeCompare(b, 'es')).map(([aula, cands]) =>
                                                        renderAulaCard(sede, edificio, aula, cands)
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })
            ) : (
                /* Fase 2: Edificio → Aula (Madrid fijo) */
                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#0099cc]/10"><Building2 size={16} className="text-[#0099cc]" /></div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Madrid</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                {Array.from(grouped.get('root')?.values() ?? []).flatMap(m => Array.from(m.values())).flat().length} alumnos
                                {searchWords.length === 0 && ` · ${activeDate}`}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 space-y-5">
                        <VenueCard sedeKey="Madrid" />
                        {Array.from(grouped.get('root')?.entries() ?? []).sort(([a], [b]) => a.localeCompare(b, 'es')).map(([edificio, aulaMap]) => (
                            <div key={edificio}>
                                {hasEdificio && edificio !== 'root' && (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <DoorOpen size={13} className="text-slate-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{edificio}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {Array.from(aulaMap.entries()).sort(([a], [b]) => a.localeCompare(b, 'es')).map(([aula, cands]) =>
                                        renderAulaCard('root', edificio, aula, cands)
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedPhaseId !== 'fase3' && (
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                    <Users size={11} className="inline mr-1" />
                    {searchWords.length > 0
                        ? `${Array.from(grouped.values()).flatMap(edMap => Array.from(edMap.values()).flatMap(aulaMap => Array.from(aulaMap.values()))).flat().length} coincidencias · ${selectedPhase.label}`
                        : `${dayData.length} alumnos convocados el ${activeDate} · ${selectedPhase.label}`}
                </p>
            )}
        </div>
    );
}
