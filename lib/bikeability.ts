import type { Listing } from './types';

/**
 * Bikeability score, 0–100. This is a HARD GATE: below the threshold the
 * listing fails regardless of anything else.
 *
 * v1 uses manually entered inputs. v2 should compute distance-to-lane from the
 * Toronto Open Data `cycling-network` dataset and elevation gain from NRCan
 * HRDEM (1 m). See PHASE-0-FINDINGS.md §8 for the sources.
 *
 * The resilience idea is the part worth keeping: after the Court of Appeal
 * ruling of 2026-08-14, the Bloor/Yonge/University lanes can legally be
 * removed. A property whose only good route is Bloor scores well today and
 * badly tomorrow. So we score twice and report the gap.
 */

export interface BikeabilityResult {
  score: number;
  /** Score if the Bill 212 corridors are removed. */
  resilientScore: number;
  /** How much of the score depends on at-risk infrastructure. */
  resilienceGap: number;
  passes: boolean;
  /** False until the distance to a protected lane has been entered. An
   *  unmeasured property is not a failing one — the gate reports "not assessed"
   *  rather than failing the listing on missing data. */
  assessed: boolean;
  factors: { label: string; points: number; max: number; note?: string }[];
}

export function bikeability(listing: Listing, threshold: number): BikeabilityResult {
  const factors: BikeabilityResult['factors'] = [];

  // Proximity to protected infrastructure — the dominant term.
  const d = listing.metresToProtectedLane;
  let proximity = 0;
  if (d === undefined) {
    proximity = 0;
  } else if (d <= 200) proximity = 45;
  else if (d <= 400) proximity = 38;
  else if (d <= 700) proximity = 28;
  else if (d <= 1200) proximity = 16;
  else proximity = 5;
  factors.push({
    label: 'Distance to protected lane',
    points: proximity,
    max: 45,
    note: d === undefined ? 'Not entered' : `${d} m`,
  });

  // Network quality: is the nearest good route one that survives Bill 212?
  const corridor = listing.onResilientCorridor ? 30 : 12;
  factors.push({
    label: 'Route resilience',
    points: corridor,
    max: 30,
    note: listing.onResilientCorridor
      ? 'Served by Harbord/Hoskin or College — concrete cycle track, not named in Bill 212'
      : 'Depends on a corridor the province may remove',
  });

  // Storage at the property. The difference between cycling daily and sometimes.
  const storage = listing.secureBikeStorage ? 15 : 0;
  factors.push({
    label: 'Secure bike storage',
    points: storage,
    max: 15,
    note: listing.secureBikeStorage ? 'Garage, shed or laneway access' : 'None identified',
  });

  // Topography. South of Davenport is flat; north means the Lake Iroquois climb.
  const terrain = listing.northOfDavenport ? 3 : 10;
  factors.push({
    label: 'Terrain',
    points: terrain,
    max: 10,
    note: listing.northOfDavenport
      ? 'North of Davenport — the escarpment is on every northbound ride'
      : 'South of Davenport — flat',
  });

  const score = factors.reduce((s, f) => s + f.points, 0);

  // Resilient score: recompute assuming the at-risk corridors are gone.
  const resilientScore = listing.onResilientCorridor
    ? score
    : score - corridor + 2 - Math.round(proximity * 0.5);

  const assessed = d !== undefined;

  return {
    score,
    resilientScore: Math.max(0, resilientScore),
    resilienceGap: score - Math.max(0, resilientScore),
    // An unassessed property does not fail — it is simply not yet measured.
    passes: assessed ? Math.max(0, resilientScore) >= threshold : true,
    assessed,
    factors,
  };
}
