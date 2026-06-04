import { X, Trophy, MapPin, Calendar, FileText, ChevronRight, User, Award, Percent, Link, Check, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Candidate } from '../App';
import { PhaseConfig } from '../phaseConfig';

interface CandidateDetailProps {
  candidate: Candidate | null;
  phase: PhaseConfig;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function CandidateDetail({ candidate, phase, onClose, onNext, onPrev }: CandidateDetailProps) {
  if (!candidate) return null;

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', candidate['APELLIDOS Y NOMBRE']);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2050);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const cleanStatus = status.trim().toUpperCase();
    if (cleanStatus === 'APTO/A' || cleanStatus === 'APTO') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-750 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20">
          Apto
        </span>
      );
    }
    if (cleanStatus === 'NO APTO/A' || cleanStatus === 'NO APTO') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-750 dark:text-rose-400 border border-rose-200 dark:border-rose-900/20">
          No Apto
        </span>
      );
    }
    if (cleanStatus === 'NO PRESENTADO' || cleanStatus === 'NP' || cleanStatus === '---') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
          No Presentado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-150 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20">
        {status}
      </span>
    );
  };

  const renderValue = (value: any) => {
    if (value === undefined || value === null || value === '---' || value === '#N/A' || value === '#N/D' || value === '') {
      return <span className="text-slate-400 dark:text-slate-600 font-medium">-</span>;
    }
    return <span className="font-bold text-slate-800 dark:text-slate-150">{value}</span>;
  };

  const scoreColumn = phase.scoreColumn;
  const statusColumn = phase.statusColumn;

  // Let's determine phase-specific display cards:
  // Phase 1 info:
  const hasFase1Data = candidate['TOTAL FASE 1'] !== undefined || candidate['CONOCIMIENTOS GENERALES'] !== undefined;
  const hasFase2Data = candidate['TOTAL FASE 2'] !== undefined || candidate['AULA FASE 2'] !== undefined;
  const hasFase3Data = candidate['F1+F2+F3A'] !== undefined || candidate['INGLÉS ORAL'] !== undefined || candidate['FECHA FASE 3'] !== undefined;

  // Determine active overall status
  const getOverallStatus = () => {
    const statusFields = [
      candidate['ESTADO PROVISIONAL FASE 3A'],
      candidate['ESTADO DEFINITIVO FASE 2'],
      candidate['ESTADO PROVISIONAL FASE 2'],
      candidate['ESTADO DEFINITIVO FASE 1'],
      candidate['ESTADO PROVISIONAL']
    ];

    // If any status is explicitly NO APTO/A, they are NO APTO/A overall
    if (statusFields.some(status => status && (status.trim().toUpperCase() === 'NO APTO/A' || status.trim().toUpperCase() === 'NO APTO'))) {
      return 'NO APTO/A';
    }

    // Special status like Renuncia or Exclusión
    const renuncia = statusFields.find(status => status && status.trim().toUpperCase().includes('RENUNCIA'));
    if (renuncia) return renuncia;

    const exclusion = statusFields.find(status => status && status.trim().toUpperCase().includes('EXCLUS'));
    if (exclusion) return exclusion;

    // Otherwise, check chronologically from latest to oldest for a valid non-empty and non-hyphen status
    for (const status of statusFields) {
      if (status && status !== '---' && status !== '#N/D' && status !== '#N/A' && status !== '') {
        return status;
      }
    }

    // Fallback to active statusColumn if present and has real value
    if (statusColumn && candidate[statusColumn] && candidate[statusColumn] !== '---') {
      return candidate[statusColumn];
    }

    // Last valid status that wasn't '---'
    const latestValidStatus = statusFields.find(status => status && status !== '---' && status !== '#N/D' && status !== '#N/A' && status !== '');
    if (latestValidStatus) {
      return latestValidStatus;
    }

    return '-';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-[#0099cc] to-emerald-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-slate-100 dark:border-zinc-900 relative">
          <div className="space-y-1 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0099cc] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                Candidato
              </span>
              {candidate.ranking && (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  <Trophy size={10} />
                  <span>Puesto {candidate.ranking}</span>
                  {candidate.rankingF1 && (() => {
                    const delta = candidate.rankingF1 - candidate.ranking;
                    if (delta > 0) return <span className="text-emerald-500">+{delta}</span>;
                    if (delta < 0) return <span className="text-rose-500">{delta}</span>;
                    return null;
                  })()}
                </div>
              )}
              {getStatusBadge(overallStatus)}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">
              {candidate['APELLIDOS Y NOMBRE']}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <User size={12} className="text-slate-400" />
                ID: {candidate.IDENTIFICADOR || '-'}
              </span>
              {candidate['SEDE DE EXAMEN FASE 1'] && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  Sede F1: {candidate['SEDE DE EXAMEN FASE 1']}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 absolute right-4 top-4">
            {onPrev && (
              <button
                onClick={onPrev}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Anterior (←)"
                aria-label="Candidato anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Siguiente (→)"
                aria-label="Siguiente candidato"
              >
                <ChevronRight size={18} />
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Copiar enlace a esta ficha"
              aria-label="Copiar enlace"
            >
              {copied ? <Check size={18} className="text-emerald-500 font-bold" /> : <Link size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Cerrar (Esc)"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-120px)] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
          {/* Timeline / Progress Indicator */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 rounded-xl p-4 border border-slate-150 dark:border-zinc-900">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Progreso en el Proceso Selectivo
            </h3>
            <div className="grid grid-cols-3 gap-2 relative">
              {/* Phase 1 Step */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  candidate['ESTADO DEFINITIVO FASE 1'] === 'APTO/A' || candidate['ESTADO PROVISIONAL'] === 'APTO/A'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : candidate['ESTADO DEFINITIVO FASE 1'] === 'NO APTO/A' || candidate['ESTADO PROVISIONAL'] === 'NO APTO/A'
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-600 dark:text-rose-400'
                    : hasFase1Data
                    ? 'bg-blue-50 dark:bg-blue-950 border-[#0099cc] text-[#0099cc]'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
                }`}>
                  1
                </div>
                <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300">Fase 1</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {candidate['ESTADO DEFINITIVO FASE 1'] || candidate['ESTADO PROVISIONAL'] || 'Pendiente'}
                </span>
              </div>

              {/* Phase 2 Step */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  candidate['ESTADO DEFINITIVO FASE 2'] === 'APTO/A' || candidate['ESTADO PROVISIONAL FASE 2'] === 'APTO/A'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : candidate['ESTADO DEFINITIVO FASE 2'] === 'NO APTO/A' || candidate['ESTADO PROVISIONAL FASE 2'] === 'NO APTO/A'
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-600 dark:text-rose-400'
                    : hasFase2Data
                    ? 'bg-blue-50 dark:bg-blue-950 border-[#0099cc] text-[#0099cc]'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
                }`}>
                  2
                </div>
                <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300">Fase 2</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {candidate['ESTADO DEFINITIVO FASE 2'] || candidate['ESTADO PROVISIONAL FASE 2'] || 'Pendiente'}
                </span>
              </div>

              {/* Phase 3 Step */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  candidate['ESTADO PROVISIONAL FASE 3A'] === 'APTO/A'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : candidate['ESTADO PROVISIONAL FASE 3A'] === 'NO APTO/A'
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-600 dark:text-rose-400'
                    : hasFase3Data
                    ? 'bg-blue-50 dark:bg-blue-950 border-[#0099cc] text-[#0099cc]'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
                }`}>
                  3
                </div>
                <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300">Fase 3</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {candidate['ESTADO PROVISIONAL FASE 3A'] || 'Pendiente'}
                </span>
              </div>

              {/* Connecting line */}
              <div className="absolute top-4 left-[16.6%] right-[16.6%] h-0.5 bg-slate-200 dark:bg-zinc-800 -z-0" />
            </div>
          </div>

          {/* Total Provisional (F1+F2+F3A) */}
          {overallStatus !== 'NO APTO/A' && candidate['F1+F2+F3A'] && candidate['F1+F2+F3A'] !== '---' && candidate['F1+F2+F3A'] !== '#N/D' && candidate['F1+F2+F3A'] !== '#N/A' && (
            <div className="bg-[#0099cc]/10 dark:bg-[#0099cc]/5 p-4 rounded-xl border border-[#0099cc]/20 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#0099cc] text-white">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Provisional (F1+F2+F3A)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Suma ponderada acumulada hasta Fase 3A</p>
                </div>
              </div>
              <span className="text-lg font-black text-[#0099cc] tabular-nums">{candidate['F1+F2+F3A']}</span>
            </div>
          )}

          {/* Phase 1 Details */}
          {hasFase1Data && (
            <div className="border border-slate-150 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-150 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-[#0099cc]" />
                  Fase 1: Conocimientos, Aptitudes y Personalidad
                </span>
                {candidate['TOTAL FASE 1'] && (
                  <span className="text-xs font-black text-[#0099cc] tabular-nums">
                    Nota F1: {candidate['TOTAL FASE 1']}
                  </span>
                )}
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subtests */}
                <div className="space-y-3.5 sm:col-span-2">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Conocimientos Generales</span>
                      {renderValue(candidate['CONOCIMIENTOS GENERALES'])}
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Idioma Inglés</span>
                      {renderValue(candidate['CONOCIMIENTOS IDIOMA INGLÉS'])}
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Test de Aptitudes</span>
                      {renderValue(candidate['APTITUDES'])}
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Test de Personalidad</span>
                      {renderValue(candidate['PERSONALIDAD'])}
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="sm:col-span-2 bg-slate-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-slate-100 dark:border-zinc-900/30 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Día de Examen</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['DIA EXAMEN FASE 1'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Aula / Sala</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['AULA/SALA FASE 1'] || '-'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Sede F1</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['SEDE DE EXAMEN FASE 1'] || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase 2 Details */}
          {hasFase2Data && (
            <div className="border border-slate-150 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-150 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-[#0099cc]" />
                  Fase 2: Pruebas FEAST
                </span>
                {candidate['TOTAL FASE 2'] && (
                  <span className="text-xs font-black text-[#0099cc] tabular-nums">
                    Nota F2: {candidate['TOTAL FASE 2']}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">FEAST + PDEA</span>
                    {renderValue(candidate['TOTAL FASE 2'])}
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Estado Fase 2</span>
                    <span className="font-bold">
                      {candidate['ESTADO DEFINITIVO FASE 2'] || candidate['ESTADO PROVISIONAL FASE 2'] || '-'}
                    </span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="bg-slate-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-slate-100 dark:border-zinc-900/30 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Fecha Examen</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['FECHA EXAMEN FASE 2'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Hora Citación</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['HORA INICIO FASE 2'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Sede F2</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['SEDE FASE 2'] || '-'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Edificio</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['EDIFICIO FASE 2'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Aula</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['AULA FASE 2'] || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase 3 Details */}
          {hasFase3Data && (
            <div className="border border-slate-150 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-150 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-[#0099cc]" />
                  Fase 3: Inglés, Conductual y Clínica
                </span>
                {candidate['INGLÉS ORAL'] && (
                  <span className="text-xs font-black text-[#0099cc] tabular-nums">
                    Nota F3: {candidate['INGLÉS ORAL']}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Nota F3 (Inglés Oral)</span>
                    {renderValue(candidate['INGLÉS ORAL'])}
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Evaluación Conductual</span>
                    <span className="text-slate-400 dark:text-slate-500 italic">Aún por evaluar</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Evaluación Clínica</span>
                    <span className="text-slate-400 dark:text-slate-500 italic">Aún por evaluar</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Estado Fase 3A</span>
                    <span className="font-bold">
                      {candidate['ESTADO PROVISIONAL FASE 3A'] || '-'}
                    </span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="bg-slate-50/50 dark:bg-zinc-900/10 p-3 rounded-lg border border-slate-100 dark:border-zinc-900/30 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Fecha Convocatoria F3</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['FECHA FASE 3'] || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider text-[9px] font-bold">Hora Convocatoria F3A</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate['HORA FASE 3A'] || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-150 dark:border-zinc-900 text-center text-[10px] text-slate-400 dark:text-slate-550">
          Consulta de resultados Enaire 2025 · Ficha del Alumno
        </div>
      </motion.div>

      {/* Floating navigation controls for desktop */}
      <div className="hidden lg:block">
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/30 p-3.5 rounded-full text-white border border-white/20 hover:scale-105 transition-all shadow-lg backdrop-blur-md"
            aria-label="Candidato anterior"
            title="Anterior (←)"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/30 p-3.5 rounded-full text-white border border-white/20 hover:scale-105 transition-all shadow-lg backdrop-blur-md"
            aria-label="Siguiente candidato"
            title="Siguiente (→)"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
