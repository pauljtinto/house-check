/**
 * List-price strategy classifier.
 *
 * In Toronto C01 / University the list price is a marketing decision, not a
 * valuation. Properties listed in a particular band are deliberately underpriced
 * to attract an offer night; properties listed above it are priced at or above
 * market and negotiate downward. Blending the two produces a fair-value estimate
 * that can be wrong by 40%.
 *
 * Calibrated on 23 sold comps, Mar–Aug 2026. See data/comps-university-c01.csv
 * and COMPS-ANALYSIS.md. Sample sizes are small — every result carries its own n
 * so the UI can be honest about confidence.
 */

export type Strategy = 'offer-night-underpriced' | 'priced-to-market' | 'unknown';

export interface StrategyVerdict {
  strategy: Strategy;
  /** Predicted sale price range, in dollars. */
  predicted: { low: number; median: number; high: number } | null;
  /** Multiples of list price behind the prediction. */
  ratios: { low: number; median: number; high: number } | null;
  /** Number of comps supporting this call. */
  n: number;
  confidence: 'low' | 'moderate' | 'high';
  explanation: string;
}

/**
 * Empirical bands from the comp set.
 *
 * The $989k–$1.199M band was 5 for 5 selling 19.7%–42.0% over ask, all within
 * 11 days. Below $950k the only observation (176 Brunswick, $849k → $815k) sold
 * UNDER ask and was $380k cheaper than anything else in the set, which reads as
 * a property with a real problem rather than a pricing strategy.
 */
const UNDERPRICED_BAND = { min: 950_000, max: 1_249_999 };

export function classifyListPrice(
  listPrice: number,
  daysOnMarket?: number,
  /** True when the listing holds offers to a set date — an explicit hold-back. */
  holdbackOffers = false,
): StrategyVerdict {
  /**
   * A declared offer date beats the price band. The band is only a proxy for
   * "is this listing being held back"; an actual offer night is the thing
   * itself. Above the calibrated band the premium compresses sharply — the two
   * high-priced over-ask comps (46 Brunswick at $1.498M, +6.8%; 281 Brunswick
   * at $1.7M, +5.9%) went nowhere near the +29% seen around $1M. So this
   * returns a deliberately wide, low-confidence range rather than a false
   * precision the data cannot support.
   */
  if (holdbackOffers && listPrice > UNDERPRICED_BAND.max) {
    const ratios = { low: 1.0, median: 1.064, high: 1.20 };
    return {
      strategy: 'offer-night-underpriced',
      predicted: {
        low: listPrice * ratios.low,
        median: listPrice * ratios.median,
        high: listPrice * ratios.high,
      },
      ratios,
      n: 3,
      confidence: 'low',
      explanation:
        'Offers are being held to a date — the list price is a strategy, not a valuation. Above the ' +
        'well-calibrated band the over-ask premium compresses sharply and clusters tightly: three ' +
        'observations at +5.9% (281 Brunswick, $1.70M), +6.4% (365 Shaw, $1.35M) and +6.8% ' +
        '(46 Brunswick, $1.50M), versus a +29% median nearer $1M. Median +6.4%. The range stays wide ' +
        'because n=3 and a genuine bidding war can exceed it.',
    };
  }

  if (listPrice < UNDERPRICED_BAND.min) {
    return {
      strategy: 'unknown',
      predicted: null,
      ratios: null,
      n: 1,
      confidence: 'low',
      explanation:
        'Below the observed underpricing band. The single comp this low (176 Brunswick, $849k) ' +
        'sold 4% UNDER ask and $380k below anything else in the set — treat a list price here as ' +
        'a signal of a problem with the property, not a bargain.',
    };
  }

  if (listPrice <= UNDERPRICED_BAND.max) {
    const ratios = { low: 1.197, median: 1.289, high: 1.42 };
    return {
      strategy: 'offer-night-underpriced',
      predicted: {
        low: listPrice * ratios.low,
        median: listPrice * ratios.median,
        high: listPrice * ratios.high,
      },
      ratios,
      n: 5,
      confidence: 'moderate',
      explanation:
        'Listed inside the offer-night band. All 5 comps in this band sold 19.7–42.0% over ask, ' +
        'every one within 11 days. Do not treat the list price as the price — budget for the ' +
        'predicted range. Small sample: n=5.',
    };
  }

  // Priced to market. Discount widens with days on market.
  const slow = daysOnMarket !== undefined && daysOnMarket >= 30;
  const fast = daysOnMarket !== undefined && daysOnMarket <= 11;

  let ratios = { low: 0.911, median: 0.946, high: 1.068 };
  let explanation =
    'Listed at or above market. The 16 comps listed this high sold at a median 94.6% of ask — ' +
    'roughly 5% of built-in negotiating room. An offer under asking is normal here.';
  let confidence: StrategyVerdict['confidence'] = 'moderate';

  if (slow) {
    ratios = { low: 0.907, median: 0.934, high: 0.976 };
    explanation +=
      ' This listing has been on market 30+ days: comps at that age sold at a median 93.4% of ask, ' +
      'and the ask was probably wrong to begin with. Negotiating room is above average.';
    confidence = 'moderate';
  } else if (fast) {
    ratios = { low: 0.946, median: 1.0, high: 1.068 };
    explanation +=
      ' This listing is moving fast (≤11 days). Comps selling this quickly went at a median 113% ' +
      'of ask across all bands — expect competition and little discount.';
    confidence = 'low';
  }

  return {
    strategy: 'priced-to-market',
    predicted: {
      low: listPrice * ratios.low,
      median: listPrice * ratios.median,
      high: listPrice * ratios.high,
    },
    ratios,
    n: 16,
    confidence,
    explanation,
  };
}

/**
 * Does a listing fit the budget once the strategy is accounted for?
 * This is the question the list price alone cannot answer.
 */
export function fitsBudget(
  listPrice: number,
  budgetCeiling: number,
  daysOnMarket?: number,
  holdbackOffers = false,
): { verdict: 'within' | 'stretch' | 'out'; predictedMedian: number | null; note: string } {
  const v = classifyListPrice(listPrice, daysOnMarket, holdbackOffers);
  if (!v.predicted) {
    return { verdict: 'stretch', predictedMedian: null, note: v.explanation };
  }
  const { median, low } = v.predicted;

  if (median <= budgetCeiling) {
    return {
      verdict: 'within',
      predictedMedian: median,
      note: `Predicted to land near $${Math.round(median).toLocaleString()}, inside the ceiling.`,
    };
  }
  if (low <= budgetCeiling) {
    return {
      verdict: 'stretch',
      predictedMedian: median,
      note:
        `Predicted median $${Math.round(median).toLocaleString()} is above the ceiling, but the ` +
        `bottom of the range ($${Math.round(low).toLocaleString()}) is not. Winnable only at the ` +
        'low end of what comparable properties actually fetched.',
    };
  }
  return {
    verdict: 'out',
    predictedMedian: median,
    note:
      `Even the bottom of the predicted range ($${Math.round(low).toLocaleString()}) exceeds the ` +
      'ceiling. The list price is not the obstacle — the landing price is.',
  };
}
