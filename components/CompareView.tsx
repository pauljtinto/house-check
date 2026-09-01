'use client';

import { useState } from 'react';
import type { Evaluation } from '@/lib/evaluate';
import { money } from './Field';

type SortKey = 'address' | 'listPrice' | 'predicted' | 'verdict' | 'cash' | 'carry' | 'bike';

const VERDICT_ORDER = { buy: 0, stretch: 1, walk: 2 } as const;
const VERDICT_COLOR = { buy: 'var(--pass)', stretch: 'var(--warn)', walk: 'var(--fail)' } as const;
const VERDICT_LABEL = { buy: 'Pursue', stretch: 'Stretch', walk: 'Walk' } as const;

/** Side-by-side across every saved listing. What you actually decide from. */
export function CompareView({
  evaluations,
  onSelect,
}: {
  evaluations: Evaluation[];
  onSelect: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortKey>('verdict');
  const [asc, setAsc] = useState(true);

  const value = (e: Evaluation, k: SortKey): string | number => {
    switch (k) {
      case 'address':
        return e.listing.address || 'zzz';
      case 'listPrice':
        return e.listing.listPrice;
      case 'predicted':
        return e.modelledPrice;
      case 'verdict':
        return VERDICT_ORDER[e.verdict];
      case 'cash':
        return e.cash.total;
      case 'carry':
        return e.carryEmpty.effectiveMonthly;
      case 'bike':
        return e.bike.assessed ? e.bike.resilientScore : -1;
    }
  };

  const rows = [...evaluations].sort((a, b) => {
    const x = value(a, sort);
    const y = value(b, sort);
    const cmp = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
    return asc ? cmp : -cmp;
  });

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
      <h3 className="text-[13px] font-semibold mb-1">Compare</h3>
      <p className="muted text-[12px] mb-3">
        Predicted landing price, not the ask. Carry is the condo-empty branch — the worst case.
      </p>

      <div className="scroll-x">
        <table className="text-[12px] w-full tabular-nums" style={{ minWidth: 720 }}>
          <thead>
            <tr className="muted text-[11px]" style={{ borderBottom: '1px solid var(--line)' }}>
              {head('address', 'Address')}
              {head('verdict', 'Verdict')}
              {head('listPrice', 'Ask', true)}
              {head('predicted', 'Predicted', true)}
              {head('cash', 'To close', true)}
              {head('carry', 'Monthly', true)}
              {head('bike', 'Bike', true)}
              <th className="pb-1.5 px-2 font-medium text-left">Red gates</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const red = e.gates.filter((g) => g.state === 'fail').map((g) => g.name);
              return (
                <tr
                  key={e.listing.id}
                  className="cursor-pointer"
                  style={{ borderBottom: '1px solid var(--line)' }}
                  onClick={() => onSelect(e.listing.id)}
                >
                  <td className="py-1.5 px-2">{e.listing.address || 'Untitled'}</td>
                  <td className="py-1.5 px-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: VERDICT_COLOR[e.verdict] }}
                      />
                      {VERDICT_LABEL[e.verdict]}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right">{money(e.listing.listPrice)}</td>
                  <td className="py-1.5 px-2 text-right font-medium">
                    {money(e.modelledPrice)}
                    {e.listing.soldPrice && (
                      <span className="muted"> / {money(e.listing.soldPrice)}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right">{money(e.cash.total)}</td>
                  <td className="py-1.5 px-2 text-right">{money(e.carryEmpty.effectiveMonthly)}</td>
                  <td className="py-1.5 px-2 text-right">
                    {e.bike.assessed ? e.bike.resilientScore : <span className="muted">–</span>}
                  </td>
                  <td className="py-1.5 px-2" style={{ color: red.length ? 'var(--fail)' : undefined }}>
                    {red.length ? red.join(', ') : <span className="muted">none</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
