/**
 * House Check — single source of truth for every rate, bracket and default.
 *
 * RULE: every value here carries a `verified` date and a `source`. Anything
 * older than ~3 months gets re-checked before it is relied on for an offer.
 *
 * Phase 0 verification pass: 2026-08-31
 */

export interface Verified<T> {
  value: T;
  verified: string; // ISO date
  source: string;
  note?: string;
}

export interface TaxBracket {
  /** Upper bound of the bracket, inclusive. null = no upper bound. */
  upTo: number | null;
  rate: number;
}

export const ASSUMPTIONS_RECHECK_AFTER_DAYS = 90;

// ---------------------------------------------------------------------------
// Land transfer tax
// ---------------------------------------------------------------------------

/**
 * Ontario Land Transfer Tax — marginal brackets.
 * These top brackets (2.0% / 2.5%) apply ONLY where the land contains one or
 * two single-family residences. Other property caps at 1.5% above $400k.
 */
export const ONTARIO_LTT_BRACKETS: Verified<TaxBracket[]> = {
  value: [
    { upTo: 55_000, rate: 0.005 },
    { upTo: 250_000, rate: 0.01 },
    { upTo: 400_000, rate: 0.015 },
    { upTo: 2_000_000, rate: 0.02 },
    { upTo: null, rate: 0.025 },
  ],
  verified: '2026-08-31',
  source: 'https://www.ontario.ca/document/land-transfer-tax/calculating-land-transfer-tax',
  note: 'In force for registrations on/after 2017-01-01. No 2026 amendment found.',
};

/**
 * Toronto Municipal Land Transfer Tax — marginal brackets.
 *
 * ⚠️ THESE CHANGED ON 2026-04-01 (Council amendment 2025-12-17). The $2M–$3M
 * tier at 2.5% is NEW, and the luxury tiers above $3M were raised from
 * 3.5/4.5/5.5/6.5/7.5%. Most third-party calculators still carry the old table
 * and will understate MLTT above $2M.
 */
export const TORONTO_MLTT_BRACKETS: Verified<TaxBracket[]> = {
  value: [
    { upTo: 55_000, rate: 0.005 },
    { upTo: 250_000, rate: 0.01 },
    { upTo: 400_000, rate: 0.015 },
    { upTo: 2_000_000, rate: 0.02 },
    { upTo: 3_000_000, rate: 0.025 },
    { upTo: 4_000_000, rate: 0.044 },
    { upTo: 5_000_000, rate: 0.0545 },
    { upTo: 10_000_000, rate: 0.065 },
    { upTo: 20_000_000, rate: 0.0755 },
    { upTo: null, rate: 0.086 },
  ],
  verified: '2026-08-31',
  source:
    'https://www.toronto.ca/services-payments/property-taxes-utilities/municipal-land-transfer-tax-mltt/municipal-land-transfer-tax-mltt-rates-and-fees/',
  note: 'Effective 2026-04-01. Graduated tiers apply only to 1–2 single-family residences.',
};

/** Toronto MLTT administration fee, charged per transaction, plus HST. */
export const TORONTO_MLTT_ADMIN_FEE: Verified<number> = {
  value: 102.56,
  verified: '2026-08-31',
  source:
    'https://www.toronto.ca/services-payments/property-taxes-utilities/municipal-land-transfer-tax-mltt/municipal-land-transfer-tax-mltt-rates-and-fees/',
  note: 'HST payable on the fee. Effective 2026-04-01.',
};

export const HST_RATE = 0.13;

/**
 * First-time buyer rebates. NOT APPLICABLE to this purchase — Paul owns a
 * condo, so neither rebate is available. Retained for completeness and so the
 * engine can be reused.
 */
export const FIRST_TIME_BUYER_REBATE = {
  ontarioMax: 4_000,
  torontoMax: 4_475,
  verified: '2026-08-31',
  source:
    'https://www.ontario.ca/document/land-transfer-tax/land-transfer-tax-refunds-first-time-homebuyers',
  note: 'Requires never having owned a home anywhere in the world. Not applicable here.',
};

// ---------------------------------------------------------------------------
// Mortgage rules
// ---------------------------------------------------------------------------

/**
 * Minimum down payment tiers.
 * At or above $1,500,000 mortgage default insurance is unavailable, so 20% is
 * the floor. (Threshold raised from $1M effective 2024-12-15 — beware stale
 * sources: the FCAC page on canada.ca still contains contradictory "$1 million"
 * text as of this verification.)
 */
export const MIN_DOWN_PAYMENT = {
  value: {
    tier1UpTo: 500_000,
    tier1Rate: 0.05,
    tier2Rate: 0.10, // on the portion above $500k
    insuranceUnavailableAtOrAbove: 1_500_000,
    uninsuredMinRate: 0.20,
  },
  verified: '2026-08-31',
  source:
    'https://www.canada.ca/en/department-finance/news/2024/12/boldest-mortgage-reforms-in-decades-come-into-force-today.html',
  note: 'Confirmed against CMHC. Do NOT source this from the FCAC down-payment page — it is stale.',
};

