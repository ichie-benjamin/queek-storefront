import { apiGet } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { normalizeProduct } from '../lib/product-normalizer';
import type { ApiResponse, Product } from '../types/product';

export interface VendorCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  products_count: number;
  featured: boolean;
  type: 'manual' | 'smart';
}

export interface VendorPromotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  type: string;
  value: number | null;
  valid_from: string | null;
  valid_until: string | null;
  status: string;
  is_live: boolean;
}

const normalizeCollection = (raw: Record<string, unknown>): VendorCollection => ({
  id: String(raw.id ?? ''),
  slug: String(raw.slug ?? ''),
  name: String(raw.name ?? ''),
  description: typeof raw.description === 'string' ? raw.description : null,
  image:
    typeof raw.image === 'string'
      ? raw.image
      : typeof raw.image_url === 'string'
        ? raw.image_url
        : null,
  products_count: Number(raw.products_count ?? raw.items_count ?? 0) || 0,
  featured: Boolean(raw.featured || raw.is_featured),
  type: raw.type === 'smart' ? 'smart' : 'manual',
});

const normalizePromotion = (raw: Record<string, unknown>): VendorPromotion => ({
  id: String(raw.id ?? ''),
  title: String(raw.title ?? raw.name ?? ''),
  description: typeof raw.description === 'string' ? raw.description : null,
  image_url:
    typeof raw.image_url === 'string'
      ? raw.image_url
      : typeof raw.image === 'string'
        ? raw.image
        : null,
  type: String(raw.type ?? raw.discount_type ?? ''),
  value: typeof raw.value === 'number' ? raw.value : typeof raw.discount_value === 'number' ? raw.discount_value : null,
  valid_from: typeof raw.valid_from === 'string' ? raw.valid_from : typeof raw.starts_at === 'string' ? raw.starts_at : null,
  valid_until: typeof raw.valid_until === 'string' ? raw.valid_until : typeof raw.ends_at === 'string' ? raw.ends_at : null,
  status: String(raw.status ?? ''),
  is_live: Boolean(raw.is_live ?? raw.is_active),
});

export const fetchVendorCollections = async (): Promise<VendorCollection[]> => {
  try {
    const payload = await apiGet<ApiResponse<unknown>>(ENDPOINTS.store.collections);
    const items = Array.isArray(payload.data) ? payload.data : [];
    return items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(normalizeCollection);
  } catch {
    return [];
  }
};

export const fetchVendorPromotions = async (): Promise<VendorPromotion[]> => {
  try {
    const payload = await apiGet<ApiResponse<unknown>>(ENDPOINTS.store.promotions, {
      sort: 'ending_soon',
      per_page: 6,
    });
    const items = Array.isArray(payload.data) ? payload.data : [];
    return items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(normalizePromotion)
      .filter((p) => p.is_live);
  } catch {
    return [];
  }
};

export const fetchCollectionProducts = async (
  collectionSlug: string,
  params?: Record<string, string | number | boolean>,
): Promise<Product[]> => {
  try {
    const payload = await apiGet<ApiResponse<unknown>>(
      ENDPOINTS.store.collectionProducts(collectionSlug),
      { per_page: 24, ...params },
    );
    const raw = Array.isArray(payload.data) ? payload.data : [];
    return raw
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => normalizeProduct(item));
  } catch {
    return [];
  }
};
