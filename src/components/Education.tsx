import { useMemo, useState } from "react";
import { BookOpen, Calculator, GraduationCap } from "lucide-react";
import type { Completeness, FinancialResult, ModelInputs } from "@/lib/types";
import { computeModel } from "@/lib/calculations";
import { EXAMPLE_FORM, toModelInputs } from "@/lib/presets";
import { money, moneyPrecise, number, payback, percent, percentValue } from "@/lib/format";
import { Card, Expandable, SectionHeader } from "./ui";
import { cn } from "@/utils/cn";

export function Education({ inputs, r, completeness }: { inputs: ModelInputs; r: FinancialResult; completeness: Completeness }) {
  const [forceExample, setForceExample] = useState(false);
  const exampleInputs = useMemo(() => toModelInputs(EXAMPLE_FORM), []);
  const exampleResult = useMemo(() => computeModel(exampleInputs), [exampleInputs]);
  const usingExample = forceExample || !completeness.allRequired;
  const i = usingExample ? exampleInputs : inputs;
  const result = usingExample ? exampleResult : r;
  const lessons = buildLessons(i, result);

  return (
    <section aria-labelledby="learning-title">
      <Card className="overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader icon={<span className="icon-bubble"><GraduationCap className="h-4 w-4" aria-hidden="true" /></span>} title="Aprendé a reproducir los cálculos" subtitle="Usá papel o una calculadora básica. Cada resultado sale de los mismos datos que usa el modelo." />
          <div className="flex rounded-xl border border-slate-200 bg-slate-100/70 p-1" aria-label="Datos usados en los ejemplos">
            <button type="button" disabled={!completeness.allRequired} onClick={() => setForceExample(false)} className={cn("segmented-button", !usingExample && "segmented-button-active")}>Tus datos</button>
            <button type="button" onClick={() => setForceExample(true)} className={cn("segmented-button", usingExample && "segmented-button-active")}>Inmobiliaria Delta</button>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-relaxed text-slate-600">
          <strong className="text-slate-900">Fuente activa: {usingExample ? "Inmobiliaria Delta" : "tus datos"}.</strong>{" "}
          {usingExample && !completeness.allRequired ? "El ejemplo educativo no modifica la calculadora." : "Cambiar un supuesto actualiza cada desarrollo."}
        </div>
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {lessons.map((lesson, index) => (
          <Card key={lesson.title} className="p-4 sm:p-5">
            <Expandable title={`${index + 1}. ${lesson.title}`} defaultOpen={index === 0}>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>{lesson.explanation}</p>
                <Formula label="Fórmula">{lesson.formula}</Formula>
                <div><h3 className="lesson-label">Variables</h3><p className="mt-1 text-xs">{lesson.variables}</p></div>
                <Formula label="Sustitución">{lesson.substitution}</Formula>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600"><Calculator className="h-3.5 w-3.5" aria-hidden="true" />Resultado</div><p className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900">{lesson.result}</p><p className="mt-1 text-xs text-slate-600">{lesson.interpretation}</p></div>
              </div>
            </Expandable>
          </Card>
        ))}
      </div>

      <Card className="mt-5 p-5">
        <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" aria-hidden="true" /><div><h2 className="font-display font-semibold text-slate-900">Regla de honestidad financiera</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">Las horas liberadas representan capacidad operativa. Solo son ahorro realizado cuando la tasa de captura refleja costos eliminados o ingresos medidos. Automatización y captura nunca son sinónimos.</p></div></div>
      </Card>
    </section>
  );
}

type Lesson = { title: string; explanation: string; formula: string; variables: string; substitution: string; result: string; interpretation: string };