/** OSFI B-20 minimum qualifying rate: greater of contract rate + 2% or 5.25%. */
export const STRESS_TEST = {
  value: { marginOverContract: 0.02, floorRate: 0.0525 },
  verified: '2026-08-31',
  source:
    'https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/minimum-qualifying-rate-uninsured-mortgages',
  note:
    'Applies to federally regulated lenders. Exempt for a straight uninsured switch at renewal ' +
    '(no increase in loan amount, no extension of amortization).',
};

/** Debt service ratio guidance. Insured limits; lenders vary on uninsured. */
export const DEBT_SERVICE_LIMITS = {
  value: { gds: 0.39, tds: 0.44 },
  verified: '2026-08-31',
  source:
    'https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/home-start',
  note: 'CMHC Home Start figures. Uninsured lender policy varies — confirm with the broker.',
};

// ---------------------------------------------------------------------------
// Property tax
// ---------------------------------------------------------------------------

/**
 * Toronto 2026 residential property tax rate, applied to MPAC assessed value.
 *
 * ⚠️ Assessed value is NOT purchase price. MPAC assessments remain based on a
 * 2016-01-01 valuation date, so tax on a $1.5M house is typically calculated on
 * a much lower figure. Always prefer the listing's stated actual tax.
 */
export const TORONTO_PROPERTY_TAX_RATE: Verified<number> = {
  value: 0.00767311,
  verified: '2026-08-31',
  source:
    'https://www.toronto.ca/services-payments/property-taxes-utilities/property-tax/property-tax-rates-and-fees/',
  note: 'City 0.605295% + Education 0.153000% + City Building Fund 0.009016%. 2025 total was 0.754087%.',
};

export const MPAC_VALUATION_DATE: Verified<string> = {
  value: '2016-01-01',
  verified: '2026-08-31',
  source: 'https://www.mpac.ca/en/UnderstandingYourAssessment/AssessmentCycle',
  note: 'Reassessment postponed; 2026 tax year still uses fully phased-in 2016 values.',
};

// ---------------------------------------------------------------------------
// Buyer-specific status (Paul + Armando)
// ---------------------------------------------------------------------------

/**
 * NRST and the federal foreign-buyer ban both turn on CITIZENSHIP, not tax
 * residency. Armando is a Canadian citizen, so neither applies. Ontario states
 * explicitly that whether a citizen is a non-resident for income tax purposes
 * is not relevant to NRST.
 */
export const NRST_APPLIES: Verified<boolean> = {
  value: false,
  verified: '2026-08-31',
  source: 'https://www.ontario.ca/document/land-transfer-tax/non-resident-speculation-tax',
  note:
    'Provincial NRST 25% + Toronto MNRST 10% would apply to a foreign national. Both buyers are ' +
    'Canadian citizens, so neither applies. NOTE: NRST is triggered by ANY foreign transferee on ' +
    'the FULL property value, not pro-rated — so this depends on the title list staying as planned.',
};

export const FOREIGN_BUYER_BAN_APPLIES: Verified<boolean> = {
  value: false,
  verified: '2026-08-31',
  source: 'https://laws-lois.justice.gc.ca/eng/acts/P-25.2/FullText.html',
  note:
    'Act in force until 2027-01-01. "Non-Canadian" is defined by citizenship/PR/Indian Act ' +
    'registration with no residence test, so a citizen living abroad is not caught.',
};

// ---------------------------------------------------------------------------
// Zoning / income potential (City of Toronto)
// ---------------------------------------------------------------------------

export const MULTIPLEX_RULES = {
  value: {
    unitsAsOfRightCityWide: 4,
    maxHeightM: 10,
    parkingSpacesRequired: 0,
    exemptFromFsi: true,
    exemptFromMaxStoreys: true,
    /** 5–6 units permitted in Toronto & East York wards (incl. Ward 11) — DETACHED ONLY. */
    sixplex: {
      permittedInWard11: true,
      detachedOnly: true,
      maxHeightM: 10.5,
    },
  },
  verified: '2026-08-31',
  source:
    'https://www.toronto.ca/city-government/planning-development/planning-studies-initiatives/multiplex-housing/multiplex-study-2-4-units/',
  note:
    '4 units: By-laws 473/474-2023, in force 2023-05-12. 5–6 units: OPA 818 / By-law 654-2025, ' +
    'June 2025, Toronto & East York wards only, DETACHED ONLY — which excludes most semis and ' +
    'row houses in Harbord Village. Zoning permission does not override an Ontario Heritage Act permit.',
};

export const LANEWAY_SUITE_RULES = {
  value: {
    minLaneAbutmentM: 3.5,
    separationFromHouseM: { oneStorey: 5.0, twoStorey: 7.5 },
    maxHeightM: { at5m: 4.0, at7_5m: 6.3 },
    maxStoreys: 2,
    maxLengthM: 10.0,
    maxWidthM: 8.0,
    parkingSpacesRequired: 0,
  },
  verified: '2026-08-31',
  source: 'https://www.toronto.ca/zoning/bylaw_amendments/ZBL_NewProvision_Chapter150_8.htm',
  note:
    '⚠️ MODERATE CONFIDENCE. Latest verifiable amendment to s.150.8 is 2023, while garden suites ' +
    'were liberalised in 2025 (separation cut to 4.0m). Confirm the 5.0m figure with Toronto ' +
    'Building before relying on it. Harbord Village lots are often shallow — a two-storey suite ' +
    'needs 7.5m separation and frequently will not fit.',
};

