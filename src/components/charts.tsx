import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancialResult, ModelInputs, ScenarioConfig } from "@/lib/types";
import { evaluateScenario } from "@/lib/calculations";
import { money, number } from "@/lib/format";

const BLUE = "#2563eb";
const SLATE = "var(--chart-muted)";
const EMERALD = "#059669";
const AMBER = "#d97706";
const RED = "#dc2626";
const INDIGO = "#4f46e5";

const axisStyle = { fontSize: 11, fill: "var(--chart-label)" };
const usd = (value: unknown) => money(Number(value));
const tooltipStyle = { background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" };

/* Current vs automated process — horizontal stacked bar */
export function ProcessChart({ r }: { r: FinancialResult }) {
  const data = [
    {
      name: "Horas / mes",
      Restantes: r.remainingManualHours,
      Liberadas: r.releasedHours,
    },
  ];
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" tick={axisStyle} unit=" h" />
        <YAxis type="category" dataKey="name" tick={axisStyle} width={78} />
        <Tooltip
          formatter={(v) => `${number(Number(v), 1)} h`}
          cursor={{ fill: "var(--chart-cursor)" }}
          contentStyle={tooltipStyle}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Restantes" stackId="a" fill={SLATE} barSize={34} />
        <Bar dataKey="Liberadas" stackId="a" fill={EMERALD} radius={[0, 4, 4, 0]} barSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Monthly operating-cost breakdown — donut + legend */
export function CostBreakdownChart({
  r,
  inputs,
}: {
  r: FinancialResult;
  inputs: ModelInputs;
}) {
  const slices = [
    { name: "IA", value: inputs.monthlyAICost, color: BLUE },
    { name: "Infraestructura", value: inputs.monthlyInfrastructureCost, color: INDIGO },
    { name: "Soporte", value: r.monthlySupportCost, color: AMBER },
    { name: "Otros", value: r.otherRecurringCosts, color: SLATE },
  ].filter((s) => s.value > 0);

  if (r.monthlyTCO <= 0) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
        Sin costos operativos cargados.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="52%" height={170}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            stroke="var(--surface-raised)"
          >
            {slices.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip formatter={usd} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5 text-xs">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
            <span className="font-mono tabular-nums text-slate-900">{money(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* First-year comparison — potential value vs TCO vs net */
export function FirstYearChart({ r }: { r: FinancialResult }) {
  const net = r.firstYearPotentialNetValue;
  const data = [
    { name: "Valor potencial", v: r.firstYearPotentialValue, color: BLUE },
    { name: "TCO 1er año", v: r.firstYearTCO, color: SLATE },
    { name: "Valor neto", v: Math.abs(net), color: net >= 0 ? EMERALD : RED },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="name" tick={axisStyle} interval={0} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} width={40} />
        <Tooltip formatter={usd} cursor={{ fill: "var(--chart-cursor)" }} contentStyle={tooltipStyle} />
        <Bar dataKey="v" radius={[4, 4, 0, 0]} barSize={44}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScenarioComparisonChart({ base, scenarios }: { base: ModelInputs; scenarios: ScenarioConfig[] }) {
  const data = scenarios.map((scenario) => {
    const result = evaluateScenario(base, scenario);
    return {
      name: scenario.label,
      ROI: result.firstYearPotentialROI ?? 0,
      Payback: result.potentialPaybackMonths ?? 0,
    };
  });
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="name" tick={axisStyle} />
        <YAxis yAxisId="roi" tick={axisStyle} tickFormatter={(value) => `${value}%`} width={46} />
        <YAxis yAxisId="payback" orientation="right" tick={axisStyle} unit=" m" width={40} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === "ROI" ? `${number(Number(value), 1)} %` : `${number(Number(value), 1)} meses`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="roi" dataKey="ROI" fill={BLUE} radius={[5, 5, 0, 0]} />
        <Bar yAxisId="payback" dataKey="Payback" fill={EMERALD} radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
