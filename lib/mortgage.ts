import { MIN_DOWN_PAYMENT, STRESS_TEST } from './assumptions';

/** Minimum down payment required in dollars for a given purchase price. */
export function minimumDownPayment(price: number): number {
  const r = MIN_DOWN_PAYMENT.value;
  if (price >= r.insuranceUnavailableAtOrAbove) return price * r.uninsuredMinRate;
  if (price <= r.tier1UpTo) return price * r.tier1Rate;
  return r.tier1UpTo * r.tier1Rate + (price - r.tier1UpTo) * r.tier2Rate;
}

/** Whether mortgage default insurance is available at this price. */
export function insuranceAvailable(price: number): boolean {
  return price < MIN_DOWN_PAYMENT.value.insuranceUnavailableAtOrAbove;
}

/** OSFI minimum qualifying rate: greater of contract + 2% or the 5.25% floor. */
export function qualifyingRate(contractRate: number): number {
  return Math.max(contractRate + STRESS_TEST.value.marginOverContract, STRESS_TEST.value.floorRate);
}

/**
 * Monthly payment for a fixed-rate mortgage.
 *
 * Canadian fixed-rate mortgages are compounded semi-annually, not monthly, so
 * the nominal annual rate must be converted to an effective monthly rate before
 * amortising. Using the US convention (rate/12) overstates the payment by a
 * small but real amount, which matters when the output is a pass/fail gate.
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  compounding: 'semi-annual' | 'monthly' = 'semi-annual',
): number {
  if (principal <= 0) return 0;
  const n = amortizationYears * 12;
  if (annualRate === 0) return principal / n;

  const i =
    compounding === 'semi-annual'
      ? Math.pow(1 + annualRate / 2, 2 / 12) - 1
      : annualRate / 12;

  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

export interface DebtServiceInput {
  /** Gross annual income the lender will actually document. */
  annualIncome: number;
  mortgagePaymentMonthly: number;
  propertyTaxMonthly: number;
  heatMonthly: number;
  condoFeeMonthly?: number;
  /** Other monthly debt obligations: practice loan, HELOC, car, cards. */
  otherDebtMonthly?: number;
}

export interface DebtServiceResult {
  gds: number;
  tds: number;
}

/**
 * Gross and total debt service ratios.
 * Lenders count 50% of condo fees toward GDS/TDS.
 */
export function debtServiceRatios(input: DebtServiceInput): DebtServiceResult {
  const monthlyIncome = input.annualIncome / 12;
  if (monthlyIncome <= 0) return { gds: Infinity, tds: Infinity };

  const housing =
    input.mortgagePaymentMonthly +
    input.propertyTaxMonthly +
    input.heatMonthly +
    (input.condoFeeMonthly ?? 0) * 0.5;

  return {
    gds: housing / monthlyIncome,
    tds: (housing + (input.otherDebtMonthly ?? 0)) / monthlyIncome,
  };
}
