import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartPanel } from '../components/CartPanel';
import { fetchProductByIdOrSlug, fetchProductReviews, fetchVendorProductSections } from '../services/products';
import { useCartStore } from '../stores/cartStore';
import { useVendorStore } from '../stores/vendorStore';
import { useShopCart } from '../hooks/useShopCart';
import { getThemeViews } from '../theme/views';

interface ProductDetailPageProps {
  shopSlug: string | null;
  themeKey: string;
  onThemeChange: (key: string) => void;
}

export const ProductDetailPage = ({ shopSlug, themeKey, onThemeChange }: ProductDetailPageProps) => {
  const [cartOpen, setCartOpen] = useState(false);
  const params = useParams();

  const idOrSlug = params.idOrSlug || '';
  const shopProfile = useVendorStore((s) => s.profile);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product-detail', idOrSlug],
    queryFn: () => fetchProductByIdOrSlug(idOrSlug),
    enabled: Boolean(idOrSlug),
  });

  const detailShopSlug = product?.shop?.slug || shopSlug || null;

  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', product?.slug],
    queryFn: () => fetchProductReviews(product?.slug || '', { perPage: 12, sort: 'newest' }),
    enabled: Boolean(product?.slug),
    staleTime: 1000 * 60 * 2,
  });

  const { data: relatedSections } = useQuery({
    queryKey: ['related-products', detailShopSlug],
    queryFn: () => fetchVendorProductSections(),
    enabled: Boolean(detailShopSlug),
    staleTime: 1000 * 60 * 5,
  });

  const addProduct = useCartStore((state) => state.addProduct);

  const currentShopId = product?.shop_id || '';
  const currency = shopProfile?.currency ?? '';
  const { count: cartCount } = useShopCart(currentShopId);

  const views = getThemeViews(themeKey);
  const ProductDetailView = views.ProductDetailView;
  const errorMessage = isError
    ? `Failed to load product: ${(error as Error)?.message || 'Unknown error'}`
    : null;
  const relatedProducts = (relatedSections ?? [])
    .flatMap((s) => s.products)
    .filter((item) => item.id !== product?.id)
    .slice(0, 12);

  return (
    <main className="storefront-page">
      <ProductDetailView
        themeKey={themeKey}
        onThemeChange={onThemeChange}
        shopSlug={detailShopSlug}
        shopProfile={shopProfile}
        cartCount={cartCount}
        product={product ?? null}
        relatedProducts={relatedProducts}
        reviewsData={reviewsData ?? null}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onAddToCart={addProduct}
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
