import type { FinancialResult, ModelInputs, MonthlyProjection, ScenarioConfig, ScenarioResult } from "./types";

export function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roi(net: number, cost: number): number | null {
  return cost > 0 ? round((net / cost) * 100, 2) : null;
}

function paybackFromProjection(projection: MonthlyProjection[], key: "potentialNet" | "realizedNet", initial: number): number | null {
  if (initial <= 0) return 0;
  let balance = -initial;
  for (const month of projection) {
    const start = balance;
    balance = round(balance + month[key]);
    if (balance >= 0 && month[key] > 0) {
      return round(month.month - 1 + (-start / month[key]), 2);
    }
  }
  const last = projection.at(-1);
  return last && last[key] > 0 ? round(12 + (-balance / last[key]), 2) : null;
}

/** Single source of truth for fixed and progressive first-year economics. */
export function computeModel(input: ModelInputs): FinancialResult {
  const volume = Math.max(0, num(input.monthlyVolume));
  const minutes = Math.max(0, num(input.minutesPerCase));
  const hourly = Math.max(0, num(input.hourlyHumanCost));
  const fixedRate = clampRate(num(input.automationRate));
  const capture = clampRate(num(input.captureRate));
  const monthlyManualHours = round((volume * minutes) / 60, 4);
  const manualLaborValue = round(monthlyManualHours * hourly);
  const monthlySupportCost = round(Math.max(0, num(input.supportHours)) * Math.max(0, num(input.supportHourlyRate)));
  const recurringOther = round(Math.max(0, num(input.thirdPartyApiCost)) + Math.max(0, num(input.softwareLicenseCost)) + Math.max(0, num(input.otherRecurringCosts)));
  const totalInitialInvestment = round(Math.max(0, num(input.setupCost)) + Math.max(0, num(input.additionalOneTimeCosts)));
  const processedRate = clampRate(num(input.aiProcessedRate));
  const monthlyAIProcessedCases = round(volume * processedRate, 4);
  const monthlyAIExpense = calculateAIExpense(input, monthlyAIProcessedCases);
  const monthlyTCO = round(monthlyAIExpense + Math.max(0, num(input.monthlyInfrastructureCost)) + monthlySupportCost + recurringOther);
  const schedule = input.progressiveEnabled
    ? Array.from({ length: 12 }, (_, index) => clampRate(input.automationSchedule[index] ?? 0))
    : Array.from({ length: 12 }, () => fixedRate);

  let potentialBalance = -totalInitialInvestment;
  let realizedBalance = -totalInitialInvestment;
  const monthlyProjection: MonthlyProjection[] = schedule.map((automationRate, index) => {
    const potentialValue = round(manualLaborValue * automationRate);
    const realizedValue = round(potentialValue * capture);
    const potentialNet = round(potentialValue - monthlyTCO);
    const realizedNet = round(realizedValue - monthlyTCO);
    potentialBalance = round(potentialBalance + potentialNet);
    realizedBalance = round(realizedBalance + realizedNet);
    return {
      month: index + 1,
      automationRate,
      aiProcessedCases: monthlyAIProcessedCases,
      aiExpense: monthlyAIExpense,
      monthlyTCO,
      potentialValue,
      realizedValue,
      potentialNet,
      realizedNet,
      cumulativePotentialBalance: potentialBalance,
      cumulativeRealizedBalance: realizedBalance,
    };
  });

  const automatedCases = round(volume * fixedRate, 4);
  const releasedHours = round(monthlyManualHours * fixedRate, 4);
  const remainingCases = round(volume - automatedCases, 4);
  const remainingManualHours = round(monthlyManualHours - releasedHours, 4);
  const releasedCapacityValue = round(releasedHours * hourly);
  const firstYearPotentialValue = round(monthlyProjection.reduce((sum, month) => sum + month.potentialValue, 0));
  const realizedFirstYearValue = round(monthlyProjection.reduce((sum, month) => sum + month.realizedValue, 0));
  const firstYearTCO = round(totalInitialInvestment + monthlyProjection.reduce((sum, month) => sum + month.monthlyTCO, 0));
  const firstYearPotentialNetValue = round(firstYearPotentialValue - firstYearTCO);
  const potentialMonthlyNetValue = round(releasedCapacityValue - monthlyTCO);
  const realizedMonthlyBenefit = round(releasedCapacityValue * capture);
  const realizedMonthlyNetBenefit = round(realizedMonthlyBenefit - monthlyTCO);
  const breakEvenRate = manualLaborValue > 0 ? round(monthlyTCO / manualLaborValue, 6) : null;
  const potentialPaybackMonths = paybackFromProjection(monthlyProjection, "potentialNet", totalInitialInvestment);
  const realizedPaybackMonths = capture > 0 ? paybackFromProjection(monthlyProjection, "realizedNet", totalInitialInvestment) : null;

  return {
    monthlyManualHours: round(monthlyManualHours, 2),
    manualLaborValue,
    automatedCases,
    remainingCases,
    releasedHours: round(releasedHours, 2),
    remainingManualHours: round(remainingManualHours, 2),
    releasedCapacityValue,
    monthlySupportCost,
    monthlyAIProcessedCases,
    monthlyAIExpense,
    otherRecurringCosts: recurringOther,
    monthlyTCO,
    totalInitialInvestment,
    firstYearTCO,
    potentialMonthlyNetValue,
    potentialMonthlyROI: roi(potentialMonthlyNetValue, monthlyTCO),
    firstYearPotentialValue,
    firstYearPotentialNetValue,
    firstYearPotentialROI: roi(firstYearPotentialNetValue, firstYearTCO),
    monthlyPotentialSurplus: potentialMonthlyNetValue,
    potentialPaybackMonths,
    realizedPaybackMonths,
    breakEvenRate,
    breakEvenReachable: breakEvenRate !== null && breakEvenRate <= 1,
    costPerAutomatedCase: automatedCases > 0 ? round(monthlyTCO / automatedCases, 2) : null,
    realizedMonthlyBenefit,
    realizedMonthlyNetBenefit,
    realizedFirstYearROI: roi(realizedFirstYearValue - firstYearTCO, firstYearTCO),
    captureConfigured: capture > 0,
    deploymentMode: input.progressiveEnabled ? "progressive" : "fixed",
    averageFirstYearAutomationRate: round(schedule.reduce((sum, rate) => sum + rate, 0) / 12, 6),
    monthlyProjection,
  };
}

