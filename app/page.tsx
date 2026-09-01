'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PROFILE,
  PLACEHOLDER_FIELDS,
  type BuyerProfile,
  type Listing,
  type PropertyType,
  type HeritageStatus,
  type SuiteStatus,
} from '@/lib/types';
import { evaluate } from '@/lib/evaluate';
import { Verdict } from '@/components/Verdict';
import { Importer } from '@/components/Importer';
import { Field, Money, Pct, Num, Check, money } from '@/components/Field';
import { Comparables, useComps } from '@/components/Comparables';
import { StretchPanel } from '@/components/StretchPanel';
import { CompareView } from '@/components/CompareView';
import { seedListings } from '@/lib/seed';
import { CompsBrowser } from '@/components/CompsBrowser';

const STORAGE_KEY = 'house-check:v1';

const VERDICT_DOT = { buy: 'var(--pass)', stretch: 'var(--warn)', walk: 'var(--fail)' } as const;

function blankListing(over: Partial<Listing> = {}): Listing {
  return {
    id: crypto.randomUUID(),
    address: '',
    listPrice: 999_000,
    daysOnMarket: undefined,
    type: 'Semi-Detached',
    onResilientCorridor: true,
    secureBikeStorage: false,
    northOfDavenport: false,
    heritage: 'unknown',
    suite: 'none',
    abutsLaneway: false,
    scores: {},
    ...over,
  };
}

function isBlank(l: Listing): boolean {
  return !l.address.trim() && l.listPrice === 999_000 && l.metresToProtectedLane === undefined;
}

