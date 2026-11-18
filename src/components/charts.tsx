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
import type { FinancialResult, ModelInputs } from "@/lib/types";
import { money, number } from "@/lib/format";

const BLUE = "#2563eb";
const SLATE = "#cbd5e1";
const EMERALD = "#059669";
const AMBER = "#d97706";
const RED = "#dc2626";
const INDIGO = "#4f46e5";

const axisStyle = { fontSize: 11, fill: "#64748b" };
const usd = (value: unknown) => money(Number(value));

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
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" tick={axisStyle} unit=" h" />
        <YAxis type="category" dataKey="name" tick={axisStyle} width={78} />
        <Tooltip
          formatter={(v) => `${number(Number(v), 1)} h`}
          cursor={{ fill: "#f1f5f9" }}
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
            stroke="#fff"
          >
            {slices.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip formatter={usd} />
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
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="name" tick={axisStyle} interval={0} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} width={40} />
        <Tooltip formatter={usd} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="v" radius={[4, 4, 0, 0]} barSize={44}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
