import type {
  FinancialResult,
  ModelInputs,
  ScenarioConfig,
  ScenarioResult,
} from "./types";

/** Coerce anything into a finite number, falling back to 0. */
export function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Safe division returning null when the divisor is not usable. */
function safeDiv(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const r = numerator / denominator;
  return Number.isFinite(r) ? r : null;
}

/** Round for stable deterministic output (avoids float noise). */
function round(v: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round((v + Number.EPSILON) * f) / f;
}

/**
 * Core deterministic financial model. Every figure in the app
 * derives from this single function so logic is never duplicated
 * inside components. All values rounded for determinism.
 */
export function computeModel(i: ModelInputs): FinancialResult {
  const volume = Math.max(0, num(i.monthlyVolume));
  const minutes = Math.max(0, num(i.minutesPerCase));
  const hourly = Math.max(0, num(i.hourlyHumanCost));
  const rate = clampRate(num(i.automationRate));
  const capture = clampRate(num(i.captureRate));

  // Current manual process
  const monthlyManualHours = round((volume * minutes) / 60, 4);
  const manualLaborValue = round(monthlyManualHours * hourly);

  // Automation split
  const automatedCases = round(volume * rate, 4);
  const remainingCases = round(volume - automatedCases, 4);
  const releasedHours = round(monthlyManualHours * rate, 4);
  const remainingManualHours = round(monthlyManualHours - releasedHours, 4);
  const releasedCapacityValue = round(releasedHours * hourly);

  // Costs. Recurring operating costs only (one-time handled below).
  const monthlySupportCost = round(num(i.supportHours) * num(i.supportHourlyRate));
  const recurringOther = round(
    num(i.thirdPartyApiCost) +
      num(i.softwareLicenseCost) +
      num(i.otherRecurringCosts)
  );

  const monthlyTCO = round(
    num(i.monthlyAICost) +
      num(i.monthlyInfrastructureCost) +
      monthlySupportCost +
      recurringOther
  );

  const totalInitialInvestment = round(
    num(i.setupCost) + num(i.additionalOneTimeCosts)
  );
  const firstYearTCO = round(totalInitialInvestment + monthlyTCO * 12);

  // Potential (capacity-based) economics
  const potentialMonthlyNetValue = round(releasedCapacityValue - monthlyTCO);
  const potentialMonthlyROI = pct(potentialMonthlyNetValue, monthlyTCO);

  const firstYearPotentialValue = round(releasedCapacityValue * 12);
  const firstYearPotentialNetValue = round(firstYearPotentialValue - firstYearTCO);
  const firstYearPotentialROI = pct(firstYearPotentialNetValue, firstYearTCO);

  const monthlyPotentialSurplus = potentialMonthlyNetValue;
  const potentialPaybackMonths =
    monthlyPotentialSurplus > 0
      ? round(totalInitialInvestment / monthlyPotentialSurplus, 2)
      : null;

  // Break-even automation rate (recurring costs only)
  const breakEvenRate =
    manualLaborValue > 0 ? round(monthlyTCO / manualLaborValue, 6) : null;
  const breakEvenReachable = breakEvenRate !== null && breakEvenRate <= 1;

  const costPerAutomatedCase = safeDiv(monthlyTCO, automatedCases);

  // Realized (capture-based) economics
  const realizedMonthlyBenefit = round(releasedCapacityValue * capture);
  const realizedMonthlyNetBenefit = round(realizedMonthlyBenefit - monthlyTCO);
  const realizedFirstYearROI = firstYearTCO > 0
    ? round(((realizedMonthlyBenefit * 12 - firstYearTCO) / firstYearTCO) * 100, 2)
    : null;

  return {
    monthlyManualHours: round(monthlyManualHours, 2),
    manualLaborValue,
    automatedCases,
    remainingCases,
    releasedHours: round(releasedHours, 2),
    remainingManualHours: round(remainingManualHours, 2),
    releasedCapacityValue,
    monthlySupportCost,
    otherRecurringCosts: recurringOther,
    monthlyTCO,
    totalInitialInvestment,
    firstYearTCO,
    potentialMonthlyNetValue,
    potentialMonthlyROI,
    firstYearPotentialValue,
    firstYearPotentialNetValue,
    firstYearPotentialROI,
    monthlyPotentialSurplus,
    potentialPaybackMonths,
    breakEvenRate,
    breakEvenReachable,
    costPerAutomatedCase:
      costPerAutomatedCase !== null ? round(costPerAutomatedCase, 2) : null,
    realizedMonthlyBenefit,
    realizedMonthlyNetBenefit,
    realizedFirstYearROI,
    captureConfigured: capture > 0,
  };
}

function pct(net: number, base: number): number | null {
  if (!Number.isFinite(base) || base <= 0) return null;
  return round((net / base) * 100, 2);
}

export function clampRate(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.min(1, Math.max(0, fraction));
}

/** Parse a percentage string ("80", "80%") into a fraction 0..1. */
export function percentToFraction(raw: string): number {
  const cleaned = raw.replace(/[%\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return clampRate(n / 100);
}

/**
 * Evaluate a scenario by overriding base assumptions. The rest of
 * the economic context (support, infra, setup...) is inherited so
 * results react instantly to base changes.
 */
export function evaluateScenario(
  base: ModelInputs,
  scenario: ScenarioConfig
): ScenarioResult {
  const a = scenario.assumptions;
  const effectiveVolume = round(base.monthlyVolume * num(a.volumeFactor), 4);
  const effectiveAutomationRate = clampRate(num(a.automationRate));
  const effectiveAICost = round(base.monthlyAICost * num(a.aiCostFactor));

  const result = computeModel({
    ...base,
    monthlyVolume: effectiveVolume,
    automationRate: effectiveAutomationRate,
    monthlyAICost: effectiveAICost,
  });

  return {
    ...result,
    label: scenario.label,
    effectiveVolume: round(effectiveVolume, 2),
    effectiveAutomationRate,
    effectiveAICost,
  };
}
