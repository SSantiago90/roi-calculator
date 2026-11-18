import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, BookMarked, Calculator, ClipboardCopy, FileDown, GraduationCap, Moon, RotateCcw, Save, Sparkles, Sun, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import type { CommercialContext, NumericForm, PersistedState, ProjectInfo, ScenarioConfig } from "@/lib/types";
import { computeModel } from "@/lib/calculations";
import { money, number, payback, percentValue } from "@/lib/format";
import { getCompleteness, toModelInputs, DEFAULT_PROJECT, EMPTY_FORM, EMPTY_SCENARIOS, EXAMPLE_COMMERCIAL, EXAMPLE_FORM, EXAMPLE_PROJECT } from "@/lib/presets";
import { clearState, defaultState, loadState, saveState } from "@/lib/storage";
import { GuidedContext } from "@/components/ui";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { Scenarios } from "@/components/Scenarios";
import { Education } from "@/components/Education";
import { Analytics } from "@/components/Analytics";
import { Report } from "@/components/Report";
import { AnimatedContent, Glow, GradientText } from "@/components/react-bits";

type View = "calculadora" | "aprende" | "graficos";
type Theme = "dark" | "light";
const THEME_KEY = "roi-tco-calculator:theme";
const views: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "calculadora", label: "Calculadora", icon: <Calculator className="h-4 w-4" aria-hidden="true" /> },
  { id: "aprende", label: "Aprendé los cálculos", icon: <BookMarked className="h-4 w-4" aria-hidden="true" /> },
  { id: "graficos", label: "Gráficos", icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
];

