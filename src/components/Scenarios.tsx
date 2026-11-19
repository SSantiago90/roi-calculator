import { GitCompareArrows } from "lucide-react";
import type { ModelInputs, ScenarioConfig } from "@/lib/types";
import { evaluateScenario } from "@/lib/calculations";
import { money, number, payback, percent, percentValue } from "@/lib/format";
import { Card, SectionHeader } from "./ui";
import { cn } from "@/utils/cn";

export function Scenarios({
  base,
  scenarios,
  onChange,
  captureConfigured,
}: {
  base: ModelInputs;
  scenarios: ScenarioConfig[];
  onChange: (s: ScenarioConfig[]) => void;
  captureConfigured: boolean;
}) {
  const results = scenarios.map((s) => ({ cfg: s, res: evaluateScenario(base, s) }));

  const update = (id: ScenarioConfig["id"], patch: Partial<ScenarioConfig["assumptions"]>) => {
    onChange(
      scenarios.map((s) =>
        s.id === id ? { ...s, assumptions: { ...s.assumptions, ...patch } } : s
      )
    );
  };

  const accent: Record<string, string> = {
    conservador: "border-amber-300 bg-amber-50",
    base: "border-blue-300 bg-blue-50",
    optimista: "border-emerald-300 bg-emerald-50",
  };

  return (
    <Card className="p-5">
      <SectionHeader
        icon={
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GitCompareArrows className="h-4 w-4" />
          </span>
        }
        title="Simulación de escenarios"
        subtitle="Compará un caso conservador, base y optimista. Son ejemplos educativos editables."
      />

      {/* Editors */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((s) => (
          <div key={s.id} className={cn("rounded-xl border p-3", accent[s.id])}>
            <div className="font-display text-sm font-semibold text-slate-800">{s.label}</div>
            <div className="mt-2 space-y-2">
              <FactorInput
                label="Volumen mensual"
                value={s.assumptions.volumeFactor * 100}
                onChange={(v) => update(s.id, { volumeFactor: v / 100 })}
              />
              <FactorInput
                label="Automatización"
                value={s.assumptions.automationRate * 100}
                onChange={(v) => update(s.id, { automationRate: v / 100 })}
              />
              <FactorInput
                label="Costo de IA"
                value={s.assumptions.aiCostFactor * 100}
                onChange={(v) => update(s.id, { aiCostFactor: v / 100 })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Comparison — desktop table */}
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-2.5 font-medium text-slate-500">Resultado calculado</th>
              {results.map(({ cfg }) => (
                <th key={cfg.id} className="px-4 py-2.5 text-right font-display font-semibold text-slate-700">
                  {cfg.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <Row label="Volumen mensual" cells={results.map(({ res }) => number(res.effectiveVolume, 0))} />
            <Row label="Automatización" cells={results.map(({ res }) => percent(res.effectiveAutomationRate))} />
            <Row label="Casos automatizados" cells={results.map(({ res }) => number(res.automatedCases, 0))} />
            <Row label="Horas liberadas" cells={results.map(({ res }) => `${number(res.releasedHours, 0)} h`)} />
            <Row label="Capacidad liberada" cells={results.map(({ res }) => money(res.releasedCapacityValue))} moneyTone />
            <Row label="Costo IA mensual" cells={results.map(({ res }) => money(res.monthlyAIExpense))} />
            <Row label="TCO mensual" cells={results.map(({ res }) => money(res.monthlyTCO))} />
            <Row label="TCO 1er año" cells={results.map(({ res }) => money(res.firstYearTCO))} />
            <Row
              label="ROI potencial 12 m"
              cells={results.map(({ res }) => percentValue(res.firstYearPotentialROI))}
              roiCells={results.map(({ res }) => res.firstYearPotentialROI)}
            />
            <Row label="Recuperación" cells={results.map(({ res }) => payback(res.potentialPaybackMonths))} />
            {captureConfigured && (
              <Row
                label="ROI realizado 12 m"
                cells={results.map(({ res }) => percentValue(res.realizedFirstYearROI))}
                roiCells={results.map(({ res }) => res.realizedFirstYearROI)}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Comparison — mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {results.map(({ cfg, res }) => (
          <div key={cfg.id} className={cn("rounded-xl border p-4", accent[cfg.id])}>
            <div className="font-display text-base font-semibold text-slate-900">{cfg.label}</div>
            <dl className="mt-2 space-y-1 text-sm">
              <Line k="Volumen mensual" v={number(res.effectiveVolume, 0)} />
              <Line k="Horas liberadas" v={`${number(res.releasedHours, 0)} h`} />
              <Line k="Capacidad liberada" v={money(res.releasedCapacityValue)} />
              <Line k="Costo IA mensual" v={money(res.monthlyAIExpense)} />
              <Line k="TCO mensual" v={money(res.monthlyTCO)} />
              <Line k="TCO 1er año" v={money(res.firstYearTCO)} />
              <Line k="ROI potencial 12 m" v={percentValue(res.firstYearPotentialROI)} />
              <Line k="Recuperación" v={payback(res.potentialPaybackMonths)} />
              {captureConfigured && <Line k="ROI realizado 12 m" v={percentValue(res.realizedFirstYearROI)} />}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Los supuestos (arriba) son editables; los resultados se recalculan al instante
        y heredan el contexto de costos del caso principal.
      </p>
    </Card>
  );
}

function FactorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-slate-600">
      <span>{label}</span>
      <span className="relative w-20">
        <input
          type="number"
          name={`scenario-${label}`}
          autoComplete="off"
          value={Math.round(value)}
          min={0}
          max={300}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-slate-300 bg-white py-1 pr-5 pl-2 text-right font-mono text-xs tabular-nums focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
      </span>
    </label>
  );
}

function Row({
  label,
  cells,
  roiCells,
  moneyTone,
}: {
  label: string;
  cells: string[];
  roiCells?: (number | null)[];
  moneyTone?: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-slate-500">{label}</td>
      {cells.map((c, i) => {
        const roi = roiCells?.[i];
        const tone =
          roi != null ? (roi >= 0 ? "text-emerald-600" : "text-red-600") : "text-slate-800";
        return (
          <td
            key={i}
            className={cn(
              "px-4 py-2.5 text-right font-mono tabular-nums",
              moneyTone && "font-semibold text-slate-900",
              !moneyTone && tone
            )}
          >
            {c}
          </td>
        );
      })}
    </tr>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-mono tabular-nums text-slate-900">{v}</dd>
    </div>
  );
}
