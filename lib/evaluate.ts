import { landTransferTax } from './landTransferTax';
import { minimumDownPayment, monthlyPayment, qualifyingRate, debtServiceRatios } from './mortgage';
import { classifyListPrice, type StrategyVerdict } from './listPriceStrategy';
import { bikeability, type BikeabilityResult } from './bikeability';
import { DEFAULTS, TORONTO_PROPERTY_TAX_RATE, DEBT_SERVICE_LIMITS } from './assumptions';
import type { Listing, BuyerProfile, PillarScores } from './types';

export type GateState = 'pass' | 'warn' | 'fail';

export interface Gate {
  name: string;
  state: GateState;
  detail: string;
}

export interface CashToClose {
  purchasePrice: number;
  downPayment: number;
  minimumRequired: number;
  ontarioLtt: number;
  torontoMltt: number;
  adminFee: number;
  legal: number;
  titleInsurance: number;
  inspection: number;
  total: number;
  cashRemaining: number;
}

export interface Carry {
  mortgagePrincipal: number;
  mortgageMonthly: number;
  stressedMonthly: number;
  propertyTaxMonthly: number;
  insuranceMonthly: number;
  maintenanceMonthly: number;
  condoCarryMonthly: number;
  condoRentOffset: number;
  suiteIncome: number;
  /** Everything, both properties, before any rental income. */
  grossMonthly: number;
  /** After condo rent and suite income. */
  effectiveMonthly: number;
  gds: number;
  tds: number;
}

export interface Evaluation {
  listing: Listing;
  strategy: StrategyVerdict;
  /** Price the model runs on: predicted landing price, not the ask. */
  modelledPrice: number;
  bike: BikeabilityResult;
  gates: Gate[];
  cash: CashToClose;
  carryRented: Carry;
  carryEmpty: Carry;
  pillarScore: number | null;
  verdict: 'buy' | 'stretch' | 'walk';
  headline: string;
  whatWouldHaveToBeTrue: string[];
  flags: string[];
}

