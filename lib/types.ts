export type ListingPhoto = {
  id?: string;
  storage_path: string;
  sort_order: number;
};

export type Listing = {
  id: string;
  seller_id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  mileage: number;
  body_type: string;
  fuel_type: string;
  transmission: string;
  drivetrain: string | null;
  color: string | null;
  vin: string | null;
  doors: number | null;
  seats: number | null;
  engine_size: number | null;
  cat_status: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  listing_photos?: ListingPhoto[];
  profiles?: { full_name: string | null };
};
