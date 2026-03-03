const STOREFRONT_DOMAIN = (import.meta.env.VITE_STOREFRONT_DOMAIN as string) || 'localhost';
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'localhost']);

export const resolveVendorSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.split(':')[0];
  if (host !== STOREFRONT_DOMAIN && host.endsWith('.' + STOREFRONT_DOMAIN)) {
    const sub = host.slice(0, host.length - STOREFRONT_DOMAIN.length - 1);
    if (sub && !RESERVED.has(sub)) return sub;
  }
  return (import.meta.env.VITE_DEFAULT_SHOP_SLUG as string) || null;
};

export interface ShopContext {
  shopSlug: string | null;
  themeKey: string | null;
}

export const getShopContext = (): ShopContext => {
  if (typeof window === 'undefined') {
    return { shopSlug: null, themeKey: null };
  }

  const params = new URLSearchParams(window.location.search);
  const shopSlug = params.get('shop_slug') || resolveVendorSlug();
  const themeKey = params.get('theme') || null;

  return { shopSlug, themeKey };
};
