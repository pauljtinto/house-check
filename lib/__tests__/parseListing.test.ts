import { describe, it, expect } from 'vitest';
import { parseListing } from '../parseListing';

const HOUSESIGMA = `365 Shaw Street
Viewed
Toronto - Trinity-Bellwoods
Duplex
Sold: $ 1,435,000
Listed: $ 1,349,000
Sold 4 days ago
4 Bedrooms
2 Bathrooms
1 Garage
Listing History
Price Changes (0)
Key Facts
Tax:
$7,461 / 2025
Property Type:
Duplex, 3-Storey
Building Age:
-
Size:
1500-2000 feet²
Lot Size:
16 x 127 feet
Parking:
Detached 1 garage
Basement:
Unfinished
Listing #:
C13705850
Days on Market:
2 days
Listed on:
2026-08-24
Description:
The property is a duplex located in the heart of Toronto's vibrant neighbourhood.
It features 2 spacious units and a generous lot with a detached garage.
The property is a 2-family home with self-contained units, perfect for generating income.
The asking price and details of the offer received will be reviewed on August 26, 2026, at 2:45.`;

const MLS_SHEET = `196 Brunswick Ave
Toronto Ontario M5S 2M5
Toronto C01 University Toronto
List: $1,390,000 For: Sale
Taxes: $12,622.26/2026
DOM: 8
Detached
2 1/2 Storey
Front On: W
18 x 120 Feet
Bedrooms: 2 + 2
Washrooms: 3
MLS#: C13702882
Kitchens: 1
Basement: Finished / Separate Entrance
Drive: Lane
Garage: Yes
Gar/Gar Pk Spcs: Detached / 1
Apx Sqft: 1500-2000
Finished Lower Level: Complete with a separate entrance, bedroom, 3-piece bath, and rough-in for a second kitchen.
Brkage Remks: Offers if any graciously accepted on Sep 2nd @ 8 pm. Seller reserves the right to accept pre-emptive offer.`;

describe('HouseSigma paste', () => {
  const r = parseListing(HOUSESIGMA);

  it('reads the address', () => {
    expect(r.listing.address).toBe('365 Shaw Street');
  });

  it('separates list price from sold price', () => {
    expect(r.listing.listPrice).toBe(1_349_000);
    expect(r.listing.soldPrice).toBe(1_435_000);
  });

  it('reads tax, lot and size', () => {
    expect(r.listing.annualPropertyTax).toBe(7_461);
    expect(r.listing.lotFrontageFt).toBe(16);
    expect(r.listing.lotDepthFt).toBe(127);
    expect(r.listing.sqftAboveGrade).toBe(1750);
  });

  it('reads days on market', () => {
    expect(r.listing.daysOnMarket).toBe(2);
  });

  it('detects the offer hold-back from the description', () => {
    expect(r.listing.holdbackOffers).toBe(true);
    expect(r.listing.offerDate).toMatch(/August 26/);
  });

  it('infers bike storage and laneway access from a detached garage', () => {
    expect(r.listing.secureBikeStorage).toBe(true);
    expect(r.listing.abutsLaneway).toBe(true);
  });

  it('flags the two units as an unverified suite', () => {
    expect(r.listing.suite).toBe('existing-unverified');
    expect(r.notes.join(' ')).toMatch(/no public registry/i);
  });

  it('reports what it could not find', () => {
    expect(r.missing).toContain('distance to nearest protected bike lane');
    expect(r.missing).toContain('heritage status');
  });
});

describe('MLS sheet paste', () => {
  const r = parseListing(MLS_SHEET);

  it('reads address and list price', () => {
    expect(r.listing.address).toBe('196 Brunswick Ave');
    expect(r.listing.listPrice).toBe(1_390_000);
    expect(r.listing.soldPrice).toBeUndefined();
  });

  it('reads the decimal tax figure', () => {
    expect(r.listing.annualPropertyTax).toBeCloseTo(12_622.26, 2);
  });

  it('reads type, lot and DOM', () => {
    expect(r.listing.type).toBe('Detached');
    expect(r.listing.lotFrontageFt).toBe(18);
    expect(r.listing.lotDepthFt).toBe(120);
    expect(r.listing.daysOnMarket).toBe(8);
  });

  it('sums bedrooms above and below grade, and warns about the split', () => {
    expect(r.listing.beds).toBe(4);
    expect(r.notes.join(' ')).toMatch(/above grade/);
  });

  it('detects the offer date and the bully-offer clause', () => {
    expect(r.listing.holdbackOffers).toBe(true);
    expect(r.notes.join(' ')).toMatch(/pre-emptive/i);
  });

  it('reads the kitchen rough-in as an addable suite', () => {
    expect(r.listing.kitchens).toBe(1);
    expect(r.listing.suite).toBe('addable');
  });

  it('picks up laneway access from Drive: Lane', () => {
    expect(r.listing.abutsLaneway).toBe(true);
  });
});

describe('robustness', () => {
  it('does not throw on empty input', () => {
    expect(() => parseListing('')).not.toThrow();
  });

  it('does not invent a price it cannot find', () => {
    const r = parseListing('Some random text with no prices in it at all.');
    expect(r.listing.listPrice).toBeUndefined();
    expect(r.missing).toContain('list price');
  });

  it('never reports a field it did not actually read', () => {
    const r = parseListing(HOUSESIGMA);
    for (const f of r.found) {
      expect(f.value.length).toBeGreaterThan(0);
      expect(f.source.length).toBeGreaterThan(0);
    }
  });
});
