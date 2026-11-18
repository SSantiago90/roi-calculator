import { Briefcase, Settings2 } from "lucide-react";
import type {
  CommercialContext,
  Completeness,
  NumericForm,
  ProjectInfo,
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
}: {
  project: ProjectInfo;
  onProject: (k: ProjKey, v: string) => void;
  form: NumericForm;
  onField: (k: NumKey, v: string) => void;
  commercial: CommercialContext;
  onCommercial: (k: ComKey, v: string) => void;
  completeness: Completeness;
}) {
  return (
    <div className="space-y-5">
      {/* Section A — Project info */}
      <Card className="p-5 rise-in">
        <SectionHeader
          icon={<IconBubble><Briefcase className="h-4 w-4" /></IconBubble>}
          title="Información del proyecto"
          subtitle="Da contexto al informe. No afecta los cálculos."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Cliente o empresa"
            value={project.clientName}
            onChange={(v) => onProject("clientName", v)}
            placeholder="Inmobiliaria Delta"
          />
          <TextField
            label="Industria"
            value={project.industry}
            onChange={(v) => onProject("industry", v)}
            placeholder="Real Estate"
          />
          <div className="sm:col-span-2">
            <TextField
              label="Proceso a automatizar"
              value={project.process}
              onChange={(v) => onProject("process", v)}
              placeholder="Calificación de leads por WhatsApp y gestión de citas"
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

      {/* Section D — Costs */}
      <Card className="p-5 rise-in">
        <SectionHeader
          step="3"
          title="Costos de implementación y operación"
          subtitle="Inversión inicial y gastos recurrentes."
        />
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
            label="Costo mensual de IA"
            value={form.monthlyAICost}
            onChange={(v) => onField("monthlyAICost", v)}
            unit="US$"
            info="Gasto mensual en modelos/APIs de IA (tokens, suscripciones de modelos)."
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
