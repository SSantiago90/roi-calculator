// Number parsing & formatting for es-AR with USD currency.
// Accepts common input formats without misreading decimal separators.

/**
 * Parse a user-entered number string.
 * Rules:
 *  - strip spaces and currency symbols
 *  - if both "." and "," present: "." = thousands, "," = decimal
 *  - if only ",": treat as decimal separator
 *  - if only ".": treat as decimal separator (e.g. "1200.5")
 * Returns null when empty or not parseable so callers can distinguish
 * "missing" from an intentional zero.
 */
export function parseNumber(raw: string): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[\s$]/g, "").replace(/USD/gi, "");
  if (cleaned === "") return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized: string;
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned; // keep dots as decimal
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

const currencyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyFmtCents = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFmt = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

const pctFmt = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

export function money(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return currencyFmt.format(v);
}

export function moneyPrecise(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return currencyFmtCents.format(v);
}

export function number(v: number | null | undefined, decimals?: number): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (decimals != null) {
    return new Intl.NumberFormat("es-AR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0,
    }).format(v);
  }
  return numberFmt.format(v);
}

/** fraction (0..1) => "80 %" ; allows >1 to show e.g. break-even unreachable */
export function percent(fraction: number | null | undefined, digits = 0): string {
  if (fraction == null || !Number.isFinite(fraction)) return "—";
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
  }).format(fraction * 100)} %`;
}

export function percentValue(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${pctFmt.format(v)} %`;
}

/** Format a payback expressed in months into a readable phrase. */
export function payback(months: number | null | undefined): string {
  if (months == null || !Number.isFinite(months)) {
    return "No se recupera con los supuestos actuales.";
  }
  if (months < 1) {
    const days = Math.round(months * 30);
    return `~ ${days} días`;
  }
  const m = Math.floor(months);
  const remDays = Math.round((months - m) * 30);
  if (m >= 12) {
    const years = months / 12;
    return `~ ${number(years, 1)} años`;
  }
  return remDays > 0
    ? `~ ${m} m ${remDays} d`
    : `~ ${m} meses`;
}