export default function Page() {
  const [profile, setProfile] = useState<BuyerProfile>(DEFAULT_PROFILE);
  const [listings, setListings] = useState<Listing[]>([blankListing()]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'listing' | 'profile' | 'import'>('listing');
  const [showCompare, setShowCompare] = useState(false);
  const [showComps, setShowComps] = useState(false);
  const { comps, error: compsError } = useComps();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.profile) setProfile({ ...DEFAULT_PROFILE, ...s.profile });
        if (Array.isArray(s.listings) && s.listings.length) {
          setListings(s.listings);
          setActiveId(s.listings[0].id);
        }
      }
    } catch {
      /* first run, private window, or storage blocked */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, listings }));
    } catch {
      /* non-fatal */
    }
  }, [profile, listings, loaded]);

  const active = useMemo(
    () => listings.find((l) => l.id === activeId) ?? listings[0],
    [listings, activeId],
  );

  const evaluations = useMemo(
    () => new Map(listings.map((l) => [l.id, evaluate(l, profile)])),
    [listings, profile],
  );
  const evaluation = active ? evaluations.get(active.id)! : null;

  function update(patch: Partial<Listing>) {
    setListings((ls) => ls.map((l) => (l.id === active.id ? { ...l, ...patch } : l)));
  }

  /** Reuse an existing untouched blank rather than piling up empties. */
  function addListing(from?: Partial<Listing>) {
    const existingBlank = !from && listings.find(isBlank);
    if (existingBlank) {
      setActiveId(existingBlank.id);
      setView('listing');
      return;
    }
    const l = blankListing(from);
    setListings((ls) => [...ls, l]);
    setActiveId(l.id);
    setView('listing');
  }

  /** Load the three listings we analysed, without wiping anything already here. */
  function loadSeed() {
    const seeded = seedListings();
    setListings((ls) => {
      const kept = ls.filter((l) => !isBlank(l));
      const have = new Set(kept.map((l) => l.address.trim().toLowerCase()));
      const fresh = seeded.filter((s) => !have.has(s.address.trim().toLowerCase()));
      return [...kept, ...fresh];
    });
    setActiveId(null);
    setView('listing');
  }

  function removeListing(id: string) {
    setListings((ls) => {
      const next = ls.filter((l) => l.id !== id);
      return next.length ? next : [blankListing()];
    });
    if (activeId === id) setActiveId(null);
  }

  function setScore(person: 'Paul' | 'Armando', pillar: keyof NonNullable<Listing['scores']>[string], v: number) {
    const scores = { ...(active.scores ?? {}) };
    const cur = scores[person] ?? { location: 3, size: 3, growth: 3, income: 3 };
    scores[person] = { ...cur, [pillar]: v };
    update({ scores });
  }

  const usingPlaceholders = PLACEHOLDER_FIELDS.filter((f) => profile[f] === DEFAULT_PROFILE[f]);

  const missingSeed = useMemo(() => {
    const have = new Set(listings.map((l) => l.address.trim().toLowerCase()));
    return seedListings().filter((s) => !have.has(s.address.trim().toLowerCase())).length;
  }, [listings]);

  if (!active) return null;

  return (
    <main className="max-w-[1500px] mx-auto px-5 py-6">
      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">House Check</h1>
          <p className="muted text-[13px]">Annex · U of T · Trinity Bellwoods</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('import')} className="btn btn-primary">
            Import listing
          </button>
          <button onClick={() => addListing()} className="btn">
            + Blank
          </button>
          <button
            onClick={() => setShowCompare((v) => !v)}
            className="btn"
            disabled={listings.length < 2}
            title={listings.length < 2 ? 'Add a second listing to compare' : undefined}
            style={listings.length < 2 ? { opacity: 0.5, cursor: 'default' } : undefined}
          >
            {showCompare ? 'Hide compare' : `Compare (${listings.length})`}
          </button>
          <button
            onClick={() => setShowComps((v) => !v)}
            className="btn"
            disabled={comps.length === 0}
            style={comps.length === 0 ? { opacity: 0.5, cursor: 'default' } : undefined}
          >
            {showComps ? 'Hide comps' : `Comps (${comps.length})`}
          </button>
          <button onClick={() => setView(view === 'profile' ? 'listing' : 'profile')} className="btn">
            {view === 'profile' ? 'Back' : 'Your numbers'}
          </button>
        </div>
      </header>

      {usingPlaceholders.length > 0 && (
        <div
          className="rounded-lg p-3 mb-4 text-[13px] leading-snug panel"
          style={{ borderColor: 'var(--warn)' }}
        >
          <strong>{usingPlaceholders.length} financial inputs are still placeholders</strong> — dollar figures
          are illustrative until you replace them under <em>Your numbers</em>.
        </div>
      )}

      {showComps && comps.length > 0 && (
        <div className="mb-5">
          <CompsBrowser comps={comps} onClose={() => setShowComps(false)} />
        </div>
      )}

      {showCompare && listings.length >= 2 && (
        <div className="mb-5">
          <CompareView
            evaluations={listings.map((l) => evaluations.get(l.id)!)}
            onSelect={(id) => {
              setActiveId(id);
              setView('listing');
              setShowCompare(false);
            }}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[230px_360px_1fr] gap-5 items-start">
        {/* Listing rail */}
        <aside className="panel rounded-lg p-2">
          <div className="text-[11px] uppercase tracking-wide muted px-2 py-1.5">
            {listings.length} listing{listings.length === 1 ? '' : 's'}
          </div>
          <div className="space-y-0.5">
            {listings.map((l) => {
              const ev = evaluations.get(l.id)!;
              const isActive = l.id === active.id;
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer group"
                  style={isActive ? { background: 'var(--panel-2)' } : undefined}
                  onClick={() => {
                    setActiveId(l.id);
                    setView('listing');
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: VERDICT_DOT[ev.verdict] }}
                    title={ev.verdict}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate">{l.address || 'Untitled'}</span>
                    <span className="block text-[11px] muted tabular-nums">
                      {money(l.listPrice)}
                      {l.soldPrice ? ` → ${money(l.soldPrice)}` : ''}
                    </span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeListing(l.id);
                    }}
                    className="muted text-[15px] leading-none px-1 opacity-0 group-hover:opacity-100"
                    title="Remove"
                    aria-label={`Remove ${l.address || 'untitled listing'}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className="pt-1.5 mt-1 px-2 space-y-1.5 border-t" style={{ borderColor: 'var(--line)' }}>
            {missingSeed > 0 && (
              <button onClick={loadSeed} className="block text-[11px] underline text-left leading-snug">
                Load the {missingSeed} listing{missingSeed === 1 ? '' : 's'} we analysed
                <span className="block muted no-underline">196 &amp; 46 Brunswick, 365 Shaw</span>
              </button>
            )}
            {listings.length > 1 && (
              <button
                onClick={() => {
                  if (confirm('Remove every listing? This cannot be undone.')) {
                    setListings([blankListing()]);
                    setActiveId(null);
                  }
                }}
                className="block text-[11px] muted underline"
              >
                Clear all
              </button>
            )}
          </div>
        </aside>

        {/* Editor */}
        <section>
          {view === 'import' ? (
            <Importer
              onImport={(partial) => {
                addListing(partial);
              }}
              onCancel={() => setView('listing')}
            />
          ) : view === 'profile' ? (
            <div className="panel rounded-lg p-4 space-y-3">
              <h2 className="text-sm font-semibold">Your numbers</h2>
              <Field label="Budget ceiling" hint="Pre-approval purchase price">
                <Money value={profile.budgetCeiling} onChange={(v) => setProfile({ ...profile, budgetCeiling: v })} />
              </Field>
              <Field label="Stretch limit" hint="Above this, walk regardless">
                <Money value={profile.stretchLimit} onChange={(v) => setProfile({ ...profile, stretchLimit: v })} />
              </Field>
              <Field label="Cash available" placeholder={profile.cashAvailable === DEFAULT_PROFILE.cashAvailable} hint="Down payment plus closing costs">
                <Money value={profile.cashAvailable} onChange={(v) => setProfile({ ...profile, cashAvailable: v })} />
              </Field>
              <Field label="Planned down payment" placeholder={profile.plannedDownPayment === DEFAULT_PROFILE.plannedDownPayment} hint="Raised automatically if below the legal minimum">
                <Money value={profile.plannedDownPayment} onChange={(v) => setProfile({ ...profile, plannedDownPayment: v })} />
              </Field>
              <Field label="Reserve floor" placeholder={profile.reserveFloor === DEFAULT_PROFILE.reserveFloor} hint="Cash you will not go below after closing">
                <Money value={profile.reserveFloor} onChange={(v) => setProfile({ ...profile, reserveFloor: v })} />
              </Field>
              <Field label="Mortgage rate %" placeholder={profile.contractRate === DEFAULT_PROFILE.contractRate}>
                <Pct value={profile.contractRate} onChange={(v) => setProfile({ ...profile, contractRate: v })} />
              </Field>
              <Field label="Amortization (years)">
                <Num value={profile.amortizationYears} onChange={(v) => setProfile({ ...profile, amortizationYears: v ?? 30 })} />
              </Field>
              <Field label="Documented annual income" placeholder={profile.documentedAnnualIncome === DEFAULT_PROFILE.documentedAnnualIncome} hint="What the lender will actually underwrite">
                <Money value={profile.documentedAnnualIncome} onChange={(v) => setProfile({ ...profile, documentedAnnualIncome: v })} />
              </Field>
              <Field label="Other monthly debt" placeholder={profile.otherMonthlyDebt === DEFAULT_PROFILE.otherMonthlyDebt} hint="Practice loan, HELOC, anything the lender counts">
                <Money value={profile.otherMonthlyDebt} onChange={(v) => setProfile({ ...profile, otherMonthlyDebt: v })} />
              </Field>
              <Field label="Condo monthly carry" placeholder={profile.condoMonthlyCarry === DEFAULT_PROFILE.condoMonthlyCarry}>
                <Money value={profile.condoMonthlyCarry} onChange={(v) => setProfile({ ...profile, condoMonthlyCarry: v })} />
              </Field>
              <Field label="Condo expected rent" placeholder={profile.condoExpectedRent === DEFAULT_PROFILE.condoExpectedRent}>
                <Money value={profile.condoExpectedRent} onChange={(v) => setProfile({ ...profile, condoExpectedRent: v })} />
              </Field>
              <Field label="Bikeability threshold" hint="Below this score, a listing fails outright">
                <Num value={profile.bikeabilityThreshold} onChange={(v) => setProfile({ ...profile, bikeabilityThreshold: v ?? 60 })} />
              </Field>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="text-[13px] font-medium mb-2">Pillar weights</div>
                {(['location', 'size', 'growth', 'income'] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] capitalize w-16">{k}</span>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={profile.weights[k]}
                      onChange={(e) =>
                        setProfile({ ...profile, weights: { ...profile.weights, [k]: Number(e.target.value) } })
                      }
                    />
                    <span className="text-[12px] tabular-nums w-8 text-right">{profile.weights[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel rounded-lg p-4 space-y-3">
              <h2 className="text-sm font-semibold">Listing</h2>
              <Field label="Address">
                <input value={active.address} onChange={(e) => update({ address: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="List price">
                  <Money value={active.listPrice} onChange={(v) => update({ listPrice: v })} />
                </Field>
                <Field label="Days on market">
                  <Num value={active.daysOnMarket} onChange={(v) => update({ daysOnMarket: v })} />
                </Field>
              </div>
              <Field label="Type">
                <select value={active.type} onChange={(e) => update({ type: e.target.value as PropertyType })}>
                  {['Semi-Detached', 'Att/Row/Twnhouse', 'Detached', 'Duplex', 'Triplex', 'Other'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Check
                checked={active.holdbackOffers ?? false}
                onChange={(b) => update({ holdbackOffers: b })}
                label="Offers held to a date (offer night)"
              />
              <p className="muted text-[11px] -mt-1 leading-snug">
                A declared offer date beats the price band — it means the ask is a strategy, not a valuation.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Annual property tax">
                  <Num value={active.annualPropertyTax} onChange={(v) => update({ annualPropertyTax: v })} step={100} />
                </Field>
                <Field label="Kitchens" hint="2+ signals an existing suite">
                  <Num value={active.kitchens} onChange={(v) => update({ kitchens: v })} />
                </Field>
              </div>
              <Field label="Sold price" hint="Only for comps — scores the model's prediction">
                <Num value={active.soldPrice} onChange={(v) => update({ soldPrice: v })} step={1000} />
              </Field>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="text-[13px] font-medium mb-2">Listing history</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Original ask" hint="Earliest price across all attempts">
                    <Num value={active.originalListPrice} onChange={(v) => update({ originalListPrice: v })} step={1000} />
                  </Field>
                  <Field label="Prior terminations">
                    <Num value={active.priorTerminations} onChange={(v) => update({ priorTerminations: v })} />
                  </Field>
                </div>
                <p className="muted text-[11px] mt-1 leading-snug">
                  A terminate-and-relist resets days-on-market and lowers the ask. Any &ldquo;sold over
                  ask&rdquo; measured against the relist overstates demand.
                </p>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="text-[13px] font-medium mb-2">Bikeability</div>
                <Field label="Metres to nearest protected lane">
                  <Num value={active.metresToProtectedLane} onChange={(v) => update({ metresToProtectedLane: v })} step={50} />
                </Field>
                <div className="space-y-1.5 mt-2">
                  <Check checked={active.onResilientCorridor} onChange={(b) => update({ onResilientCorridor: b })} label="Served by Harbord/Hoskin or College" />
                  <Check checked={active.secureBikeStorage} onChange={(b) => update({ secureBikeStorage: b })} label="Secure bike storage" />
                  <Check checked={active.northOfDavenport} onChange={(b) => update({ northOfDavenport: b })} label="North of Davenport (the climb)" />
                </div>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="text-[13px] font-medium mb-2">Growth &amp; income</div>
                <Field label="Heritage status" hint="Check the City Heritage Property Search">
                  <select value={active.heritage} onChange={(e) => update({ heritage: e.target.value as HeritageStatus })}>
                    <option value="unknown">Not checked</option>
                    <option value="none">Not on the register</option>
                    <option value="listed">Listed only</option>
                    <option value="designated">Designated</option>
                  </select>
                </Field>
                <Field label="Second suite">
                  <select value={active.suite} onChange={(e) => update({ suite: e.target.value as SuiteStatus })}>
                    <option value="none">None</option>
                    <option value="existing-unverified">Exists, legality unverified</option>
                    <option value="existing-legal">Exists, permit closed + ESA</option>
                    <option value="addable">Could be added</option>
                  </select>
                </Field>
                <Field label="Suite rent per month">
                  <Num value={active.estimatedSuiteRentMonthly} onChange={(v) => update({ estimatedSuiteRentMonthly: v })} step={100} />
                </Field>
                <div className="mt-2">
                  <Check checked={active.abutsLaneway} onChange={(b) => update({ abutsLaneway: b })} label="Abuts a public laneway" />
                </div>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="text-[13px] font-medium mb-1">Scores, 1–5</div>
                <p className="muted text-[11px] mb-2">Score separately, then compare. Don&apos;t look at each other&apos;s first.</p>
                {(['Paul', 'Armando'] as const).map((person) => (
                  <div key={person} className="mb-2">
                    <div className="text-[12px] font-medium">{person}</div>
                    {(['location', 'size', 'growth', 'income'] as const).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-[11px] capitalize w-14 muted">{k}</span>
                        <input type="range" min={1} max={5} value={active.scores?.[person]?.[k] ?? 3} onChange={(e) => setScore(person, k, Number(e.target.value))} />
                        <span className="text-[11px] tabular-nums w-3">{active.scores?.[person]?.[k] ?? 3}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Field label="Deal-breaker" hint="Anything here fails the listing outright">
                <input value={active.dealBreaker ?? ''} onChange={(e) => update({ dealBreaker: e.target.value || undefined })} />
              </Field>
            </div>
          )}
        </section>

        <section className="space-y-4">
          {evaluation && <Verdict ev={evaluation} />}
          {evaluation && (
            <StretchPanel listing={active} profile={profile} predicted={evaluation.modelledPrice} />
          )}
          {evaluation && comps.length > 0 && (
            <Comparables comps={comps} type={active.type} price={evaluation.modelledPrice} />
          )}
          {compsError && (
            <div className="panel rounded-lg p-3 text-[12px] muted">
              Could not load the comp set ({compsError}). Check that
              <code> public/data/comps-university-c01.csv</code> is present.
            </div>
          )}
        </section>
      </div>

      <footer className="muted text-[11px] mt-8 leading-relaxed max-w-3xl">
        Not mortgage, tax or legal advice. Rates and rules verified 2026-08-31 — see PHASE-0-FINDINGS.md.
        Predictions are calibrated on sold comps in Toronto C01/University, March–August 2026; sample sizes are
        small and shown with every estimate.
      </footer>
    </main>
  );
}
