import type { Completeness, FinancialResult, ModelInputs } from "./types";

export interface Warning {
  tone: "info" | "warning" | "danger" | "success";
  text: string;
}

/** Derive honest, contextual guidance from the current numbers. */
export function buildWarnings(
  r: FinancialResult,
  inputs: ModelInputs,
  c: Completeness
): Warning[] {
  const out: Warning[] = [];

  if (!c.allRequired) {
    out.push({
      tone: "danger",
      text: "Faltan datos obligatorios (volumen, minutos por caso o costo horario). No se muestran conclusiones financieras hasta completarlos.",
    });
    return out;
  }

  if (inputs.automationRate >= 0.9) {
    out.push({
      tone: "warning",
      text: "El porcentaje de automatización es muy alto. Verificá que sea alcanzable considerando excepciones, derivaciones a humanos y errores.",
    });
  }

  if (!r.captureConfigured) {
    out.push({
      tone: "info",
      text: "Por el momento el proyecto libera capacidad operativa, pero no se declaró ahorro económico realizado (captura = 0%).",
    });
  } else {
    out.push({
      tone: "success",
      text: `Se modela un ${Math.round(inputs.captureRate * 100)}% del valor liberado como beneficio efectivamente capturado.`,
    });
  }

  if (r.monthlyTCO > r.releasedCapacityValue && r.releasedCapacityValue > 0) {
    out.push({
      tone: "danger",
      text: "Los costos operativos mensuales superan el valor estimado de la capacidad liberada.",
    });
  }

  if (r.firstYearPotentialROI != null && r.firstYearPotentialROI < 0) {
    out.push({
      tone: "danger",
      text: "Con los supuestos actuales, el valor económico estimado no cubre el costo total del primer año.",
    });
  }

  if (r.breakEvenRate != null && !r.breakEvenReachable) {
    out.push({
      tone: "warning",
      text: "El punto de equilibrio operativo requiere más del 100% de automatización: no es alcanzable con los costos recurrentes actuales.",
    });
  }

  if (r.potentialPaybackMonths == null && r.totalInitialInvestment > 0) {
    out.push({
      tone: "warning",
      text: "La inversión inicial no se recupera porque el excedente mensual potencial es nulo o negativo.",
    });
  }

  return out;
}
