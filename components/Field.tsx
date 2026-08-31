'use client';

import React from 'react';

export function Field({
  label,
  hint,
  placeholder: isPlaceholder,
  children,
}: {
  label: string;
  hint?: string;
  placeholder?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-1.5 text-[13px] font-medium mb-1">
        {label}
        {isPlaceholder && (
          <span
            className="text-[10px] uppercase tracking-wide px-1 py-px rounded"
            style={{ background: 'var(--warn)', color: 'var(--panel)' }}
            title="This is a placeholder value, not a figure you supplied"
          >
            guess
          </span>
        )}
      </span>
      {children}
      {hint && <span className="block muted text-[11px] mt-1 leading-snug">{hint}</span>}
    </label>
  );
}

export function Money({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={1000}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Pct({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      value={+(value * 100).toFixed(3)}
      step={0.05}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
    />
  );
}

export function Num({
  value,
  onChange,
  step = 1,
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  );
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-auto"
        style={{ width: 'auto' }}
      />
      {label}
    </label>
  );
}

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-CA');
}
