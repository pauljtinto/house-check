import { describe, it, expect } from 'vitest';
import { landTransferTax, applyBrackets, stretchTaxTable } from '../landTransferTax';
import {
  minimumDownPayment,
  insuranceAvailable,
  qualifyingRate,
  monthlyPayment,
  debtServiceRatios,
} from '../mortgage';
import { classifyListPrice, fitsBudget } from '../listPriceStrategy';
import { ONTARIO_LTT_BRACKETS, TORONTO_MLTT_BRACKETS } from '../assumptions';

describe('land transfer tax', () => {
  it('computes Ontario LTT at the $1.5M reference price', () => {
    // 55,000 @ 0.5% = 275
    // 195,000 @ 1.0% = 1,950
    // 150,000 @ 1.5% = 2,250
    // 1,100,000 @ 2.0% = 22,000
    expect(applyBrackets(1_500_000, ONTARIO_LTT_BRACKETS.value)).toBeCloseTo(26_475, 2);
  });

  it('computes Toronto MLTT identically below $2M', () => {
    expect(applyBrackets(1_500_000, TORONTO_MLTT_BRACKETS.value)).toBeCloseTo(26_475, 2);
  });

  it('totals roughly $53k at the pre-approval ceiling', () => {
    const t = landTransferTax(1_500_000);
    expect(t.ontario).toBeCloseTo(26_475, 2);
    expect(t.toronto).toBeCloseTo(26_475, 2);
    expect(t.adminFee).toBeCloseTo(115.89, 2);
    expect(t.total).toBeCloseTo(53_065.89, 2);
  });

  it('applies a 4% combined marginal rate between $400k and $2M', () => {
    expect(landTransferTax(1_500_000).marginalRate).toBeCloseTo(0.04, 6);
    const a = landTransferTax(1_500_000).total;
    const b = landTransferTax(1_600_000).total;
    expect(b - a).toBeCloseTo(4_000, 2);
  });

  it('applies the new April 2026 Toronto $2M-$3M tier', () => {
    // Above $2M: Ontario 2.5% + Toronto 2.5% = 5% combined marginal.
    expect(landTransferTax(2_500_000).marginalRate).toBeCloseTo(0.05, 6);
    const a = landTransferTax(2_100_000).total;
    const b = landTransferTax(2_200_000).total;
    expect(b - a).toBeCloseTo(5_000, 2);
  });

  it('caps non one-or-two-family property at the lower rates', () => {
    // A triplex gets no graduated tier above $400k.
    const sfr = landTransferTax(2_600_000, { oneOrTwoFamily: true });
    const plex = landTransferTax(2_600_000, { oneOrTwoFamily: false });
    expect(plex.total).toBeLessThan(sfr.total);
    expect(plex.marginalRate).toBeCloseTo(0.015 + 0.02, 6);
  });

  it('returns zero for a zero or negative price', () => {
    expect(applyBrackets(0, ONTARIO_LTT_BRACKETS.value)).toBe(0);
    expect(applyBrackets(-5, ONTARIO_LTT_BRACKETS.value)).toBe(0);
  });

  it('builds a stretch table with a rising delta', () => {
    const rows = stretchTaxTable(1_500_000, 1_800_000);
    expect(rows).toHaveLength(4);
    expect(rows[0].deltaFromBase).toBe(0);
    expect(rows[3].deltaFromBase).toBeCloseTo(12_000, 2);
  });
});

describe('minimum down payment', () => {
  it('is 5% below $500k', () => {
    expect(minimumDownPayment(400_000)).toBeCloseTo(20_000, 2);
  });

  it('is tiered between $500k and $1.5M', () => {
    // 25,000 + 10% of 500,000
    expect(minimumDownPayment(1_000_000)).toBeCloseTo(75_000, 2);
  });

  it('jumps to 20% at exactly $1.5M', () => {
    expect(minimumDownPayment(1_499_999)).toBeCloseTo(124_999.9, 1);
    expect(minimumDownPayment(1_500_000)).toBeCloseTo(300_000, 2);
  });

  it('knows insurance is unavailable at and above $1.5M', () => {
    expect(insuranceAvailable(1_499_999)).toBe(true);
    expect(insuranceAvailable(1_500_000)).toBe(false);
  });
});

describe('stress test', () => {
  it('uses the floor when the contract rate is low', () => {
    expect(qualifyingRate(0.03)).toBeCloseTo(0.0525, 6);
  });

  it('uses contract + 2% when that is higher', () => {
    expect(qualifyingRate(0.045)).toBeCloseTo(0.065, 6);
  });
});

