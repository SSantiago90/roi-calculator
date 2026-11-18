import { BarChart3 } from "lucide-react";
import type { Completeness, FinancialResult, ModelInputs, ScenarioConfig } from "@/lib/types";
import { money, number } from "@/lib/format";
import { Card, SectionHeader } from "./ui";
import { CostBreakdownChart, FirstYearChart, ProcessChart, ScenarioComparisonChart } from "./charts";

export function Analytics({ r, inputs, scenarios, completeness }: { r: FinancialResult; inputs: ModelInputs; scenarios: ScenarioConfig[]; completeness: Completeness }) {
  return (
    <section aria-labelledby="analytics-title">
      <div className="mb-6 flex items-start justify-between gap-4">
        <SectionHeader icon={<span className="icon-bubble"><BarChart3 className="h-4 w-4" aria-hidden="true" /></span>} title="Gráficos & análisis visual" subtitle="Las vistas se actualizan con los supuestos de la calculadora." />
      </div>
      {!completeness.allRequired && <div className="mb-5 rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-700">Completá volumen, minutos y costo horario para obtener comparaciones representativas. Los gráficos muestran ceros mientras tanto.</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Horas manuales vs. liberadas" hint="Horas por mes" note={`Original: ${number(r.monthlyManualHours, 0)} h · Liberadas: ${number(r.releasedHours, 0)} h`}><ProcessChart r={r} /></ChartCard>
        <ChartCard title="Costo operativo mensual" hint="Composición del TCO" note={`TCO mensual: ${money(r.monthlyTCO)}`}><CostBreakdownChart r={r} inputs={inputs} /></ChartCard>
        <ChartCard title="Economía del primer año" hint="Valor, costo y neto" note={`Valor potencial: ${money(r.firstYearPotentialValue)} · TCO: ${money(r.firstYearTCO)}`}><FirstYearChart r={r} /></ChartCard>
        <ChartCard title="Escenarios comparados" hint="ROI y recuperación" note="El payback se omite cuando el excedente mensual no alcanza para recuperar la inversión."><ScenarioComparisonChart base={inputs} scenarios={scenarios} /></ChartCard>
      </div>
    </section>
  );
}

function ChartCard({ title, hint, note, children }: { title: string; hint: string; note: string; children: React.ReactNode }) {
  return <Card className="p-5"><div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="text-balance font-display text-base font-semibold text-slate-900">{title}</h2><span className="shrink-0 text-[11px] text-slate-500">{hint}</span></div>{children}<p className="mt-3 text-pretty text-xs leading-relaxed text-slate-500">{note}</p></Card>;
}
