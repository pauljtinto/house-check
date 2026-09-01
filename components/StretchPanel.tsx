'use client';

import { landTransferTax } from '@/lib/landTransferTax';
import { minimumDownPayment, monthlyPayment, qualifyingRate } from '@/lib/mortgage';
import { DEFAULTS } from '@/lib/assumptions';
import type { BuyerProfile, Listing } from '@/lib/types';
import { money } from './Field';

/**
 * What it costs to go over the ceiling.
 *
 * Shown only when the predicted landing price exceeds the budget ceiling —
 * the point is to price the stretch, not to tempt one.
 */
export function StretchPanel({
  listing,
  profile,
  predicted,
}: {
  listing: Listing;
  profile: BuyerProfile;
  predicted: number;
}) {
  if (predicted <= profile.budgetCeiling) return null;

  const oneOrTwoFamily = listing.type !== 'Triplex';
  const base = profile.budgetCeiling;
  const baseTax = landTransferTax(base, { oneOrTwoFamily }).total;
  const baseDown = Math.max(profile.plannedDownPayment, minimumDownPayment(base));
  const propertyTaxMonthly = (listing.annualPropertyTax ?? 0) / 12;

  const step = 50_000;
  const top = Math.max(profile.stretchLimit, Math.ceil(predicted / step) * step);

  const rows: {
    price: number;
    tax: number;
    extraTax: number;
    down: number;
    extraCash: number;
    carry: number;
    remaining: number;
    breaks: boolean;
    isPredicted: boolean;
  }[] = [];

  for (let p = base; p <= top; p += step) {
    const tax = landTransferTax(p, { oneOrTwoFamily }).total;
    const down = Math.max(profile.plannedDownPayment, minimumDownPayment(p));
    const closing = tax + DEFAULTS.legalFees + DEFAULTS.titleInsurance + DEFAULTS.homeInspection;
    const totalCash = down + closing;
    const principal = p - down;
    const carry = monthlyPayment(principal, profile.contractRate, profile.amortizationYears);
    const remaining = profile.cashAvailable - totalCash;
    rows.push({
      price: p,
      tax,
      extraTax: tax - baseTax,
      down,
      extraCash: totalCash - (baseDown + baseTax + DEFAULTS.legalFees + DEFAULTS.titleInsurance + DEFAULTS.homeInspection),
      carry: carry + propertyTaxMonthly,
      remaining,
      breaks: remaining < profile.reserveFloor,
      isPredicted: Math.abs(p - predicted) < step / 2,
    });
  }

  const firstBreak = rows.find((r) => r.breaks);
  const marginal = landTransferTax(predicted, { oneOrTwoFamily }).marginalRate;

  return (
    <div className="panel rounded-lg p-4" style={{ borderColor: 'var(--warn)' }}>
      <h3 className="text-[13px] font-semibold mb-1">What the stretch costs</h3>
      <p className="muted text-[12px] mb-3 leading-snug">
        Predicted landing is {money(predicted)}, above your {money(profile.budgetCeiling)} ceiling.
        Marginal land transfer tax here is {(marginal * 100).toFixed(0)}% combined, so every $100,000
        of price costs {money(marginal * 100_000)} in tax before the larger down payment.
      </p>

      <div className="scroll-x">
        <table className="text-[12px] w-full tabular-nums" style={{ minWidth: 460 }}>
          <thead>
            <tr className="muted text-[11px] text-left">
              <th className="pb-1 pr-3 font-medium">Price</th>
              <th className="pb-1 pr-3 font-medium text-right">Extra tax</th>
              <th className="pb-1 pr-3 font-medium text-right">Extra cash</th>
              <th className="pb-1 pr-3 font-medium text-right">Monthly</th>
              <th className="pb-1 font-medium text-right">Cash left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.price}
                style={{
                  background: r.isPredicted ? 'var(--panel-2)' : undefined,
                  color: r.breaks ? 'var(--fail)' : undefined,
                }}
              >
                <td className="py-0.5 pr-3">
                  {money(r.price)}
                  {r.isPredicted && <span className="muted text-[10px]"> ← predicted</span>}
                </td>
                <td className="py-0.5 pr-3 text-right">{r.extraTax ? money(r.extraTax) : '—'}</td>
                <td className="py-0.5 pr-3 text-right">{r.extraCash ? money(r.extraCash) : '—'}</td>
                <td className="py-0.5 pr-3 text-right">{money(r.carry)}</td>
                <td className="py-0.5 text-right">{money(r.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] mt-3 leading-snug">
        {firstBreak ? (
          <>
            Your {money(profile.reserveFloor)} reserve floor breaks at{' '}
            <strong>{money(firstBreak.price)}</strong>. That is the hard stop, whatever the house is worth.
          </>
        ) : (
          <>The reserve floor holds across this whole range.</>
        )}
      </p>
      <p className="muted text-[11px] mt-1 leading-snug">
        Monthly figures exclude the condo carry and use the contract rate, not the stress-tested rate.
      </p>
    </div>
  );
}
