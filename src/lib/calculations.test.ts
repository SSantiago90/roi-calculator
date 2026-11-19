import { describe, expect, it } from "vitest";
import { computeModel, evaluateScenario, percentToFraction } from "./calculations";
import type { ModelInputs, ScenarioConfig } from "./types";
import { EXAMPLE_FORM, getCompleteness, toModelInputs } from "./presets";

/** Base inputs replicating the "Inmobiliaria Delta" example. */
function delta(): ModelInputs {
  return {
    monthlyVolume: 1200,
    minutesPerCase: 12,
    hourlyHumanCost: 15,
    automationRate: 0.8,
    captureRate: 0,
    setupCost: 3000,
    monthlyAICost: 400,
    monthlyInfrastructureCost: 100,
    supportHours: 8,
    supportHourlyRate: 30,
    thirdPartyApiCost: 0,
    softwareLicenseCost: 0,
    otherRecurringCosts: 0,
    additionalOneTimeCosts: 0,
    progressiveEnabled: false,
    automationSchedule: Array.from({ length: 12 }, () => 0.8),
    aiCostModel: "fixed",
    variableAICostPerCase: 0,
    aiProcessedRate: 1,
  };
}

describe("computeModel — Inmobiliaria Delta base scenario", () => {
  it("matches the documented expected figures", () => {
    const r = computeModel(delta());
    expect(r.monthlyManualHours).toBe(240);
    expect(r.manualLaborValue).toBe(3600);
    expect(r.monthlySupportCost).toBe(240);
    expect(r.monthlyTCO).toBe(740);
    expect(r.releasedHours).toBe(192);
    expect(r.releasedCapacityValue).toBe(2880);
    expect(r.monthlyPotentialSurplus).toBe(2140);
    expect(r.potentialPaybackMonths).toBe(1.4); // 3000 / 2140 ≈ 1.40
    expect(r.firstYearTCO).toBe(11880);
    expect(r.firstYearPotentialROI).toBeCloseTo(190.91, 1);
  });
});

describe("edge cases", () => {
  it("handles zero monthly volume without NaN", () => {
    const r = computeModel({ ...delta(), monthlyVolume: 0 });
    expect(r.monthlyManualHours).toBe(0);
    expect(r.releasedCapacityValue).toBe(0);
    expect(r.costPerAutomatedCase).toBeNull();
    expect(Number.isNaN(r.firstYearPotentialROI)).toBe(false);
  });

  it("handles zero automation rate", () => {
    const r = computeModel({ ...delta(), automationRate: 0 });
    expect(r.releasedHours).toBe(0);
    expect(r.releasedCapacityValue).toBe(0);
    expect(r.automatedCases).toBe(0);
    expect(r.remainingManualHours).toBe(240);
    expect(r.potentialMonthlyNetValue).toBe(-r.monthlyTCO);
  });

  it("handles 100% automation", () => {
    const r = computeModel({ ...delta(), automationRate: 1 });
    expect(r.releasedHours).toBe(240);
    expect(r.remainingManualHours).toBe(0);
    expect(r.automatedCases).toBe(1200);
    expect(r.releasedCapacityValue).toBe(3600);
  });

  it("handles zero recurring costs (no division crash)", () => {
    const r = computeModel({
      ...delta(),
      monthlyAICost: 0,
      monthlyInfrastructureCost: 0,
      supportHours: 0,
    });
    expect(r.monthlyTCO).toBe(0);
    // No operating cost -> operational ROI is undefined, not Infinity.
    expect(r.potentialMonthlyROI).toBeNull();
    expect(r.costPerAutomatedCase).toBe(0);
  });

  it("produces a negative potential ROI when capacity value < costs", () => {
    const r = computeModel({ ...delta(), hourlyHumanCost: 1, automationRate: 0.1 });
    expect(r.firstYearPotentialROI!).toBeLessThan(0);
  });

  it("reports negative monthly net benefit correctly", () => {
    const r = computeModel({ ...delta(), monthlyAICost: 5000 });
    expect(r.potentialMonthlyNetValue).toBeLessThan(0);
  });

  it("marks payback unavailable when surplus <= 0", () => {
    const r = computeModel({ ...delta(), monthlyAICost: 4000 });
    expect(r.monthlyPotentialSurplus).toBeLessThanOrEqual(0);
    expect(r.potentialPaybackMonths).toBeNull();
  });

  it("flags break-even above 100% as unreachable", () => {
    // Huge recurring cost vs tiny labor value -> requires > 100% automation.
    const r = computeModel({ ...delta(), hourlyHumanCost: 1, monthlyAICost: 9000 });
    expect(r.breakEvenRate).not.toBeNull();
    expect(r.breakEvenReachable).toBe(false);
  });

  it("distinguishes 0% captured value from 100% potential capacity", () => {
    const r = computeModel({ ...delta(), captureRate: 0 });
    expect(r.captureConfigured).toBe(false);
    expect(r.realizedMonthlyBenefit).toBe(0);
    expect(r.releasedCapacityValue).toBe(2880); // potential still reported
    expect(r.realizedFirstYearROI!).toBeLessThan(r.firstYearPotentialROI!);
  });

  it("changing setup affects first-year ROI but not monthly operating TCO", () => {
    const a = computeModel(delta());
    const b = computeModel({ ...delta(), setupCost: 9000 });
    expect(b.monthlyTCO).toBe(a.monthlyTCO); // unchanged
    expect(b.firstYearTCO).toBeGreaterThan(a.firstYearTCO);
    expect(b.firstYearPotentialROI!).toBeLessThan(a.firstYearPotentialROI!);
  });

  it("includes additional one-time costs exactly once", () => {
    const base = computeModel(delta());
    const withExtra = computeModel({ ...delta(), additionalOneTimeCosts: 500 });
    expect(withExtra.firstYearTCO - base.firstYearTCO).toBe(500);
    expect(withExtra.monthlyTCO).toBe(base.monthlyTCO); // not recurring
    expect(withExtra.totalInitialInvestment).toBe(base.totalInitialInvestment + 500);
  });
});

