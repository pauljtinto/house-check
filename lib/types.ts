export type PropertyType =
  | 'Detached'
  | 'Semi-Detached'
  | 'Att/Row/Twnhouse'
  | 'Duplex'
  | 'Triplex'
  | 'Other';

export type HeritageStatus = 'none' | 'unknown' | 'listed' | 'designated';

export type SuiteStatus = 'none' | 'existing-unverified' | 'existing-legal' | 'addable';

export interface Listing {
  id: string;
  address: string;
  listPrice: number;
  /** Set only for sold comps — lets the app score its own prediction. */
  soldPrice?: number;
  daysOnMarket?: number;
  type: PropertyType;
  /** Offers held to a set date. Overrides the list-price band — a declared
   *  offer night IS the hold-back signal the band only proxies for. */
  holdbackOffers?: boolean;
  offerDate?: string;

  // Size
  sqftAboveGrade?: number;
  sqftBelowGrade?: number;
  beds?: number;
  baths?: number;
  lotFrontageFt?: number;
  lotDepthFt?: number;

  // Carrying
  annualPropertyTax?: number;
  monthlyCondoFee?: number;

  // Bikeability inputs (manual for now — see lib/bikeability.ts)
  metresToProtectedLane?: number;
  onResilientCorridor: boolean; // Harbord/Hoskin/College rather than Bloor
  secureBikeStorage: boolean;
  northOfDavenport: boolean;

  // Growth / income
  heritage: HeritageStatus;
  kitchens?: number;
  suite: SuiteStatus;
  abutsLaneway: boolean;
  estimatedSuiteRentMonthly?: number;

  // Scores, 1-5, entered per person
  scores?: Record<string, PillarScores>;
  dealBreaker?: string;
  notes?: string;
}

export interface PillarScores {
  location: number;
  size: number;
  growth: number;
  income: number;
}

export interface BuyerProfile {
  // Financing
  budgetCeiling: number;
  stretchLimit: number;
  /** Total cash on hand for the purchase: down payment AND closing costs. */
  cashAvailable: number;
  /** What you intend to put down. Raised automatically if below the legal minimum. */
  plannedDownPayment: number;
  reserveFloor: number;
  contractRate: number;
  amortizationYears: number;

  // Income and existing obligations
  documentedAnnualIncome: number;
  otherMonthlyDebt: number;

  // The condo that is being kept
  condoMonthlyCarry: number;
  condoExpectedRent: number;
  condoRented: boolean;

  // Preferences
  bikeabilityThreshold: number;
  weights: PillarScores;
}

export const DEFAULT_PROFILE: BuyerProfile = {
  budgetCeiling: 1_500_000,
  stretchLimit: 1_750_000,
  cashAvailable: 450_000, // PLACEHOLDER — replace with the real figure
  plannedDownPayment: 300_000, // PLACEHOLDER — 20% of $1.5M
  reserveFloor: 50_000, // PLACEHOLDER
  contractRate: 0.045, // PLACEHOLDER — confirm with the broker
  amortizationYears: 30,
  documentedAnnualIncome: 400_000, // PLACEHOLDER
  otherMonthlyDebt: 0, // PLACEHOLDER — practice loan service if the lender counts it
  condoMonthlyCarry: 2_500, // PLACEHOLDER
  condoExpectedRent: 2_800, // PLACEHOLDER
  condoRented: false,
  bikeabilityThreshold: 60,
  weights: { location: 30, size: 20, growth: 25, income: 25 },
};

/** Fields above that are guesses, not supplied by Paul. Surfaced in the UI. */
export const PLACEHOLDER_FIELDS: (keyof BuyerProfile)[] = [
  'cashAvailable',
  'plannedDownPayment',
  'reserveFloor',
  'contractRate',
  'documentedAnnualIncome',
  'otherMonthlyDebt',
  'condoMonthlyCarry',
  'condoExpectedRent',
];