function initialView(): View {
  const hash = window.location.hash.slice(1);
  return views.some((item) => item.id === hash) ? hash as View : "calculadora";
}

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [view, setView] = useState<View>(initialView);
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark");
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#070a12" : "#f5f7fb");
  }, [theme]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);
  const patch = useCallback((next: Partial<PersistedState>) => setState((current) => ({ ...current, ...next })), []);
  const onProject = useCallback((key: keyof ProjectInfo, value: string) => setState((current) => ({ ...current, project: { ...current.project, [key]: value } })), []);
  const onField = useCallback((key: keyof NumericForm, value: string) => setState((current) => ({ ...current, form: { ...current.form, [key]: value } })), []);
  const onCommercial = useCallback((key: keyof CommercialContext, value: string) => setState((current) => ({ ...current, commercial: { ...current.commercial, [key]: value } })), []);

  const inputs = useMemo(() => toModelInputs(state.form), [state.form]);
  const completeness = useMemo(() => getCompleteness(state.form), [state.form]);
  const result = useMemo(() => computeModel(inputs), [inputs]);

  const selectView = (next: View) => {
    setView(next);
    history.replaceState(null, "", `${location.pathname}${location.search}#${next}`);
  };
  const loadExample = () => {
    setState((current) => ({ ...current, project: { ...EXAMPLE_PROJECT }, form: { ...EXAMPLE_FORM }, commercial: { ...EXAMPLE_COMMERCIAL } }));
    flash("Ejemplo Inmobiliaria Delta cargado.");
  };
  const resetAll = () => {
    if (!window.confirm("¿Vaciar todos los campos y escenarios del proyecto?")) return;
    clearState();
    setState({
      ...defaultState(),
      project: { ...DEFAULT_PROJECT },
      form: { ...EMPTY_FORM },
      commercial: { stakeholders: "", tools: "", kpi: "", successFee: "", attributionWindowDays: "", notes: "" },
      scenarios: structuredClone(EMPTY_SCENARIOS),
    });
    flash("Proyecto vacío. El tema se conservó.");
  };

  const copySummary = async () => {
    const text = [
      `Resumen ROI & TCO — ${state.project.clientName || "Proyecto"}`,
      `Volumen mensual: ${number(inputs.monthlyVolume, 0)} casos · ${number(result.monthlyManualHours, 0)} h manuales`,
      `Costo laboral equivalente: ${money(result.manualLaborValue)}/mes`,
      `Automatización: ${state.form.automationRate || "0"}% · Horas liberadas: ${number(result.releasedHours, 0)} h`,
      `Capacidad liberada: ${money(result.releasedCapacityValue)}/mes`,
      `TCO mensual: ${money(result.monthlyTCO)} · TCO 1er año: ${money(result.firstYearTCO)}`,
      `ROI potencial 12m: ${percentValue(result.firstYearPotentialROI)}`,
      `Recuperación: ${payback(result.potentialPaybackMonths)}`,
      result.captureConfigured ? `ROI realizado 12m: ${percentValue(result.realizedFirstYearROI)}` : "",
    ].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(text); flash("Resumen copiado al portapapeles."); }
    catch { flash("No se pudo copiar. Revisá los permisos del navegador."); }
  };
  const exportJSON = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(state.project.clientName || "proyecto").replace(/\s+/g, "-").toLowerCase()}-roi-tco.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash("Proyecto exportado en JSON.");
  };
  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<PersistedState>;
        const base = defaultState();
        setState({ version: base.version, project: { ...base.project, ...parsed.project }, form: { ...base.form, ...parsed.form }, commercial: { ...base.commercial, ...parsed.commercial }, scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : base.scenarios, guidedMode: Boolean(parsed.guidedMode) });
        flash("Proyecto importado.");
      } catch { flash("JSON inválido. Elegí un archivo exportado por esta calculadora."); }
    };
    reader.readAsText(file);
  };

  return (
    <GuidedContext.Provider value={state.guidedMode}>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <div className="screen-only min-h-screen overflow-x-hidden">
        <div className="app-backdrop relative min-h-screen">
          <Glow className="left-[8%] top-[-12rem] bg-blue-500/20" />
          <Glow className="right-[-8rem] top-24 bg-violet-500/15" />
          <header className="relative border-b border-slate-200/70">
            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="eyebrow"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />Herramienta educativa · IA & n8n</div>
                  <h1 className="mt-3 text-balance font-display text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">Calculadora <GradientText>ROI & TCO</GradientText></h1>
                  <p className="mt-2 max-w-xl text-pretty text-base text-slate-600">Modelá automatizaciones, defendé cada supuesto y distinguí capacidad potencial de ahorro comprobado.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ToolButton icon={<BookMarked />} onClick={() => patch({ guidedMode: !state.guidedMode })} active={state.guidedMode}>Guiado {state.guidedMode ? "ON" : "OFF"}</ToolButton>
                  <ToolButton icon={<Sparkles />} onClick={loadExample}>Ejemplo</ToolButton>
                  <ToolButton icon={<RotateCcw />} onClick={resetAll}>Restablecer</ToolButton>
                  <ToolButton icon={<ClipboardCopy />} onClick={copySummary}>Copiar</ToolButton>
                  <ToolButton icon={<Save />} onClick={exportJSON}>JSON</ToolButton>
                  <ToolButton icon={<Upload />} onClick={() => fileRef.current?.click()}>Importar</ToolButton>
                  <button type="button" aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="icon-button">{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>
                  <button type="button" onClick={() => window.print()} className="primary-button"><FileDown className="h-4 w-4" aria-hidden="true" />Resumen PDF</button>
                  <input ref={fileRef} type="file" accept="application/json" className="hidden" aria-label="Importar proyecto JSON" onChange={(event) => { const file = event.target.files?.[0]; if (file) importJSON(file); event.target.value = ""; }} />
                </div>
              </div>
              <nav className="mt-7 flex max-w-2xl gap-1 rounded-2xl border border-slate-200 bg-white/70 p-1.5 backdrop-blur-xl" aria-label="Secciones principales">
                {views.map((item) => <button key={item.id} type="button" onClick={() => selectView(item.id)} aria-current={view === item.id ? "page" : undefined} className={cn("nav-tab", view === item.id && "nav-tab-active")}>{item.icon}<span>{item.label}</span></button>)}
              </nav>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="relative mx-auto max-w-7xl px-4 py-7 outline-none sm:px-6 lg:px-8">
            {view === "calculadora" && <AnimatedContent>
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm leading-relaxed text-slate-600 backdrop-blur-xl"><strong>3 capas, sin atajos:</strong> capacidad liberada, valor económico potencial y ahorro efectivamente capturado.</div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <InputPanel project={state.project} onProject={onProject} form={state.form} onField={onField} commercial={state.commercial} onCommercial={onCommercial} completeness={completeness} />
                <div><div className="space-y-4 lg:sticky lg:top-4"><ResultsDashboard r={result} inputs={inputs} completeness={completeness} /></div></div>
              </div>
              <div className="mt-6"><Scenarios base={inputs} scenarios={state.scenarios} onChange={(scenarios: ScenarioConfig[]) => patch({ scenarios })} captureConfigured={result.captureConfigured} /></div>
            </AnimatedContent>}
            {view === "aprende" && <AnimatedContent><Education inputs={inputs} r={result} completeness={completeness} /></AnimatedContent>}
            {view === "graficos" && <AnimatedContent><Analytics r={result} inputs={inputs} scenarios={state.scenarios} completeness={completeness} /></AnimatedContent>}
          </main>
          <footer className="relative mx-auto max-w-7xl px-4 pb-12 text-center text-xs text-slate-500 sm:px-6 lg:px-8">Proyecciones educativas basadas en supuestos. No garantizan ahorro. Moneda base: USD.</footer>
        </div>
        {toast && <div role="status" aria-live="polite" className="toast">{toast}</div>}
      </div>
      <div className="print-only"><Report project={state.project} inputs={inputs} r={result} scenarios={state.scenarios} /></div>
    </GuidedContext.Provider>
  );
}

function ToolButton({ icon, children, onClick, active }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return <button type="button" onClick={onClick} className={cn("tool-button", active && "tool-button-active")}><span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span>{children}</button>;
}
