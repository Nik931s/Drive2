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
  /** In an auction "price" is the CURRENT BID (or the starting bid if nobody has bid yet). */
  price: number;
  starting_price: number | null;
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
  /** pending | active | sold | unsold | cancelled */
  status: string;
  is_featured: boolean;
  created_at: string;
  auction_start: string | null;
  auction_end: string | null;
  bid_increment: number;
  bid_count: number;
  winning_bidder_id: string | null;
  anti_snipe_minutes: number;
  has_reserve: boolean;
  reserve_met: boolean;
  listing_photos?: ListingPhoto[];
  profiles?: { full_name: string | null };
};
