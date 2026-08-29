'use client';
 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import type { Listing } from '@/lib/types';
 
const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];
 
function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
}
 
export default function EditListingForm({ listing }: { listing: Listing }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    make: listing.make,
    model: listing.model,
    year: String(listing.year),
    price: String(listing.price),
    mileage: String(listing.mileage),
    body_type: listing.body_type,
    fuel_type: listing.fuel_type,
    transmission: listing.transmission,
    drivetrain: listing.drivetrain || 'FWD',
    color: listing.color || '',
    vin: listing.vin || '',
    description: listing.description || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
 
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        make: form.make,
        model: form.model,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        body_type: form.body_type,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        drivetrain: form.drivetrain,
        color: form.color,
        vin: form.vin || null,
        description: form.description,
      })
      .eq('id', listing.id);
 
    setLoading(false);
 
    if (updateError) {
      setError(updateError.message);
      return;
    }
 
    router.push(`/listing/${listing.id}`);
    router.refresh();
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-chrome p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Make"><input required value={form.make} onChange={(e) => update('make', e.target.value)} className="input" /></Field>
        <Field label="Model"><input required value={form.model} onChange={(e) => update('model', e.target.value)} className="input" /></Field>
        <Field label="Year">
          <input
            required
            type="number"
            min={1980}
            max={2026}
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            onWheel={preventScrollChange}
            className="input"
          />
        </Field>
        <Field label="Price (£)">
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            onWheel={preventScrollChange}
            className="input"
          />
        </Field>
        <Field label="Mileage">
          <input
            required
            type="number"
            min={0}
            value={form.mileage}
            onChange={(e) => update('mileage', e.target.value)}
            onWheel={preventScrollChange}
            className="input"
          />
        </Field>
        <Field label="Color"><input value={form.color} onChange={(e) => update('color', e.target.value)} className="input" /></Field>
        <Field label="Body type">
          <select value={form.body_type} onChange={(e) => update('body_type', e.target.value)} className="input">
            {BODY_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Transmission">
          <select value={form.transmission} onChange={(e) => update('transmission', e.target.value)} className="input">
            <option>Automatic</option><option>Manual</option>
          </select>
        </Field>
        <Field label="Drivetrain">
          <select value={form.drivetrain} onChange={(e) => update('drivetrain', e.target.value)} className="input">
            <option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option>
          </select>
        </Field>
        <Field label="VIN (optional)"><input value={form.vin} onChange={(e) => update('vin', e.target.value)} className="input" /></Field>
      </div>
 
      <Field label="Description">
        <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} className="input" />
      </Field>
 
      {error && <p className="text-sm text-red-700">{error}</p>}
 
      <button disabled={loading} className="w-full bg-amber text-ink font-bold py-3 disabled:opacity-50">
        {loading ? 'Saving…' : 'Save changes'}
      </button>
 
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #B8BCC0;
          padding: 8px 10px;
          font-size: 14px;
        }
      `}</style>
    </form>
  );
}
 
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">{label}</label>
      {children}
    </div>
  );
}
 