function buildLessons(i: ModelInputs, r: FinancialResult): Lesson[] {
  return [
    { title: "Horas manuales mensuales", explanation: "Convierte el volumen y el tiempo unitario en carga de trabajo mensual.", formula: "H = V × M ÷ 60", variables: "V: casos mensuales · M: minutos por caso · 60: minutos por hora.", substitution: `${number(i.monthlyVolume)} × ${number(i.minutesPerCase)} ÷ 60`, result: `${number(r.monthlyManualHours)} h/mes`, interpretation: "Es el esfuerzo humano mensual del proceso actual." },
    { title: "Costo laboral equivalente", explanation: "Valora el tiempo manual al costo horario del rol.", formula: "CL = H × CH", variables: "H: horas manuales · CH: costo horario humano.", substitution: `${number(r.monthlyManualHours)} × ${moneyPrecise(i.hourlyHumanCost)}`, result: `${money(r.manualLaborValue)}/mes`, interpretation: "Es valor de tiempo, no ahorro automático de nómina." },
    { title: "Casos automatizados & horas liberadas", explanation: "Aplica la tasa de automatización al volumen y a las horas manuales.", formula: "CA = V × A  |  HL = H × A", variables: "A: automatización expresada como fracción entre 0 y 1.", substitution: `${number(i.monthlyVolume)} × ${percent(i.automationRate)}  |  ${number(r.monthlyManualHours)} × ${percent(i.automationRate)}`, result: `${number(r.automatedCases)} casos · ${number(r.releasedHours)} h`, interpretation: "Mide alcance operativo; los casos restantes siguen requiriendo trabajo humano." },
    { title: "Valor de la capacidad liberada", explanation: "Valora las horas liberadas con el mismo costo horario.", formula: "VCL = HL × CH", variables: "HL: horas liberadas · CH: costo horario humano.", substitution: `${number(r.releasedHours)} × ${moneyPrecise(i.hourlyHumanCost)}`, result: `${money(r.releasedCapacityValue)}/mes`, interpretation: "Es valor potencial. Solo una parte puede convertirse en beneficio comprobable." },
    { title: "TCO operativo mensual", explanation: "Suma IA, infraestructura, soporte y otros costos recurrentes sin incluir la inversión inicial.", formula: "TCOm = IA + Infra + (HS × CS) + Otros", variables: "HS: horas de soporte · CS: costo horario de soporte · Otros: APIs, licencias y recurrentes.", substitution: `${money(i.monthlyAICost)} + ${money(i.monthlyInfrastructureCost)} + (${number(i.supportHours)} × ${moneyPrecise(i.supportHourlyRate)}) + ${money(r.otherRecurringCosts)}`, result: `${money(r.monthlyTCO)}/mes`, interpretation: "Es lo que cuesta operar la automatización cada mes." },
    { title: "TCO del primer año", explanation: "Suma la inversión única y 12 meses de operación.", formula: "TCO₁₂ = Inversión inicial + TCOm × 12", variables: "La inversión inicial incluye setup y otros costos únicos.", substitution: `${money(r.totalInitialInvestment)} + ${money(r.monthlyTCO)} × 12`, result: money(r.firstYearTCO), interpretation: "No duplica setup ni mezcla gastos únicos con el costo mensual." },
    { title: "ROI potencial & realizado", explanation: "El ROI potencial usa toda la capacidad liberada. El realizado aplica primero la tasa de captura.", formula: "ROI = (Valor anual − TCO₁₂) ÷ TCO₁₂ × 100", variables: "Valor potencial anual = VCL × 12 · Valor realizado anual = VCL × captura × 12.", substitution: `Potencial: (${money(r.firstYearPotentialValue)} − ${money(r.firstYearTCO)}) ÷ ${money(r.firstYearTCO)} × 100`, result: `Potencial ${percentValue(r.firstYearPotentialROI)} · Realizado ${percentValue(r.realizedFirstYearROI)}`, interpretation: `Con captura de ${percent(i.captureRate)}, el beneficio realizado mensual es ${money(r.realizedMonthlyBenefit)}.` },
    { title: "Período de recuperación", explanation: "Divide la inversión inicial por el excedente potencial mensual, si ese excedente es positivo.", formula: "Payback = Inversión inicial ÷ (VCL − TCOm)", variables: "Si VCL − TCOm ≤ 0, la inversión no se recupera con estos supuestos.", substitution: `${money(r.totalInitialInvestment)} ÷ (${money(r.releasedCapacityValue)} − ${money(r.monthlyTCO)})`, result: payback(r.potentialPaybackMonths), interpretation: "Es un plazo potencial; requiere convertir la capacidad en valor real." },
    { title: "Automatización de equilibrio", explanation: "Calcula qué tasa de automatización cubre los costos operativos mensuales.", formula: "Aeq = TCOm ÷ costo laboral manual", variables: "Compara recurrentes con el valor total del proceso manual.", substitution: `${money(r.monthlyTCO)} ÷ ${money(r.manualLaborValue)}`, result: r.breakEvenRate == null ? "No calculable" : percent(r.breakEvenRate, 1), interpretation: r.breakEvenReachable ? "La tasa requerida está dentro del rango 0–100%." : "Supera 100%: no es alcanzable con estos costos." },
    { title: "Costo por caso automatizado", explanation: "Distribuye el TCO mensual entre los casos resueltos automáticamente.", formula: "CCA = TCOm ÷ casos automatizados", variables: "Si no hay casos automatizados, el resultado no existe.", substitution: `${money(r.monthlyTCO)} ÷ ${number(r.automatedCases)}`, result: moneyPrecise(r.costPerAutomatedCase), interpretation: "Sirve para comparar eficiencia unitaria entre alternativas y escenarios." },
    { title: "Implementación progresiva", explanation: "Suma el valor mensual usando la tasa configurada para cada mes, sin asumir madurez desde el inicio.", formula: "Valor anual = Σ(costo laboral manual × Aₘ)", variables: "Aₘ: automatización estimada del mes m. El TCO mensual se cobra durante todo el despliegue.", substitution: `${money(r.manualLaborValue)} × (${r.monthlyProjection.map((month) => number(month.automationRate * 100, 0)).join("% + ")}%)`, result: `${money(r.firstYearPotentialValue)} de valor potencial anual`, interpretation: `Modo ${r.deploymentMode === "progressive" ? "progresivo" : "fijo"}; automatización media ${percent(r.averageFirstYearAutomationRate)}.` },
    { title: "Flujo acumulado", explanation: "Parte de la inversión inicial negativa y suma el beneficio neto de cada mes.", formula: "Saldoₘ = − inversión inicial + Σ(valorₘ − TCOₘ)", variables: "El saldo potencial usa capacidad liberada. El realizado usa solo el porcentaje capturado.", substitution: `−${money(r.totalInitialInvestment)} + Σ de 12 beneficios netos mensuales`, result: `Potencial M12: ${money(r.monthlyProjection[11]?.cumulativePotentialBalance)} · Realizado M12: ${money(r.monthlyProjection[11]?.cumulativeRealizedBalance)}`, interpretation: "Cruzar cero significa recuperar la inversión bajo la serie de supuestos elegida." },
    { title: "Payback potencial vs. realizado", explanation: "Ambos usan el mismo flujo acumulado; cambia el valor económico reconocido.", formula: "Payback = primer momento donde el saldo acumulado ≥ 0", variables: "Potencial: 100% del valor de capacidad · Realizado: valor de capacidad × captura.", substitution: `Captura configurada: ${percent(i.captureRate)} · Inversión: ${money(r.totalInitialInvestment)}`, result: `Potencial: ${payback(r.potentialPaybackMonths)} · Realizado: ${payback(r.realizedPaybackMonths)}`, interpretation: "El potencial es una simulación. Solo el realizado representa ahorro o ingreso declarado." },
    { title: "Costo fijo vs. variable de IA", explanation: "El modelo fijo usa una estimación mensual. El variable suma una base fija y el costo de todos los casos procesados por IA.", formula: "IA variable = fijo + casos procesados × costo por caso", variables: "Casos procesados pueden incluir éxitos, fallos y derivaciones humanas.", substitution: `${money(i.monthlyAICost)} + ${number(r.monthlyAIProcessedCases)} × ${moneyPrecise(i.variableAICostPerCase)}`, result: `${money(r.monthlyAIExpense)}/mes`, interpretation: `Modelo activo: ${i.aiCostModel === "fixed" ? "costo mensual fijo" : "fijo + variable por caso procesado"}.` },
    { title: "Sensibilidad del ROI", explanation: "Recalcula el ROI cambiando solo la automatización para observar cuánto depende de ese supuesto.", formula: "ROI(A) = (valor anual con A − TCO₁₂) ÷ TCO₁₂ × 100", variables: "A varía; volumen, costo horario y estructura de costos permanecen constantes.", substitution: `Compará A = 20%, 40%, 60%, 80% y 100%`, result: `Caso actual: ${percentValue(r.firstYearPotentialROI)}`, interpretation: "No es un pronóstico: muestra sensibilidad a una variable aislada." },
  ];
}

function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><h3 className="lesson-label">{label}</h3><div className="mt-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 px-3 py-2.5 font-mono text-xs tabular-nums text-cyan-200">{children}</div></div>;
}