describe("helpers", () => {
  it("percentToFraction clamps and converts", () => {
    expect(percentToFraction("80")).toBe(0.8);
    expect(percentToFraction("80%")).toBe(0.8);
    expect(percentToFraction("150")).toBe(1);
    expect(percentToFraction("-5")).toBe(0);
  });

  it("evaluateScenario overrides assumptions and inherits context", () => {
    const scenario: ScenarioConfig = {
      id: "conservador",
      label: "Conservador",
      assumptions: { volumeFactor: 0.7, automationRate: 0.6, aiCostFactor: 1.2 },
    };
    const r = evaluateScenario(delta(), scenario);
    expect(r.effectiveVolume).toBeCloseTo(840, 3);
    expect(r.effectiveAICost).toBe(480);
    // Support cost inherited from base (unchanged).
    expect(r.monthlySupportCost).toBe(240);
  });

  it("keeps a missing required value distinguishable from an explicit zero", () => {
    const missing = { ...EXAMPLE_FORM, monthlyVolume: "" };
    const zero = { ...EXAMPLE_FORM, monthlyVolume: "0" };
    expect(toModelInputs(missing).monthlyVolume).toBe(0);
    expect(toModelInputs(zero).monthlyVolume).toBe(0);
    expect(getCompleteness(missing).volume).toBe(false);
    expect(getCompleteness(zero).volume).toBe(true);
  });
});

describe("deployment and AI cost models", () => {
  it("uses each progressive automation rate for first-year value", () => {
    const schedule = [0, 0.2, 0.4, 0.5, 0.65, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8];
    const result = computeModel({ ...delta(), progressiveEnabled: true, automationSchedule: schedule });
    expect(result.deploymentMode).toBe("progressive");
    expect(result.firstYearPotentialValue).toBeCloseTo(3600 * schedule.reduce((sum, rate) => sum + rate, 0), 2);
    expect(result.firstYearPotentialValue).toBeLessThan(computeModel(delta()).firstYearPotentialValue);
  });

  it("keeps fixed mode backward-compatible", () => {
    const result = computeModel(delta());
    expect(result.monthlyAIExpense).toBe(400);
    expect(result.averageFirstYearAutomationRate).toBe(0.8);
    expect(result.monthlyProjection).toHaveLength(12);
  });

  it("charges variable AI cost for all AI-processed cases", () => {
    const result = computeModel({ ...delta(), aiCostModel: "variable", monthlyAICost: 100, variableAICostPerCase: 0.25, aiProcessedRate: 1 });
    expect(result.monthlyAIProcessedCases).toBe(1200);
    expect(result.monthlyAIExpense).toBe(400);
    expect(result.monthlyTCO).toBe(740);
  });

  it("tracks potential and realized cumulative recovery separately", () => {
    const result = computeModel({ ...delta(), captureRate: 0.5 });
    expect(result.monthlyProjection[0].cumulativePotentialBalance).toBe(-860);
    expect(result.monthlyProjection[0].cumulativeRealizedBalance).toBe(-2300);
    expect(result.potentialPaybackMonths).toBeLessThan(result.realizedPaybackMonths!);
  });

  it("returns no payback when monthly net value never becomes positive", () => {
    const result = computeModel({ ...delta(), monthlyAICost: 5000, captureRate: 1 });
    expect(result.potentialPaybackMonths).toBeNull();
    expect(result.realizedPaybackMonths).toBeNull();
    expect(result.monthlyProjection[11].cumulativePotentialBalance).toBeLessThan(0);
  });
});
