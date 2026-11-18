# Guía para agentes

## Propósito del proyecto

Esta aplicación es una calculadora educativa de **ROI y TCO** para proyectos de automatización con IA y n8n. Permite modelar un proceso manual, estimar capacidad liberada, comparar escenarios y distinguir entre valor potencial y ahorro efectivamente capturado.

- Idioma de interfaz y documentación: español rioplatense (`es-AR`)
- Moneda base: USD
- Aplicación orientada a uso web y a generación de un resumen imprimible/PDF
- No es una herramienta financiera certificada ni garantiza ahorros reales

## Skills disponibles

Usar las skills locales ubicadas en `.agents/skills/` antes de abordar tareas compatibles. Priorizar esta secuencia:

1. **Caveman**: `.agents/skills/caveman/SKILL.md`
   - Usar para respuestas breves y técnicas, sin relleno.
   - Mantener toda la precisión, los hechos, errores, comandos y rutas.
   - Aplicar como estilo de comunicación, no como reducción de información crítica.

2. **Ponytail**: `.agents/skills/ponytail/SKILL.md`
   - Usar en todas las tareas de programación.
   - Priorizar el cambio más pequeño que resuelva completamente el problema.
   - Leer los callers, tests y configuración relacionados antes de editar.
   - No agregar abstracciones, dependencias o opciones que no sean necesarias.

3. **Web Design Guidelines**: `.agents/skills/web-design-guidelines/SKILL.md`
   - Usar al crear, modificar o revisar interfaz, accesibilidad, diseño o experiencia de usuario.
   - Consultar la guía vigente indicada por la skill antes de producir hallazgos o cambios visuales.
   - Entregar hallazgos de UI en el formato `archivo:línea` definido por esa skill.

Las demás skills locales también pueden usarse cuando describan directamente la tarea; no reemplazan las tres prioridades anteriores. Ante cambios de UI, aplicar Web Design Guidelines después de Ponytail y presentar una comunicación alineada con Caveman.

## Stack técnico

- React 19
- TypeScript 5.9 en modo estricto
- Vite 7
- Tailwind CSS 4 mediante `@tailwindcss/vite`
- Recharts 3 para visualizaciones
- Lucide React para iconografía
- Vitest 4 para pruebas unitarias
- `vite-plugin-singlefile` para empaquetar la aplicación en un único archivo distribuible

## Comandos

```powershell
npm install
npm run dev
npm run build
npx tsc --noEmit
npx vitest run
npx vitest run src\lib\calculations.test.ts
```

No existe actualmente un script npm `test`; ejecutar Vitest directamente o agregar un script solo si la tarea lo requiere.

## Arquitectura

```text
src/
  App.tsx                  Estado global, persistencia y acciones principales
  main.tsx                 Punto de entrada de React
  index.css                Tailwind, tema, animaciones y estilos de impresión
  components/
    InputPanel.tsx         Formularios de proyecto y supuestos
    ResultsDashboard.tsx   Indicadores, advertencias y gráficos
    Scenarios.tsx          Edición y comparación de escenarios
    Education.tsx          Explicaciones educativas
    Report.tsx             Vista exclusiva para impresión/PDF
    charts.tsx             Gráficos Recharts
    ui.tsx                 Primitivas visuales compartidas
  lib/
    calculations.ts        Modelo financiero determinista
    calculations.test.ts   Casos unitarios del modelo
    types.ts               Tipos de datos y resultados
    presets.ts             Valores iniciales y normalización de entradas
    format.ts              Parseo y formato numérico/es-AR
    storage.ts             Persistencia local y estado por defecto
    warnings.ts            Reglas para advertencias y alertas
  utils/
    cn.ts                   Composición de clases CSS
```

El alias `@` apunta a `src/`. En nuevos imports usar `@/...` para archivos cruzados y rutas relativas solo dentro del mismo módulo cuando resulte más claro.

## Flujo de datos

1. `App` carga `PersistedState` desde `localStorage`.
2. Los campos se mantienen como strings en `NumericForm` para aceptar formatos argentinos e internacionales.
3. `toModelInputs()` convierte los strings en `ModelInputs`.
4. `computeModel()` recibe únicamente valores numéricos normalizados y genera `FinancialResult`.
5. El dashboard, escenarios, informe impreso y educación consumen el mismo resultado calculado.
6. Los cambios se guardan con debounce en `localStorage` mediante `saveState()`.

No distribuir ni duplicar fórmulas financieras dentro de componentes. Toda lógica de cálculo debe permanecer en `src/lib/calculations.ts`.

## Modelo financiero

Las fórmulas principales son:

