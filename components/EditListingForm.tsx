'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabaseClient';
import type { Listing, ListingPhoto } from '@/lib/types';

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'EV', 'Van', 'Convertible'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'LPG'];
const CAT_STATUSES = ['None', 'Cat N', 'Cat S', 'Cat C (legacy)', 'Cat D (legacy)'];

function preventScrollChange(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
}

function pathFromPublicUrl(url: string) {
  const marker = '/listing-photos/';
  const idx = url.indexOf(marker);
  return idx === -1 ? url : url.slice(idx + marker.length);
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

export default function EditListingForm({
  listing,
  photos,
}: {
  listing: Listing;
  photos: ListingPhoto[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    make: listing.make,
    model: listing.model,
    variant: listing.variant || '',
    year: String(listing.year),
    price: String(listing.price),
    mileage: String(listing.mileage),
    body_type: listing.body_type,
    fuel_type: listing.fuel_type === 'Gas' ? 'Petrol' : listing.fuel_type,
    transmission: listing.transmission,
    drivetrain: listing.drivetrain || 'FWD',
    color: listing.color || '',
    vin: listing.vin || '',
    doors: listing.doors != null ? String(listing.doors) : '',
    seats: listing.seats != null ? String(listing.seats) : '',
    engine_size: listing.engine_size != null ? String(listing.engine_size) : '',
    cat_status: listing.cat_status || 'None',
    postcode: listing.postcode || '',
    description: listing.description || '',
  });
  const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>(photos);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function removePhoto(photo: ListingPhoto) {
    if (!photo.id) return;
    setRemovingId(photo.id);
    setError(null);

    const objectPath = pathFromPublicUrl(photo.storage_path);
    await supabase.storage.from('listing-photos').remove([objectPath]);

    const { error: deleteError } = await supabase
      .from('listing_photos')
      .delete()
      .eq('id', photo.id);

    setRemovingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let latitude = listing.latitude;
    let longitude = listing.longitude;
    if (form.postcode.trim() && form.postcode.trim() !== (listing.postcode || '').trim()) {
      const geo = await geocodePostcode(form.postcode);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lng;
      }
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({
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
        postcode: form.postcode || null,
        latitude,
        longitude,
        description: form.description,
      })
      .eq('id', listing.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    if (newPhotos.length > 0) {
      const startOrder = existingPhotos.length
        ? Math.max(...existingPhotos.map((p) => p.sort_order)) + 1
        : 0;

      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i];
        const path = `${listing.seller_id}/${listing.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file);
        if (!uploadError) {
          const { data: pub } = supabase.storage.from('listing-photos').getPublicUrl(path);
          await supabase.from('listing_photos').insert({
            listing_id: listing.id,
            storage_path: pub.publicUrl,
            sort_order: startOrder + i,
          });
        }
      }
    }

    setLoading(false);
    router.push(`/listing/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-chrome p-6">
      <div>
        <label className="block text-xs font-semibold uppercase text-inkSoft mb-2">Current photos</label>
        {existingPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative h-24 border border-chrome overflow-hidden">
                <Image src={photo.storage_path} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  disabled={removingId === photo.id}
                  className="absolute top-1 right-1 bg-ink text-concrete text-[10px] font-bold w-5 h-5 flex items-center justify-center disabled:opacity-50"
                  title="Remove photo"
                >
                  {removingId === photo.id ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-inkSoft mb-3">No photos uploaded yet.</p>
        )}

        <label className="block text-xs font-semibold uppercase text-inkSoft mb-1">Add more photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
        />
        {newPhotos.length > 0 && (
          <p className="text-xs text-inkSoft mt-1">{newPhotos.length} new photo(s) ready to upload on save.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Make"><input required value={form.make} onChange={(e) => update('make', e.target.value)} className="input" /></Field>
        <Field label="Model"><input required value={form.model} onChange={(e) => update('model', e.target.value)} className="input" /></Field>
        <Field label="Variant / trim (optional)"><input value={form.variant} onChange={(e) => update('variant', e.target.value)} className="input" /></Field>
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
        <Field label="Postcode (for location search)">
          <input value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input" />
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
