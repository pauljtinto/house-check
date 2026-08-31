'use client';

import { useState } from 'react';
import { parseListing, type ParseResult } from '@/lib/parseListing';
import type { Listing } from '@/lib/types';

export function Importer({
  onImport,
  onCancel,
}: {
  onImport: (l: Partial<Listing>) => void;
  onCancel: () => void;
}) {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);

  return (
    <div className="panel rounded-lg p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Import a listing</h2>
        <button onClick={onCancel} className="text-[12px] muted underline">
          Cancel
        </button>
      </div>
      <p className="muted text-[12px] leading-snug">
        Paste a HouseSigma page or an MLS sheet. Everything it reads is shown below for you to check
        before it becomes a listing — it never fills in a value silently.
      </p>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={10}
        placeholder="Paste the whole page here — address, prices, key facts, description…"
        style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
      />

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => setResult(parseListing(raw))} disabled={!raw.trim()}>
          Parse
        </button>
        {result && (
          <button
            className="btn"
            onClick={() => {
              onImport(result.listing);
              setRaw('');
              setResult(null);
            }}
          >
            Create listing
          </button>
        )}
      </div>

      {result && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h3 className="text-[13px] font-semibold mb-1.5">
              Read {result.found.length} field{result.found.length === 1 ? '' : 's'}
            </h3>
            <div className="scroll-x">
              <table className="text-[12px] w-full" style={{ minWidth: 420 }}>
                <tbody>
                  {result.found.map((f, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-1 pr-3 muted whitespace-nowrap">{f.field}</td>
                      <td className="py-1 pr-3 font-medium">{f.value}</td>
                      <td className="py-1 muted text-[11px] italic">{f.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.missing.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold mb-1">Not found — you&apos;ll need to enter these</h3>
              <p className="text-[12px] muted">{result.missing.join(' · ')}</p>
            </div>
          )}

          {result.notes.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold mb-1">Notes</h3>
              <ul className="space-y-1 text-[12px]">
                {result.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 leading-snug">
                    <span style={{ color: 'var(--warn)' }}>▲</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
