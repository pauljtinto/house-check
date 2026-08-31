import {
  ONTARIO_LTT_BRACKETS,
  TORONTO_MLTT_BRACKETS,
  TORONTO_MLTT_ADMIN_FEE,
  HST_RATE,
  type TaxBracket,
} from './assumptions';

/** Apply marginal brackets to a value. Returns tax in dollars (unrounded). */
export function applyBrackets(value: number, brackets: TaxBracket[]): number {
  if (value <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (value <= lower) break;
    const taxableInBand = Math.min(value, upper) - lower;
    tax += taxableInBand * b.rate;
    lower = upper;
  }
  return tax;
}

export interface LandTransferTax {
  ontario: number;
  toronto: number;
  adminFee: number;
  total: number;
  /** Combined marginal rate at this price — what one more dollar costs. */
  marginalRate: number;
}

/**
 * Land transfer tax for a residential purchase in the City of Toronto.
 *
 * Assumes the property contains one or two single-family residences, which is
 * what unlocks the graduated tiers above $400k. A triplex or larger caps at
 * 1.5% above $400k under both statutes — pass `oneOrTwoFamily: false` for those.
 */
export function landTransferTax(
  price: number,
  opts: { oneOrTwoFamily?: boolean; firstTimeBuyerRebate?: { ontario: number; toronto: number } } = {},
): LandTransferTax {
  const { oneOrTwoFamily = true } = opts;

  const onBrackets = oneOrTwoFamily
    ? ONTARIO_LTT_BRACKETS.value
    : capAt(ONTARIO_LTT_BRACKETS.value, 400_000, 0.015);
  const toBrackets = oneOrTwoFamily
    ? TORONTO_MLTT_BRACKETS.value
    : capAt(TORONTO_MLTT_BRACKETS.value, 400_000, 0.02);

  let ontario = applyBrackets(price, onBrackets);
  let toronto = applyBrackets(price, toBrackets);

  if (opts.firstTimeBuyerRebate) {
    ontario = Math.max(0, ontario - opts.firstTimeBuyerRebate.ontario);
    toronto = Math.max(0, toronto - opts.firstTimeBuyerRebate.toronto);
  }

  const adminFee = TORONTO_MLTT_ADMIN_FEE.value * (1 + HST_RATE);
  const marginalRate = marginalRateAt(price, onBrackets) + marginalRateAt(price, toBrackets);

  return {
    ontario,
    toronto,
    adminFee,
    total: ontario + toronto + adminFee,
    marginalRate,
  };
}

function capAt(brackets: TaxBracket[], threshold: number, rate: number): TaxBracket[] {
  const kept = brackets.filter((b) => b.upTo !== null && b.upTo <= threshold);
  return [...kept, { upTo: null, rate }];
}

function marginalRateAt(price: number, brackets: TaxBracket[]): number {
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (price > lower && price <= upper) return b.rate;
    lower = upper;
  }
  return brackets[brackets.length - 1].rate;
}

/**
 * What each additional $100k of purchase price costs in land transfer tax.
 * Used by the stretch-band panel.
 */
export function stretchTaxTable(from: number, to: number, step = 100_000) {
  const rows: { price: number; total: number; deltaFromBase: number }[] = [];
  const base = landTransferTax(from).total;
  for (let p = from; p <= to; p += step) {
    const total = landTransferTax(p).total;
    rows.push({ price: p, total, deltaFromBase: total - base });
  }
  return rows;
}