export function evaluate(listing: Listing, profile: BuyerProfile): Evaluation {
  const strategy = classifyListPrice(listing.listPrice, listing.daysOnMarket, listing.holdbackOffers ?? false);
  const modelledPrice = strategy.predicted?.median ?? listing.listPrice;

  const bike = bikeability(listing, profile.bikeabilityThreshold);
  const oneOrTwoFamily = listing.type !== 'Triplex';
  const cash = cashToClose(modelledPrice, profile, oneOrTwoFamily);
  const carryRented = carry(listing, profile, modelledPrice, true);
  const carryEmpty = carry(listing, profile, modelledPrice, false);

  const gates: Gate[] = [];
  const flags: string[] = [];
  const wwhtbt: string[] = [];

  // --- Gate: bikeability -----------------------------------------------
  gates.push({
    name: 'Bikeability',
    state: !bike.assessed ? 'warn' : bike.passes ? 'pass' : 'fail',
    detail: !bike.assessed
      ? 'Not assessed — enter the distance to the nearest protected lane.'
      : bike.passes
        ? `Scores ${bike.score}/100 (${bike.resilientScore} if the Bill 212 lanes go).`
        : `Scores ${bike.resilientScore}/100 once at-risk lanes are excluded, below your ${profile.bikeabilityThreshold} threshold.`,
  });
  if (bike.resilienceGap > 10) {
    flags.push(
      `${bike.resilienceGap} points of this property's bike score depend on corridors the province ` +
        `is now legally free to remove.`,
    );
  }

  // --- Gate: price ------------------------------------------------------
  let priceState: GateState = 'pass';
  let priceDetail = '';
  if (modelledPrice <= profile.budgetCeiling) {
    priceDetail = `Predicted to land near $${fmt(modelledPrice)}, inside your $${fmt(profile.budgetCeiling)} ceiling.`;
  } else if (modelledPrice <= profile.stretchLimit) {
    priceState = 'warn';
    const extra = modelledPrice - profile.budgetCeiling;
    const extraTax =
      landTransferTax(modelledPrice, { oneOrTwoFamily }).total -
      landTransferTax(profile.budgetCeiling, { oneOrTwoFamily }).total;
    priceDetail =
      `Predicted at $${fmt(modelledPrice)} — $${fmt(extra)} over the ceiling, which also costs ` +
      `$${fmt(extraTax)} in extra land transfer tax.`;
    wwhtbt.push(`You win it near $${fmt(strategy.predicted?.low ?? modelledPrice)} rather than the predicted median.`);
  } else {
    priceState = 'fail';
    priceDetail = `Predicted at $${fmt(modelledPrice)}, past your $${fmt(profile.stretchLimit)} stretch limit.`;
  }
  gates.push({ name: 'Price', state: priceState, detail: priceDetail });

  // --- Gate: cash floor -------------------------------------------------
  let cashState: GateState = 'pass';
  let cashDetail = `$${fmt(cash.total)} to close, leaving $${fmt(cash.cashRemaining)}.`;
  if (cash.cashRemaining < 0) {
    cashState = 'fail';
    cashDetail =
      `$${fmt(cash.total)} needed to close but only $${fmt(profile.cashAvailable)} available — ` +
      `short by $${fmt(-cash.cashRemaining)}.`;
  } else if (cash.downPayment > profile.plannedDownPayment) {
    cashState = 'warn';
    cashDetail =
      `The $${fmt(cash.minimumRequired)} legal minimum down payment at this price exceeds your planned ` +
      `$${fmt(profile.plannedDownPayment)}. Total to close: $${fmt(cash.total)}, leaving $${fmt(cash.cashRemaining)}.`;
  } else if (cash.cashRemaining < profile.reserveFloor) {
    cashState = 'fail';
    cashDetail =
      `$${fmt(cash.total)} to close would leave $${fmt(cash.cashRemaining)}, below your ` +
      `$${fmt(profile.reserveFloor)} reserve floor.`;
    wwhtbt.push(`You lower the reserve floor or find another $${fmt(profile.reserveFloor - cash.cashRemaining)}.`);
  } else if (cash.cashRemaining < profile.reserveFloor * 1.25) {
    cashState = 'warn';
    cashDetail += ' That is uncomfortably close to your reserve floor.';
  }
  gates.push({ name: 'Cash floor', state: cashState, detail: cashDetail });

  // --- Gate: debt service ----------------------------------------------
  const worst = carryEmpty;
  let dsState: GateState = 'pass';
  let dsDetail = `TDS ${(worst.tds * 100).toFixed(1)}% with the condo empty.`;
  if (worst.tds > DEBT_SERVICE_LIMITS.value.tds) {
    dsState = 'fail';
    dsDetail = `TDS ${(worst.tds * 100).toFixed(1)}% with the condo empty, above the ${(DEBT_SERVICE_LIMITS.value.tds * 100).toFixed(0)}% guideline.`;
    if (carryRented.tds <= DEBT_SERVICE_LIMITS.value.tds) {
      wwhtbt.push('The condo is rented — the empty-condo branch fails on debt service.');
    }
  } else if (worst.tds > DEBT_SERVICE_LIMITS.value.tds * 0.9) {
    dsState = 'warn';
    dsDetail += ' Tight.';
  }
  gates.push({ name: 'Debt service', state: dsState, detail: dsDetail });

  // --- Flags ------------------------------------------------------------
  if (listing.heritage === 'designated') {
    flags.push(
      'Heritage designated: street-visible exterior alterations need a permit, and a rear or ' +
        'third-storey addition must not break the roofline ridge from the opposite sidewalk.',
    );
  }
  if (listing.heritage === 'unknown') {
    flags.push('Heritage status not checked — run the address through the City Heritage Property Search.');
  }
  if (listing.suite === 'existing-unverified') {
    flags.push(
      'Suite legality unverified. There is no public registry — ask for the building permit history ' +
        'with a closed final inspection, plus the ESA certificate.',
    );
  }
  if (listing.type === 'Detached') {
    flags.push(
      'Detached pricing is thinly supported in this comp set — only two detached C01 sales are in the model, so treat the predicted landing range as lower confidence.',
    );
  }
  if (listing.type !== 'Detached' && listing.abutsLaneway) {
    flags.push('Sixplex permission is detached-only; this property is capped at four units as-of-right.');
  }
  if (listing.annualPropertyTax && modelledPrice > 0) {
    const impliedRate = listing.annualPropertyTax / modelledPrice;
    if (impliedRate > TORONTO_PROPERTY_TAX_RATE.value * 1.4) {
      flags.push(
        `Listed property tax ($${fmt(listing.annualPropertyTax)}/yr) looks high for this price — ` +
          'check the MPAC assessment.',
      );
    }
  }
  if (listing.dealBreaker) flags.push(`Deal-breaker noted: ${listing.dealBreaker}`);

  // --- Pillars ----------------------------------------------------------
  const pillarScore = weightedPillarScore(listing.scores, profile.weights);

  // --- Verdict ----------------------------------------------------------
  const anyFail = gates.some((g) => g.state === 'fail');
  const anyWarn = gates.some((g) => g.state === 'warn');
  let verdict: Evaluation['verdict'] = 'buy';
  if (anyFail) verdict = 'walk';
  else if (anyWarn) verdict = 'stretch';
  if (listing.dealBreaker) verdict = 'walk';

  const headline =
    verdict === 'walk'
      ? gates.find((g) => g.state === 'fail')?.detail ?? 'A deal-breaker is recorded against this property.'
      : verdict === 'stretch'
        ? gates.find((g) => g.state === 'warn')?.detail ?? 'Workable, with conditions.'
        : `Predicted landing $${fmt(modelledPrice)}, $${fmt(cash.total)} to close, ` +
          `$${fmt(carryEmpty.effectiveMonthly)}/mo carry worst case.`;

  if (carryEmpty.effectiveMonthly > carryRented.effectiveMonthly * 1.15) {
    wwhtbt.push(
      `You find a condo tenant — renting it saves $${fmt(carryEmpty.effectiveMonthly - carryRented.effectiveMonthly)}/mo.`,
    );
  }
  if (listing.suite !== 'none' && listing.suite !== 'existing-legal') {
    wwhtbt.push('The suite turns out to be legal, or can be made legal at a known cost.');
  }

  return {
    listing,
    strategy,
    modelledPrice,
    bike,
    gates,
    cash,
    carryRented,
    carryEmpty,
    pillarScore,
    verdict,
    headline,
    whatWouldHaveToBeTrue: wwhtbt,
    flags,
  };
}

