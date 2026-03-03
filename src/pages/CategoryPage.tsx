import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CartPanel } from '../components/CartPanel';
import { fetchVendorProductSections } from '../services/products';
import { useVendorStore } from '../stores/vendorStore';
import { useShopCart } from '../hooks/useShopCart';
import type { Product } from '../types/product';
import { NovaCard, ProductItemModal } from '../theme/layouts/nova';
import { NovaFooter } from '../theme/layouts/nova/NovaFooter';

interface CategoryPageProps {
  shopSlug: string | null;
  themeKey: string;
  onThemeChange: (key: string) => void;
}

export const CategoryPage = ({ shopSlug }: CategoryPageProps) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const effectiveSlug = shopSlug || searchParams.get('shop');

  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['product-sections', effectiveSlug],
    queryFn: () => fetchVendorProductSections(),
    enabled: Boolean(effectiveSlug),
    staleTime: 1000 * 60 * 5,
  });

  const shopProfile = useVendorStore((s) => s.profile);

  const section = sections.find((s) => s.category_id === categoryId);
  const products = section?.products ?? [];
  const currency = shopProfile?.currency ?? '';
  const currentShopId = products[0]?.shop_id || '';

  const { count: cartCount } = useShopCart(currentShopId);

  return (
    <div className="qn-page theme-nova">
      <header className="qn-detail-nav">
        <div className="qn-detail-nav__inner">
          <Link to={effectiveSlug ? `/?shop=${encodeURIComponent(effectiveSlug)}` : '/'} className="qn-breadcrumbs__back">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <button
            type="button"
            className="qn-nav__icon-btn qn-nav__cart"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M2 3h2l2.4 9.6a1 1 0 001 .4H15a1 1 0 00.97-.76L17 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="17" r="1" fill="currentColor" />
              <circle cx="14" cy="17" r="1" fill="currentColor" />
            </svg>
            {cartCount > 0 && <span className="qn-nav__cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className="qn-container qn-category-page">
        <div className="qn-section-head">
          <h1 className="qn-section-title">{section?.title ?? 'Category'}</h1>
          {!isLoading && (
            <span className="qn-section-count">{products.length} items</span>
          )}
        </div>

        {isLoading && (
          <div className="qn-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="qn-card qn-card--skeleton">
                <div className="qn-skeleton qn-skeleton--media" />
                <div className="qn-card__body">
                  <div className="qn-skeleton qn-skeleton--line qn-skeleton--short" />
                  <div className="qn-skeleton qn-skeleton--line" />
                  <div className="qn-skeleton qn-skeleton--line qn-skeleton--mid" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="qn-empty-state">
            <p>No items in this category.</p>
            <Link to="/" className="qn-btn qn-btn--ghost">Back to catalogue</Link>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="qn-grid">
            {products.map((product) => (
              <NovaCard key={product.id} product={product} onOpen={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      <NovaFooter shopProfile={shopProfile} shopSlug={effectiveSlug} />

      {selectedProduct && (
        <ProductItemModal
          product={selectedProduct}
          shopSlug={effectiveSlug}
          currency={currency}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartPanel
        shopId={currentShopId}
        currency={currency}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
};
