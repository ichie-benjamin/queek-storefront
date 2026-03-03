export interface ShopProfile {
  id: string;
  slug: string | null;
  name: string | null;
  logo: string | null;
  banner: string | null;
  tagline: string | null;
  address: string | null;
  delivery_time: string | null;
  min_order_price: number | null;
  currency: string | null;
  rating_value: number;
  rating_count: number;
  rating_label: string;
}
