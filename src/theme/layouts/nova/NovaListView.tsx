import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Product } from '../../../types/product';
import type { ProductListViewProps } from '../../view-types';
import { shopLabel, getStoredAddress, setStoredAddress } from './helpers';
import AddressModal from './AddressModal';
import VendorInfoModal from './VendorInfoModal';
import FloatingSearch, { FloatingSearchFab } from './FloatingSearch';
import NovaNav from './NovaNav';
import NovaHero from './NovaHero';
import { NovaCard } from './NovaCard';
import { ProductItemModal } from './ProductItemModal';
import { useUserStore } from '../../../stores/userStore';
import { useAuthModal } from '../../../stores/authModalStore';
import { useVendorStore } from '../../../stores/vendorStore';
import { logoutSession } from '../../../services/auth';
import { NovaFooter } from './NovaFooter';
import { OrdersModal, OrdersIcon, LogoutIcon } from './NovaOrders';

/* ── NovaListView ───────────────────────────────────────── */

export const NovaListView = ({
  shopSlug, shopProfile, cartCount, onOpenCart,
  search, onSearchChange,
  products, sections,
  isLoading, errorMessage,
}: ProductListViewProps) => {
  const shopName = shopLabel(shopProfile?.name || products[0]?.shop?.name, shopSlug);
  const vendorCurrency = useVendorStore((s) => s.profile?.currency ?? '');
  const currency = vendorCurrency || products[0]?.currency || '';

  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const logout = useUserStore((s) => s.logout);
  const openAuth = useAuthModal((s) => s.open);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const activeSearch = searchParams.get('q');
  const ordersOpen = searchParams.has('orders');
  const orderDetailId = searchParams.get('order') ?? null;

  const [navScrolled, setNavScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [vendorInfoOpen, setVendorInfoOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(getStoredAddress);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavScrolled(y > 10);
      setShowBackToTop(y > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setVendorInfoOpen(false);
        setAddressOpen(false);
        setSelectedProduct(null);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleSaveAddress = (value: string) => {
    setDeliveryAddress(value);
    setStoredAddress(value);
  };

  const handleCategoryPill = (categoryId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('category') === categoryId) {
        next.delete('category');
      } else {
        next.set('category', categoryId);
      }
      return next;
    });
  };

  const handleSearchCommit = (q: string) => {
    onSearchChange(q);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q.trim()) {
        next.set('q', q.trim());
      } else {
        next.delete('q');
      }
      return next;
    });
  };

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      openAuth();
      return;
    }
    setProfileOpen((v) => !v);
  };

  const openOrders = () => setSearchParams((p) => { p.set('orders', ''); return p; });
  const closeOrders = () => setSearchParams((p) => { p.delete('orders'); p.delete('order'); return p; });
  const openOrderDetail = (id: string) => setSearchParams((p) => { p.set('order', id); return p; });
  const closeOrderDetail = () => setSearchParams((p) => { p.delete('order'); return p; });

  const filteredSections = useMemo(() => {
    let result = sections;
    if (activeCategory) {
      result = result.filter((s) => s.category_id === activeCategory);
    }
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      result = result
        .map((s) => ({
          ...s,
          products: s.products.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              (p.excerpt ?? '').toLowerCase().includes(q) ||
              p.categories.some((c) => c.name.toLowerCase().includes(q)),
          ),
        }))
        .filter((s) => s.products.length > 0);
    }
    return result;
  }, [sections, activeCategory, activeSearch]);

  return (
    <div className="qn-page">
      <NovaNav
        shopName={shopName}
        shopProfile={shopProfile}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        onOpenVendorInfo={() => setVendorInfoOpen(true)}
        onOpenAddress={() => setAddressOpen(true)}
        deliveryAddress={deliveryAddress}
        scrolled={navScrolled}
        user={user}
        onOpenProfile={handleAvatarClick}
      />

      {/* Profile dropdown */}
      {profileOpen && (
        <div className="qn-profile-dropdown" ref={profileRef}>
          <button
            type="button"
            onClick={() => { setProfileOpen(false); openOrders(); }}
          >
            <OrdersIcon /> My Orders
          </button>
          <button
            type="button"
            className="qn-profile-dropdown__logout"
            onClick={() => {
              setProfileOpen(false);
              logoutSession().catch(() => null).finally(() => logout());
            }}
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      )}

      <NovaHero shopName={shopName} shopProfile={shopProfile} products={products} />

      {sections.length > 0 && (
        <div className="qn-category-nav">
          <div className="qn-category-nav__inner">
            {sections.map((section) => {
              const isActive = activeCategory === section.category_id;
              return (
                <button
                  key={section.category_id}
                  type="button"
                  className={`qn-category-nav__pill${isActive ? ' is-active' : ''}`}
                  onClick={() => handleCategoryPill(section.category_id)}
                  aria-pressed={isActive}
                >
                  {section.title}
                  {isActive && (
                    <svg className="qn-category-nav__close" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="qn-sections" id="catalogue">
        {isLoading && (
          <div className="qn-section qn-container">
            <div className="qn-section-head">
              <div className="qn-skeleton qn-skeleton--line" style={{ width: '140px', height: '22px' }} />
            </div>
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
          </div>
        )}

        {!isLoading && errorMessage && (
          <p className="qn-empty qn-container">{errorMessage}</p>
        )}

        {!isLoading && filteredSections.length === 0 && !errorMessage && (
          <div className="qn-empty-state qn-container">
            <p>{activeCategory || activeSearch ? 'No items matched.' : 'No items available.'}</p>
            {(activeCategory || activeSearch) && (
              <button
                type="button"
                className="qn-btn qn-btn--ghost"
                onClick={() => setSearchParams({})}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && filteredSections.map((section) => (
          <section
            key={section.category_id}
            id={`cat-${section.category_id}`}
            className="qn-section"
          >
            <div className="qn-section-head qn-container">
              <h2 className="qn-section-title">{section.title}</h2>
              {section.view_more && (
                <Link
                  to={`/category/${section.category_id}${shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''}`}
                  className="qn-section-view-all"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="qn-grid qn-container">
              {section.products.map((p) => (
                <NovaCard key={p.id} product={p} onOpen={setSelectedProduct} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <NovaFooter shopProfile={shopProfile ?? null} shopSlug={shopSlug ?? null} />

      {!searchOpen && <FloatingSearchFab onClick={() => setSearchOpen(true)} />}

      {showBackToTop && (
        <button
          type="button"
          className="qn-back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {selectedProduct && (
        <ProductItemModal
          product={selectedProduct}
          shopSlug={shopSlug}
          currency={currency}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {searchOpen && (
        <FloatingSearch
          products={products}
          collections={[]}
          initialQuery={activeSearch ?? search}
          onCommit={handleSearchCommit}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {vendorInfoOpen && (
        <VendorInfoModal
          shopName={shopName}
          shopProfile={shopProfile}
          collections={[]}
          products={products}
          onClose={() => setVendorInfoOpen(false)}
        />
      )}

      {addressOpen && (
        <AddressModal
          current={deliveryAddress}
          onSave={handleSaveAddress}
          onClose={() => setAddressOpen(false)}
        />
      )}

      {ordersOpen && (
        <OrdersModal
          currency={currency}
          onClose={closeOrders}
          onOpenDetail={openOrderDetail}
          activeOrderId={orderDetailId}
          onCloseDetail={closeOrderDetail}
        />
      )}
    </div>
  );
};

export default NovaListView;
