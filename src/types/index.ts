// ── Supabase-aligned TypeScript types ────────────────────────────

export type Role = 'customer' | 'seller' | 'admin';

export interface Profile {
  id: string;
  role: Role;
  name: string | null;
  mobile: string | null;
  avatar_url: string | null;
  banned: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Seller {
  id: string;
  business_name: string;
  gst_number?: string;
  gst_doc_url?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  trust_score: number;
  total_reviews: number;
  total_products: number;
  total_orders: number;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_id?: string;      // human-readable unique ID e.g. "PROD-001-V1"
  seller_sku?: string;      // seller's internal SKU
  attributes: Record<string, string>;  // { "Color": "Blue", "Size": "XL" }
  price: number;
  compare_price?: number;
  quantity: number;
  images: string[];
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  product_id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compare_price?: number;
  images: string[];
  thumbnail?: string;
  specifications: Record<string, string>;
  quantity: number;
  sold_count: number;
  authenticity_verified: boolean;
  certificate_id?: string;
  verification_date?: string;
  trust_score: number;
  verified_buyer_reviews: number;
  avg_rating: number;
  trending: boolean;
  featured: boolean;
  is_active: boolean;
  seller_sku?: string;
  has_variants: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  seller?: Seller;
  variants?: ProductVariant[];
}

export interface SerializedUnit {
  id: string;
  unit_code: string;
  product_id: string;
  seller_id: string;
  owner_id?: string;
  status: 'manufactured' | 'verified' | 'in_stock' | 'sold' | 'returned' | 'archived';
  manufactured_at?: string;
  verified_at?: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
}

export interface TrackingEvent {
  id: string;
  unit_code: string;
  product_id: string;
  status:
    | 'manufactured'
    | 'verified'
    | 'in_stock'
    | 'dispatched'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'returned';
  location?: string;
  description?: string;
  actor_id?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  unit_code?: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  verified_purchase: boolean;
  helpful_count: number;
  flagged: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Pick<Profile, 'name' | 'avatar_url'>;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'dispatched'
  | 'in_transit' | 'delivered' | 'cancelled'
  | 'return_requested' | 'returned' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  shipping_address: Address;
  status: OrderStatus;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  notes?: string;
  invoice_url?: string;
  cancel_reason?: string;
  cancelled_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  unit_code?: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total: number;
  item_status: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Joined
  product?: Product;
}

export interface FraudReport {
  id: string;
  reporter_id?: string;
  reported_type: 'product' | 'seller' | 'review' | 'user' | 'unit';
  reported_id: string;
  reason: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export type VerificationStatusType = 'VERIFIED' | 'SUSPICIOUS' | 'COUNTERFEIT' | 'INVALID' | 'REVOKED';
export type OwnershipStatusType = 'UNCLAIMED' | 'REGISTERED' | 'DISPUTED' | 'RESET';

export interface TrackedUnit {
  id: string;
  product_id: string;
  seller_id: string;
  variant_id?: string;
  unique_unit_code: string;
  serial_number: string;
  qr_code_url?: string;
  verification_status: VerificationStatusType;
  ownership_status: OwnershipStatusType;
  current_owner_id?: string;
  manufacture_date: string;
  warranty_expiry?: string;
  scan_count: number;
  last_scan_location?: string;
  last_scan_at?: string;
  fraud_flag: boolean;
  counterfeit_reports_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
  variant?: ProductVariant;
  seller?: Pick<any, 'id' | 'business_name' | 'trust_score' | 'verification_status'>;
}

export interface VerificationLog {
  id: string;
  unit_code: string;
  ip_address?: string;
  device_fingerprint?: string;
  geolocation?: string;
  country?: string;
  status: string;
  risk_score: number;
  scanned_at: string;
}

export interface OwnershipHistory {
  id: string;
  unit_code: string;
  previous_owner_id?: string;
  new_owner_id: string;
  order_id?: string;
  assigned_at: string;
}

export interface SellerTrustScore {
  seller_id: string;
  trust_score: number;
  successful_verifications: number;
  counterfeit_reports: number;
  verified_sales_count: number;
  last_calculated_at: string;
}

export interface VerificationSession {
  id: string;
  unit_code: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// ── Filter / Query types ──────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  verified?: boolean;
  search?: string;
  sortBy?: 'featured' | 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}
