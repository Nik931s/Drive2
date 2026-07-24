'use client';

import { useState } from 'react';

export default function PaymentCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(Math.round(price * 0.1));
  const [apr, setApr] = useState(6.9);
  const [term, setTerm] = useState(60);
  const principal = Math.max(price - down, 0);
  const r = apr / 100 / 12;
  const monthly = r === 0 ? principal / term : (principal * r) / (1 - Math.pow(1 + r, -term));

  return (
    <div className="mt-6">
      <h4 className="font-display text-lg mb-2">Estimate payment</h4>
      <div className="space-y-2 text-xs">
        <Row label="Down payment"><input type="number" value={down} step={500} onChange={(e) => setDown(Number(e.target.value))} className="calc-input" /></Row>
        <Row label="APR %"><input type="number" value={apr} step={0.1} onChange={(e) => setApr(Number(e.target.value))} className="calc-input" /></Row>
        <Row label="Term (months)"><input type="number" value={term} step={6} onChange={(e) => setTerm(Number(e.target.value))} className="calc-input" /></Row>
      </div>
      <div className="bg-ink text-concrete text-center p-3 mt-3">
        <div className="font-display text-3xl text-amber">${Math.round(monthly)}</div>
        <div className="font-mono text-[11px] text-chrome">estimated / month</div>
      </div>
      <p className="text-[11px] text-inkSoft mt-1">Estimate only — not a loan offer.</p>
      <style jsx>{`
        .calc-input {
          width: 90px;
          border: 1px solid #B8BCC0;
          padding: 4px 6px;
          font-family: 'IBM Plex Mono', monospace;
        }
      `}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {children}
    </div>
  );
}
