import { useMemo, useState } from 'react';
import type { Product } from '../../types/product';

export interface ProductGalleryFrame {
  id: string;
  url: string;
  alt: string;
}

const toMap = (product: Product, variantId: string) => {
  const variant = product.variants.find((entry) => entry.id === variantId);
  if (!variant) return {};
  return Object.fromEntries(variant.option_values.map((entry) => [entry.option_name, entry.value]));
};

const buildGalleryFrames = (product: Product): ProductGalleryFrame[] => {
  const rows: ProductGalleryFrame[] = [];
  const seen = new Set<string>();

  const push = (url: string | null | undefined, id: string, alt?: string) => {
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    rows.push({ id, url: trimmed, alt: alt || product.title });
  };

  // Gallery entries first, then primary image — no thumbnail, no variant images
  product.media.gallery?.forEach((entry, index) => {
    push(entry.url, `gallery-${String(entry.id || index)}`, entry.alt);
  });
  push(product.media.image, 'image');

  if (rows.length === 0) {
    rows.push({ id: 'fallback', url: '/vite.svg', alt: product.title });
  }

  return rows;
};

export const useProductDetailState = (product: Product) => {
  const galleryFrames = useMemo(() => buildGalleryFrames(product), [product]);
  const variants = useMemo(
    () => product.variants.filter((variant) => variant.is_active),
    [product.variants],
  );

  const initialOptions = useMemo(() => {
    if (product.options.length === 0) {
      return {
        options: {} as Record<string, string>,
        variantId: null as string | null,
      };
    }

    const fallbackVariant = variants.find((entry) => entry.inventory.in_stock) || variants[0];
    const fallbackMap = fallbackVariant ? toMap(product, fallbackVariant.id) : {};
    const options: Record<string, string> = {};

    product.options.forEach((option) => {
      const fromVariant = fallbackMap[option.name];
      const known = fromVariant && option.values.some((value) => value.value === fromVariant);
      options[option.name] = known ? fromVariant : option.values[0]?.value || '';
    });

    return {
      options,
      variantId: fallbackVariant?.id || null,
    };
  }, [product, variants]);

  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions.options);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialOptions.variantId);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;

    if (selectedVariantId) {
      const direct = variants.find((variant) => variant.id === selectedVariantId);
      if (direct) return direct;
    }

    return (
      variants.find((variant) => {
        const map = toMap(product, variant.id);
        return product.options.every((option) => map[option.name] === selectedOptions[option.name]);
      }) || null
    );
  }, [product, selectedOptions, selectedVariantId, variants]);

  const applyOptionSelection = (optionName: string, candidateValue: string) => {
    const next = {
      ...selectedOptions,
      [optionName]: candidateValue,
    };
    setSelectedOptions(next);

    if (variants.length === 0) return;

    const exact = variants.find((variant) => {
      const map = toMap(product, variant.id);
      return product.options.every((option) => map[option.name] === next[option.name]);
    });

    const fallback = variants.find((variant) => {
      const map = toMap(product, variant.id);
      return map[optionName] === candidateValue && variant.inventory.in_stock;
    });

    setSelectedVariantId((exact || fallback || null)?.id || null);
  };

  const optionStatus = (optionName: string, candidateValue: string) => {
    if (variants.length === 0) return 'in-stock' as const;

    const matches = variants.filter((variant) => {
      const map = toMap(product, variant.id);
      return product.options.every((option) => {
        const expected = option.name === optionName ? candidateValue : selectedOptions[option.name];
        return map[option.name] === expected;
      });
    });

    if (matches.length === 0) return 'invalid' as const;
    if (matches.some((variant) => variant.inventory.in_stock)) return 'in-stock' as const;
    return 'out-of-stock' as const;
  };

  const safeFrameIndex = activeFrameIndex >= galleryFrames.length ? 0 : activeFrameIndex;
  const activeFrame = galleryFrames[safeFrameIndex] || galleryFrames[0];

  const displayPrice = selectedVariant?.pricing.sale_amount ?? product.pricing.sale_amount;
  const compareAtPrice = selectedVariant?.pricing.compare_at_amount ?? product.pricing.compare_at_amount;
  const isInStock = selectedVariant?.inventory.in_stock ?? product.inventory.in_stock;
  const hasDiscount = compareAtPrice > displayPrice;
  const priceRangeLabel =
    !selectedVariant && product.pricing.price_range.min_amount !== product.pricing.price_range.max_amount
      ? `${product.pricing.price_range.min_amount}-${product.pricing.price_range.max_amount}`
      : null;

  return {
    galleryFrames,
    activeFrame,
    activeFrameIndex: safeFrameIndex,
    setActiveFrameIndex,
    quantity,
    setQuantity,
    selectedOptions,
    selectedVariant,
    applyOptionSelection,
    optionStatus,
    displayPrice,
    compareAtPrice,
    hasDiscount,
    isInStock,
    priceRangeLabel,
  };
};

