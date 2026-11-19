import { Briefcase, CalendarRange, Settings2 } from "lucide-react";
import type {
  CommercialContext,
  Completeness,
  NumericForm,
  ProjectInfo,
  SimulationConfig,
} from "@/lib/types";
import { Card, Expandable, NumberField, PercentSlider, SectionHeader, TextField } from "./ui";

type NumKey = keyof NumericForm;
type ProjKey = keyof ProjectInfo;
type ComKey = keyof CommercialContext;

export function InputPanel({
  project,
  onProject,
  form,
  onField,
  commercial,
  onCommercial,
  completeness,
  simulation,
  onSimulation,
}: {
  project: ProjectInfo;
  onProject: (k: ProjKey, v: string) => void;
  form: NumericForm;
  onField: (k: NumKey, v: string) => void;
  commercial: CommercialContext;
  onCommercial: (k: ComKey, v: string) => void;
  completeness: Completeness;
  simulation: SimulationConfig;
  onSimulation: (next: Partial<SimulationConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Section A — Project info */}
      <Card className="p-5 rise-in">
        <SectionHeader
          icon={<IconBubble><Briefcase className="h-4 w-4" aria-hidden="true" /></IconBubble>}
          title="Información del proyecto"
          subtitle="Da contexto al informe. No afecta los cálculos."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Cliente o empresa"
            value={project.clientName}
            onChange={(v) => onProject("clientName", v)}
            placeholder="Ej.: Inmobiliaria Delta…"
          />
          <TextField
            label="Industria"
            value={project.industry}
            onChange={(v) => onProject("industry", v)}
            placeholder="Ej.: Real Estate…"
          />
          <div className="sm:col-span-2">
            <TextField
              label="Proceso a automatizar"
              value={project.process}
              onChange={(v) => onProject("process", v)}
              placeholder="Ej.: calificación de leads y gestión de citas…"
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              label="Descripción de la oportunidad"
              textarea
              value={project.description}
              onChange={(v) => onProject("description", v)}
              placeholder="Breve descripción de qué resuelve la automatización…"
            />
          </div>
        </div>
      </Card>

      {/* Section B — Current manual process */}
      <Card className="p-5 rise-in">
        <SectionHeader
          step="1"
          title="Proceso manual actual"
          subtitle="Cuánto cuesta hoy hacerlo a mano."
        />
        {!completeness.allRequired && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Completá volumen mensual, minutos por caso y costo horario para ver
            conclusiones financieras válidas.
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Volumen mensual de casos"
            value={form.monthlyVolume}
            onChange={(v) => onField("monthlyVolume", v)}
            unit="#"
            required
            info="Cantidad de casos, tareas o solicitudes que el proceso maneja por mes."
            guided="Contá cuántas veces se repite el proceso por mes. Ej.: 1200 leads."
          />
          <NumberField
            label="Minutos por caso"
            value={form.minutesPerCase}
            onChange={(v) => onField("minutesPerCase", v)}
            unit="min"
            required
            info="Tiempo promedio que una persona dedica a cada caso."
            guided="Estimá el tiempo humano promedio por caso, en minutos."
          />
          <NumberField
            label="Costo horario humano"
            value={form.hourlyHumanCost}
            onChange={(v) => onField("hourlyHumanCost", v)}
            unit="US$"
            required
            info="Valor de la hora de la persona que hoy hace el trabajo (carga incluida)."
            guided="Usá un valor razonable de hora humana en USD para el rol."
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          El costo laboral equivalente representa el valor del tiempo que hoy se
          dedica al proceso. <strong>No</strong> implica que la empresa vaya a
          ahorrar automáticamente ese dinero.
        </p>
      </Card>

      {/* Section C — Automation */}
      <Card className="p-5 rise-in">
        <SectionHeader
          step="2"
          title="Automatización propuesta"
          subtitle="Qué porción del trabajo resolverá la IA."
        />
        <div className="mt-4 space-y-5">
          <PercentSlider
            label="Porcentaje estimado de automatización"
            value={form.automationRate}
            onChange={(v) => onField("automationRate", v)}
            info="Porcentaje de casos que la solución resolvería sin intervención humana."
            guided="Supuesto educativo: cada caso automatizado elimina su tiempo manual; los no automatizados conservan su tiempo original."
          />
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <PercentSlider
              label="% de valor económico efectivamente capturado"
              value={form.captureRate}
              onChange={(v) => onField("captureRate", v)}
              accent="emerald"
              info="Porción de la capacidad liberada que realmente se convierte en ahorro o ingreso. Por defecto 0% (sin ahorro confirmado)."
              guided="Dejalo en 0% salvo que puedas justificar ahorro real (ej.: horas efectivamente eliminadas de nómina). Evita presentar capacidad como ganancia garantizada."
            />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Las horas liberadas pueden transformarse en mayor capacidad, mejor
          atención o reducción de tiempos. Solo son ahorro directo si se eliminan
          costos reales.
        </p>
      </Card>

      <Card className="p-5 rise-in">
        <SectionHeader
          icon={<IconBubble><CalendarRange className="h-4 w-4" aria-hidden="true" /></IconBubble>}
          title="Implementación progresiva"
          subtitle="Modelá el ramp-up durante los primeros 12 meses."
        />
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <input
            type="checkbox"
            checked={simulation.progressiveEnabled}
            onChange={(event) => onSimulation({ progressiveEnabled: event.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span><span className="block text-sm font-semibold text-slate-900">Usar porcentajes mensuales</span><span className="mt-0.5 block text-xs text-slate-500">Desactivado: los 12 meses usan el porcentaje fijo principal.</span></span>
        </label>
        {simulation.progressiveEnabled && (
          <div className="mt-4">
            {simulation.automationSchedule.some((value) => value.trim() === "") && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Faltan porcentajes mensuales. Completalos para evitar una proyección anual incompleta.</p>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {simulation.automationSchedule.map((value, index) => (
                <label key={index} className="block rounded-xl border border-slate-200 bg-slate-50/60 p-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mes {index + 1}</span>
                  <span className="relative mt-1 block">
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      name={`automation-month-${index + 1}`}
                      value={value}
                      onChange={(event) => {
                        const schedule = [...simulation.automationSchedule];
                        schedule[index] = event.target.value.replace(/[^0-9.,]/g, "");
                        onSimulation({ automationSchedule: schedule });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-2 pr-6 text-right font-mono text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Supuestos editables, no resultados garantizados. El TCO operativo se aplica en cada mes, incluso durante el piloto.</p>
          </div>
        )}
      </Card>

      {/* Section D — Costs */}
      <Card className="p-5 rise-in">
        <SectionHeader
          step="3"
          title="Costos de implementación y operación"
          subtitle="Inversión inicial y gastos recurrentes."
        />
        <p className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs leading-relaxed text-slate-600"><strong className="text-slate-900">Perspectiva del cliente:</strong> cargá precios y costos que paga la empresa evaluada. No mezcles costos internos, ingresos o margen del proveedor.</p>
        <fieldset className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-700">Modelo de costo de IA</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="ai-cost-model" checked={simulation.aiCostModel === "fixed"} onChange={() => onSimulation({ aiCostModel: "fixed" })} />Costo mensual fijo</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="radio" name="ai-cost-model" checked={simulation.aiCostModel === "variable"} onChange={() => onSimulation({ aiCostModel: "variable" })} />Fijo + variable por caso</label>
          </div>
          {simulation.aiCostModel === "variable" && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <NumberField label="Costo variable por caso procesado" value={simulation.variableAICostPerCase} onChange={(value) => onSimulation({ variableAICostPerCase: value })} unit="US$" info="Se cobra por cada caso que la IA procesa, aunque termine derivado a una persona." />
            <PercentSlider label="Casos procesados por IA" value={simulation.aiProcessedRate} onChange={(value) => onSimulation({ aiProcessedRate: value })} info="Porción del volumen que consume IA. No equivale al porcentaje resuelto automáticamente." />
          </div>}
          {simulation.aiCostModel === "variable" && (simulation.variableAICostPerCase.trim() === "" || simulation.aiProcessedRate.trim() === "") && <p className="mt-3 text-xs text-red-600">Completá costo por caso y porcentaje procesado. Un campo vacío no representa 0.</p>}
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Costo inicial de implementación"
            value={form.setupCost}
            onChange={(v) => onField("setupCost", v)}
            unit="US$"
            info="Inversión única de puesta en marcha (desarrollo, integración, configuración)."
            guided="Se paga una sola vez. Impacta el ROI anual pero no el TCO mensual operativo."
          />
          <NumberField
            label={simulation.aiCostModel === "fixed" ? "Costo mensual de IA" : "Costo fijo mensual de IA"}
            value={form.monthlyAICost}
            onChange={(v) => onField("monthlyAICost", v)}
            unit="US$"
            info={simulation.aiCostModel === "fixed" ? "Estimación mensual total de IA." : "Componente fijo mensual; el costo variable se suma por caso procesado."}
            guided="Ej.: consumo mensual de LLMs o licencias de IA."
          />
          <NumberField
            label="Costo mensual de infraestructura"
            value={form.monthlyInfrastructureCost}
            onChange={(v) => onField("monthlyInfrastructureCost", v)}
            unit="US$"
            info="Hosting, servidores, plataforma de automatización (ej.: n8n)."
            guided="Servidores o plataformas que corren todos los meses."
          />
          <NumberField
            label="Horas de soporte mensuales"
            value={form.supportHours}
            onChange={(v) => onField("supportHours", v)}
            unit="h"
            info="Horas de mantenimiento/soporte estimadas por mes."
            guided="Mantenimiento, monitoreo y ajustes mensuales."
          />
          <NumberField
            label="Costo horario de soporte"
            value={form.supportHourlyRate}
            onChange={(v) => onField("supportHourlyRate", v)}
            unit="US$"
            info="Valor de la hora técnica de soporte."
            guided="Multiplicado por las horas de soporte da el costo mensual de soporte."
          />
        </div>

        <div className="mt-4">
          <Expandable title="Costos avanzados (opcional)">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="APIs de terceros (mensual)"
                value={form.thirdPartyApiCost}
                onChange={(v) => onField("thirdPartyApiCost", v)}
                unit="US$"
              />
              <NumberField
                label="Licencias de software (mensual)"
                value={form.softwareLicenseCost}
                onChange={(v) => onField("softwareLicenseCost", v)}
                unit="US$"
              />
              <NumberField
                label="Otros gastos recurrentes (mensual)"
                value={form.otherRecurringCosts}
                onChange={(v) => onField("otherRecurringCosts", v)}
                unit="US$"
              />
              <NumberField
                label="Gastos únicos adicionales"
                value={form.additionalOneTimeCosts}
                onChange={(v) => onField("additionalOneTimeCosts", v)}
                unit="US$"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Cada costo se cuenta una única vez, en su categoría correspondiente
              (única o recurrente), para no duplicar montos.
            </p>
          </Expandable>
        </div>
      </Card>

      {/* Commercial context — contextual only */}
      <Card className="p-5 rise-in">
        <Expandable title="Datos para la propuesta comercial (contexto)">
          <p className="-mt-1 mb-3 flex items-center gap-1.5 text-xs text-amber-700">
            <Settings2 className="h-3.5 w-3.5" /> Solo contextual: estos datos no
            se usan en las fórmulas financieras.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Stakeholders"
              value={commercial.stakeholders}
              onChange={(v) => onCommercial("stakeholders", v)}
              placeholder="CFO, COO, CTO/CISO"
            />
            <TextField
              label="Herramientas actuales"
              value={commercial.tools}
              onChange={(v) => onCommercial("tools", v)}
              placeholder="WhatsApp, CRM, Google Calendar"
            />
            <TextField
              label="KPI de éxito"
              value={commercial.kpi}
              onChange={(v) => onCommercial("kpi", v)}
              placeholder="Cita calificada asistida por IA"
            />
            <NumberField
              label="Success fee por evento"
              value={commercial.successFee}
              onChange={(v) => onCommercial("successFee", v)}
              unit="US$"
              compact
              info="Cargo comercial opcional. No se incorpora al ROI porque la cantidad de eventos facturables es desconocida."
            />
            <NumberField
              label="Ventana de atribución"
              value={commercial.attributionWindowDays}
              onChange={(v) => onCommercial("attributionWindowDays", v)}
              unit="días"
              compact
            />
            <div className="sm:col-span-2">
              <TextField
                label="Notas adicionales"
                textarea
                value={commercial.notes}
                onChange={(v) => onCommercial("notes", v)}
              />
            </div>
          </div>
        </Expandable>
      </Card>

    </div>
  );
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
      {children}
    </span>
  );
}