export const SECOND_SUITE_RULES = {
  value: {
    maxOnePerDwelling: true,
    maxShareOfInteriorFloorArea: 0.45,
    minCeilingHeightBasementM: 1.95,
    minCeilingHeightAtticM: 2.03,
    fireSeparationMinutes: 30,
    fireSeparationMinutesWithInterconnectedAlarms: 15,
    parkingSpacesRequired: 0,
    publicRegistryExists: false,
  },
  verified: '2026-08-31',
  source: 'https://www.ontario.ca/page/add-second-unit-your-house',
  note:
    'NO public registry of legal second suites exists. The only diligence path is the building ' +
    'permit history with a closed final inspection, plus the ESA electrical certificate. A listing ' +
    'claiming a "legal" suite without a closed permit is a red flag.',
};

export const SHORT_TERM_RENTAL_RULES = {
  value: {
    definitionUnderDays: 28,
    entireHomeNightCapPerYear: 180,
    principalResidenceRequired: true,
    registrationFeePerYear: 390,
    municipalAccommodationTaxRate: 0.06,
  },
  verified: '2026-08-31',
  source:
    'https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/short-term-rentals/',
  note:
    'MAT is 6% as of 2026-08-01 (the temporary 8.5% rate expired 2026-07-31). IMPORTANT: a single ' +
    'continuous 6-month let is 28+ days, so it is NOT a short-term rental and the cap/fee/MAT do ' +
    'not apply — but it becomes a Residential Tenancies Act tenancy with security of tenure. See ' +
    'PHASE-0-FINDINGS.md §5.',
};

// ---------------------------------------------------------------------------
// Cycling infrastructure risk
// ---------------------------------------------------------------------------

/**
 * Bill 212 removal provisions — legal position as of the phase 0 pass.
 * Segments listed here are scored as AT RISK; the engine scores every property
 * twice, with and without them, and reports the delta.
 */
export const BIKE_LANE_RISK = {
  value: {
    atRiskCorridors: ['Bloor', 'Yonge', 'University', 'Queen\'s Park Cres', 'Avenue Rd'],
    protectedAndNotAtRisk: ['Harbord', 'Hoskin', 'College', 'Shaw', 'Roxton', 'Richmond', 'Adelaide'],
    injunctionInForce: false,
    removalsCompleted: false,
  },
  verified: '2026-08-31',
  source: 'Cycle Toronto v. Ontario (AG), 2026 ONCA 582 (2026-08-14)',
  note:
    'Court of Appeal overturned the 2025 Superior Court ruling on 2026-08-14; the injunction is ' +
    'dissolved and removal is legally permitted. No physical removal confirmed as of ~2026-08-18. ' +
    'Watch: possible SCC leave application, and the 2026-10-26 municipal election. Harbord/Hoskin ' +
    '(concrete cycle track, completed Nov 2025) and College are NOT named in Bill 212.',
};

// ---------------------------------------------------------------------------
// Modelling defaults — editable, not verified facts
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  maintenanceReserveRateOfValuePerYear: 0.01,
  sellingCostRate: 0.05,
  appreciationScenarios: { bear: 0.0, base: 0.025, bull: 0.05 },
  legalFees: 2_500,
  titleInsurance: 700,
  homeInspection: 700,
  /** Purchase price ceiling from the pre-approval. Soft — see the stretch band. */
  preApprovalMaxPurchasePrice: 1_500_000,
};

export const VERIFIED_ASSUMPTIONS = [
  ONTARIO_LTT_BRACKETS,
  TORONTO_MLTT_BRACKETS,
  TORONTO_MLTT_ADMIN_FEE,
  TORONTO_PROPERTY_TAX_RATE,
  MPAC_VALUATION_DATE,
  NRST_APPLIES,
  FOREIGN_BUYER_BAN_APPLIES,
  MIN_DOWN_PAYMENT,
  STRESS_TEST,
  DEBT_SERVICE_LIMITS,
  MULTIPLEX_RULES,
  LANEWAY_SUITE_RULES,
  SECOND_SUITE_RULES,
  SHORT_TERM_RENTAL_RULES,
  BIKE_LANE_RISK,
] as const;

export function oldestVerifiedDate(): string {
  return VERIFIED_ASSUMPTIONS.reduce((oldest, item) => (item.verified < oldest ? item.verified : oldest), VERIFIED_ASSUMPTIONS[0].verified);
}

export function daysSinceVerified(asOf = new Date()): number {
  const verified = new Date(`${oldestVerifiedDate()}T00:00:00Z`).getTime();
  const now = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  return Math.floor((now - verified) / 86_400_000);
}

export function assumptionsNeedRefresh(asOf = new Date()): boolean {
  return daysSinceVerified(asOf) > ASSUMPTIONS_RECHECK_AFTER_DAYS;
}
