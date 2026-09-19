'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'LPG'];
const CAT_STATUSES = ['None', 'Cat N', 'Cat S', 'Cat C (legacy)', 'Cat D (legacy)'];

function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export default function SellPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    make: '', model: '', variant: '', year: '2020', price: '', mileage: '',
    body_type: 'Sedan', fuel_type: 'Petrol', transmission: 'Automatic',
    drivetrain: 'FWD', color: '', vin: '',
    doors: '', seats: '', engine_size: '',
    cat_status: 'None', postcode: '',
    description: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.postcode.trim()) {
      setError('A postcode is required so buyers can see where the car is located.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Please log in before listing a car.');
      setLoading(false);
      return;
    }

    const geo = await geocodePostcode(form.postcode);
    if (!geo) {
      setError(`Couldn't recognise the postcode "${form.postcode}". Please check it and try again.`);
      setLoading(false);
      return;
    }

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        make: form.make,
        model: form.model,
        variant: form.variant || null,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        body_type: form.body_type,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        drivetrain: form.drivetrain,
        color: form.color,
        vin: form.vin || null,
        doors: form.doors ? Number(form.doors) : null,
        seats: form.seats ? Number(form.seats) : null,
        engine_size: form.engine_size ? Number(form.engine_size) : null,
        cat_status: form.cat_status,
        postcode: form.postcode,
        latitude: geo.lat,
        longitude: geo.lng,
        description: form.description,
      })
      .select()
      .single();

    if (insertError || !listing) {
      setError(insertError?.message || 'Could not create listing.');
      setLoading(false);
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const path = `${user.id}/${listing.id}/${i}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from('listing-photos').getPublicUrl(path);
        await supabase.from('listing_photos').insert({
          listing_id: listing.id,
          storage_path: pub.publicUrl,
          sort_order: i,
        });
      }
    }

    setLoading(false);
    router.push(`/listing/${listing.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="font-display text-5xl mb-6">List your car</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-chrome p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Make"><input required value={form.make} onChange={(e) => update('make', e.target.value)} className="input" /></Field>
          <Field label="Model"><input required value={form.model} onChange={(e) => update('model', e.target.value)} className="input" /></Field>
          <Field label="Variant / trim (optional)"><input value={form.variant} onChange={(e) => update('variant', e.target.value)} placeholder="e.g. ST-Line, M Sport" className="input" /></Field>
          <Field label="Year">
            <input required type="number" min={1980} max={2026} value={form.year}
              onChange={(e) => update('year', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Price (£)">
            <input required type="number" min={0} value={form.price}
              onChange={(e) => update('price', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Mileage">
            <input required type="number" min={0} value={form.mileage}
              onChange={(e) => update('mileage', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Color"><input value={form.color} onChange={(e) => update('color', e.target.value)} className="input" /></Field>
          <Field label="Body type">
            <select value={form.body_type} onChange={(e) => update('body_type', e.target.value)} className="input">
              {BODY_TYPES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Fuel type">
            <select value={form.fuel_type} onChange={(e) => update('fuel_type', e.target.value)} className="input">
              {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
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
          <Field label="Doors">
            <input type="number" min={2} max={6} value={form.doors}
              onChange={(e) => update('doors', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Seats">
            <input type="number" min={1} max={9} value={form.seats}
              onChange={(e) => update('seats', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Engine size (litres)">
            <input type="number" step={0.1} min={0} value={form.engine_size}
              onChange={(e) => update('engine_size', e.target.value)} onWheel={preventScrollChange} className="input" />
          </Field>
          <Field label="Write-off category">
            <select value={form.cat_status} onChange={(e) => update('cat_status', e.target.value)} className="input">
              {CAT_STATUSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Postcode (required)">
            <input required value={form.postcode} onChange={(e) => update('postcode', e.target.value)} placeholder="e.g. SW1A 1AA" className="input" />
          </Field>
          <Field label="VIN (optional)"><input value={form.vin} onChange={(e) => update('vin', e.target.value)} className="input" /></Field>
        </div>

        <Field label="Description">
          <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} className="input" />
        </Field>

        <Field label="Photos">
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
        </Field>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button disabled={loading} className="w-full bg-amber text-ink font-bold py-3 disabled:opacity-50">
          {loading ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #B8BCC0;
          padding: 8px 10px;
          font-size: 14px;
        }
      `}</style>
    </div>
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
