import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartPanel } from '../components/CartPanel';
import { fetchVendorProductSections } from '../services/products';
import { useShopCart } from '../hooks/useShopCart';
import { useVendorStore } from '../stores/vendorStore';
import { getThemeViews } from '../theme/views';

interface ProductListPageProps {
  shopSlug: string | null;
  themeKey: string;
  onThemeChange: (key: string) => void;
}

export const ProductListPage = ({ shopSlug, themeKey, onThemeChange }: ProductListPageProps) => {
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const shopProfile = useVendorStore((s) => s.profile);

  const { data: sections = [], isLoading, isError, error } = useQuery({
    queryKey: ['product-sections', shopSlug],
    queryFn: () => fetchVendorProductSections(),
  });

  const products = useMemo(() => sections.flatMap((s) => s.products), [sections]);

  const currentShopId = products[0]?.shop_id || '';

  const { count: cartCount } = useShopCart(currentShopId);

  const currency = shopProfile?.currency ?? '';
  const views = getThemeViews(themeKey);
  const errorMessage = isError
    ? `Failed to load products: ${(error as Error)?.message || 'Unknown error'}`
    : null;
  const ProductListView = views.ProductListView;

  return (
    <main className="storefront-page" aria-live="polite">
      <ProductListView
        themeKey={themeKey}
        onThemeChange={onThemeChange}
        shopSlug={shopSlug}
        shopProfile={shopProfile}
        cartCount={cartCount}
        search={search}
        onSearchChange={setSearch}
        products={products}
        sections={sections}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onAddToCart={() => {}}
        onOpenCart={() => setCartOpen(true)}
      />

      <CartPanel
        shopId={currentShopId}
        currency={currency}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </main>
  );
};
