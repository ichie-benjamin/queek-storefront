import { apiGet } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { extractProducts, normalizeProduct } from '../lib/product-normalizer';
import type {
  ApiResponse,
  LegacyProductLike,
  Product,
  ProductReview,
  ProductReviewsData,
  ProductSection,
} from '../types/product';

export interface ProductReviewsQuery {
  page?: number;
  perPage?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
  rating?: 1 | 2 | 3 | 4 | 5;
}


export const fetchVendorProductSections = async (): Promise<ProductSection[]> => {
  const payload = await apiGet<ApiResponse<unknown>>(ENDPOINTS.store.products, { format: 'sectioned' });
  const raw = payload.data;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: unknown) => {
      const section = s as Record<string, unknown>;
      return Array.isArray(section.data) && (section.data as unknown[]).length > 0;
    })
    .map((s: unknown) => {
      const section = s as Record<string, unknown>;
      return {
        title: String(section.title ?? ''),
        view_more: Boolean(section.view_more),
        category_id: String(section.category_id ?? ''),
        products: (section.data as LegacyProductLike[]).map((p) => normalizeProduct(p)),
      };
    });
};

export const fetchProductByIdOrSlug = async (idOrSlug: string): Promise<Product | null> => {
  const payload = await apiGet<ApiResponse<unknown>>(ENDPOINTS.store.productDetail(idOrSlug));
  const raw = extractProducts(payload.data)[0];
  return raw ? normalizeProduct(raw) : null;
};

const normalizeReviewEntry = (raw: unknown): ProductReview | null => {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const id = String(value.id ?? '');
  if (!id) return null;

  return {
    id,
    title: typeof value.title === 'string' ? value.title : null,
    description:
      typeof value.description === 'string'
        ? value.description
        : typeof value.comment === 'string'
          ? value.comment
          : null,
    rating: typeof value.rating === 'number' ? value.rating : Number(value.rating ?? 0),
    customer_name:
      typeof value.customer_name === 'string'
        ? value.customer_name
        : typeof (value.user as { name?: string } | null)?.name === 'string'
          ? ((value.user as { name?: string }).name ?? null)
          : null,
    created_at: typeof value.created_at === 'string' ? value.created_at : null,
  };
};

export const fetchProductReviews = async (
  slug: string,
  query: ProductReviewsQuery = {},
): Promise<ProductReviewsData | null> => {
  const payload = await apiGet<ApiResponse<unknown>>(ENDPOINTS.store.productReviews(slug), {
    page: query.page ?? 1,
    per_page: query.perPage ?? 12,
    sort: query.sort ?? 'newest',
    rating: query.rating ?? undefined,
  });

  if (!payload?.data || typeof payload.data !== 'object') {
    return null;
  }

  const data = payload.data as Record<string, unknown>;
  const summary = data.summary as Record<string, unknown> | undefined;
  const pagination = data.pagination as Record<string, unknown> | undefined;
  const product = data.product as Record<string, unknown> | undefined;
  const ratingBreakdown =
    summary?.rating_breakdown && typeof summary.rating_breakdown === 'object'
      ? (summary.rating_breakdown as Record<string, unknown>)
      : {};
  const reviews = Array.isArray(data.reviews)
    ? data.reviews
      .map((entry) => normalizeReviewEntry(entry))
      .filter((entry): entry is ProductReview => Boolean(entry))
    : [];

  return {
    product: {
      id: String(product?.id ?? ''),
      slug: String(product?.slug ?? slug),
      title: String(product?.title ?? ''),
    },
    summary: {
      average_rating: Number(summary?.average_rating ?? 0) || 0,
      total_reviews: Number(summary?.total_reviews ?? reviews.length) || 0,
      rating_breakdown: {
        '5': Number(ratingBreakdown['5'] ?? 0) || 0,
        '4': Number(ratingBreakdown['4'] ?? 0) || 0,
        '3': Number(ratingBreakdown['3'] ?? 0) || 0,
        '2': Number(ratingBreakdown['2'] ?? 0) || 0,
        '1': Number(ratingBreakdown['1'] ?? 0) || 0,
      },
    },
    pagination: {
      current_page: Number(pagination?.current_page ?? 1) || 1,
      per_page: Number(pagination?.per_page ?? 12) || 12,
      total: Number(pagination?.total ?? reviews.length) || reviews.length,
      has_more: Boolean(pagination?.has_more),
    },
    reviews,
  };
};
