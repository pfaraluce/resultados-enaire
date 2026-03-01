# Buscador Resultados Controladores 2025

Herramienta no oficial diseñada para facilitar la consulta y el análisis del ranking de la convocatoria externa para la selección de Controladores de Tránsito Aéreo de Enaire 2025.

Este proyecto permite la lectura rápida mediante filtros por sede o estado de la candidatura, y provee una pantalla de métricas y estadísticas de asistencia.

## Características

- Búsqueda rápida de candidatos por apellidos o nombre
- Filtros por sede de examen y estado de la candidatura (Apto/No Apto/No Presentado)
- Ordenación por diferentes métricas (Ranking, Conocimientos, Test de inglés...)
- Dashboard con estadísticas y porcentaje de aprobados y presentados

## Tecnologías Utilizadas

Este proyecto es una SPA (Single Page Application) construida con las siguientes herramientas modernas:

- **React 19** + **Vite**
- **TypeScript**
- **Tailwind CSS 4** para diseño e interfaz responsiva
- **Lucide React** para los iconos
- **Motion (framer-motion)** para animaciones de interfaz
- **Recharts** para componentes de datos estadísticos
- **PapaParse** para lectura asíncrona de los datos en formato CSV

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
