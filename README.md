# Buscador Resultados Controladores 2025

Herramienta no oficial diseñada para facilitar la consulta y el análisis del ranking de la convocatoria externa para la selección de Controladores de Tránsito Aéreo de Enaire 2025.

Este proyecto permite la lectura rápida mediante filtros por sede o estado de la candidatura, y provee una pantalla de métricas y estadísticas de asistencia.

## Características principales

- **Buscador Inteligente**: Localización instantánea de candidatos mediante búsqueda por nombre o apellidos. Admite atajo de teclado (`Ctrl + F` o `Cmd + F`) para enfocar el cuadro de búsqueda rápidamente.
- **Filtros y Columnas Personalizables**:
  - Filtrado por sedes de examen oficiales y estado de la candidatura (Apto, No Apto, No Presentado).
  - Selector dinámico de columnas para adaptar la tabla de resultados a las métricas de interés.
- **Ordenación Multimétrica**: Clasificación interactiva del listado por orden de mérito/ranking, notas globales de cada fase, o resultados individuales de pruebas específicas (Conocimientos, Inglés, Aptitudes, Personalidad).
- **Dashboard de Estadísticas**:
  - Análisis de rendimiento y asistencia distribuido por sedes de examen.
  - Funnel interactivo del proceso selectivo global (vista resumen y diagrama de flujo Sankey).
  - Métricas avanzadas como la frecuencia de aprobados por jornada o la variación/movimiento en el ranking oficial tras las diferentes fases.
- **Consulta de Aulas**: Panel específico para localizar la asignación de edificios, aulas e información de citación de cada candidato para el desarrollo de las pruebas presenciales.
- **Expediente Detallado del Candidato**: Ficha individual en formato modal que consolida el progreso completo del aspirante a lo largo de las distintas fases del proceso selectivo.
- **Exportación a PDF**: Botón de descarga directa que genera un documento de expediente en formato A4 optimizado. Sigue la identidad visual corporativa en tema claro y recopila de manera ordenada las calificaciones y logística del candidato.

## Tecnologías Utilizadas

Este proyecto es una SPA (Single Page Application) construida con las siguientes herramientas modernas:

- **React 19** + **Vite**
- **TypeScript**
- **Tailwind CSS 4** para diseño e interfaz responsiva
- **Lucide React** para los iconos
- **Motion (framer-motion)** para animaciones de interfaz
- **Recharts** para componentes de datos estadísticos
- **PapaParse** para lectura asíncrona de los datos en formato CSV
- **jsPDF** para la generación dinámica del PDF de la ficha del candidato

## Instalación y Desarrollo Local

**Requisitos previos:** Node.js (v18+)

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Arranca el entorno de desarrollo local:
   ```bash
   npm run dev
   ```

El servidor local arranca en `http://localhost:3000`.

## Scripts Útiles

* `npm run dev` - Arranca el entorno local.
* `npm run build` - Transpila (TypeScript a JavaScript) y minifica el código a la carpeta `dist`, listo para producción.
* `npm run preview` - Previsualización del servidor de producción local.
* `npm run lint` - Chequeo estático de TypeScript (sin emisión).

## Origen de los datos

Este proyecto lee un documento CSV con los resultados originales expuestos públicamente. La aplicación no tiene vinculación oficial con Enaire ni modifica los resultados presentados. Para información oficial vinculante y posibles reclamaciones, consulte siempre la Sede Electrónica de Enaire.
