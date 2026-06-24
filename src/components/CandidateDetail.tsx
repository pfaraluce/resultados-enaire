import { X, Trophy, MapPin, Calendar, FileText, ChevronRight, User, Award, Percent, Link, Check, ChevronLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
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

    // Special override for phase 3 prov plaza:
    if (phase.id === 'fase3-prov' && (cleanStatus === 'APTO/A' || cleanStatus === 'APTO')) {
      if (candidate.ranking && candidate.ranking <= 149) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-450 border border-emerald-250/50 dark:border-emerald-900/30 animate-pulse">
            Con Plaza (Prov.)
          </span>
        );
      } else if (candidate.ranking) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/20">
            Apto (Sin Plaza)
          </span>
        );
      }
    }

    if (cleanStatus === 'APTO/A' || cleanStatus === 'APTO') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20">
          Apto
        </span>
      );
    }
    if (cleanStatus === 'NO APTO/A' || cleanStatus === 'NO APTO') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-455 border border-rose-200 dark:border-rose-900/20">
          No Apto
        </span>
      );
    }
    if (cleanStatus === 'NO PRESENTADO' || cleanStatus === 'NP' || cleanStatus === '---') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-800">
          No Presentado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20">
        {status}
      </span>
    );
  };

  const renderValue = (value: any) => {
    if (value === undefined || value === null || value === '---' || value === '#N/A' || value === '#N/D' || value === '') {
      return <span className="text-slate-400 dark:text-slate-600 font-medium">-</span>;
    }
    return <span className="font-bold text-slate-800 dark:text-slate-200">{value}</span>;
  };

  const scoreColumn = phase.scoreColumn;
  const statusColumn = phase.statusColumn;

  // Let's determine phase-specific display cards:
  // Phase 1 info:
  const hasFase1Data = candidate['TOTAL FASE 1'] !== undefined || candidate['CONOCIMIENTOS GENERALES'] !== undefined;
  const hasFase2Data = candidate['TOTAL FASE 2'] !== undefined || candidate['AULA FASE 2'] !== undefined;
  const hasFase3Data = candidate['F1+F2+F3A'] !== undefined || candidate['INGLÉS ORAL'] !== undefined || candidate['FECHA FASE 3'] !== undefined || candidate['F1+F2+F3'] !== undefined;

  const parseScoreVal = (val: any) => {
    if (!val || val === '---' || val === '#N/A' || val === '#N/D') return 0;
    const parsed = parseFloat(val.toString().replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const getF3Score = () => {
    if (candidate['PUNTUACIÓN 3 B)'] !== undefined) {
      const score3A = parseScoreVal(candidate['INGLÉS ORAL']);
      const score3B = parseScoreVal(candidate['PUNTUACIÓN 3 B)']);
      if (score3A === 0 && score3B === 0) return '---';
      return (score3A + score3B).toLocaleString('es-ES', { maximumFractionDigits: 2 });
    }
    return candidate['INGLÉS ORAL'] || '---';
  };

  const getFase3Status = () => {
    const status3A = (candidate['ESTADO DEFINITIVO FASE 3A'] ?? candidate['ESTADO PROVISIONAL FASE 3A'])?.trim();
    const status3B = (candidate['RESULTADO DEFINITIVO 3 B)'] ?? candidate['RESULTADO 3 B)'])?.trim();
    const status3C = (candidate['RESULTADO DEFINITIVO 3 C)'] ?? candidate['RESULTADO 3 C)'])?.trim();

    const u3A = status3A?.toUpperCase() || '';
    const u3B = status3B?.toUpperCase() || '';
    const u3C = status3C?.toUpperCase() || '';

    // Check for explicit exclusions, renuncias, etc. first
    if (u3A.includes('EXCLUI') || u3A.includes('RENUNCIA')) return status3A;
    if (u3B.includes('EXCLUI') || u3B.includes('RENUNCIA')) return status3B;
    if (u3C.includes('EXCLUI') || u3C.includes('RENUNCIA')) return status3C;

    if (u3A === 'NO APTO/A' || u3B === 'NO APTO/A' || u3C === 'NO APTO/A' ||
        u3A === 'NO APTO' || u3B === 'NO APTO' || u3C === 'NO APTO') {
      return 'NO APTO/A';
    }
    if ((u3A === 'APTO/A' || u3A === 'APTO') && 
        (u3B === 'APTO/A' || u3B === 'APTO') && 
        (u3C === 'APTO/A' || u3C === 'APTO')) {
      return 'APTO/A';
    }
    
    // If one is APTO/A but another is pending/empty, return Pendiente
    if (u3A === 'APTO/A' && (u3B === '---' || !u3B || u3C === '---' || !u3C)) {
      return 'Pendiente';
    }

    return status3A || 'Pendiente';
  };

  // Determine active overall status
  const getOverallStatus = () => {
    const statusFields = [
      candidate['RESULTADO DEFINITIVO 3 B)'],
      candidate['RESULTADO 3 B)'],
      candidate['RESULTADO DEFINITIVO 3 C)'],
      candidate['RESULTADO 3 C)'],
      candidate['ESTADO DEFINITIVO FASE 3A'],
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Top brand accent line
    doc.setFillColor(0, 153, 204); // Enaire blue
    doc.rect(15, 15, 180, 1.5, 'F');

    let y = 24;

    // 2. Pre-title/badge info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 153, 204);
    doc.text('CONVOCATORIA SELECCIÓN CONTROLADORES ENAIRE 2025', 15, y);
    y += 6;

    // 3. Candidate Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(candidate['APELLIDOS Y NOMBRE'], 15, y);
    y += 7;

    // 4. Candidate Sub-metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    let metaText = `ID: ${candidate.IDENTIFICADOR || '-'}`;
    if (candidate['SEDE DE EXAMEN FASE 1']) {
      metaText += `   |   Sede Examen F1: ${candidate['SEDE DE EXAMEN FASE 1']}`;
    }
    doc.text(metaText, 15, y);
    y += 8;

    // 5. Banner: Ranking and Overall Status
    const overallStatusVal = overallStatus;
    const cleanStatus = overallStatusVal.trim().toUpperCase();
    let statusRGB = [100, 116, 139]; // default slate-500

    if (cleanStatus.includes('APTO') && !cleanStatus.includes('NO APTO')) {
      statusRGB = [5, 150, 105]; // emerald-600
    } else if (cleanStatus.includes('NO APTO')) {
      statusRGB = [220, 38, 38]; // red-600
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, y, 180, 16, 2, 2, 'FD');

    // Ranking info inside banner
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PUESTO EN EL RANKING', 20, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const rankingText = candidate.ranking ? `Puesto ${candidate.ranking}` : 'Sin Ranking';
    doc.text(rankingText, 20, y + 11);

    // Overall Status info inside banner
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ESTADO GENERAL DEL CANDIDATO', 110, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(statusRGB[0], statusRGB[1], statusRGB[2]);
    doc.text(overallStatusVal, 110, y + 11);

    y += 24;

    // 6. Progress Timeline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PROGRESO EN EL PROCESO SELECTIVO', 15, y);
    y += 6;

    // Draw connecting timeline line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.line(45, y + 4, 165, y + 4);

    const drawTimelineStep = (cx: number, cy: number, num: number, label: string, statusText: string, state: 'APTO' | 'NOAPTO' | 'HASDATA' | 'PENDIENTE') => {
      // Circle fill
      let circleFillRGB = [200, 200, 200];
      if (state === 'APTO') circleFillRGB = [5, 150, 105];
      else if (state === 'NOAPTO') circleFillRGB = [220, 38, 38];
      else if (state === 'HASDATA') circleFillRGB = [0, 153, 204];

      doc.setFillColor(circleFillRGB[0], circleFillRGB[1], circleFillRGB[2]);
      doc.circle(cx, cy + 4, 4, 'F');

      // Circle number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(String(num), cx, cy + 4, { align: 'center', baseline: 'middle' });

      // Label below circle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(label, cx, cy + 13, { align: 'center' });

      // Status text below label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(statusText, cx, cy + 17, { align: 'center' });
    };

    // Calculate step states
    const f1StateText = candidate['ESTADO DEFINITIVO FASE 1'] || candidate['ESTADO PROVISIONAL'];
    const f1State = (f1StateText === 'APTO/A' || f1StateText === 'APTO') ? 'APTO' 
      : (f1StateText === 'NO APTO/A' || f1StateText === 'NO APTO') ? 'NOAPTO'
      : hasFase1Data ? 'HASDATA' : 'PENDIENTE';

    const f2StateText = candidate['ESTADO DEFINITIVO FASE 2'] || candidate['ESTADO PROVISIONAL FASE 2'];
    const f2State = (f2StateText === 'APTO/A' || f2StateText === 'APTO') ? 'APTO'
      : (f2StateText === 'NO APTO/A' || f2StateText === 'NO APTO') ? 'NOAPTO'
      : hasFase2Data ? 'HASDATA' : 'PENDIENTE';

    const f3StateText = getFase3Status();
    const f3State = (f3StateText === 'APTO/A' || f3StateText === 'APTO') ? 'APTO'
      : (f3StateText === 'NO APTO/A' || f3StateText === 'NO APTO') ? 'NOAPTO'
      : hasFase3Data ? 'HASDATA' : 'PENDIENTE';

    drawTimelineStep(45, y, 1, 'Fase 1', f1StateText || (hasFase1Data ? 'Presentado' : 'Pendiente'), f1State);
    drawTimelineStep(105, y, 2, 'Fase 2', f2StateText || (hasFase2Data ? 'Presentado' : 'Pendiente'), f2State);
    drawTimelineStep(165, y, 3, 'Fase 3', f3StateText || 'Pendiente', f3State);

    y += 26;

    // 7. Totals Provisional / Placement banners (before details)
    if (phase.id === 'fase3a-prov' && overallStatusVal !== 'NO APTO/A' && candidate['F1+F2+F3A'] && candidate['F1+F2+F3A'] !== '---' && candidate['F1+F2+F3A'] !== '#N/D' && candidate['F1+F2+F3A'] !== '#N/A') {
      doc.setFillColor(230, 245, 250);
      doc.setDrawColor(180, 230, 245);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, 180, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('Total Provisional (F1+F2+F3A) - Suma ponderada acumulada', 20, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 153, 204);
      doc.text(String(candidate['F1+F2+F3A']), 190, y + 8, { align: 'right' });

      y += 18;
    } else if (phase.id === 'fase3-prov') {
      if (candidate.ranking) {
        const isPlaza = candidate.ranking <= 149;
        const bannerBgRGB = isPlaza ? [236, 253, 245] : [255, 251, 235];
        const bannerBorderRGB = isPlaza ? [167, 243, 208] : [253, 230, 138];
        const badgeTextRGB = isPlaza ? [5, 150, 105] : [217, 119, 6];

        doc.setFillColor(bannerBgRGB[0], bannerBgRGB[1], bannerBgRGB[2]);
        doc.setDrawColor(bannerBorderRGB[0], bannerBorderRGB[1], bannerBorderRGB[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, y, 180, 14, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(badgeTextRGB[0], badgeTextRGB[1], badgeTextRGB[2]);
        doc.text(isPlaza ? 'Estado: Provisionalmente con Plaza' : 'Estado: Apto (Sin Plaza)', 20, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(isPlaza ? 'Se encuentra dentro de las 149 plazas provisionales.' : 'Superado el proceso, en espera de posibles renuncias.', 20, y + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('Nota F1+F2+F3', 190, y + 4.5, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 153, 204);
        doc.text(String(candidate['F1+F2+F3']), 190, y + 10.5, { align: 'right' });

        y += 20;
      } else if (candidate['F1+F2+F3'] && candidate['F1+F2+F3'] !== '---') {
        // No Apto / Eliminado
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, y, 180, 14, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text('Estado: No Apto / Eliminado', 20, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('No supera alguna de las subpruebas de la Fase 3.', 20, y + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('Nota F1+F2+F3', 190, y + 4.5, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38);
        doc.text(String(candidate['F1+F2+F3']), 190, y + 10.5, { align: 'right' });

        y += 20;
      }
    }

    // Card drawing helper
    const drawCard = (title: string, rightText: string, yPos: number, height: number) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, yPos, 180, height, 2, 2, 'FD');

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, yPos, 180, 8, 2, 2, 'F');
      doc.rect(15, yPos + 4, 180, 4, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.line(15, yPos + 8, 195, yPos + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(title, 20, yPos + 5.5);

      if (rightText) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 153, 204);
        doc.text(rightText, 190, yPos + 5.5, { align: 'right' });
      }
    };

    const drawGridValue = (x: number, yPos: number, label: string, val: any) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x, yPos);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      let displayVal = '-';
      if (val !== undefined && val !== null && val !== '---' && val !== '#N/A' && val !== '#N/D' && val !== '') {
        displayVal = String(val);
      }

      const upperVal = displayVal.toUpperCase();
      if (upperVal === 'APTO' || upperVal === 'APTO/A') {
        doc.setTextColor(5, 150, 105);
      } else if (upperVal === 'NO APTO' || upperVal === 'NO APTO/A') {
        doc.setTextColor(220, 38, 38);
      }

      doc.text(displayVal, x, yPos + 4.5);
    };

    // 8. Phase 1 Details Card
    if (hasFase1Data) {
      drawCard('FASE 1: CONOCIMIENTOS, APTITUDES Y PERSONALIDAD', candidate['TOTAL FASE 1'] ? `Nota F1: ${candidate['TOTAL FASE 1']}` : '', y, 32);
      
      // Row 1
      drawGridValue(20, y + 13, 'Conocimientos Grales.', candidate['CONOCIMIENTOS GENERALES']);
      drawGridValue(65, y + 13, 'Idioma Inglés', candidate['CONOCIMIENTOS IDIOMA INGLÉS']);
      drawGridValue(110, y + 13, 'Test de Aptitudes', candidate['APTITUDES']);
      drawGridValue(155, y + 13, 'Test de Personalidad', candidate['PERSONALIDAD']);

      // Row 2
      drawGridValue(20, y + 23, 'Día de Examen', candidate['DIA EXAMEN FASE 1']);
      drawGridValue(65, y + 23, 'Aula / Sala', candidate['AULA/SALA FASE 1']);
      drawGridValue(110, y + 23, 'Sede F1', candidate['SEDE DE EXAMEN FASE 1']);

      y += 38;
    }

    // 9. Phase 2 Details Card
    if (hasFase2Data) {
      drawCard('FASE 2: PRUEBAS DIGITALES', candidate['TOTAL FASE 2'] ? `Nota F2: ${candidate['TOTAL FASE 2']}` : '', y, 32);

      // Row 1
      drawGridValue(20, y + 13, 'FEAST + PDEA (Total)', candidate['TOTAL FASE 2']);
      drawGridValue(65, y + 13, 'Estado Fase 2', candidate['ESTADO DEFINITIVO FASE 2'] || candidate['ESTADO PROVISIONAL FASE 2']);
      drawGridValue(110, y + 13, 'Fecha Examen', candidate['FECHA EXAMEN FASE 2']);
      drawGridValue(155, y + 13, 'Hora Citación', candidate['HORA INICIO FASE 2']);

      // Row 2
      const sedeEdificio = `${candidate['SEDE FASE 2'] || ''}${candidate['EDIFICIO FASE 2'] ? ` - ${candidate['EDIFICIO FASE 2']}` : ''}` || '-';
      drawGridValue(20, y + 23, 'Sede / Edificio', sedeEdificio);
      drawGridValue(155, y + 23, 'Aula', candidate['AULA FASE 2']);

      y += 38;
    }

    // 10. Phase 3 Details Card
    if (hasFase3Data) {
      drawCard('FASE 3: INGLÉS, CONDUCTUAL Y CLÍNICA', getF3Score() !== '---' ? `Nota F3: ${getF3Score()}` : '', y, 32);

      // Row 1
      drawGridValue(20, y + 13, 'Inglés Oral (3A)', candidate['INGLÉS ORAL']);
      drawGridValue(65, y + 13, 'Conductual (3B)', candidate['PUNTUACIÓN 3 B)']);
      drawGridValue(110, y + 13, 'Clínica (3C)', candidate['RESULTADO 3 C)']);

      // Row 2
      drawGridValue(20, y + 23, 'Estado 3A (Inglés)', candidate['ESTADO DEFINITIVO FASE 3A'] ?? candidate['ESTADO PROVISIONAL FASE 3A']);
      drawGridValue(65, y + 23, 'Resultado 3B', candidate['RESULTADO DEFINITIVO 3 B)'] ?? candidate['RESULTADO 3 B)']);
      drawGridValue(110, y + 23, 'Fecha Convocatoria', candidate['FECHA FASE 3']);
      drawGridValue(155, y + 23, 'Hora Convocatoria', candidate['HORA FASE 3A']);

      y += 38;
    }

    // 11. Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Consulta de resultados Enaire 2025 · Ficha del Alumno', 105, 285, { align: 'center' });

    // Save PDF
    const safeName = candidate['APELLIDOS Y NOMBRE'].trim().replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Ficha_Candidato_${safeName}.pdf`);
  };

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
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-blue-500 via-[#0099cc] to-emerald-500" />

        {/* Top Control Bar / Toolbar */}
        <div className="pt-4 pb-3 px-6 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center z-10">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Ficha del Candidato
          </span>
          <div className="flex items-center gap-1">
            {onPrev && (
              <button
                onClick={onPrev}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Anterior (←)"
                aria-label="Candidato anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Siguiente (→)"
                aria-label="Siguiente candidato"
              >
                <ChevronRight size={18} />
              </button>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Copiar enlace a esta ficha"
              aria-label="Copiar enlace"
            >
              {copied ? <Check size={18} className="text-emerald-500 font-bold" /> : <Link size={18} />}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Descargar Ficha en PDF (A4)"
              aria-label="Descargar PDF"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Cerrar (Esc)"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Candidate Profile Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-zinc-900 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {candidate.ranking && (
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-55/60 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/40 dark:border-amber-900/20">
                <Trophy size={10} className="text-amber-500" />
                <span>Puesto {candidate.ranking}</span>
                {candidate.rankingF1 && (() => {
                  const delta = candidate.rankingF1 - candidate.ranking;
                  if (delta > 0) return <span className="text-emerald-600 dark:text-emerald-450 ml-0.5">+{delta}</span>;
                  if (delta < 0) return <span className="text-rose-650 dark:text-rose-455 ml-0.5">{delta}</span>;
                  return null;
                })()}
              </div>
            )}
            {getStatusBadge(overallStatus)}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {candidate['APELLIDOS Y NOMBRE']}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
          {/* Timeline / Progress Indicator */}
          <div className="bg-slate-50 dark:bg-zinc-900/30 rounded-xl p-4 border border-slate-200 dark:border-zinc-900">
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
                  getFase3Status() === 'APTO/A'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : getFase3Status() === 'NO APTO/A'
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-600 dark:text-rose-400'
                    : hasFase3Data
                    ? 'bg-blue-50 dark:bg-blue-950 border-[#0099cc] text-[#0099cc]'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400'
                }`}>
                  3
                </div>
                <span className="text-[10px] font-bold mt-2 text-slate-700 dark:text-slate-300">Fase 3</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {getFase3Status() || 'Pendiente'}
                </span>
              </div>

              {/* Connecting line */}
              <div className="absolute top-4 left-[16.6%] right-[16.6%] h-0.5 bg-slate-200 dark:bg-zinc-800 z-0" />
            </div>
          </div>

          {/* Total Provisional (F1+F2+F3A) */}
          {phase.id === 'fase3a-prov' && overallStatus !== 'NO APTO/A' && candidate['F1+F2+F3A'] && candidate['F1+F2+F3A'] !== '---' && candidate['F1+F2+F3A'] !== '#N/D' && candidate['F1+F2+F3A'] !== '#N/A' && (
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

          {/* Total Provisional (F1+F2+F3) and Place status */}
          {phase.id === 'fase3-prov' && candidate.ranking && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-sm ${
              candidate.ranking <= 149
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg text-white ${
                  candidate.ranking <= 149 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  <Trophy size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {candidate.ranking <= 149 ? 'Estado: Provisionalmente con Plaza' : 'Estado: Apto (Sin Plaza)'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {candidate.ranking <= 149
                      ? 'Se encuentra dentro de las 149 plazas provisionales.'
                      : 'Superado el proceso, en espera de posibles renuncias.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nota F1+F2+F3</span>
                <span className="text-lg font-black text-[#0099cc] tabular-nums">{candidate['F1+F2+F3']}</span>
              </div>
            </div>
          )}

          {phase.id === 'fase3-prov' && !candidate.ranking && candidate['F1+F2+F3'] && candidate['F1+F2+F3'] !== '---' && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 p-4 rounded-xl flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500 text-white">
                  <X size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Estado: No Apto / Eliminado</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">No supera alguna de las subpruebas de la Fase 3.</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nota F1+F2+F3</span>
                <span className="text-lg font-black text-rose-500 tabular-nums">{candidate['F1+F2+F3']}</span>
              </div>
            </div>
          )}

          {/* Phase 1 Details */}
          {hasFase1Data && (
            <div className="border border-slate-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-zinc-900 flex justify-between items-center">
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
            <div className="border border-slate-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-[#0099cc]" />
                  Fase 2: Pruebas Digitales
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
            <div className="border border-slate-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-zinc-900 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={14} className="text-[#0099cc]" />
                  Fase 3: Inglés, Conductual y Clínica
                </span>
                {getF3Score() !== '---' && (
                  <span className="text-xs font-black text-[#0099cc] tabular-nums">
                    Nota F3 (Inglés + Conductual): {getF3Score()}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Nota 3A (Inglés Oral)</span>
                    {renderValue(candidate['INGLÉS ORAL'])}
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Estado Fase 3A (Inglés)</span>
                    <span className="font-bold">
                      {candidate['ESTADO DEFINITIVO FASE 3A'] ?? candidate['ESTADO PROVISIONAL FASE 3A'] ?? '-'}
                    </span>
                  </div>
                  {candidate['PUNTUACIÓN 3 B)'] !== undefined ? (
                    <>
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Puntuación 3B (Conductual)</span>
                        {renderValue(candidate['PUNTUACIÓN 3 B)'])}
                      </div>
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Resultado 3B (Conductual)</span>
                        <span className="font-bold">
                          {candidate['RESULTADO DEFINITIVO 3 B)'] ?? candidate['RESULTADO 3 B)'] ?? '-'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Evaluación Conductual</span>
                      <span className="text-slate-400 dark:text-slate-500 italic">Aún por evaluar</span>
                    </div>
                  )}
                  {candidate['RESULTADO 3 C)'] !== undefined ? (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Resultado 3C (Clínica)</span>
                      <span className="font-bold">
                        {candidate['RESULTADO 3 C)'] || '-'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Evaluación Clínica</span>
                      <span className="text-slate-400 dark:text-slate-500 italic">Aún por evaluar</span>
                    </div>
                  )}
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
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-900 text-center text-[10px] text-slate-400 dark:text-slate-500">
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
