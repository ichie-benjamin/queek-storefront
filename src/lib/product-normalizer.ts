import type {
  LegacyProductLike,
  ProductAddon,
  Product,
  ProductCategory,
  ProductFlags,
  ProductInventory,
  ProductOption,
  ProductReview,
  ProductPricing,
  ProductShop,
  ProductVariant,
  ProductVariantOptionValue,
} from '../types/product';

const KIND_SET = new Set(['physical', 'service', 'digital']);
const STATUS_SET = new Set(['active', 'inactive']);

const toNumber = (value: unknown, fallback = 0): number => {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

const normalizeKind = (value: unknown): Product['kind'] => {
  if (value === 'product') return 'physical';
  if (typeof value === 'string' && KIND_SET.has(value)) {
    return value as Product['kind'];
  }
  return 'physical';
};

const normalizeStatus = (value: unknown): Product['status'] => {
  if (typeof value === 'string' && STATUS_SET.has(value)) {
    return value as Product['status'];
  }
  return 'active';
};

const normalizeShop = (raw: LegacyProductLike, shopId: string): ProductShop => {
  const source = raw.shop ?? raw.vendor ?? {};
  return {
    id: String(source.id ?? shopId),
    name: source.name ?? null,
    slug: source.slug ?? null,
    logo: source.logo ?? null,
    rating: toNumber(source.rating, 0),
    rating_count: toNumber(source.rating_count, 0),
  };
};

const normalizePricing = (raw: LegacyProductLike): ProductPricing => {
  const legacyBase = toNumber(raw.price, 0);
  const legacySale = toNumber(raw.discount_price, legacyBase);
  const legacyCompareAt = toNumber(raw.compare_at_price, legacyBase);

  const source = raw.pricing ?? {};

  const base_amount = toNumber(source.base_amount, legacyBase);
  const sale_amount = toNumber(source.sale_amount, legacySale);
  const compare_at_amount = toNumber(source.compare_at_amount, legacyCompareAt || base_amount);
  const discount_amount = toNumber(
    source.discount_amount,
    Math.max(compare_at_amount - sale_amount, 0),
  );

  const fallbackPercent = compare_at_amount > 0
    ? Math.round((discount_amount / compare_at_amount) * 100)
    : 0;

  const discount_percent = toNumber(source.discount_percent, fallbackPercent);
  const is_price_from = toBool(source.is_price_from, toBool(raw.is_price_from, false));
  const tax_inclusive = toBool(source.tax_inclusive, false);

  const price_range = {
    min_amount: toNumber(source.price_range?.min_amount, toNumber(source.price_range?.min, sale_amount)),
    max_amount: toNumber(source.price_range?.max_amount, toNumber(source.price_range?.max, sale_amount)),
  };

  return {
    base_amount,
    sale_amount,
    compare_at_amount,
    discount_amount,
    discount_percent,
    is_price_from,
    tax_inclusive,
    price_range,
  };
};

const normalizeInventory = (raw: LegacyProductLike): ProductInventory => {
  const source = raw.inventory ?? {};
  const quantity = toNumber(source.quantity, toNumber(raw.stock, 0));

  const in_stock = toBool(source.in_stock, toBool(raw.in_stock, quantity > 0));

  return {
    in_stock,
    tracking: toBool(source.tracking, toBool(raw.inventory_tracking, quantity > 0)),
    quantity,
  };
};

const normalizeFlags = (raw: LegacyProductLike): ProductFlags => {
  const source = raw.flags ?? {};

  return {
    featured: toBool(source.featured, false),
    is_marketplace: toBool(source.is_marketplace, false),
    is_wholesale: toBool(source.is_wholesale, false),
    is_new: toBool(source.is_new, false),
  };
};

const normalizeMedia = (raw: LegacyProductLike): Product['media'] => {
  const source = raw.media ?? {};

  const gallery = Array.isArray(source.gallery)
    ? source.gallery
      .map((entry, index) => {
        const url = typeof entry?.url === 'string' ? entry.url.trim() : '';
        if (!url) return null;
        return {
          id: String(entry.id ?? `gallery-${index}`),
          url,
          alt: typeof entry.alt === 'string' ? entry.alt : undefined,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  return {
    thumbnail: source.thumbnail ?? raw.thumbnail ?? null,
    image: source.image ?? raw.image ?? null,
    primary_variant_image:
      typeof source.primary_variant_image === 'string' ? source.primary_variant_image : null,
    video_url: typeof source.video_url === 'string' ? source.video_url : null,
    gallery,
  };
};

const normalizeCategories = (raw: LegacyProductLike): ProductCategory[] => {
  if (!Array.isArray(raw.categories)) return [];

  return raw.categories
    .map((category) => {
      const name = typeof category?.name === 'string' ? category.name.trim() : '';
      if (!name) return null;

      return {
        id: String(category.id ?? ''),
        name,
        slug: String(category.slug ?? ''),
      };
    })
    .filter((category): category is ProductCategory => Boolean(category));
};

const normalizeOptions = (raw: LegacyProductLike): ProductOption[] => {
  if (!Array.isArray(raw.options)) return [];

  return raw.options
    .map((option) => {
      const optionName = typeof option?.name === 'string' ? option.name.trim() : '';
      if (!optionName) return null;

      const baseValues = Array.isArray(option.values)
        ? option.values.map((entry) => {
          if (typeof entry === 'string') {
            const value = entry.trim();
            if (!value) return null;
            return {
              value,
              label: value,
              color_code: null,
            };
          }

          const value = typeof entry?.value === 'string' ? entry.value.trim() : '';
          if (!value) return null;
          return {
            value,
            label: typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : value,
            color_code: typeof entry.color_code === 'string' ? entry.color_code : null,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        : [];

      const detailedValues = Array.isArray(option.values_detailed)
        ? option.values_detailed
          .map((entry) => {
            const value = typeof entry?.value === 'string' ? entry.value.trim() : '';
            if (!value) return null;
            return {
              value,
              label: typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : value,
              color_code: typeof entry.color_code === 'string' ? entry.color_code : null,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        : [];

      const merged = new Map<string, ProductOption['values'][number]>();
      for (const entry of baseValues) {
        merged.set(entry.value, entry);
      }
      for (const entry of detailedValues) {
        merged.set(entry.value, {
          ...merged.get(entry.value),
          ...entry,
        });
      }

      const values = Array.from(merged.values());
      if (values.length === 0) return null;

      return {
        name: optionName,
        type: typeof option.type === 'string' ? option.type : null,
        values,
      };
    })
    .filter((option): option is ProductOption => Boolean(option));
};

const normalizeVariantOptionValues = (
  value:
    | Record<string, string>
    | Array<{
        option_name?: string | null;
        optionName?: string | null;
        value?: string | null;
        label?: string | null;
      }>
    | null
    | undefined,
): ProductVariantOptionValue[] => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).reduce<ProductVariantOptionValue[]>((rows, [optionName, optionValue]) => {
      if (typeof optionValue !== 'string' || !optionValue.trim()) return rows;

      rows.push({
        option_name: optionName,
        value: optionValue.trim(),
      });
      return rows;
    }, []);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((entry: {
      option_name?: string | null;
      optionName?: string | null;
      value?: string | null;
      label?: string | null;
    }) => {
      const option_name =
        (typeof entry?.option_name === 'string' && entry.option_name.trim()) ||
        (typeof entry?.optionName === 'string' && entry.optionName.trim()) ||
        '';
      const resolved =
        (typeof entry?.value === 'string' && entry.value.trim()) ||
        (typeof entry?.label === 'string' && entry.label.trim()) ||
        '';
      if (!option_name || !resolved) return null;
      return {
        option_name,
        value: resolved,
      };
    })
    .filter((entry): entry is ProductVariantOptionValue => Boolean(entry));
};

const normalizeVariants = (raw: LegacyProductLike): ProductVariant[] => {
  if (!Array.isArray(raw.variants)) return [];

  return raw.variants.reduce<ProductVariant[]>((rows, variant, index) => {
      const id = String(variant?.id ?? '');
      if (!id) return rows;

      const saleAmount = toNumber(
        variant.pricing?.sale_amount,
        toNumber(variant.discount_price, toNumber(variant.price, 0)),
      );
      const baseAmount = toNumber(
        variant.pricing?.base_amount,
        toNumber(
          variant.compare_at_price,
          saleAmount,
        ),
      );
      const compareAtAmount = toNumber(variant.pricing?.compare_at_amount, baseAmount);
      const discountAmount = toNumber(
        variant.pricing?.discount_amount,
        Math.max(compareAtAmount - saleAmount, 0),
      );
      const discountPercent = compareAtAmount > 0
        ? Math.round((discountAmount / compareAtAmount) * 100)
        : 0;

      const quantity = toNumber(variant.inventory?.quantity, toNumber(variant.stock, 0));
      const inStock = toBool(variant.inventory?.in_stock, toBool(variant.in_stock, quantity > 0));
      const tracking = toBool(variant.inventory?.tracking, toBool(variant.track_inventory, quantity > 0));
      const media = variant.media ?? {};

      rows.push({
        id,
        sku: typeof variant.sku === 'string' ? variant.sku : null,
        title: typeof variant.title === 'string' ? variant.title : null,
        option_values: normalizeVariantOptionValues(variant.option_values),
        pricing: {
          base_amount: baseAmount,
          sale_amount: saleAmount,
          compare_at_amount: compareAtAmount,
          discount_amount: discountAmount,
          discount_percent: toNumber(variant.pricing?.discount_percent, discountPercent),
        },
        inventory: {
          in_stock: inStock,
          tracking,
          quantity,
        },
        media: {
          thumbnail: media.thumbnail ?? null,
          image: media.image ?? null,
          primary_variant_image: null,
          video_url: typeof media.video_url === 'string' ? media.video_url : null,
          gallery: Array.isArray(media.gallery)
            ? media.gallery
              .map((entry, galleryIndex) => {
                const url = typeof entry?.url === 'string' ? entry.url.trim() : '';
                if (!url) return null;
                return {
                  id: String(entry.id ?? `variant-${index}-gallery-${galleryIndex}`),
                  url,
                  alt: typeof entry.alt === 'string' ? entry.alt : undefined,
                };
              })
              .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
            : [],
        },
        weight: typeof variant.weight === 'string' ? variant.weight : null,
        position: variant.position != null ? toNumber(variant.position, index) : null,
        is_active: toBool(variant.is_active, true),
      });

      return rows;
    }, []);
};

const normalizeAddons = (raw: LegacyProductLike): ProductAddon[] => {
  if (!Array.isArray(raw.addons)) return [];

  return raw.addons
    .map((addon) => {
      const id = String(addon?.id ?? '');
      const title = typeof addon?.title === 'string' ? addon.title.trim() : '';
      if (!id || !title) return null;

      const items = Array.isArray(addon.items)
        ? addon.items
          .map((item) => {
            const itemId = String(item?.id ?? '');
            const itemName = typeof item?.name === 'string' ? item.name.trim() : '';
            if (!itemId || !itemName) return null;
            return {
              id: itemId,
              name: itemName,
              display_name: typeof item.display_name === 'string' ? item.display_name : null,
              price: toNumber(item.price, 0),
              in_stock: toBool(item.in_stock, true),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : [];

      return {
        id,
        title,
        min: toNumber(addon.min, 0),
        max: toNumber(addon.max, 0),
        required: toBool(addon.required, false),
        multiple_selection: toBool(addon.multiple_selection, false),
        items,
      };
    })
    .filter((addon): addon is ProductAddon => Boolean(addon));
};

const normalizeReviews = (raw: LegacyProductLike): ProductReview[] => {
  if (!Array.isArray(raw.reviews)) return [];

  return raw.reviews
    .map((review) => {
      const id = String(review?.id ?? '');
      if (!id) return null;

      return {
        id,
        title: typeof review.title === 'string' ? review.title : null,
        description:
          typeof review.description === 'string'
            ? review.description
            : typeof review.comment === 'string'
              ? review.comment
              : null,
        rating: toNumber(review.rating, 0),
        customer_name: typeof review.customer_name === 'string' ? review.customer_name : null,
        created_at: typeof review.created_at === 'string' ? review.created_at : null,
      };
    })
    .filter((review): review is ProductReview => Boolean(review));
};

export const normalizeProduct = (raw: LegacyProductLike): Product => {
  const shop_id = String(raw.shop_id ?? raw.vendor_id ?? raw.shop?.id ?? raw.vendor?.id ?? '');
  const id = String(raw.id ?? '');
  const normalizedKind = normalizeKind(raw.kind ?? raw.type);

  return {
    shop_id,
    id,
    p_id: toNumber(raw.p_id, 0),
    title: String(raw.title ?? ''),
    slug: String(raw.slug ?? id),
    excerpt: raw.excerpt ?? raw.description ?? null,
    description: raw.description ?? raw.excerpt ?? null,
    kind: normalizedKind,
    status: normalizeStatus(raw.status),
    currency: String(raw.currency ?? ''),
    pricing: normalizePricing(raw),
    shop: normalizeShop(raw, shop_id),
    media: normalizeMedia(raw),
    inventory: normalizeInventory(raw),
    variants_count: toNumber(raw.variants_count, toNumber(raw.variations_count, 0)),
    review_summary: {
      rating: toNumber(raw.review_summary?.rating, toNumber(raw.rating, 0)),
      review_count: toNumber(raw.review_summary?.review_count, toNumber(raw.review_count, 0)),
    },
    flags: normalizeFlags(raw),
    categories: normalizeCategories(raw),
    options: normalizeOptions(raw),
    variants: normalizeVariants(raw),
    addons: normalizeAddons(raw),
    reviews: normalizeReviews(raw),
    created_at: typeof raw.created_at === 'string' ? raw.created_at : null,
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : null,
  };
};

export const extractProducts = (payloadData: unknown): LegacyProductLike[] => {
  if (Array.isArray(payloadData)) {
    if (payloadData.length === 0) return [];

    const first = payloadData[0] as Record<string, unknown>;

    // Legacy grouped categories shape [{ title, data: [...] }]
    if (first && Array.isArray(first.data)) {
      const grouped = payloadData as Array<{ data?: LegacyProductLike[] }>;
      return grouped.flatMap((entry) => entry.data ?? []);
    }

    return payloadData as LegacyProductLike[];
  }

  if (payloadData && typeof payloadData === 'object') {
    const record = payloadData as Record<string, unknown>;
    if (record.product && typeof record.product === 'object') {
      return [record.product as LegacyProductLike];
    }

    if (record.data && Array.isArray(record.data)) {
      return record.data as LegacyProductLike[];
    }

    return [record as LegacyProductLike];
  }

  return [];
};
