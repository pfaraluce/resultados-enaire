// Phase auto-detection based on CSV headers.
// Detection logic: inspect column headers after parse, match keywords.

export interface ColumnDef {
  key: string;
  label: string;
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

const FASE_1_DEF_COLUMNS: ColumnDef[] = [
  { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
  { key: 'SEDE DE EXAMEN', label: 'Sede' },
  { key: 'TOTAL FASE 1', label: 'Total F1' },
  { key: 'DIA EXAMEN', label: 'Día' },
  { key: 'AULA/SALA', label: 'Aula' },
  { key: 'CONOCIMIENTOS GENERALES', label: 'C. Grales' },
  { key: 'CONOCIMIENTOS IDIOMA INGLÉS', label: 'Inglés' },
  { key: 'APTITUDES', label: 'Aptitudes' },
  { key: 'PERSONALIDAD', label: 'Pers.' },
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
 *   1. "FASE 3" → check "PROVISIONAL" → Fase 3 Prov / Fase 3 Def
 *   2. "ORAL"   → Fase 3 Prueba A
 *   3. "FASE 2" → check "PROVISIONAL" → Fase 2 Prov / Fase 2 Def
 *   4. "FASE 1" → check "PROVISIONAL" → Fase 1 Prov / Fase 1 Def
 *   5. Fallback → show all columns as-is
 */
export function detectPhase(headers: string[]): PhaseConfig {
  const upperHeaders = headers.map(h => h.toUpperCase().trim());
  const isProvisional = hasKeyword(upperHeaders, 'PROVISIONAL');

  // 1. FASE 3
  if (hasKeyword(upperHeaders, 'FASE 3')) {
    if (isProvisional) {
      return filterByHeaders({
        id: 'fase3-prov',
        label: 'Fase 3 - Resultados Provisionales',
        badgeText: 'Fase 3 - Provisionales',
        scoreColumn: 'TOTAL FASE 3',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
          { key: 'TOTAL FASE 3', label: 'Total F3' },
          { key: 'ESTADO PROVISIONAL', label: 'Estado' },
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
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
          { key: 'TOTAL FASE 3', label: 'Total F3' },
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
        { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
        { key: 'ESTADO PROVISIONAL', label: 'Estado' },
      ],
      defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'ESTADO PROVISIONAL'],
      sortableColumns: [],
    }, headers);
  }

  // 3. FASE 2
  if (hasKeyword(upperHeaders, 'FASE 2')) {
    if (isProvisional) {
      return filterByHeaders({
        id: 'fase2-prov',
        label: 'Fase 2 - Resultados Provisionales',
        badgeText: 'Fase 2 - Provisionales',
        scoreColumn: 'TOTAL FASE 2',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: [
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
          { key: 'TOTAL FASE 2', label: 'Total F2' },
          { key: 'ESTADO PROVISIONAL', label: 'Estado' },
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
          { key: 'APELLIDOS Y NOMBRE', label: 'Nombre' },
          { key: 'TOTAL FASE 2', label: 'Total F2' },
        ],
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 2'],
        sortableColumns: ['TOTAL FASE 2'],
      }, headers);
    }
  }

  // 4. FASE 1
  if (hasKeyword(upperHeaders, 'FASE 1')) {
    if (isProvisional) {
      return filterByHeaders({
        id: 'fase1-prov',
        label: 'Fase 1 - Resultados Provisionales',
        badgeText: 'Fase 1 - Provisionales',
        scoreColumn: 'TOTAL FASE 1',
        statusColumn: 'ESTADO PROVISIONAL',
        columns: FASE_1_COLUMNS,
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 1', 'ESTADO PROVISIONAL', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
        sortableColumns: ['TOTAL FASE 1', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
      }, headers);
    } else {
      return filterByHeaders({
        id: 'fase1-def',
        label: 'Fase 1 - Resultados Definitivos',
        badgeText: 'Fase 1 - Definitivos',
        scoreColumn: 'TOTAL FASE 1',
        statusColumn: '',
        columns: FASE_1_DEF_COLUMNS,
        defaultVisibleColumns: ['APELLIDOS Y NOMBRE', 'TOTAL FASE 1', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
        sortableColumns: ['TOTAL FASE 1', 'CONOCIMIENTOS GENERALES', 'CONOCIMIENTOS IDIOMA INGLÉS', 'APTITUDES'],
      }, headers);
    }
  }

  // 5. Fallback: unknown phase, show all columns
  const fallbackColumns = headers
    .filter(h => h.trim())
    .map(h => ({ key: h.trim(), label: h.trim() }));

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
