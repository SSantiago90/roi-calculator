import type { FinancialResult, ModelInputs, ProjectInfo } from "@/lib/types";
import { evaluateScenario } from "@/lib/calculations";
import type { ScenarioConfig } from "@/lib/types";
import { money, number, payback, percent, percentValue } from "@/lib/format";

export function Report({
  project,
  inputs,
  r,
  scenarios,
}: {
  project: ProjectInfo;
  inputs: ModelInputs;
  r: FinancialResult;
  scenarios: ScenarioConfig[];
}) {
  const sResults = scenarios.map((s) => ({ cfg: s, res: evaluateScenario(inputs, s) }));
  const today = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-page mx-auto max-w-3xl bg-white p-8 font-sans text-slate-800">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-700">
          Resumen financiero · Herramienta educativa
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Evaluación ROI &amp; TCO — {project.clientName || "Proyecto sin nombre"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {project.industry && `${project.industry} · `}
          {project.process || "Automatización con IA"} · Generado el {today}
        </p>
      </div>

      {/* Supuestos */}
      <Section title="Supuestos de entrada">
        <Grid>
          <Item k="Volumen mensual" v={number(inputs.monthlyVolume, 0)} />
          <Item k="Minutos por caso" v={`${number(inputs.minutesPerCase, 0)} min`} />
          <Item k="Costo horario humano" v={money(inputs.hourlyHumanCost)} />
          <Item k="% automatización" v={percent(inputs.automationRate)} />
          <Item k="% valor capturado" v={percent(inputs.captureRate)} />
          <Item k="Costo inicial (setup)" v={money(inputs.setupCost)} />
          <Item k="Costo mensual IA" v={money(inputs.monthlyAICost)} />
          <Item k="Modelo de costo IA" v={inputs.aiCostModel === "fixed" ? "Fijo mensual" : "Fijo + variable por caso"} />
          <Item k="Gasto IA calculado" v={money(r.monthlyAIExpense)} />
          <Item k="Infraestructura mensual" v={money(inputs.monthlyInfrastructureCost)} />
          <Item k="Soporte mensual" v={money(r.monthlySupportCost)} />
          <Item k="Otros recurrentes" v={money(r.otherRecurringCosts)} />
        </Grid>
      </Section>

      {/* Proceso actual */}
      <Section title="Proceso manual actual">
        <Grid>
          <Item k="Horas manuales / mes" v={`${number(r.monthlyManualHours, 0)} h`} />
          <Item k="Costo laboral equivalente" v={money(r.manualLaborValue)} />
        </Grid>
        <Note>
          Este valor representa el costo equivalente del tiempo dedicado al proceso. No se
          interpreta automáticamente como ahorro.
        </Note>
      </Section>

      {/* Automatización */}
      <Section title="Estimación de automatización">
        <Grid>
          <Item k="Modo anual" v={r.deploymentMode === "progressive" ? "Implementación progresiva" : "Automatización fija"} />
          <Item k="Automatización media 12 m" v={percent(r.averageFirstYearAutomationRate)} />
          <Item k="Casos automatizados" v={number(r.automatedCases, 0)} />
          <Item k="Horas liberadas / mes" v={`${number(r.releasedHours, 0)} h`} />
          <Item k="Horas manuales restantes" v={`${number(r.remainingManualHours, 0)} h`} />
          <Item k="Capacidad económica liberada" v={money(r.releasedCapacityValue)} />
        </Grid>
      </Section>

      {/* Costos */}
      <Section title="Costos">
        <Grid>
          <Item k="TCO mensual operativo" v={money(r.monthlyTCO)} />
          <Item k="Inversión inicial total" v={money(r.totalInitialInvestment)} />
          <Item k="TCO del primer año" v={money(r.firstYearTCO)} />
          <Item k="Costo por caso automatizado" v={r.costPerAutomatedCase != null ? money(r.costPerAutomatedCase) : "—"} />
        </Grid>
      </Section>

      {/* Resultados */}
      <Section title="Resultados financieros">
        <Grid>
          <Item k="ROI potencial 12 meses" v={percentValue(r.firstYearPotentialROI)} strong />
          <Item k="Valor neto potencial (1er año)" v={money(r.firstYearPotentialNetValue)} />
          <Item k="Recuperación estimada" v={payback(r.potentialPaybackMonths)} />
          <Item k="Recuperación realizada" v={r.captureConfigured ? payback(r.realizedPaybackMonths) : "Sin captura configurada"} />
          <Item
            k="Punto de equilibrio operativo"
            v={r.breakEvenRate == null ? "—" : r.breakEvenReachable ? percent(r.breakEvenRate) : "> 100% (no alcanzable)"}
          />
          <Item
            k="ROI realizado 12 meses"
            v={r.captureConfigured ? percentValue(r.realizedFirstYearROI) : "Sin ahorro realizado confirmado"}
          />
        </Grid>
      </Section>

      {/* Escenarios */}
      <Section title="Comparación de escenarios">
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="py-1.5 pr-2 font-medium text-slate-500">Métrica</th>
              {sResults.map(({ cfg }) => (
                <th key={cfg.id} className="py-1.5 px-2 text-right font-medium text-slate-600">
                  {cfg.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TRow k="Capacidad liberada" cells={sResults.map(({ res }) => money(res.releasedCapacityValue))} />
            <TRow k="Gasto IA mensual" cells={sResults.map(({ res }) => money(res.monthlyAIExpense))} />
            <TRow k="TCO mensual" cells={sResults.map(({ res }) => money(res.monthlyTCO))} />
            <TRow k="TCO 1er año" cells={sResults.map(({ res }) => money(res.firstYearTCO))} />
            <TRow k="ROI potencial 12 m" cells={sResults.map(({ res }) => percentValue(res.firstYearPotentialROI))} />
            <TRow k="Recuperación" cells={sResults.map(({ res }) => payback(res.potentialPaybackMonths))} />
            {r.captureConfigured && <TRow k="ROI realizado 12 m" cells={sResults.map(({ res }) => percentValue(res.realizedFirstYearROI))} />}
          </tbody>
        </table>
      </Section>

      {/* Nota final */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <strong className="text-slate-800">Potencial vs. realizado.</strong> El ROI potencial
        valora toda la capacidad operativa liberada. El ROI realizado considera solo el valor que
        se puede justificar como efectivamente capturado (actualmente{" "}
        {percent(inputs.captureRate)}). Liberar horas no equivale automáticamente a ahorrar dinero:
        depende de adopción, precisión real y decisiones operativas. Este documento es un soporte
        financiero educativo, no una propuesta comercial terminada.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-slate-900">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">{children}</div>;
}

function Item({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dotted border-slate-200 py-1">
      <span className="text-xs text-slate-500">{k}</span>
      <span className={`font-mono text-xs tabular-nums ${strong ? "font-bold text-slate-900" : "text-slate-700"}`}>
        {v}
      </span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[11px] italic text-slate-500">{children}</p>;
}

function TRow({ k, cells }: { k: string; cells: string[] }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 pr-2 text-slate-500">{k}</td>
      {cells.map((c, i) => (
        <td key={i} className="py-1.5 px-2 text-right font-mono tabular-nums text-slate-800">
          {c}
        </td>
      ))}
    </tr>
  );
}