function calculateAIExpense(input: ModelInputs, processedCases: number): number {
  const fixed = Math.max(0, num(input.monthlyAICost));
  if (input.aiCostModel === "fixed") return round(fixed);
  return round(fixed + processedCases * Math.max(0, num(input.variableAICostPerCase)));
}

export function clampRate(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.min(1, Math.max(0, fraction));
}

export function percentToFraction(raw: string): number {
  const parsed = Number(raw.replace(/[%\s]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? clampRate(parsed / 100) : 0;
}

export function evaluateScenario(base: ModelInputs, scenario: ScenarioConfig): ScenarioResult {
  const assumptions = scenario.assumptions;
  const effectiveVolume = round(base.monthlyVolume * num(assumptions.volumeFactor), 4);
  const effectiveAutomationRate = clampRate(num(assumptions.automationRate));
  const effectiveAICost = round(base.monthlyAICost * num(assumptions.aiCostFactor));
  const result = computeModel({
    ...base,
    monthlyVolume: effectiveVolume,
    automationRate: effectiveAutomationRate,
    monthlyAICost: effectiveAICost,
    variableAICostPerCase: base.variableAICostPerCase * num(assumptions.aiCostFactor),
    progressiveEnabled: false,
  });
  return { ...result, label: scenario.label, effectiveVolume: round(effectiveVolume, 2), effectiveAutomationRate, effectiveAICost: result.monthlyAIExpense };
}

export function evaluateAutomationSensitivity(base: ModelInputs, rates = [0.2, 0.4, 0.6, 0.8, 1]): { rate: number; roi: number | null }[] {
  return rates.map((rate) => ({ rate, roi: computeModel({ ...base, automationRate: rate, progressiveEnabled: false }).firstYearPotentialROI }));
}
