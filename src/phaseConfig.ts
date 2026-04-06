// Phase auto-detection based on CSV headers.
// Detection logic: inspect column headers after parse, match keywords.

export interface ColumnDef {
  key: string;
  label: string;
  group?: 'fase1' | 'fase2' | 'fase3' | 'other'; // for grouping in column picker
}

export interface PhaseConfig {
  id: string;
  label: string;            // Full display label, e.g. "Fase 1 - Resultados Provisionales"
  badgeText: string;        // Short badge text, e.g. "Fase 1 - Provisionales"
  scoreColumn: string;      // Column used for ranking, e.g. "TOTAL FASE 1"
  statusColumn: string;     // Column used for APTO/NO APTO status
  columns: ColumnDef[];     // All available columns for this phase
  defaultVisibleColumns: string[];
  sortableColumns: string[];
}

// Known column sets per phase — will be refined as new CSVs arrive.
// Columns that don't exist in the CSV are silently ignored at render time.

const FASE_1_COLUMNS: ColumnDef[] = [
  { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
  { key: 'SEDE DE EXAMEN FASE 1', label: 'Sede F1', group: 'fase1' },
  { key: 'DIA EXAMEN FASE 1', label: 'Día F1', group: 'fase1' },
  { key: 'AULA/SALA FASE 1', label: 'Aula F1', group: 'fase1' },
  { key: 'CONOCIMIENTOS GENERALES', label: 'C. Grales', group: 'fase1' },
  { key: 'CONOCIMIENTOS IDIOMA INGLÉS', label: 'Inglés', group: 'fase1' },
  { key: 'APTITUDES', label: 'Aptitudes', group: 'fase1' },
  { key: 'PERSONALIDAD', label: 'Pers.', group: 'fase1' },
  { key: 'TOTAL FASE 1', label: 'Total F1', group: 'fase1' },
  { key: 'ESTADO DEFINITIVO FASE 1', label: 'Estado F1', group: 'fase1' },
  { key: 'FECHA EXAMEN FASE 2', label: 'Fecha F2', group: 'fase2' },
  { key: 'HORA INICIO FASE 2', label: 'Hora F2', group: 'fase2' },
  { key: 'SEDE FASE 2', label: 'Sede F2', group: 'fase2' },
  { key: 'EDIFICIO FASE 2', label: 'Edificio F2', group: 'fase2' },
  { key: 'AULA FASE 2', label: 'Aula F2', group: 'fase2' },
  { key: 'ESTADO PROVISIONAL FASE 2', label: 'Estado', group: 'fase2' },
  { key: 'ESTADO DEFINITIVO FASE 2', label: 'Estado', group: 'fase2' },
  { key: 'TOTAL FASE 2', label: 'Total F2', group: 'fase2' },
  { key: 'F1+F2', label: 'Total', group: 'other' },
  { key: 'FECHA FASE 3', label: 'Fecha F3', group: 'fase3' },
  { key: 'HORA FASE 3A', label: 'Hora F3A', group: 'fase3' },
];

// Helper: check if any header contains a keyword (case-insensitive)
function hasKeyword(upperHeaders: string[], keyword: string): boolean {
  return upperHeaders.some(h => h.includes(keyword));
}

// Helper: filter phase columns to only those present in the CSV
function filterByHeaders(phase: PhaseConfig, headers: string[]): PhaseConfig {
  const filteredColumns = phase.columns.filter(
    col => col.key === 'APELLIDOS Y NOMBRE' || headers.some(h => h.trim() === col.key)
  );
  return {
    ...phase,
    columns: filteredColumns,
    defaultVisibleColumns: phase.defaultVisibleColumns.filter(
      key => key === 'APELLIDOS Y NOMBRE' || headers.some(h => h.trim() === key)
    ),
  };
}

/**
 * Detect the current phase from CSV column headers.
 * Sequential logic (highest phase first):
 *   0. "FASE 1" + "FASE 2" + "PROVISIONAL" → Fase 1+2 Provisionales (suma F1+F2)
 *   1. "FASE 3" → check "PROVISIONAL" → Fase 3 Prov / Fase 3 Def
 *   2. "ORAL"   → Fase 3 Prueba A
 *   3. "FASE 2" → check "PROVISIONAL" → Fase 2 Prov / Fase 2 Def
 *   4. "FASE 1" → check "PROVISIONAL" / "DEFINITIVO" → Fase 1 Prov / Fase 1 Def
 *   5. Fallback → show all columns as-is
 */
export function detectPhase(headers: string[]): PhaseConfig {
  const upperHeaders = headers.map(h => h.toUpperCase().trim());
  const isProvisional = hasKeyword(upperHeaders, 'PROVISIONAL');
  const hasFase1 = hasKeyword(upperHeaders, 'FASE 1');
  const hasFase2 = hasKeyword(upperHeaders, 'FASE 2');

  // 0. FASE 1 + FASE 2 (Provisional or Definitivo)
  if (hasFase1 && hasFase2) {
    const isActuallyDefinitive = !isProvisional || upperHeaders.includes('ESTADO DEFINITIVO FASE 2');
    const statusCol = upperHeaders.includes('ESTADO DEFINITIVO FASE 2') 
      ? 'ESTADO DEFINITIVO FASE 2' 
      : 'ESTADO PROVISIONAL FASE 2';

    return filterByHeaders({
      id: isActuallyDefinitive ? 'fase1y2-def' : 'fase1y2-prov',
      label: isActuallyDefinitive ? 'Fase 2 - Resultados Definitivos' : 'Fase 2 - Resultados Provisionales',
      badgeText: isActuallyDefinitive ? 'Fase 2 - Definitivos' : 'Fase 2 - Provisionales',
      scoreColumn: 'F1+F2',
      statusColumn: statusCol,
      columns: FASE_1_COLUMNS,
      defaultVisibleColumns: [
        'APELLIDOS Y NOMBRE',
        'F1+F2',
        statusCol,
        'TOTAL FASE 1',
        'TOTAL FASE 2',
        'FECHA FASE 3',
        'HORA FASE 3A',
      ],
      sortableColumns: ['TOTAL FASE 1', 'TOTAL FASE 2', 'F1+F2', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
    }, headers);
  }

  // 1. FASE 3 — only when TOTAL FASE 3 is present (not just phase-3 schedule columns like FECHA FASE 3)
  if (upperHeaders.some(h => h === 'TOTAL FASE 3')) {
    if (isProvisional) {
      return filterByHeaders({
        id: 'fase3-prov',
        label: 'Fase 3 - Resultados Provisionales',
        badgeText: 'Fase 3 - Provisionales',
        scoreColumn: 'TOTAL FASE 3',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
          { key: 'TOTAL FASE 3', label: 'Total F3', group: 'other' },
          { key: 'ESTADO PROVISIONAL', label: 'Estado', group: 'other' },
        ],
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 3', 'ESTADO PROVISIONAL'],
        sortableColumns: ['TOTAL FASE 3'],
      }, headers);
    } else {
      return filterByHeaders({
        id: 'fase3-def',
        label: 'Fase 3 - Resultados Definitivos',
        badgeText: 'Fase 3 - Definitivos',
        scoreColumn: 'TOTAL FASE 3',
        statusColumn: '',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
          { key: 'TOTAL FASE 3', label: 'Total F3', group: 'other' },
        ],
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 3'],
        sortableColumns: ['TOTAL FASE 3'],
      }, headers);
    }
  }

  // 2. ORAL (Fase 3 - Prueba A, evaluación oral de inglés)
  if (hasKeyword(upperHeaders, 'ORAL')) {
    return filterByHeaders({
      id: 'fase3-ingles',
      label: 'Fase 3 - Evaluación Oral de Inglés',
      badgeText: 'Fase 3 - Evaluación Oral',
      scoreColumn: '',
      statusColumn: 'ESTADO PROVISIONAL',
      columns: [
        { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
        { key: 'ESTADO PROVISIONAL', label: 'Estado', group: 'other' },
      ],
      defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'ESTADO PROVISIONAL'],
      sortableColumns: [],
    }, headers);
  }

  // 3. FASE 2 (sola, sin FASE 1)
  if (hasFase2 && !hasFase1) {
    if (isProvisional) {
      return filterByHeaders({
        id: 'fase2-prov',
        label: 'Fase 2 - Resultados Provisionales',
        badgeText: 'Fase 2 - Provisionales',
        scoreColumn: 'TOTAL FASE 2',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
          { key: 'TOTAL FASE 2', label: 'Total F2', group: 'fase2' },
          { key: 'ESTADO PROVISIONAL', label: 'Estado', group: 'other' },
        ],
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 2', 'ESTADO PROVISIONAL'],
        sortableColumns: ['TOTAL FASE 2'],
      }, headers);
    } else {
      return filterByHeaders({
        id: 'fase2-def',
        label: 'Fase 2 - Resultados Definitivos',
        badgeText: 'Fase 2 - Definitivos',
        scoreColumn: 'TOTAL FASE 2',
        statusColumn: '',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre', group: 'other' },
          { key: 'TOTAL FASE 2', label: 'Total F2', group: 'fase2' },
        ],
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 2'],
        sortableColumns: ['TOTAL FASE 2'],
      }, headers);
    }
  }

  // 4. FASE 1 sola
  if (hasFase1) {
    // Definitivos: tiene ESTADO DEFINITIVO (sin PROVISIONAL)
    if (!isProvisional || hasKeyword(upperHeaders, 'DEFINITIVO')) {
      return filterByHeaders({
        id: 'fase1-def',
        label: 'Fase 1 - Resultados Definitivos',
        badgeText: 'Fase 1 - Definitivos',
        scoreColumn: 'TOTAL FASE 1',
        statusColumn: 'ESTADO DEFINITIVO FASE 1',
        columns: FASE_1_COLUMNS,
        defaultVisibleColumns: [
          'APELLIDOS Y NOMBRE',
          'TOTAL FASE 1',
          'ESTADO DEFINITIVO FASE 1',
          'FECHA EXAMEN FASE 2',
          'HORA INICIO FASE 2',
          'SEDE FASE 2',
          'EDIFICIO FASE 2',
          'AULA FASE 2',
        ],
        sortableColumns: ['TOTAL FASE 1', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
      }, headers);
    } else {
      // Provisionales
      return filterByHeaders({
        id: 'fase1-prov',
        label: 'Fase 1 - Resultados Provisionales',
        badgeText: 'Fase 1 - Provisionales',
        scoreColumn: 'TOTAL FASE 1',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: FASE_1_COLUMNS,
        defaultVisibleColumns: [
          'APELLIDOS Y NOMBRE',
          'TOTAL FASE 1',
          'ESTADO PROVISIONAL',
          'CONOCIMIENTOS GENERALES',
          'CONOCIMIENTOS IDIOMA INGLÉS',
          'APTITUDES',
        ],
        sortableColumns: ['TOTAL FASE 1', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
      }, headers);
    }
  }

  // 5. Fallback: unknown phase, show all columns
  const fallbackColumns = headers
    .filter(h => h.trim())
    .map(h => ({ key: h.trim(), label: h.trim(), group: 'other' as const }));

  return {
    id: 'unknown',
    label: 'Resultados',
    badgeText: 'Resultados',
    scoreColumn: '',
    statusColumn: '',
    columns: fallbackColumns,
    defaultVisibleColumns: fallbackColumns.map(c => c.key),
    sortableColumns: [],
  };
}
