'use client';

import { useEffect, useState } from 'react';
import { COMPS_CSV_PATH, parseCompsCsv, assessAgainstComps, type Comp } from '@/lib/comps';
import { money } from './Field';

/** Loads the comp CSV once and shares it across panels. */
export function useComps(): { comps: Comp[]; error: string | null } {
  const [comps, setComps] = useState<Comp[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(COMPS_CSV_PATH)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      })
      .then((t) => {
        if (!cancelled) setComps(parseCompsCsv(t));
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { comps, error };
}

export function Comparables({
  comps,
  type,
  price,
}: {
  comps: Comp[];
  type: string;
  price: number;
}) {
  if (comps.length === 0) return null;

  const { band, percentile, nearest, reading } = assessAgainstComps(comps, type, price);

  return (
    <div className="panel rounded-lg p-4">
      <h3 className="text-[13px] font-semibold mb-2">
        Comparables — {type}
        {band && <span className="muted font-normal"> · n={band.n}</span>}
      </h3>

      {band ? (
        <>
          {/* Band as a scale, with the predicted price marked */}
          <div className="mt-3 mb-1">
            <div className="relative h-8">
              {/* full range */}
              <div
                className="absolute top-3 h-1 rounded left-0 right-0"
                style={{ background: 'var(--line)' }}
              />
              {/* interquartile range */}
              <div
                className="absolute top-3 h-1 rounded"
                style={{
                  background: 'var(--pass)',
                  left: `${pct(band.p25, band.min, band.max)}%`,
                  right: `${100 - pct(band.p75, band.min, band.max)}%`,
                }}
              />
              {/* median */}
              <div
                className="absolute top-1.5 w-px h-4"
                style={{ background: 'var(--ink)', left: `${pct(band.median, band.min, band.max)}%` }}
              />
              {/* this listing */}
              <div
                className="absolute top-0 w-2 h-2 rounded-full -ml-1"
                style={{
                  background: 'var(--terra, var(--fail))',
                  left: `${clamp(pct(price, band.min, band.max))}%`,
                }}
                title={`This listing: ${money(price)}`}
              />
              <div
                className="absolute top-5 text-[10px] tabular-nums -ml-8 whitespace-nowrap"
                style={{ left: `${clamp(pct(price, band.min, band.max))}%`, color: 'var(--fail)' }}
              >
                {money(price)}
              </div>
            </div>
            {/* The median label is positioned under its own tick, not centred —
                centring only lines up by coincidence for a symmetric set. */}
            <div className="relative h-4 mt-3">
              <span className="absolute left-0 text-[10px] muted tabular-nums">{money(band.min)}</span>
              <span
                className="absolute text-[10px] muted tabular-nums whitespace-nowrap"
                style={{
                  left: `${clamp(pct(band.median, band.min, band.max))}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                median {money(band.median)}
              </span>
              <span className="absolute right-0 text-[10px] muted tabular-nums">{money(band.max)}</span>
            </div>
          </div>

          <p className="text-[12px] mt-3 leading-snug">{reading}</p>
          {percentile !== null && band.n >= 3 && (
            <p className="muted text-[11px] mt-1">
              Sits above {Math.round(percentile)}% of {type} sales in the set.
            </p>
          )}

          {band.sqftCoverage === 0 && (
            <p className="muted text-[11px] mt-2 leading-snug">
              No square footage in the comp set, so no $/sqft comparison is possible. Worth asking your
              agent for it — it is the missing piece for a real fair-value estimate.
            </p>
          )}

          {band.relistedCount > 0 && (
            <p className="text-[11px] mt-2 leading-snug" style={{ color: 'var(--warn)' }}>
              ▲ {band.relistedCount} of these {band.n} comp{band.n === 1 ? '' : 's'} was relisted after a
              failed attempt. Its sold-over-ask figure overstates demand.
            </p>
          )}

          {nearest.length > 0 && (
            <div className="mt-3 pt-2 border-t scroll-x" style={{ borderColor: 'var(--line)' }}>
              <div className="text-[11px] muted mb-1">Nearest by price</div>
              <table className="text-[11px] w-full tabular-nums" style={{ minWidth: 320 }}>
                <tbody>
                  {nearest.map((c) => (
                    <tr key={c.ref}>
                      <td className="pr-2 py-0.5">{c.address}</td>
                      <td className="pr-2 py-0.5 text-right">{money(c.soldPrice)}</td>
                      <td className="pr-2 py-0.5 text-right muted">{c.soldToListPct.toFixed(0)}% of ask</td>
                      <td className="py-0.5 text-right muted">
                        {(c.priorTerminations ?? 0) > 0 ? 'relist' : `${c.dom ?? '–'}d`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="text-[12px] muted">{reading}</p>
      )}
    </div>
  );
}

function pct(v: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((v - min) / (max - min)) * 100;
}
function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
