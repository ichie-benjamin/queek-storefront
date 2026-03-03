import { apiGet } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import type { ShopProfile } from '../types/shop';

interface RawShopPayload {
  id?: string;
  slug?: string | null;
  name?: string | null;
  logo?: string | null;
  banner?: string | null;
  slogan?: string | null;
  short_description?: string | null;
  address?: string | null;
  delivery_info?: {
    delivery_time?: string | null;
  } | null;
  min_order_price?: number | null;
  currency?: string | null;
  rating?: number | string | null;
}

const parseRating = (value: RawShopPayload['rating']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { rating_value: value, rating_count: 0, rating_label: value.toFixed(1) };
  }

  if (typeof value === 'string') {
    const match = value.match(/([\d.]+)\s*(?:\((\d+)\))?/);
    if (match) {
      const rating = Number(match[1] ?? 0);
      const count = Number(match[2] ?? 0);
      return {
        rating_value: Number.isFinite(rating) ? rating : 0,
        rating_count: Number.isFinite(count) ? count : 0,
        rating_label: value,
      };
    }
  }

  return { rating_value: 0, rating_count: 0, rating_label: '0.0' };
};

const normalizeShopProfile = (
  payload: RawShopPayload,
): ShopProfile => {
  const rating = parseRating(payload.rating);

  return {
    id: String(payload.id ?? ''),
    slug: payload.slug ?? null,
    name: payload.name ?? null,
    logo: payload.logo ?? null,
    banner: payload.banner ?? null,
    tagline: payload.slogan ?? payload.short_description ?? null,
    address: payload.address ?? null,
    delivery_time: payload.delivery_info?.delivery_time ?? null,
    min_order_price:
      typeof payload.min_order_price === 'number' && Number.isFinite(payload.min_order_price)
        ? payload.min_order_price
        : null,
    currency: payload.currency ?? null,
    rating_value: rating.rating_value,
    rating_count: rating.rating_count,
    rating_label: rating.rating_label,
  };
};

export interface VendorDeliveryMode {
  id: string;
  value: string;
  message: string;
  requires_delivery_address: boolean;
}

export interface DeliverySlot {
  id: string;
  min_time: string;
  max_time: string;
  time?: string;
  available: boolean;
}

export interface DeliveryScheduleDay {
  date: string;
  day_name: string;
  formatted_date: string;
  available: boolean;
  slots: DeliverySlot[];
}

export interface OrderType {
  id: string;
  value: string;
  available: boolean;
  unavailable_message?: {
    type: string;
    message: string;
  };
  delivery_schedule?: DeliveryScheduleDay[];
}

export interface VendorConfig {
  currency: { code: string; symbol: string };
  checkout_config: {
    min_order_amount: number;
    payment_methods: string[];
    enable_notes: boolean;
    offers_free_delivery: boolean;
  };
  delivery_modes: VendorDeliveryMode[];
  order_types: OrderType[];
  ready_time: { value: string } | null;
  business_hours: {
    open_time: string;
    close_time: string;
    is_24_hours: boolean;
  } | null;
}

export const fetchVendorConfig = async (): Promise<VendorConfig | null> => {
  try {
    const res = await apiGet<{ data: VendorConfig }>(ENDPOINTS.store.config);
    return res.data ?? null;
  } catch {
    return null;
  }
};

export const fetchShopProfile = async (): Promise<ShopProfile> => {
  const payload = await apiGet<{ data: RawShopPayload }>(ENDPOINTS.store.info);
  return normalizeShopProfile(payload.data);
};
