import { DEFAULT_FORM, DEFAULT_PROJECT, DEFAULT_COMMERCIAL, DEFAULT_SCENARIOS, DEFAULT_SIMULATION } from "./presets";
import type { PersistedState } from "./types";

const KEY = "roi-tco-calculator:v1";
export const STATE_VERSION = 1;

export function defaultState(): PersistedState {
  return {
    version: STATE_VERSION,
    project: { ...DEFAULT_PROJECT },
    form: { ...DEFAULT_FORM },
    commercial: { ...DEFAULT_COMMERCIAL },
    scenarios: structuredClone(DEFAULT_SCENARIOS),
    guidedMode: false,
    simulation: structuredClone(DEFAULT_SIMULATION),
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    // Merge defensively so old/partial saves never crash the app.
    const base = defaultState();
    return {
      version: STATE_VERSION,
      project: { ...base.project, ...parsed.project },
      form: { ...base.form, ...parsed.form },
      commercial: { ...base.commercial, ...parsed.commercial },
      scenarios:
        Array.isArray(parsed.scenarios) && parsed.scenarios.length === 3
          ? (parsed.scenarios as typeof base.scenarios)
          : base.scenarios,
      guidedMode: Boolean(parsed.guidedMode),
      simulation: {
        ...base.simulation,
        ...parsed.simulation,
        automationSchedule:
          Array.isArray(parsed.simulation?.automationSchedule) && parsed.simulation.automationSchedule.length === 12
            ? parsed.simulation.automationSchedule
            : base.simulation.automationSchedule,
      },
    };
  } catch {
    return defaultState();
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** Debounced autosave. */
export function saveState(state: PersistedState): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / private mode errors */
    }
  }, 350);
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
