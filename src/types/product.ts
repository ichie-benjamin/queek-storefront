export type ProductKind = 'physical' | 'service' | 'digital';

export type ProductStatus = 'active' | 'inactive';

export interface ProductPriceRange {
  min_amount: number;
  max_amount: number;
  min?: number;
  max?: number;
}

export interface ProductPricing {
  base_amount: number;
  sale_amount: number;
  compare_at_amount: number;
  discount_amount: number;
  discount_percent: number;
  is_price_from: boolean;
  tax_inclusive: boolean;
  price_range: ProductPriceRange;
}

export interface ProductShop {
  id: string;
  name: string | null;
  slug: string | null;
  logo: string | null;
  rating: number;
  rating_count: number;
}

export interface ProductMedia {
  thumbnail: string | null;
  image: string | null;
  primary_variant_image?: string | null;
  video_url?: string | null;
  gallery?: Array<{
    id: string | number;
    url: string;
    alt?: string;
  }>;
}

export interface ProductInventory {
  in_stock: boolean;
  tracking: boolean;
  quantity: number;
}

export interface ProductReviewSummary {
  rating: number;
  review_count: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductOptionValue {
  value: string;
  label: string;
  color_code: string | null;
}

export interface ProductOption {
  name: string;
  type: string | null;
  values: ProductOptionValue[];
}

export interface ProductVariantOptionValue {
  option_name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  title: string | null;
  option_values: ProductVariantOptionValue[];
  pricing: {
    base_amount: number;
    sale_amount: number;
    compare_at_amount: number;
    discount_amount: number;
    discount_percent: number;
  };
  inventory: {
    in_stock: boolean;
    tracking: boolean;
    quantity: number;
  };
  media: ProductMedia;
  weight: string | null;
  position: number | null;
  is_active: boolean;
}

export interface ProductAddonItem {
  id: string;
  name: string;
  display_name: string | null;
  price: number;
  in_stock: boolean;
}

export interface ProductAddon {
  id: string;
  title: string;
  min: number;
  max: number;
  required: boolean;
  multiple_selection: boolean;
  items: ProductAddonItem[];
}

export interface ProductReview {
  id: string;
  title: string | null;
  description: string | null;
  rating: number;
  customer_name: string | null;
  created_at: string | null;
}

export interface ProductReviewsSummary {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}

export interface ProductReviewsPagination {
  current_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface ProductReviewsData {
  product: {
    id: string;
    slug: string;
    title: string;
  };
  summary: ProductReviewsSummary;
  reviews: ProductReview[];
  pagination: ProductReviewsPagination;
}

export interface ProductFlags {
  featured: boolean;
  is_marketplace: boolean;
  is_wholesale: boolean;
  is_new: boolean;
}

export interface Product {
  shop_id: string;
  id: string;
  p_id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  kind: ProductKind;
  status: ProductStatus;
  currency: string;
  pricing: ProductPricing;
  shop: ProductShop;
  media: ProductMedia;
  inventory: ProductInventory;
  variants_count: number;
  review_summary: ProductReviewSummary;
  flags: ProductFlags;
  categories: ProductCategory[];
  options: ProductOption[];
  variants: ProductVariant[];
  addons: ProductAddon[];
  reviews: ProductReview[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductListMeta {
  next_cursor?: string | null;
  has_more?: boolean;
  currency?: {
    code: string;
    symbol: string;
  };
}

export interface ApiResponse<T, M = Record<string, unknown>> {
  status: string;
  message?: string;
  data: T;
  meta?: M;
  included?: Record<string, unknown>;
}

export type ProductListResponse = ApiResponse<Product[], ProductListMeta>;

export interface ProductSection {
  title: string;
  view_more: boolean;
  category_id: string;
  products: Product[];
}

// Backward compatibility input shape from older endpoints.
export interface LegacyProductLike {
  id?: string;
  p_id?: number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  description?: string | null;
  compare_at_price?: number | null;
  rating?: number;
  review_count?: number;
  kind?: string;
  type?: string;
  commerce_mode?: string;
  status?: string;
  currency?: string;

  price?: number;
  discount_price?: number;
  is_price_from?: boolean;

  shop_id?: string;
  vendor_id?: string;

  thumbnail?: string | null;
  image?: string | null;

  stock?: number;
  in_stock?: boolean;
  inventory_tracking?: boolean;

  review_summary?: {
    rating?: number;
    review_count?: number;
  };

  categories?: Array<{
    id?: string;
    name?: string;
    slug?: string;
  }>;

  options?: Array<{
    name?: string;
    type?: string | null;
    values?: Array<
      | string
      | {
          value?: string;
          label?: string | null;
          color_code?: string | null;
        }
    >;
    values_detailed?: Array<{
      value?: string;
      label?: string | null;
      color_code?: string | null;
    }>;
  }>;

  variants?: Array<{
    id?: string;
    sku?: string | null;
    title?: string | null;
    option_values?:
      | Record<string, string>
      | Array<{
          option_name?: string | null;
          optionName?: string | null;
          value?: string | null;
          label?: string | null;
        }>
      | null;
    price?: number;
    discount_price?: number | null;
    compare_at_price?: number | null;
    discount_amount?: number | null;
    has_discount?: boolean;
    stock?: number | null;
    track_inventory?: boolean | null;
    is_active?: boolean | null;
    in_stock?: boolean | null;
    weight?: string | null;
    position?: number | null;
    media?: Partial<ProductMedia>;
    inventory?: Partial<ProductInventory>;
    pricing?: {
      base_amount?: number | null;
      sale_amount?: number | null;
      compare_at_amount?: number | null;
      discount_amount?: number | null;
      discount_percent?: number | null;
    } | null;
  }>;

  addons?: Array<{
    id?: string;
    title?: string;
    min?: number;
    max?: number;
    required?: boolean;
    multiple_selection?: boolean;
    items?: Array<{
      id?: string;
      name?: string;
      display_name?: string | null;
      price?: number;
      in_stock?: boolean;
    }>;
  }>;

  reviews?: Array<{
    id?: string | number;
    title?: string | null;
    description?: string | null;
    comment?: string | null;
    rating?: number;
    customer_name?: string | null;
    created_at?: string | null;
  }>;

  vendor?: {
    id?: string;
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
    rating?: number;
    rating_count?: number;
  };

  shop?: ProductShop;

  pricing?: Partial<ProductPricing>;
  media?: Partial<ProductMedia>;
  inventory?: Partial<ProductInventory>;
  flags?: Partial<ProductFlags>;

  variants_count?: number;
  variations_count?: number;

  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: unknown;
}
