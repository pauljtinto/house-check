'use client';

import { useMemo, useState } from 'react';
import { allBands, type Comp } from '@/lib/comps';
import { money } from './Field';

type SortKey = 'address' | 'type' | 'listPrice' | 'soldPrice' | 'soldToListPct' | 'dom' | 'soldDate';

/**
 * The full comp set, browsable.
 *
 * This is the transcription of the sold report from Joseph Tucci (Sutton Group),
 * 23 sales in Toronto C01/University, plus 365 Shaw in Trinity-Bellwoods. Every
 * price prediction in the app is calibrated from these rows, so being able to
 * read them matters more than a chart does.
 */
export function CompsBrowser({ comps, onClose }: { comps: Comp[]; onClose: () => void }) {
  const [sort, setSort] = useState<SortKey>('soldPrice');
  const [asc, setAsc] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = useMemo(() => ['all', ...new Set(comps.map((c) => c.type))], [comps]);
  const bands = useMemo(() => allBands(comps), [comps]);

  const rows = useMemo(() => {
    const filtered = typeFilter === 'all' ? comps : comps.filter((c) => c.type === typeFilter);
    return [...filtered].sort((a, b) => {
      const x = a[sort] ?? 0;
      const y = b[sort] ?? 0;
      const cmp = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
      return asc ? cmp : -cmp;
    });
  }, [comps, typeFilter, sort, asc]);

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const sold = rows.map((r) => r.soldPrice).sort((a, b) => a - b);
    const mid = Math.floor(sold.length / 2);
    return {
      n: sold.length,
      median: sold.length % 2 ? sold[mid] : (sold[mid - 1] + sold[mid]) / 2,
      mean: sold.reduce((a, b) => a + b, 0) / sold.length,
      overAsk: rows.filter((r) => r.soldToListPct > 100).length,
    };
  }, [rows]);

  const head = (k: SortKey, label: string, right = false) => (
    <th
      className={`pb-1.5 px-2 font-medium cursor-pointer whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
      onClick={() => {
        if (sort === k) setAsc(!asc);
        else {
          setSort(k);
          setAsc(true);
        }
      }}
    >
      {label}
      {sort === k && <span className="muted"> {asc ? '↑' : '↓'}</span>}
    </th>
  );

  return (
    <div className="panel rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-[13px] font-semibold">
          Sold comparables <span className="muted font-normal">· {comps.length} sales</span>
        </h3>
        <button onClick={onClose} className="text-[12px] muted underline">
          Close
        </button>
      </div>
      <p className="muted text-[12px] mb-3 leading-snug">
        From your agent&apos;s sold report — Toronto C01/University, March–August 2026 — plus 365 Shaw in
        Trinity-Bellwoods. Every price prediction in this app is calibrated from these rows. Source file:{' '}
        <code>public/data/comps-university-c01.csv</code>.
      </p>

      {/* Type filter with per-type medians */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {types.map((t) => {
          const band = t === 'all' ? null : bands.find((b) => b.type === t);
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="text-[11px] px-2 py-1 rounded panel"
              style={typeFilter === t ? { borderColor: 'var(--ink)' } : undefined}
            >
              {t === 'all' ? `All (${comps.length})` : `${t} (${band?.n})`}
              {band && band.n >= 3 && (
                <span className="muted"> · {money(band.median)}</span>
              )}
            </button>
          );
        })}
      </div>

      {stats && (
        <p className="text-[12px] mb-2 tabular-nums">
          <strong>{stats.n}</strong> sales · median <strong>{money(stats.median)}</strong> · mean{' '}
          {money(stats.mean)} · <strong>{stats.overAsk}</strong> sold over ask
        </p>
      )}

      <div className="scroll-x">
        <table className="text-[12px] w-full tabular-nums" style={{ minWidth: 760 }}>
          <thead>
            <tr className="muted text-[11px]" style={{ borderBottom: '1px solid var(--line)' }}>
              {head('address', 'Address')}
              {head('type', 'Type')}
              {head('listPrice', 'Listed', true)}
              {head('soldPrice', 'Sold', true)}
              {head('soldToListPct', '% of ask', true)}
              {head('dom', 'Days', true)}
              {head('soldDate', 'Sold')}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const relisted = (c.priorTerminations ?? 0) > 0;
              const over = c.soldToListPct > 100;
              return (
                <tr key={c.ref} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td className="py-1.5 px-2">
                    {c.address}
                    {c.community !== 'University' && (
                      <span className="muted text-[10px]"> · {c.community}</span>
                    )}
                    {relisted && (
                      <span
                        className="ml-1.5 text-[10px] px-1 rounded"
                        style={{ background: 'var(--fail)', color: 'var(--panel)' }}
                        title={`Failed at ${money(c.originalListPrice!)} across ${c.priorTerminations} prior attempt(s). True days on market: ${c.propertyDom}.`}
                      >
                        relist
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 muted">{c.type}</td>
                  <td className="py-1.5 px-2 text-right">
                    {money(c.listPrice)}
                    {relisted && (
                      <span className="block text-[10px]" style={{ color: 'var(--fail)' }}>
                        was {money(c.originalListPrice!)}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium">{money(c.soldPrice)}</td>
                  <td
                    className="py-1.5 px-2 text-right"
                    style={{ color: over ? 'var(--pass)' : 'var(--muted)' }}
                  >
                    {c.soldToListPct.toFixed(1)}%
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    {c.dom ?? '–'}
                    {relisted && c.propertyDom && (
                      <span className="block text-[10px]" style={{ color: 'var(--fail)' }}>
                        really {c.propertyDom}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 muted">{c.soldDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-2 border-t text-[11px] muted leading-snug" style={{ borderColor: 'var(--line)' }}>
        <p className="mb-1">
          <strong style={{ color: 'var(--fail)' }}>relist</strong> marks a property that was terminated and
          relisted lower. Its &ldquo;% of ask&rdquo; is measured against the reduced price and overstates
          demand — 46 Brunswick reads +6.8% but actually sold 15.3% below its original $1,888,000 ask.
        </p>
        <p>
          No square footage or lot dimensions in this export, so no $/sqft comparison is possible. Worth
          asking your agent for both, plus listing histories on every comp.
        </p>
      </div>
    </div>
  );
}