describe('monthly payment', () => {
  it('uses semi-annual compounding by default (Canadian convention)', () => {
    const semi = monthlyPayment(1_000_000, 0.05, 25, 'semi-annual');
    const monthly = monthlyPayment(1_000_000, 0.05, 25, 'monthly');
    // Semi-annual compounding gives a lower effective monthly rate.
    expect(semi).toBeLessThan(monthly);
    // $1M at 5% over 25 years, semi-annual compounding ≈ $5,816/mo.
    expect(semi).toBeCloseTo(5_816.05, 1);
  });

  it('handles a zero rate as straight-line amortisation', () => {
    expect(monthlyPayment(300_000, 0, 25)).toBeCloseTo(1_000, 6);
  });

  it('returns zero for no principal', () => {
    expect(monthlyPayment(0, 0.05, 25)).toBe(0);
  });

  it('produces a higher payment at the stressed rate', () => {
    const contract = monthlyPayment(1_200_000, 0.045, 30);
    const stressed = monthlyPayment(1_200_000, qualifyingRate(0.045), 30);
    expect(stressed).toBeGreaterThan(contract);
  });
});

describe('debt service ratios', () => {
  it('counts half of condo fees', () => {
    const r = debtServiceRatios({
      annualIncome: 300_000,
      mortgagePaymentMonthly: 5_000,
      propertyTaxMonthly: 500,
      heatMonthly: 150,
      condoFeeMonthly: 600,
    });
    // (5000 + 500 + 150 + 300) / 25000
    expect(r.gds).toBeCloseTo(0.238, 3);
  });

  it('adds other debt only to TDS', () => {
    const r = debtServiceRatios({
      annualIncome: 300_000,
      mortgagePaymentMonthly: 5_000,
      propertyTaxMonthly: 500,
      heatMonthly: 150,
      otherDebtMonthly: 4_000,
    });
    expect(r.gds).toBeCloseTo(0.2260, 3);
    expect(r.tds).toBeCloseTo(0.3860, 3);
  });

  it('guards against zero income', () => {
    const r = debtServiceRatios({
      annualIncome: 0,
      mortgagePaymentMonthly: 1,
      propertyTaxMonthly: 1,
      heatMonthly: 1,
    });
    expect(r.gds).toBe(Infinity);
  });
});

describe('list price strategy', () => {
  it('flags the offer-night band and predicts well above ask', () => {
    const v = classifyListPrice(999_000);
    expect(v.strategy).toBe('offer-night-underpriced');
    expect(v.predicted!.median).toBeGreaterThan(1_250_000);
    expect(v.n).toBe(5);
  });

  it('reproduces the observed landing zone for a $999k listing', () => {
    // Comps: 91 Borden $999k -> $1,195,800 and 138 Major $999k -> $1,419,000.
    const v = classifyListPrice(999_000);
    expect(v.predicted!.low).toBeCloseTo(1_195_803, 0);
    expect(v.predicted!.high).toBeCloseTo(1_418_580, 0);
  });

  it('treats a very low list price as a warning, not a bargain', () => {
    const v = classifyListPrice(849_000);
    expect(v.strategy).toBe('unknown');
    expect(v.confidence).toBe('low');
  });

  it('expects a discount on listings above $1.5M', () => {
    const v = classifyListPrice(1_700_000);
    expect(v.strategy).toBe('priced-to-market');
    expect(v.predicted!.median).toBeLessThan(1_700_000);
  });

  it('widens the discount for a stale listing', () => {
    const fresh = classifyListPrice(1_700_000);
    const stale = classifyListPrice(1_700_000, 45);
    expect(stale.predicted!.median).toBeLessThan(fresh.predicted!.median);
  });

  it('narrows the discount for a fast-moving listing', () => {
    const fast = classifyListPrice(1_700_000, 5);
    expect(fast.predicted!.median).toBeGreaterThanOrEqual(1_700_000);
  });
});

describe('budget fit — the point of the whole exercise', () => {
  it('rejects a $1.2M listing against a $1.5M ceiling despite the low ask', () => {
    // Predicted median 1.2M * 1.289 = $1,546,800 — over the ceiling.
    const f = fitsBudget(1_200_000, 1_500_000);
    expect(f.verdict).toBe('stretch');
    expect(f.predictedMedian!).toBeGreaterThan(1_500_000);
  });

  it('accepts a $999k listing against a $1.5M ceiling', () => {
    const f = fitsBudget(999_000, 1_500_000);
    expect(f.verdict).toBe('within');
  });

  it('accepts a $1.55M listing against a $1.5M ceiling, because it will discount', () => {
    const f = fitsBudget(1_550_000, 1_500_000);
    expect(f.verdict).toBe('within');
    expect(f.predictedMedian!).toBeLessThan(1_500_000);
  });

  it('rejects a listing whose whole predicted range clears the ceiling', () => {
    const f = fitsBudget(1_900_000, 1_500_000);
    expect(f.verdict).toBe('out');
  });
});
