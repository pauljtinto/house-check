import type { Listing, PropertyType, SuiteStatus } from './types';

/**
 * Parse pasted listing text into a Listing.
 *
 * Handles two shapes:
 *   - HouseSigma-style label/value pairs, often with the value on the next line
 *   - MLS / PropTx full-sheet exports where labels and values share a line
 *
 * It never silently guesses. Everything it extracts is reported in `found` so
 * the UI can show the user exactly what it read, and anything it could not
 * determine is listed in `missing`.
 */

export interface ParseResult {
  listing: Partial<Listing>;
  found: { field: string; value: string; source: string }[];
  missing: string[];
  notes: string[];
}

const NUM = String.raw`[\d,]+(?:\.\d+)?`;

function money(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = Number(s.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** Match "Label:" followed by a value on the same line or the next one. */
function labelled(text: string, label: string, valuePattern = String.raw`[^\n]+`): string | undefined {
  const re = new RegExp(String.raw`${label}\s*:?\s*\n?\s*(${valuePattern})`, 'i');
  return re.exec(text)?.[1]?.trim();
}

export function parseListing(raw: string): ParseResult {
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const found: ParseResult['found'] = [];
  const missing: string[] = [];
  const notes: string[] = [];
  const out: Partial<Listing> = {};

  const add = (field: string, value: string, source: string) => found.push({ field, value, source });

  // --- Address ---------------------------------------------------------
  const streetRe =
    /^(\d+[A-Za-z]?\s+[A-Za-z][A-Za-z0-9'.\- ]*?\s(?:Street|St|Avenue|Ave|Road|Rd|Crescent|Cres|Drive|Dr|Boulevard|Blvd|Place|Pl|Terrace|Terr|Court|Crt|Way|Lane|Square|Sq|Gardens|Gdns|Park|Pkwy|Circle|Cir|Trail|Grove|Heights))\b/i;
  for (const l of lines.slice(0, 12)) {
    const m = streetRe.exec(l);
    if (m) {
      out.address = m[1].trim();
      add('Address', out.address, l);
      break;
    }
  }
  if (!out.address && lines[0]) {
    out.address = lines[0];
    add('Address', out.address, 'first line (no street pattern matched — check this)');
    notes.push('Address taken from the first line because no street-name pattern matched. Verify it.');
  }

  // --- Prices ----------------------------------------------------------
  const listed =
    money(new RegExp(String.raw`(?:^|\n)\s*Listed\s*:?\s*\$?\s*(${NUM})`, 'i').exec(text)?.[1]) ??
    money(new RegExp(String.raw`(?:^|\n)\s*List\s*(?:Price)?\s*:?\s*\$?\s*(${NUM})`, 'i').exec(text)?.[1]) ??
    money(new RegExp(String.raw`Asking\s*:?\s*\$?\s*(${NUM})`, 'i').exec(text)?.[1]);
  if (listed) {
    out.listPrice = listed;
    add('List price', '$' + listed.toLocaleString(), 'Listed / List');
  } else missing.push('list price');

  const sold = money(new RegExp(String.raw`(?:^|\n)\s*Sold\s*:?\s*\$?\s*(${NUM})`, 'i').exec(text)?.[1]);
  if (sold) {
    out.soldPrice = sold;
    add('SOLD price', '$' + sold.toLocaleString(), 'Sold');
    notes.push(
      'This is a sold listing. It will be scored against the model as a prediction check rather than ' +
        'treated as a live candidate.',
    );
  }

  // --- Property type ---------------------------------------------------
  const typeSrc = labelled(text, 'Property Type') ?? text;
  let type: PropertyType | undefined;
  if (/\bTriplex\b/i.test(typeSrc)) type = 'Triplex';
  else if (/\bDuplex\b/i.test(typeSrc)) type = 'Duplex';
  else if (/\bSemi[-\s]?Detached\b/i.test(typeSrc)) type = 'Semi-Detached';
  else if (/\b(?:Att\/Row|Row|Townhouse|Twnhouse|Freehold Townhouse)\b/i.test(typeSrc)) type = 'Att/Row/Twnhouse';
  else if (/\bDetached\b/i.test(typeSrc)) type = 'Detached';
  if (type) {
    out.type = type;
    add('Type', type, typeSrc.split('\n')[0].slice(0, 60));
    if (type === 'Triplex') {
      notes.push(
        'Three or more units: land transfer tax loses the graduated tiers above $400k under both the ' +
          'Ontario and Toronto statutes, which changes the tax materially. A duplex (two units) keeps them.',
      );
    }
  } else missing.push('property type');

  // --- Taxes -----------------------------------------------------------
  const taxM = new RegExp(String.raw`Tax(?:es)?\s*:?\s*\n?\s*\$?\s*(${NUM})`, 'i').exec(text);
  if (taxM) {
    const t = money(taxM[1]);
    if (t && t > 500) {
      out.annualPropertyTax = t;
      const year = /\/\s*(\d{4})/.exec(text.slice(taxM.index, taxM.index + 60))?.[1];
      add('Annual tax', '$' + t.toLocaleString() + (year ? ` (${year})` : ''), taxM[0].replace(/\n/g, ' '));
    }
  } else missing.push('property tax');

  // --- Size ------------------------------------------------------------
  const sizeM = /(\d{3,5})\s*[-–]\s*(\d{3,5})\s*(?:feet|sq|ft)/i.exec(text);
  if (sizeM) {
    out.sqftAboveGrade = Math.round((Number(sizeM[1]) + Number(sizeM[2])) / 2);
    add('Size', `${sizeM[1]}–${sizeM[2]} sqft → midpoint ${out.sqftAboveGrade}`, sizeM[0]);
    notes.push('Size is a banded range in the source; the midpoint is used. Confirm actual square footage.');
  } else missing.push('square footage');

  // --- Lot -------------------------------------------------------------
  const lotM = /(?:Lot Size|Lot|Front On|Acre)?\s*:?\s*(\d{1,3}(?:\.\d+)?)\s*[xX×]\s*(\d{1,3}(?:\.\d+)?)\s*(?:feet|ft)/i.exec(text);
  if (lotM) {
    out.lotFrontageFt = Number(lotM[1]);
    out.lotDepthFt = Number(lotM[2]);
    add('Lot', `${lotM[1]} × ${lotM[2]} ft`, lotM[0].trim());
  } else missing.push('lot dimensions');

  // --- Beds / baths ----------------------------------------------------
  const bedsM =
    /(\d+)\s*(?:\+\s*(\d+)\s*)?Bedrooms?/i.exec(text) ?? /Bedrooms?\s*:?\s*(\d+)\s*(?:\+\s*(\d+))?/i.exec(text);
  if (bedsM) {
    const above = Number(bedsM[1]);
    const below = bedsM[2] ? Number(bedsM[2]) : 0;
    out.beds = above + below;
    add('Bedrooms', below ? `${above} above grade + ${below} below` : `${above}`, bedsM[0]);
    if (below && above <= 2) {
      notes.push(
        `Only ${above} bedroom(s) above grade. That is a real size constraint and a narrower resale market ` +
          'than the total bedroom count suggests.',
      );
    }
  } else missing.push('bedrooms');

  const bathsM = /(\d+)\s*Bathrooms?/i.exec(text) ?? /Washrooms?\s*:?\s*(\d+)/i.exec(text);
  if (bathsM) {
    out.baths = Number(bathsM[1]);
    add('Bathrooms', bathsM[1], bathsM[0]);
  }

  // --- Days on market --------------------------------------------------
  const domM = /(?:Days on Market\s*:?\s*\n?\s*(\d+)|DOM\s*:?\s*(\d+))/i.exec(text);
  if (domM) {
    out.daysOnMarket = Number(domM[1] ?? domM[2]);
    add('Days on market', String(out.daysOnMarket), domM[0].replace(/\n/g, ' '));
  } else missing.push('days on market');

  // --- Hold-back / offer date -----------------------------------------
  const holdM =
    /offers?[^.\n]{0,80}?(?:will be\s+)?(?:reviewed|presented|considered|accepted)\s+on\s+([^.\n]{3,40})/i.exec(text) ??
    /offer\s+date\s*:?\s*([^\n.]{3,40})/i.exec(text) ??
    /(?:review|present)(?:ed|ing)?\s+offers?\s+on\s+([^.\n]{3,40})/i.exec(text);
  if (holdM) {
    out.holdbackOffers = true;
    out.offerDate = holdM[1].trim();
    add('Offer hold-back', `offers reviewed ${holdM[1].trim()}`, holdM[0].slice(0, 90));
    notes.push(
      'Offers are held to a date. The list price is a strategy, not a valuation — the model predicts ' +
        'above ask accordingly.',
    );
  }
  if (/pre-?emptive|bully\s+offer/i.test(text)) {
    notes.push('Seller reserves the right to accept a pre-emptive (bully) offer — it can sell before the offer date.');
  }

  // --- Parking / bike storage -----------------------------------------
  // Look for the descriptive form first ("Detached 1 garage"); a bare "1 Garage"
  // summary line often appears earlier in the page and says nothing about type.
  const garageM =
    /((?:Detached|Attached|Built-?In|Carport)\s*\d*\s*garage)/i.exec(text) ??
    /(\d+\s*Garage)/i.exec(text);
  if (garageM) {
    out.secureBikeStorage = true;
    add('Secure bike storage', 'yes — ' + garageM[1].trim(), garageM[0].trim());
    if (/detached/i.test(garageM[1])) {
      out.abutsLaneway = true;
      add('Laneway access', 'likely — detached garage', garageM[1].trim());
      notes.push('Detached garage implies rear lane access. Confirm the lane abuts at least 3.5 m for a laneway suite.');
    }
  }
  if (/\bDrive\s*:?\s*Lane\b|\blaneway\b|\brear lane\b/i.test(text)) {
    out.abutsLaneway = true;
  }

  // --- Suite / income --------------------------------------------------
  const kitchM = /Kitchens?\s*:?\s*(\d+)/i.exec(text);
  if (kitchM) {
    out.kitchens = Number(kitchM[1]);
    add('Kitchens', kitchM[1], kitchM[0]);
  }
  const basement = labelled(text, 'Basement');
  let suite: SuiteStatus = 'none';
  const hasSeparateEntrance = /separate\s+entrance/i.test(text);
  const twoUnits = /\b(?:2|two)\s+(?:spacious\s+|self-?contained\s+)?units\b|\bduplex\b|\btriplex\b|\b2-family\b|\btwo-family\b/i.test(text);
  const roughIn = /rough-?in\s+for\s+a?\s*second\s+kitchen|rough-?in.{0,20}kitchen/i.test(text);

  if (twoUnits || (out.kitchens ?? 0) >= 2) suite = 'existing-unverified';
  else if (roughIn || (hasSeparateEntrance && /finished/i.test(basement ?? ''))) suite = 'addable';
  out.suite = suite;
  if (suite !== 'none') {
    add(
      'Second suite',
      suite === 'existing-unverified' ? 'exists — legality NOT verified' : 'addable',
      twoUnits ? 'multi-unit language in the listing' : roughIn ? 'kitchen rough-in' : (basement ?? 'separate entrance'),
    );
    notes.push(
      'There is no public registry of legal second suites. Ask for the building permit history with a ' +
        'closed final inspection, plus the ESA certificate.',
    );
  }
  if (basement) add('Basement', basement.slice(0, 60), 'Basement');

  // --- Neighbourhood ---------------------------------------------------
  const hood = /Toronto\s*[-–]\s*([A-Za-z][\w\s'-]{2,40})/.exec(text)?.[1]?.trim();
  if (hood) add('Neighbourhood', hood, `Toronto - ${hood}`);

  // --- MLS -------------------------------------------------------------
  const mls = /(?:Listing\s*#|MLS\s*#?)\s*:?\s*([A-Z]\d{6,9})/i.exec(text)?.[1];
  if (mls) add('MLS', mls, 'Listing #');

  // --- Things the parser can never know -------------------------------
  missing.push('distance to nearest protected bike lane');
  missing.push('heritage status');

  return { listing: out, found, missing, notes };
}
