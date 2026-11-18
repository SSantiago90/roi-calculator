import { parseNumber } from "./format";
import { percentToFraction } from "./calculations";
import type {
  CommercialContext,
  Completeness,
  ModelInputs,
  NumericForm,
  ProjectInfo,
  ScenarioConfig,
} from "./types";

export const DEFAULT_PROJECT: ProjectInfo = {
  clientName: "",
  industry: "",
  process: "",
  description: "",
};

export const DEFAULT_COMMERCIAL: CommercialContext = {
  stakeholders: "",
  tools: "",
  kpi: "",
  successFee: "",
  attributionWindowDays: "",
  notes: "",
};

export const DEFAULT_FORM: NumericForm = {
  monthlyVolume: "500",
  minutesPerCase: "10",
  hourlyHumanCost: "12",
  automationRate: "80",
  captureRate: "0",
  setupCost: "2000",
  monthlyAICost: "300",
  monthlyInfrastructureCost: "80",
  supportHours: "6",
  supportHourlyRate: "25",
  thirdPartyApiCost: "0",
  softwareLicenseCost: "0",
  otherRecurringCosts: "0",
  additionalOneTimeCosts: "0",
};

export const EMPTY_FORM: NumericForm = Object.fromEntries(
  Object.keys(DEFAULT_FORM).map((key) => [key, ""])
) as unknown as NumericForm;

/** Fully worked teaching example described in the brief. */
export const EXAMPLE_PROJECT: ProjectInfo = {
  clientName: "Inmobiliaria Delta",
  industry: "Real Estate",
  process: "Calificación de leads de WhatsApp y agenda.",
  description:
    "Agente de IA que califica leads entrantes por WhatsApp y coordina citas con el equipo comercial.",
};

export const EXAMPLE_FORM: NumericForm = {
  monthlyVolume: "1200",
  minutesPerCase: "12",
  hourlyHumanCost: "15",
  automationRate: "80",
  captureRate: "0",
  setupCost: "3000",
  monthlyAICost: "400",
  monthlyInfrastructureCost: "100",
  supportHours: "8",
  supportHourlyRate: "30",
  thirdPartyApiCost: "0",
  softwareLicenseCost: "0",
  otherRecurringCosts: "0",
  additionalOneTimeCosts: "0",
};

export const EXAMPLE_COMMERCIAL: CommercialContext = {
  stakeholders: "CFO, COO, CTO/CISO",
  tools: "WhatsApp, CRM, Google Calendar, Slack",
  kpi: "Cita calificada asistida por IA",
  successFee: "8",
  attributionWindowDays: "30",
  notes:
    "El success fee es un cargo comercial opcional. La cantidad de eventos facturables es desconocida y no se incorpora al modelo financiero sin una decisión explícita.",
};

export const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  {
    id: "conservador",
    label: "Conservador",
    assumptions: { volumeFactor: 0.7, automationRate: 0.6, aiCostFactor: 1.2 },
  },
  {
    id: "base",
    label: "Base",
    assumptions: { volumeFactor: 1, automationRate: 0.8, aiCostFactor: 1 },
  },
  {
    id: "optimista",
    label: "Optimista",
    assumptions: { volumeFactor: 1.2, automationRate: 0.9, aiCostFactor: 0.9 },
  },
];

export const EMPTY_SCENARIOS: ScenarioConfig[] = DEFAULT_SCENARIOS.map((scenario) => ({
  ...scenario,
  assumptions: { volumeFactor: 0, automationRate: 0, aiCostFactor: 0 },
}));

/** Convert string form into normalized numeric model inputs. */
export function toModelInputs(f: NumericForm): ModelInputs {
  return {
    monthlyVolume: parseNumber(f.monthlyVolume) ?? 0,
    minutesPerCase: parseNumber(f.minutesPerCase) ?? 0,
    hourlyHumanCost: parseNumber(f.hourlyHumanCost) ?? 0,
    automationRate: percentToFraction(f.automationRate),
    captureRate: percentToFraction(f.captureRate),
    setupCost: parseNumber(f.setupCost) ?? 0,
    monthlyAICost: parseNumber(f.monthlyAICost) ?? 0,
    monthlyInfrastructureCost: parseNumber(f.monthlyInfrastructureCost) ?? 0,
    supportHours: parseNumber(f.supportHours) ?? 0,
    supportHourlyRate: parseNumber(f.supportHourlyRate) ?? 0,
    thirdPartyApiCost: parseNumber(f.thirdPartyApiCost) ?? 0,
    softwareLicenseCost: parseNumber(f.softwareLicenseCost) ?? 0,
    otherRecurringCosts: parseNumber(f.otherRecurringCosts) ?? 0,
    additionalOneTimeCosts: parseNumber(f.additionalOneTimeCosts) ?? 0,
  };
}

/** Determine which required fields have usable input. */
export function getCompleteness(f: NumericForm): Completeness {
  const volume = parseNumber(f.monthlyVolume);
  const minutes = parseNumber(f.minutesPerCase);
  const hourly = parseNumber(f.hourlyHumanCost);
  return {
    volume: volume != null && volume >= 0,
    minutes: minutes != null && minutes >= 0,
    hourly: hourly != null && hourly >= 0,
    allRequired:
      volume != null &&
      volume > 0 &&
      minutes != null &&
      minutes > 0 &&
      hourly != null &&
      hourly > 0,
  };
}