- Horas manuales mensuales: `casos mensuales * minutos por caso / 60`
- Valor laboral equivalente: `horas manuales * costo horario humano`
- Casos automatizados: `casos mensuales * tasa de automatización`
- Horas liberadas: `horas manuales * tasa de automatización`
- Capacidad liberada: `horas liberadas * costo horario humano`
- TCO mensual: IA + infraestructura + soporte + otros costos recurrentes
- Soporte mensual: `horas de soporte * costo horario de soporte`
- TCO del primer año: `inversión inicial + TCO mensual * 12`
- ROI potencial: `(valor potencial del primer año - TCO del primer año) / TCO del primer año * 100`
- Beneficio realizado: `capacidad liberada * tasa de captura`

Invariantes importantes:

- Automatización y captura son conceptos separados.
- Automatización describe cuánto trabajo puede resolverse sin intervención humana.
- Captura describe qué porción de la capacidad liberada se convierte en beneficio económico comprobable.
- Por defecto, la captura es `0%`; no presentar horas liberadas como ahorro confirmado.
- La inversión inicial no forma parte del TCO mensual.
- Las APIs, licencias y otros recurrentes deben contarse una sola vez.
- Los costos comerciales como `successFee` son contexto comercial y no deben incorporarse al modelo sin eventos reales y una política de atribución explícita.
- Los escenarios heredan soporte, infraestructura, setup y demás contexto del caso base.
- Los resultados financieros deben ser finitos o explícitamente `null`; no permitir `NaN` o `Infinity`.

## Convenciones de código

- Mantener componentes funcionales y TypeScript estricto.
- Usar tipos explícitos en props y resultados públicos.
- Reutilizar las primitivas `Card`, `SectionHeader`, `TextField`, `NumberField`, `PercentSlider`, `Expandable` e `InfoTip` de `src/components/ui.tsx`.
- Usar `cn()` para combinar clases condicionales.
- Mantener texto visible en español `es-AR`.
- Usar valores en USD en cálculos y formato monetario en `src/lib/format.ts`.
- Redondear los cálculos de `computeModel()` de manera estable; no modificar únicamente el formato visual para ocultar inconsistencias.
- No usar `as any` ni desactivar comprobaciones estrictas.
- Evitar efectos secundarios dentro de cálculos puros.
- Mantener accesibles los controles, con etiquetas y estados visibles.
- Conservar el comportamiento responsive y la vista de impresión/PDF.

## Parseo numérico

`parseNumber()` acepta entradas comunes:

- Separador decimal argentino: `12,5`
- Separador decimal inglés: `12.5`
- Miles con separador: `1.200`
- Símbolos de moneda y espacios: `US$ 1.200,50`

Si falta o no puede parsearse un campo, el modelo usa `0` para cálculos normalizados. La completitud separada de `Completeness` evita presentar conclusiones hasta contar con volumen, minutos y costo horario mayores a cero.

## Estado y persistencia

- Clave de almacenamiento: `roi-tco-calculator:v1`
- Versión de estado: `1`
- `loadState()` debe fusionar parciales con valores por defecto y tolerar datos antiguos o malformados.
- `saveState()` usa debounce de 350 ms.
- Importación/exportación usa JSON completo de `PersistedState`.
- Un JSON importado debe validar la forma básica y debe fusionarse con `defaultState()` antes de reemplazar el estado actual.

## Pruebas

Agregar o actualizar pruebas en `src/lib/calculations.test.ts` al modificar el modelo.

Las pruebas deben cubrir al menos:

- Ejemplo `Inmobiliaria Delta`
- Valores cero y costos cero
- Automatización al 0% y 100%
- Captura 0% versus 100%
- ROI negativo
- Payback inexistente
- Punto de equilibrio alcanzable e inaccesible
- Costos únicos sin duplicación
- Escenarios con herencia del contexto base
- Conversión de porcentajes y límites 0–100

Al ajustar fórmulas, actualizar simultáneamente:

- Tipos de `FinancialResult` si cambia la salida
- Pruebas unitarias
- Dashboard
- Informe imprimible
- Descripciones educativas
- Escenarios
- Advertencias derivadas

## Validación mínima antes de entregar cambios

```powershell
npx tsc --noEmit
npx vitest run src\lib\calculations.test.ts
npm run build
```

También verificar en el navegador:

- Estado inicial y ejemplo `Inmobiliaria Delta`
- Modo guiado
- Autosave y restauración
- Importación/exportación JSON
- Cambio responsive desktop/mobile
- Descarga/resumen impreso
- Gráficos con costos cero y con valores negativos
