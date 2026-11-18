import {
  AlertTriangle,
  Clock,
  DollarSign,
  Info,
  CheckCircle2,
  Hourglass,
  PiggyBank,
  Scale,
  Scissors,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { Completeness, FinancialResult, ModelInputs } from "@/lib/types";
import { money, number, payback, percent, percentValue } from "@/lib/format";
import { buildWarnings } from "@/lib/warnings";
import { Card } from "./ui";

export function ResultsDashboard({
  r,
  inputs,
  completeness,
}: {
  r: FinancialResult;
  inputs: ModelInputs;
  completeness: Completeness;
}) {
  const warnings = buildWarnings(r, inputs, completeness);
  const roiTone =
    r.firstYearPotentialROI == null
      ? "default"
      : r.firstYearPotentialROI >= 0
        ? "positive"
        : "negative";

  return (
    <div className="space-y-4">
      {/* Three-tier honesty strip */}
      <Card className="p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Tier
            n="1"
            title="Capacidad liberada"
            value={`${number(r.releasedHours, 0)} h/mes`}
            desc="Tiempo operativo que se libera."
            color="bg-blue-50 border-blue-100 text-blue-900"
          />
          <Tier
            n="2"
            title="Valor económico potencial"
            value={money(r.releasedCapacityValue)}
            desc="Equivalente teórico en USD."
            color="bg-indigo-50 border-indigo-100 text-indigo-900"
          />
          <Tier
            n="3"
            title="Ahorro realizado"
            value={r.captureConfigured ? money(r.realizedMonthlyBenefit) : "Sin confirmar"}
            desc={`Al ${Math.round(inputs.captureRate * 100)}% de captura.`}
            color="bg-emerald-50 border-emerald-100 text-emerald-900"
          />
        </div>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <ul className="space-y-2">
          {warnings.map((w, i) => (
            <WarningRow key={i} w={w} />
          ))}
        </ul>
      )}

      {/* Primary indicators */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <MiniStat
          icon={<Scissors className="h-4 w-4" />}
          label="Horas liberadas / mes"
          value={`${number(r.releasedHours, 0)} h`}
        />
        <MiniStat
          icon={<PiggyBank className="h-4 w-4" />}
          label="Capacidad liberada"
          value={money(r.releasedCapacityValue)}
          sub="equivalente mensual"
        />
        <MiniStat
          icon={<DollarSign className="h-4 w-4" />}
          label="TCO mensual"
          value={money(r.monthlyTCO)}
        />
        <MiniStat
          icon={<TrendingUp className="h-4 w-4" />}
          label="ROI potencial 12 m"
          value={percentValue(r.firstYearPotentialROI)}
          tone={roiTone}
        />
        <MiniStat
          icon={<Hourglass className="h-4 w-4" />}
          label="Recuperación"
          value={payback(r.potentialPaybackMonths)}
          small
        />
      </div>

      {/* Secondary indicators */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Secondary label="Costo manual equiv." value={money(r.manualLaborValue)} icon={<Clock className="h-3.5 w-3.5" />} />
        <Secondary label="Horas manuales rest." value={`${number(r.remainingManualHours, 0)} h`} icon={<Hourglass className="h-3.5 w-3.5" />} />
        <Secondary
          label="Costo / caso autom."
          value={r.costPerAutomatedCase != null ? money(r.costPerAutomatedCase) : "—"}
          icon={<Scale className="h-3.5 w-3.5" />}
        />
        <Secondary
          label="Punto de equilibrio"
          value={
            r.breakEvenRate == null
              ? "—"
              : r.breakEvenReachable
                ? percent(r.breakEvenRate)
                : "> 100%"
          }
          icon={<Scale className="h-3.5 w-3.5" />}
        />
        <Secondary
          label="ROI realizado 12 m"
          value={r.captureConfigured ? percentValue(r.realizedFirstYearROI) : "n/c"}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        />
      </div>

    </div>
  );
}

/* ── small presentational pieces ─────────────────────── */

function Tier({ n, title, value, desc, color }: { n: string; title: string; value: string; desc: string; color: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${color}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-70">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px]">{n}</span>
        {title}
      </div>
      <div className="mt-1 font-mono text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] opacity-80">{desc}</div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  sub,
  tone = "default",
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "negative";
  small?: boolean;
}) {
  const toneCls =
    tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-blue-600">{icon}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`mt-0.5 font-mono font-semibold tabular-nums leading-tight ${toneCls} ${small ? "text-sm" : "text-xl"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

function Secondary({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-800">{value}</div>
    </div>
  );
}

function WarningRow({ w }: { w: ReturnType<typeof buildWarnings>[number] }) {
  const map = {
    info: { cls: "border-blue-200 bg-blue-50 text-blue-800", Icon: Info },
    warning: { cls: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
    danger: { cls: "border-red-200 bg-red-50 text-red-800", Icon: XCircle },
    success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
  } as const;
  const { cls, Icon } = map[w.tone];
  return (
    <li className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{w.text}</span>
    </li>
  );
}