export function cashToClose(
  price: number,
  profile: BuyerProfile,
  /** Graduated LTT tiers above $400k apply only to 1–2 single-family residences. */
  oneOrTwoFamily = true,
): CashToClose {
  const ltt = landTransferTax(price, { oneOrTwoFamily });
  const minimumRequired = minimumDownPayment(price);
  // You cannot put down less than the legal minimum, whatever you planned.
  const downPayment = Math.min(price, Math.max(profile.plannedDownPayment, minimumRequired));

  const closingCosts =
    ltt.ontario + ltt.toronto + ltt.adminFee + DEFAULTS.legalFees + DEFAULTS.titleInsurance + DEFAULTS.homeInspection;
  const total = downPayment + closingCosts;

  return {
    purchasePrice: price,
    downPayment,
    minimumRequired,
    ontarioLtt: ltt.ontario,
    torontoMltt: ltt.toronto,
    adminFee: ltt.adminFee,
    legal: DEFAULTS.legalFees,
    titleInsurance: DEFAULTS.titleInsurance,
    inspection: DEFAULTS.homeInspection,
    total,
    cashRemaining: profile.cashAvailable - total,
  };
}

export function carry(
  listing: Listing,
  profile: BuyerProfile,
  price: number,
  condoRented: boolean,
): Carry {
  const principal = Math.max(0, price - cashToClose(price, profile, listing.type !== 'Triplex').downPayment);
  const mortgageMonthly = monthlyPayment(principal, profile.contractRate, profile.amortizationYears);
  const stressedMonthly = monthlyPayment(
    principal,
    qualifyingRate(profile.contractRate),
    profile.amortizationYears,
  );

  // Prefer the listing's actual tax; MPAC assessments trail purchase price badly.
  const propertyTaxMonthly = (listing.annualPropertyTax ?? price * TORONTO_PROPERTY_TAX_RATE.value) / 12;
  const insuranceMonthly = 200;
  const maintenanceMonthly = (price * DEFAULTS.maintenanceReserveRateOfValuePerYear) / 12;
  const suiteIncome = listing.suite === 'existing-legal' ? (listing.estimatedSuiteRentMonthly ?? 0) : 0;
  const condoRentOffset = condoRented ? profile.condoExpectedRent : 0;

  const grossMonthly =
    mortgageMonthly +
    propertyTaxMonthly +
    insuranceMonthly +
    maintenanceMonthly +
    (listing.monthlyCondoFee ?? 0) +
    profile.condoMonthlyCarry;

  const effectiveMonthly = grossMonthly - condoRentOffset - suiteIncome;

  const ratios = debtServiceRatios({
    annualIncome: profile.documentedAnnualIncome + condoRentOffset * 12 * 0.5,
    mortgagePaymentMonthly: stressedMonthly,
    propertyTaxMonthly,
    heatMonthly: 150,
    condoFeeMonthly: listing.monthlyCondoFee,
    otherDebtMonthly: profile.otherMonthlyDebt + profile.condoMonthlyCarry,
  });

  return {
    mortgagePrincipal: principal,
    mortgageMonthly,
    stressedMonthly,
    propertyTaxMonthly,
    insuranceMonthly,
    maintenanceMonthly,
    condoCarryMonthly: profile.condoMonthlyCarry,
    condoRentOffset,
    suiteIncome,
    grossMonthly,
    effectiveMonthly,
    gds: ratios.gds,
    tds: ratios.tds,
  };
}

export function weightedPillarScore(
  scores: Record<string, PillarScores> | undefined,
  weights: PillarScores,
): number | null {
  if (!scores || Object.keys(scores).length === 0) return null;
  const people = Object.values(scores);
  const avg = (k: keyof PillarScores) => people.reduce((s, p) => s + p[k], 0) / people.length;
  const totalWeight = weights.location + weights.size + weights.growth + weights.income;
  if (totalWeight === 0) return null;
  const raw =
    avg('location') * weights.location +
    avg('size') * weights.size +
    avg('growth') * weights.growth +
    avg('income') * weights.income;
  return (raw / totalWeight / 5) * 100;
}

/** Largest per-pillar gap between two scorers. The thing worth talking about. */
export function disagreements(scores: Record<string, PillarScores> | undefined) {
  if (!scores) return [];
  const names = Object.keys(scores);
  if (names.length < 2) return [];
  const keys: (keyof PillarScores)[] = ['location', 'size', 'growth', 'income'];
  return keys
    .map((k) => {
      const values = names.map((n) => scores[n][k]);
      return { pillar: k, gap: Math.max(...values) - Math.min(...values), values };
    })
    .filter((d) => d.gap >= 2)
    .sort((a, b) => b.gap - a.gap);
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-CA');
}
