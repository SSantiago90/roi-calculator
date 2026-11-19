import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancialResult, ModelInputs, ScenarioConfig } from "@/lib/types";
import { evaluateAutomationSensitivity, evaluateScenario } from "@/lib/calculations";
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
    { name: "IA", value: r.monthlyAIExpense, color: BLUE },
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

export function InvestmentRecoveryChart({ r }: { r: FinancialResult }) {
  const data = [
    { month: 0, Potencial: -r.totalInitialInvestment, Realizado: -r.totalInitialInvestment },
    ...r.monthlyProjection.map((item) => ({ month: item.month, Potencial: item.cumulativePotentialBalance, Realizado: item.cumulativeRealizedBalance })),
  ];
  const potentialWithinYear = r.potentialPaybackMonths != null && r.potentialPaybackMonths <= 12;
  const realizedWithinYear = r.realizedPaybackMonths != null && r.realizedPaybackMonths <= 12;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 6, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={axisStyle} tickFormatter={(value) => `M${value}`} />
        <YAxis tick={axisStyle} tickFormatter={(value) => `$${number(Number(value) / 1000, 0)}k`} width={48} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(value) => value === 0 ? "Inversión inicial" : `Mes ${value}`} formatter={usd} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="var(--chart-label)" strokeDasharray="4 4" />
        {potentialWithinYear && <ReferenceLine x={Math.ceil(r.potentialPaybackMonths!)} stroke={BLUE} strokeDasharray="3 3" label={{ value: "Payback potencial", fill: BLUE, fontSize: 10 }} />}
        {realizedWithinYear && <ReferenceLine x={Math.ceil(r.realizedPaybackMonths!)} stroke={EMERALD} strokeDasharray="3 3" label={{ value: "Payback realizado", fill: EMERALD, fontSize: 10, position: "insideBottomRight" }} />}
        <Line type="monotone" dataKey="Potencial" stroke={BLUE} strokeWidth={2.5} dot={{ r: 2 }} />
        <Line type="monotone" dataKey="Realizado" stroke={EMERALD} strokeWidth={2.5} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AutomationEvolutionChart({ r }: { r: FinancialResult }) {
  const data = r.monthlyProjection.map((item) => ({ month: `M${item.month}`, automation: item.automationRate * 100 }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs><linearGradient id="automation-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={INDIGO} stopOpacity={0.42} /><stop offset="100%" stopColor={INDIGO} stopOpacity={0.03} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="month" tick={axisStyle} />
        <YAxis domain={[0, 100]} tick={axisStyle} tickFormatter={(value) => `${value}%`} width={42} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${number(Number(value), 0)} % estimado`} />
        <Area type="monotone" dataKey="automation" name="Automatización" stroke={INDIGO} strokeWidth={2.5} fill="url(#automation-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ROISensitivityChart({ base }: { base: ModelInputs }) {
  const data = evaluateAutomationSensitivity(base).map((item) => ({ automation: `${number(item.rate * 100, 0)}%`, ROI: item.roi ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="automation" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(value) => `${value}%`} width={46} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${number(Number(value), 1)} %`} labelFormatter={(value) => `${value} de automatización`} />
        <ReferenceLine y={0} stroke="var(--chart-label)" />
        <Bar dataKey="ROI" radius={[5, 5, 0, 0]}>{data.map((item) => <Cell key={item.automation} fill={item.ROI >= 0 ? EMERALD : RED} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
