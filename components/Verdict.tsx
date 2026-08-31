'use client';

import type { Evaluation } from '@/lib/evaluate';
import { disagreements } from '@/lib/evaluate';
import { money } from './Field';

const STATE_COLOR = { pass: 'var(--pass)', warn: 'var(--warn)', fail: 'var(--fail)' } as const;

const VERDICT_LABEL = {
  buy: 'Worth pursuing',
  stretch: 'Stretch — conditions apply',
  walk: 'Walk away',
} as const;

const VERDICT_COLOR = { buy: 'var(--pass)', stretch: 'var(--warn)', walk: 'var(--fail)' } as const;

export function Verdict({ ev }: { ev: Evaluation }) {
  const dis = disagreements(ev.listing.scores);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className="rounded-lg p-4"
        style={{ background: VERDICT_COLOR[ev.verdict], color: '#fff' }}
      >
        <div className="text-[11px] uppercase tracking-[0.12em] opacity-80">
          {ev.listing.address || 'Unnamed listing'}
        </div>
        <div className="text-2xl font-semibold mt-0.5">{VERDICT_LABEL[ev.verdict]}</div>
        <div className="text-[13px] mt-1.5 opacity-95 leading-snug">{ev.headline}</div>
      </div>

      {/* The core insight: list price vs predicted landing */}
      <div className="panel rounded-lg p-4">
        <h3 className="text-[13px] font-semibold mb-2">Price reality</h3>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <div className="muted text-[11px]">Asking</div>
            <div className="text-lg tabular-nums">{money(ev.listing.listPrice)}</div>
          </div>
          <div>
            <div className="muted text-[11px]">Predicted landing</div>
            <div className="text-lg tabular-nums font-semibold">{money(ev.modelledPrice)}</div>
          </div>
        </div>
        {ev.strategy.predicted && (
          <div className="muted text-[12px] mt-2 tabular-nums">
            Range {money(ev.strategy.predicted.low)} – {money(ev.strategy.predicted.high)} · n={ev.strategy.n} ·{' '}
            {ev.strategy.confidence} confidence
          </div>
        )}
        <p className="text-[12px] mt-2 leading-relaxed muted">{ev.strategy.explanation}</p>
      </div>

      {/* Model check — only for sold comps */}
      {ev.listing.soldPrice && ev.strategy.predicted && (
        <div className="panel rounded-lg p-4">
          <h3 className="text-[13px] font-semibold mb-2">Model check</h3>
          {(() => {
            const actual = ev.listing.soldPrice!;
            const { low, median, high } = ev.strategy.predicted!;
            const errPct = ((median - actual) / actual) * 100;
            const inBand = actual >= low && actual <= high;
            return (
              <>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <div className="muted text-[11px]">Model predicted</div>
                    <div className="text-lg tabular-nums">{money(median)}</div>
                  </div>
                  <div>
                    <div className="muted text-[11px]">Actually sold for</div>
                    <div className="text-lg tabular-nums font-semibold">{money(actual)}</div>
                  </div>
                </div>
                <div
                  className="text-[12px] mt-2 leading-snug"
                  style={{ color: inBand ? 'var(--pass)' : 'var(--fail)' }}
                >
                  {inBand ? 'Inside the predicted range' : 'OUTSIDE the predicted range'} · median off by{' '}
                  {errPct > 0 ? '+' : ''}
                  {errPct.toFixed(1)}%
                  {' · '}
                  actual was {(((actual - ev.listing.listPrice) / ev.listing.listPrice) * 100).toFixed(1)}% vs ask
                </div>
                <p className="muted text-[11px] mt-1.5 leading-snug">
                  Every sold listing you import is a free calibration point. If the model keeps missing the
                  same direction, the ratios in <code>lib/listPriceStrategy.ts</code> need revising.
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* Gates */}
      <div className="panel rounded-lg p-4">
        <h3 className="text-[13px] font-semibold mb-2">Gates</h3>
        <div className="space-y-2">
          {ev.gates.map((g) => (
            <div key={g.name} className="flex gap-2.5 items-start text-[13px]">
              <span
                className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                style={{ background: STATE_COLOR[g.state] }}
              />
              <div>
                <span className="font-medium">{g.name}</span>
                <span className="muted"> — {g.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Money */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel rounded-lg p-4">
          <h3 className="text-[13px] font-semibold mb-2">Cash to close</h3>
          <Row label="Down payment" value={money(ev.cash.downPayment)} />
          <Row label="Ontario LTT" value={money(ev.cash.ontarioLtt)} />
          <Row label="Toronto MLTT" value={money(ev.cash.torontoMltt)} />
          <Row label="Admin fee" value={money(ev.cash.adminFee)} />
          <Row label="Legal, title, inspection" value={money(ev.cash.legal + ev.cash.titleInsurance + ev.cash.inspection)} />
          <Row label="Total" value={money(ev.cash.total)} strong />
          <Row label="Cash remaining" value={money(ev.cash.cashRemaining)} strong />
        </div>

        <div className="panel rounded-lg p-4">
          <h3 className="text-[13px] font-semibold mb-2">Monthly carry</h3>
          <Row label="Mortgage" value={money(ev.carryEmpty.mortgageMonthly)} />
          <Row label="At stress-tested rate" value={money(ev.carryEmpty.stressedMonthly)} />
          <Row label="Property tax" value={money(ev.carryEmpty.propertyTaxMonthly)} />
          <Row label="Insurance + maintenance" value={money(ev.carryEmpty.insuranceMonthly + ev.carryEmpty.maintenanceMonthly)} />
          <Row label="Condo carry" value={money(ev.carryEmpty.condoCarryMonthly)} />
          <div className="my-2 border-t" style={{ borderColor: 'var(--line)' }} />
          <Row label="Condo empty" value={money(ev.carryEmpty.effectiveMonthly)} strong />
          <Row label="Condo rented" value={money(ev.carryRented.effectiveMonthly)} strong />
          <div className="muted text-[11px] mt-2">
            TDS {(ev.carryEmpty.tds * 100).toFixed(1)}% empty · {(ev.carryRented.tds * 100).toFixed(1)}% rented
          </div>
        </div>
      </div>

      {/* Bikeability */}
      <div className="panel rounded-lg p-4">
        <h3 className="text-[13px] font-semibold mb-2">
          Bikeability {ev.bike.score}/100
          {ev.bike.resilienceGap > 0 && (
            <span className="muted font-normal"> · {ev.bike.resilientScore}/100 if Bill 212 lanes go</span>
          )}
        </h3>
        <div className="space-y-1.5">
          {ev.bike.factors.map((f) => (
            <div key={f.label} className="text-[12px]">
              <div className="flex justify-between">
                <span>{f.label}</span>
                <span className="tabular-nums muted">
                  {f.points}/{f.max}
                </span>
              </div>
              <div className="h-1 rounded mt-0.5" style={{ background: 'var(--line)' }}>
                <div
                  className="h-1 rounded"
                  style={{ width: `${(f.points / f.max) * 100}%`, background: 'var(--pass)' }}
                />
              </div>
              {f.note && <div className="muted text-[11px] mt-0.5">{f.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Disagreements */}
      {dis.length > 0 && (
        <div className="panel rounded-lg p-4">
          <h3 className="text-[13px] font-semibold mb-1">Where you disagree</h3>
          <p className="muted text-[12px] mb-2">
            The most useful thing on this page. Worth talking about before an offer, not after.
          </p>
          {dis.map((d) => (
            <div key={d.pillar} className="text-[13px]">
              <span className="capitalize font-medium">{d.pillar}</span>
              <span className="muted"> — {d.values.join(' vs ')} (gap of {d.gap})</span>
            </div>
          ))}
        </div>
      )}

      {/* What would have to be true */}
      {ev.whatWouldHaveToBeTrue.length > 0 && (
        <div className="panel rounded-lg p-4">
          <h3 className="text-[13px] font-semibold mb-2">What would have to be true</h3>
          <ul className="space-y-1 text-[13px]">
            {ev.whatWouldHaveToBeTrue.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="muted">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flags */}
      {ev.flags.length > 0 && (
        <div className="panel rounded-lg p-4" style={{ borderColor: 'var(--warn)' }}>
          <h3 className="text-[13px] font-semibold mb-2">Flags</h3>
          <ul className="space-y-1.5 text-[13px]">
            {ev.flags.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: 'var(--warn)' }}>▲</span>
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-[13px] py-0.5 ${strong ? 'font-semibold' : ''}`}>
      <span className={strong ? '' : 'muted'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
