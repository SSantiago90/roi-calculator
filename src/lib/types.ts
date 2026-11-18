// ─────────────────────────────────────────────────────────────
// Data models for the ROI & TCO calculator.
// We deliberately separate raw user input (strings, so we can
// accept many numeric formats) from normalized numeric values,
// assumptions, calculated results and scenario configuration.
// ─────────────────────────────────────────────────────────────

/** Free-text project context. Does NOT affect any formula. */
export interface ProjectInfo {
  clientName: string;
  industry: string;
  process: string;
  description: string;
}

/** Optional commercial context. Contextual only — never fed to formulas. */
export interface CommercialContext {
  stakeholders: string;
  tools: string;
  kpi: string;
  successFee: string; // USD per successful event (contextual)
  attributionWindowDays: string;
  notes: string;
}

/**
 * All numeric form fields kept as strings so the UI can accept
 * common numeric formats ("1.200", "12,5", "1200") without
 * silently misreading decimal separators. Parsed on demand.
 */
export interface NumericForm {
  // Current manual process
  monthlyVolume: string;
  minutesPerCase: string;
  hourlyHumanCost: string;
  // Automation
  automationRate: string; // percentage 0–100
  captureRate: string; // percentage 0–100 (value actually captured)
  // Costs
  setupCost: string;
  monthlyAICost: string;
  monthlyInfrastructureCost: string;
  supportHours: string;
  supportHourlyRate: string;
  // Advanced (optional, default 0)
  thirdPartyApiCost: string;
  softwareLicenseCost: string;
  otherRecurringCosts: string;
  additionalOneTimeCosts: string;
}

/** Fully parsed, numeric projection of the form (missing => 0). */
export interface ModelInputs {
  monthlyVolume: number;
  minutesPerCase: number;
  hourlyHumanCost: number;
  automationRate: number; // fraction 0..1
  captureRate: number; // fraction 0..1
  setupCost: number;
  monthlyAICost: number;
  monthlyInfrastructureCost: number;
  supportHours: number;
  supportHourlyRate: number;
  thirdPartyApiCost: number;
  softwareLicenseCost: number;
  otherRecurringCosts: number;
  additionalOneTimeCosts: number;
}

/** Which core fields still need valid input. */
export interface Completeness {
  volume: boolean;
  minutes: boolean;
  hourly: boolean;
  allRequired: boolean;
}

export interface FinancialResult {
  // Manual process
  monthlyManualHours: number;
  manualLaborValue: number;
  // Automation split
  automatedCases: number;
  remainingCases: number;
  releasedHours: number;
  remainingManualHours: number;
  releasedCapacityValue: number;
  // Costs
  monthlySupportCost: number;
  otherRecurringCosts: number;
  monthlyTCO: number;
  totalInitialInvestment: number;
  firstYearTCO: number;
  // Potential (capacity-based) economics
  potentialMonthlyNetValue: number;
  potentialMonthlyROI: number | null;
  firstYearPotentialValue: number;
  firstYearPotentialNetValue: number;
  firstYearPotentialROI: number | null;
  monthlyPotentialSurplus: number;
  potentialPaybackMonths: number | null;
  breakEvenRate: number | null; // fraction; >1 means unreachable
  breakEvenReachable: boolean;
  costPerAutomatedCase: number | null;
  // Realized (capture-based) economics
  realizedMonthlyBenefit: number;
  realizedMonthlyNetBenefit: number;
  realizedFirstYearROI: number | null;
  captureConfigured: boolean;
}

export interface ScenarioAssumptions {
  volumeFactor: number; // e.g. 0.7
  automationRate: number; // fraction 0..1
  aiCostFactor: number; // e.g. 1.2
}

export interface ScenarioConfig {
  id: "conservador" | "base" | "optimista";
  label: string;
  assumptions: ScenarioAssumptions;
}

export interface ScenarioResult extends FinancialResult {
  label: string;
  effectiveVolume: number;
  effectiveAutomationRate: number;
  effectiveAICost: number;
}

/** The whole persisted application state. */
export interface PersistedState {
  version: number;
  project: ProjectInfo;
  form: NumericForm;
  commercial: CommercialContext;
  scenarios: ScenarioConfig[];
  guidedMode: boolean;
}
