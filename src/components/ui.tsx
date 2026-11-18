import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronDown, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/utils/cn";
import { parseNumber } from "@/lib/format";

/* Guided-learning mode context: controls inline educational hints. */
export const GuidedContext = createContext(false);
export function useGuided() {
  return useContext(GuidedContext);
}

/* ── Card ─────────────────────────────────────────────── */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  step,
  title,
  subtitle,
  icon,
}: {
  step?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {step && (
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-display text-sm font-bold text-white">
          {step}
        </span>
      )}
      {icon}
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── Tooltip / Info ───────────────────────────────────── */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Más información"
        className="ml-1 inline-flex text-slate-400 transition-colors hover:text-blue-600 focus:text-blue-600 focus:outline-none"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 translate-y-1 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-100 opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** Guided-mode educational hint block. Only visible in guided mode. */
export function GuideTip({ children }: { children: ReactNode }) {
  const guided = useGuided();
  if (!guided) return null;
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-900">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <span>{children}</span>
    </div>
  );
}

/* ── Text field ───────────────────────────────────────── */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  info,
  guided,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  info?: string;
  guided?: ReactNode;
}) {
  const base =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25";
  return (
    <label className="block">
      <span className="mb-1 flex items-center text-xs font-medium text-slate-600">
        {label}
        {info && <InfoTip text={info} />}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={cn(base, "resize-none")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
      {guided && <GuideTip>{guided}</GuideTip>}
    </label>
  );
}

/* ── Numeric field (accepts es-AR / en formats) ────────── */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  info,
  guided,
  required,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  info?: string;
  guided?: ReactNode;
  required?: boolean;
  compact?: boolean;
}) {
  const trimmed = value.trim();
  const invalid = trimmed !== "" && parseNumber(trimmed) === null;
  return (
    <label className="block">
      <span className="mb-1 flex items-center text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {info && <InfoTip text={info} />}
      </span>
      <span className="relative block">
        {unit && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {unit}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border bg-white py-2 text-sm font-mono tabular-nums text-slate-900 shadow-inner shadow-slate-100 transition focus:outline-none focus:ring-2",
            unit ? "pl-11 pr-3" : "px-3",
            compact && "py-1.5",
            invalid
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25"
          )}
        />
      </span>
      {invalid && (
        <span className="mt-1 block text-xs text-red-600">
          Ingresá un número válido (ej.: 1200 o 12,5).
        </span>
      )}
      {guided && !invalid && <GuideTip>{guided}</GuideTip>}
    </label>
  );
}

/* ── Percentage slider + numeric ──────────────────────── */
export function PercentSlider({
  label,
  value,
  onChange,
  info,
  guided,
  accent = "blue",
}: {
  label: string;
  value: string; // percentage number as string
  onChange: (v: string) => void;
  info?: string;
  guided?: ReactNode;
  accent?: "blue" | "emerald";
}) {
  const n = parseNumber(value);
  const safe = n == null ? 0 : Math.min(100, Math.max(0, n));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center text-xs font-medium text-slate-600">
          {label}
          {info && <InfoTip text={info} />}
        </span>
        <span className="relative w-20">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
            className="w-full rounded-md border border-slate-300 bg-white py-1 pr-6 pl-2 text-right font-mono text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            %
          </span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={safe}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full cursor-pointer",
          accent === "emerald" && "[accent-color:#059669]"
        )}
      />
      {guided && <GuideTip>{guided}</GuideTip>}
    </div>
  );
}

/* ── Expandable panel ─────────────────────────────────── */
export function Expandable({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "warning" | "negative" | "brand";
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    positive: "text-emerald-600",
    warning: "text-amber-600",
    negative: "text-red-600",
    brand: "text-blue-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-semibold tabular-nums leading-none",
          tones[tone]
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
