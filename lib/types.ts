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
  year: number;
  price: number;
  mileage: number;
  body_type: string;
  fuel_type: string;
  transmission: string;
  drivetrain: string | null;
  color: string | null;
  vin: string | null;
  description: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  listing_photos?: ListingPhoto[];
  profiles?: { full_name: string | null };
};
 
