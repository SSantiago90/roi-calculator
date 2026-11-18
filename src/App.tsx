import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  ClipboardCopy,
  Download,
  FileDown,
  GraduationCap,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type {
  CommercialContext,
  NumericForm,
  PersistedState,
  ProjectInfo,
  ScenarioConfig,
} from "@/lib/types";
import { computeModel } from "@/lib/calculations";
import { money, number, payback, percentValue } from "@/lib/format";
import { getCompleteness, toModelInputs } from "@/lib/presets";
import {
  DEFAULT_FORM,
  DEFAULT_PROJECT,
  EXAMPLE_COMMERCIAL,
  EXAMPLE_FORM,
  EXAMPLE_PROJECT,
} from "@/lib/presets";
import { clearState, defaultState, loadState, saveState } from "@/lib/storage";
import { GuidedContext } from "@/components/ui";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Scenarios } from "@/components/Scenarios";
import { Education } from "@/components/Education";
import { Report } from "@/components/Report";

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Autosave
  useEffect(() => {
    saveState(state);
  }, [state]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const patch = useCallback((p: Partial<PersistedState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const onProject = useCallback(
    (k: keyof ProjectInfo, v: string) =>
      setState((s) => ({ ...s, project: { ...s.project, [k]: v } })),
    []
  );
  const onField = useCallback(
    (k: keyof NumericForm, v: string) =>
      setState((s) => ({ ...s, form: { ...s.form, [k]: v } })),
    []
  );
  const onCommercial = useCallback(
    (k: keyof CommercialContext, v: string) =>
      setState((s) => ({ ...s, commercial: { ...s.commercial, [k]: v } })),
    []
  );

  const inputs = useMemo(() => toModelInputs(state.form), [state.form]);
  const completeness = useMemo(() => getCompleteness(state.form), [state.form]);
  const result = useMemo(() => computeModel(inputs), [inputs]);

  const loadExample = () => {
    setState((s) => ({
      ...s,
      project: { ...EXAMPLE_PROJECT },
      form: { ...EXAMPLE_FORM },
      commercial: { ...EXAMPLE_COMMERCIAL },
    }));
    flash("Ejemplo Inmobiliaria Delta cargado.");
  };

  const resetAll = () => {
    clearState();
    setState({
      ...defaultState(),
      project: { ...DEFAULT_PROJECT },
      form: { ...DEFAULT_FORM },
    });
    flash("Valores restablecidos.");
  };

  const doPrint = () => window.print();

  const copySummary = async () => {
    const r = result;
    const text = [
      `Resumen ROI & TCO — ${state.project.clientName || "Proyecto"}`,
      `Volumen mensual: ${number(inputs.monthlyVolume, 0)} casos · ${number(result.monthlyManualHours, 0)} h manuales`,
      `Costo laboral equivalente: ${money(r.manualLaborValue)}/mes`,
      `Automatización: ${state.form.automationRate}% · Horas liberadas: ${number(r.releasedHours, 0)} h`,
      `Capacidad liberada: ${money(r.releasedCapacityValue)}/mes`,
      `TCO mensual: ${money(r.monthlyTCO)} · TCO 1er año: ${money(r.firstYearTCO)}`,
      `ROI potencial 12m: ${percentValue(r.firstYearPotentialROI)}`,
      `Recuperación: ${payback(r.potentialPaybackMonths)}`,
      r.captureConfigured ? `ROI realizado 12m: ${percentValue(r.realizedFirstYearROI)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flash("Resumen copiado al portapapeles.");
    } catch {
      flash("No se pudo copiar.");
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.project.clientName || "proyecto").replace(/\s+/g, "-").toLowerCase()}-roi-tco.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Proyecto exportado en JSON.");
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PersistedState;
        const base = defaultState();
        setState({
          version: base.version,
          project: { ...base.project, ...parsed.project },
          form: { ...base.form, ...parsed.form },
          commercial: { ...base.commercial, ...parsed.commercial },
          scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : base.scenarios,
          guidedMode: Boolean(parsed.guidedMode),
        });
        flash("Proyecto importado.");
      } catch {
        flash("Archivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <GuidedContext.Provider value={state.guidedMode}>
      {/* ── On-screen application ─────────────────────────── */}
      <div className="screen-only min-h-screen">
        <div className="app-backdrop min-h-screen">
          <div className="grid-lines border-b border-slate-200/70">
            <header className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-blue-700 backdrop-blur">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Herramienta de aprendizaje · Automatización con IA y n8n
                  </div>
                  <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    Calculadora{" "}
                    <span className="text-blue-700">ROI</span> &amp;{" "}
                    <span className="text-emerald-600">TCO</span>
                  </h1>
                  <p className="mt-2 max-w-xl text-base text-slate-600">
                    Evaluá la viabilidad económica de tus proyectos de automatización con IA —
                    y aprendé a justificar cada número.
                  </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => patch({ guidedMode: !state.guidedMode })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
                      state.guidedMode
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    )}
                  >
                    <BookMarked className="h-4 w-4" />
                    Modo guiado {state.guidedMode ? "ON" : "OFF"}
                  </button>
                  <ToolButton icon={<Sparkles className="h-4 w-4" />} onClick={loadExample}>
                    Cargar ejemplo
                  </ToolButton>
                  <ToolButton icon={<RotateCcw className="h-4 w-4" />} onClick={resetAll}>
                    Restablecer
                  </ToolButton>
                  <ToolButton icon={<ClipboardCopy className="h-4 w-4" />} onClick={copySummary}>
                    Copiar
                  </ToolButton>
                  <ToolButton icon={<Save className="h-4 w-4" />} onClick={exportJSON}>
                    JSON
                  </ToolButton>
                  <ToolButton
                    icon={<Upload className="h-4 w-4" />}
                    onClick={() => fileRef.current?.click()}
                  >
                    Importar
                  </ToolButton>
                  <button
                    onClick={doPrint}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    <FileDown className="h-4 w-4" />
                    Descargar resumen
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importJSON(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </header>
          </div>

          {/* Intro strip */}
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm leading-relaxed text-slate-600 backdrop-blur">
              Convertí datos operativos en estimaciones financieras defendibles. Esta herramienta
              distingue deliberadamente <strong>capacidad liberada</strong>,{" "}
              <strong>valor económico potencial</strong> y{" "}
              <strong>ahorro realmente capturado</strong>: tres cosas distintas que suelen
              confundirse. Todos los resultados son trazables a tus datos de entrada.
            </div>
          </div>

          {/* Main layout */}
          <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-8">
            <div className="lg:order-1">
              <InputPanel
                project={state.project}
                onProject={onProject}
                form={state.form}
                onField={onField}
                commercial={state.commercial}
                onCommercial={onCommercial}
                completeness={completeness}
              />
            </div>
            <div className="lg:order-2">
              <div className="lg:sticky lg:top-4 space-y-4">
                <ResultsDashboard r={result} inputs={inputs} completeness={completeness} />
              </div>
            </div>
          </main>

          {/* Lower sections */}
          <section className="mx-auto max-w-7xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
            <Scenarios
              base={inputs}
              scenarios={state.scenarios}
              onChange={(sc: ScenarioConfig[]) => patch({ scenarios: sc })}
              captureConfigured={result.captureConfigured}
            />
            <Education r={result} />
            <footer className="pt-2 text-center text-xs text-slate-400">
              Los resultados son proyecciones educativas basadas en supuestos. No constituyen una
              garantía de ahorro ni una propuesta comercial. Moneda: USD.
            </footer>
          </section>
        </div>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg rise-in">
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> {toast}
            </span>
          </div>
        )}
      </div>

      {/* ── Print-only financial summary ──────────────────── */}
      <div className="print-only">
        <Report
          project={state.project}
          inputs={inputs}
          r={result}
          scenarios={state.scenarios}
        />
      </div>
    </GuidedContext.Provider>
  );
}

function ToolButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
    >
      {icon}
      {children}
    </button>
  );
}
