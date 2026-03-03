import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useSearchParams } from 'react-router-dom';
import { formatMoney } from '../../../lib/format';
import type {
  Product, ProductAddon, ProductAddonItem,
  ProductReview, ProductReviewsSummary, ProductReviewsData,
} from '../../../types/product';
import type { ProductDetailViewProps } from '../../view-types';
import { useProductDetailState } from '../useProductDetailState';
import { shopLabel, ratingStr, reviewLabel, reviewCountLabel, relativeDate } from './helpers';
import { useCartStore, type CartAddon } from '../../../stores/cartStore';
import { useVendorStore } from '../../../stores/vendorStore';
import { useUserStore } from '../../../stores/userStore';
import { useAuthModal } from '../../../stores/authModalStore';
import { logoutSession } from '../../../services/auth';
import { NovaFooter } from './NovaFooter';
import { OrdersModal, OrdersIcon, LogoutIcon } from './NovaOrders';

/* ── Icons ── */

const PersonIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="19" height="19">
    <path d="M2 3h2l2.4 9.6a1 1 0 001 .4H15a1 1 0 00.97-.76L17 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="17" r="1" fill="currentColor" />
    <circle cx="14" cy="17" r="1" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ── Stars ── */

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 14 14" className="qnd-star-icon" aria-hidden="true">
    <path
      d="M7 1.5l1.55 3.14 3.47.5-2.51 2.45.59 3.46L7 9.35l-3.1 1.7.59-3.46L2 5.14l3.47-.5L7 1.5z"
      fill={filled ? '#facc15' : 'none'}
      stroke={filled ? '#facc15' : '#d6d3cd'}
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

const Stars = ({ rating, count }: { rating: number; count?: number }) => {
  const full = Math.round(rating);
  return (
    <span className="qnd-star-row" aria-label={`${ratingStr(rating)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= full} />)}
      {count !== undefined && count > 0 && (
        <span className="qnd-star-count">({reviewCountLabel(count)})</span>
      )}
    </span>
  );
};

/* ── Breakdown bar ── */

const BreakdownBar = ({ label, count, total }: { label: string; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="qnd-breakdown-row">
      <span className="qnd-breakdown-label">{label}</span>
      <div className="qnd-breakdown-track"><div className="qnd-breakdown-fill" style={{ width: `${pct}%` }} /></div>
      <span className="qnd-breakdown-count">{count}</span>
    </div>
  );
};

/* ── Reviews Sheet (slide-out) ── */

interface ReviewsSheetProps {
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
  breakdown?: ProductReviewsSummary['rating_breakdown'];
  onClose: () => void;
}

const ReviewsSheet = ({ reviews, rating, reviewCount, breakdown, onClose }: ReviewsSheetProps) => (
  <div className="qn-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="qnd-reviews-sheet">
      <div className="qnd-reviews-sheet__head">
        <div className="qnd-reviews-sheet__title-row">
          <h3 className="qnd-reviews-sheet__title">Reviews</h3>
          <button type="button" className="qn-modal__close" style={{ position: 'static' }} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="qnd-reviews-sheet__summary">
          <div className="qnd-reviews-sheet__left">
            <span className="qnd-reviews-sheet__avg">{ratingStr(rating)}</span>
            <Stars rating={rating} />
            <span className="qnd-reviews-sheet__count">{reviewLabel(reviewCount) ?? 'No reviews'}</span>
          </div>
          {breakdown && (
            <div className="qnd-reviews-sheet__bars">
              {(['5', '4', '3', '2', '1'] as const).map((star) => (
                <BreakdownBar key={star} label={`${star}★`} count={breakdown[star]} total={reviewCount} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="qnd-reviews-sheet__list">
        {reviews.length > 0 ? reviews.map((review) => (
          <article key={review.id} className="qnd-review-card">
            <div className="qnd-review-card__top">
              <div className="qnd-review-card__author">
                <span className="qnd-review-card__avatar">{(review.customer_name || 'A').charAt(0).toUpperCase()}</span>
                <div>
                  <strong className="qnd-review-card__name">{review.customer_name || 'Anonymous'}</strong>
                  {relativeDate(review.created_at) && (
                    <span className="qnd-review-card__date">{relativeDate(review.created_at)}</span>
                  )}
                </div>
              </div>
              <Stars rating={review.rating} />
            </div>
            {review.title && <p className="qnd-review-card__title">{review.title}</p>}
            <p className="qnd-review-card__text">{review.description || ''}</p>
          </article>
        )) : (
          <p className="qnd-empty">No reviews yet.</p>
        )}
      </div>
    </div>
  </div>
);

/* ── Reviews Card (compact, in right column) ── */

interface ReviewsCardProps {
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
  breakdown?: ProductReviewsSummary['rating_breakdown'];
  onOpen: () => void;
}

const ReviewsCard = ({ reviews, rating, breakdown: _bd, onOpen }: ReviewsCardProps) => {
  const preview = reviews.slice(0, 2);
  return (
    <div className="qnd-rc">
      <div className="qnd-rc__head">
        <div className="qnd-rc__summary">
          <span className="qnd-rc__avg">{ratingStr(rating)}</span>
          <div>
            <Stars rating={rating} />
          </div>
        </div>
        <button type="button" className="qnd-rc__open-btn" onClick={onOpen} aria-label="View all reviews">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {preview.length > 0 ? (
        <div className="qnd-rc__preview">
          {preview.map((review) => (
            <article key={review.id} className="qnd-rc__item">
              {review.title && <p className="qnd-rc__item-title">{review.title}</p>}
              <p className="qnd-rc__item-text">{review.description || ''}</p>
              <div className="qnd-rc__item-meta">
                <Stars rating={review.rating} />
                <span className="qnd-rc__item-author">{review.customer_name || 'Anonymous'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="qnd-rc__empty">No reviews yet. Be the first!</p>
      )}
    </div>
  );
};

/* ── Detail content ── */

const NovaDetailContent = ({
  shopSlug, shopProfile, cartCount, onOpenCart,
  product, relatedProducts, reviewsData,
}: Omit<ProductDetailViewProps, 'isLoading' | 'errorMessage' | 'product' | 'themeKey' | 'onThemeChange' | 'onAddToCart'> & {
  product: Product;
  reviewsData: ProductReviewsData | null;
}) => {
  const shopName    = shopLabel(shopProfile?.name || product.shop.name, shopSlug);
  const category    = product.categories[0];
  const reviewList  = reviewsData?.reviews?.length ? reviewsData.reviews : (product.reviews ?? []);
  const rating      = reviewsData?.summary.average_rating ?? product.review_summary.rating;
  const reviewCount = reviewsData?.summary.total_reviews ?? product.review_summary.review_count;
  const breakdown   = reviewsData?.summary.rating_breakdown;

  const currency          = useVendorStore((s) => s.profile?.currency ?? product.currency ?? '');
  const addItemWithAddons = useCartStore((s) => s.addItemWithAddons);

  const {
    galleryFrames, activeFrame, activeFrameIndex, setActiveFrameIndex,
    quantity, setQuantity, selectedOptions, applyOptionSelection, optionStatus,
    displayPrice, compareAtPrice, hasDiscount, isInStock, priceRangeLabel,
  } = useProductDetailState(product);

  /* addons */
  const addons = product.addons ?? [];
  const [selectedAddons, setSelectedAddons] = useState<Record<string, CartAddon[]>>({});
  const canAdd = addons
    .filter((a) => a.required)
    .every((a) => { const sel = selectedAddons[a.id]; return sel && sel.length >= (a.min || 1); });
  const addonTotal = Object.values(selectedAddons).flat().reduce((s, a) => s + a.price, 0);
  const lineTotal  = (displayPrice + addonTotal) * quantity;
  const discountPct = hasDiscount ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100) : 0;

  /* nav */
  const [navScrolled, setNavScrolled] = useState(false);

  /* profile / auth */
  const user            = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const logout          = useUserStore((s) => s.logout);
  const openAuth        = useAuthModal((s) => s.open);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  /* orders + reviews */
  const [searchParams, setSearchParams] = useSearchParams();
  const ordersOpen    = searchParams.has('orders');
  const orderDetailId = searchParams.get('order') ?? null;
  const [reviewsOpen, setReviewsOpen] = useState(false);

  /* related scroll */
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const scrollRelated = (dir: 'prev' | 'next') => {
    relatedScrollRef.current?.scrollBy({ left: dir === 'next' ? 260 : -260, behavior: 'smooth' });
  };

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 4);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); setReviewsOpen(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const fn = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [profileOpen]);

  const handleAvatarClick = () => {
    if (!isAuthenticated) { openAuth(); return; }
    setProfileOpen((v) => !v);
  };

  const openOrders       = () => setSearchParams((p) => { p.set('orders', ''); return p; });
  const closeOrders      = () => setSearchParams((p) => { p.delete('orders'); p.delete('order'); return p; });
  const openOrderDetail  = (id: string) => setSearchParams((p) => { p.set('order', id); return p; });
  const closeOrderDetail = () => setSearchParams((p) => { p.delete('order'); return p; });

  /* gallery nav */
  const canNavigate = galleryFrames.length > 1;
  const prevFrame = () => setActiveFrameIndex(activeFrameIndex === 0 ? galleryFrames.length - 1 : activeFrameIndex - 1);
  const nextFrame = () => setActiveFrameIndex(activeFrameIndex === galleryFrames.length - 1 ? 0 : activeFrameIndex + 1);

  /* addon selection */
  const handleAddon = (addon: ProductAddon, item: ProductAddonItem) => {
    setSelectedAddons((prev) => {
      const curr = prev[addon.id] ?? [];
      if (addon.multiple_selection) {
        const exists = curr.some((a) => a.item_id === item.id);
        if (!exists && addon.max > 0 && curr.length >= addon.max) return prev;
        const next = exists
          ? curr.filter((a) => a.item_id !== item.id)
          : [...curr, { addon_id: addon.id, item_id: item.id, name: item.name, price: item.price }];
        return { ...prev, [addon.id]: next };
      }
      if (curr.length === 1 && curr[0].item_id === item.id) {
        const { [addon.id]: _, ...rest } = prev; return rest;
      }
      return { ...prev, [addon.id]: [{ addon_id: addon.id, item_id: item.id, name: item.name, price: item.price }] };
    });
  };

  const handleCart = (openCart = false) => {
    if (!isInStock || !canAdd) return;
    addItemWithAddons(
      { ...product, pricing: { ...product.pricing, sale_amount: displayPrice, compare_at_amount: Math.max(compareAtPrice, displayPrice) } },
      quantity,
      Object.values(selectedAddons).flat(),
    );
    if (openCart) onOpenCart();
  };

  return (
    <div className="qn-page">

      {/* ── Header ── */}
      <header className={`qnd-header${navScrolled ? ' is-scrolled' : ''}`}>
        <div className="qnd-header__inner">
          <Link to="/" className="qnd-header__logo" aria-label={`${shopName} – back to store`}>
            {shopProfile?.logo
              ? <img src={shopProfile.logo} alt={shopName} />
              : <span>{shopName.charAt(0)}</span>}
          </Link>
          <div className="qnd-header__actions" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={`qnd-header__profile-btn${user ? ' has-user' : ''}`}
              onClick={handleAvatarClick}
              aria-label="Account"
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.first_name} />
                : user
                  ? <span>{user.first_name.charAt(0).toUpperCase()}</span>
                  : <PersonIcon />}
            </button>
            <button type="button" className="qnd-header__cart-btn" onClick={onOpenCart} aria-label="Open cart">
              <CartIcon />
              {cartCount > 0 && <span className="qnd-header__cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Profile dropdown */}
      {profileOpen && (
        <div className="qn-profile-dropdown" ref={profileRef}>
          <button type="button" onClick={() => { setProfileOpen(false); openOrders(); }}>
            <OrdersIcon /> My Orders
          </button>
          <button
            type="button"
            className="qn-profile-dropdown__logout"
            onClick={() => { setProfileOpen(false); logoutSession().catch(() => null).finally(() => logout()); }}
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      )}

      {/* ── Breadcrumbs ── */}
      <div className="qnd-crumbs">
        <div className="qnd-crumbs__inner">
          <Link to="/">Home</Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/?category=${encodeURIComponent(category.id)}`}>{category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="qnd-crumbs__current">{product.title}</span>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="qnd-layout">
        <div className="qnd-grid">

          {/* Gallery */}
          <section className={`qnd-gallery${!canNavigate ? ' qnd-gallery--no-nav' : ''}`}>

            {/* Sidebar thumbnails — desktop only */}
            {canNavigate && (
              <div className="qnd-gallery__sidebar">
                {galleryFrames.map((frame, i) => (
                  <button
                    key={frame.id}
                    type="button"
                    className={`qnd-thumb${i === activeFrameIndex ? ' is-active' : ''}`}
                    onClick={() => setActiveFrameIndex(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={frame.url} alt={frame.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image — fixed aspect ratio */}
            <div className="qnd-gallery__main">
              <img src={activeFrame.url} alt={activeFrame.alt} className="qnd-gallery__img" />
              {hasDiscount && discountPct > 0 && <span className="qnd-gallery__badge">-{discountPct}%</span>}
              {!isInStock && <span className="qnd-gallery__badge qnd-gallery__badge--out">Sold out</span>}
              {canNavigate && (
                <>
                  <button type="button" className="qnd-gallery__arrow qnd-gallery__arrow--prev" onClick={prevFrame} aria-label="Previous image">
                    <svg viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" className="qnd-gallery__arrow qnd-gallery__arrow--next" onClick={nextFrame} aria-label="Next image">
                    <svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Mobile thumbnails — below main image */}
            {canNavigate && (
              <div className="qnd-gallery__thumbs-mobile">
                {galleryFrames.map((frame, i) => (
                  <button
                    key={frame.id}
                    type="button"
                    className={`qnd-thumb${i === activeFrameIndex ? ' is-active' : ''}`}
                    onClick={() => setActiveFrameIndex(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={frame.url} alt={frame.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right column: panel + reviews card */}
          <div className="qnd-right-col">

            <section className="qnd-panel">

              {/* ── Identity ── */}
              <div className="qnd-block">
                {shopName && <p className="qnd-panel__shop">{shopName}</p>}
                <h1 className="qnd-panel__title">{product.title}</h1>
                {reviewCount > 0 && (
                  <div className="qnd-panel__meta">
                    <Stars rating={rating} count={reviewCount} />
                    <span className="qnd-panel__avg">{ratingStr(rating)}</span>
                  </div>
                )}
              </div>

              {/* ── Pricing ── */}
              <div className="qnd-block">
                <div className="qnd-price-row">
                  <strong className="qnd-price-main">
                    {priceRangeLabel
                      ? `${formatMoney(product.pricing.price_range.min_amount, currency)} – ${formatMoney(product.pricing.price_range.max_amount, currency)}`
                      : formatMoney(displayPrice, currency)}
                  </strong>
                  {hasDiscount && !priceRangeLabel && (
                    <del className="qnd-price-compare">{formatMoney(compareAtPrice, currency)}</del>
                  )}
                  {hasDiscount && discountPct > 0 && !priceRangeLabel && (
                    <span className="qnd-price-badge">-{discountPct}%</span>
                  )}
                </div>
                <div className={`qnd-avail${isInStock ? '' : ' is-out'}`}>
                  <span className="qnd-avail__dot" />
                  {isInStock ? 'In stock' : 'Out of stock'}
                </div>
              </div>

              {/* ── Options ── */}
              {product.options.length > 0 && (
                <div className="qnd-block">
                  <div className="qnd-options">
                    {product.options.map((option) => {
                      const isColor = option.type === 'color' || option.name.toLowerCase().includes('color') || option.name.toLowerCase().includes('colour');
                      return (
                        <div key={option.name} className="qnd-option-group">
                          <p className="qnd-option-group__label">
                            {option.name}
                            {selectedOptions[option.name] && (
                              <span className="qnd-option-group__selected"> — {selectedOptions[option.name]}</span>
                            )}
                          </p>
                          <div className="qnd-option-group__values">
                            {option.values.map((val) => {
                              const sel    = selectedOptions[option.name] === val.value;
                              const status = optionStatus(option.name, val.value);
                              if (isColor && val.color_code) {
                                return (
                                  <button key={val.value} type="button" title={val.label}
                                    className={`qnd-swatch${sel ? ' is-selected' : ''}${status === 'out-of-stock' ? ' is-out' : ''}`}
                                    style={{ '--swatch-color': val.color_code } as React.CSSProperties}
                                    disabled={status === 'invalid'}
                                    onClick={() => applyOptionSelection(option.name, val.value)}
                                    aria-label={`${option.name}: ${val.label}`}
                                  />
                                );
                              }
                              return (
                                <button key={val.value} type="button"
                                  className={`qnd-option-btn${sel ? ' is-selected' : ''}${status === 'out-of-stock' ? ' is-out' : ''}`}
                                  disabled={status === 'invalid'}
                                  onClick={() => applyOptionSelection(option.name, val.value)}
                                >
                                  {val.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Addons ── */}
              {addons.length > 0 && (
                <div className="qnd-block">
                  <div className="qnd-addons">
                    {addons.map((addon) => (
                      <div key={addon.id} className="qnd-addon-group">
                        <div className="qnd-addon-group__head">
                          <span className="qnd-addon-group__title">{addon.title}</span>
                          {addon.required
                            ? <span className="qnd-addon-group__badge qnd-addon-group__badge--req">Required</span>
                            : addon.max > 1
                              ? <span className="qnd-addon-group__badge">Up to {addon.max}</span>
                              : null}
                        </div>
                        <div className="qnd-addon-items">
                          {addon.items.map((item) => {
                            const sel = (selectedAddons[addon.id] ?? []).some((a) => a.item_id === item.id);
                            return (
                              <button key={item.id} type="button"
                                className={`qnd-addon-item${sel ? ' is-selected' : ''}${!item.in_stock ? ' is-out' : ''}`}
                                onClick={() => handleAddon(addon, item)}
                                disabled={!item.in_stock}
                              >
                                <span className="qnd-addon-item__check">
                                  {sel ? <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                                </span>
                                <span className="qnd-addon-item__name">{item.display_name || item.name}</span>
                                {item.price > 0 && <span className="qnd-addon-item__price">+{formatMoney(item.price, currency)}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Purchase ── */}
              <div className="qnd-block">
                <div className="qnd-qty">
                  <span className="qnd-qty__label">Quantity</span>
                  <div className="qnd-qty__stepper">
                    <button type="button" className="qnd-qty__btn" onClick={() => setQuantity((v) => Math.max(1, v - 1))} aria-label="Decrease">
                      <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                    <span className="qnd-qty__count">{quantity}</span>
                    <button type="button" className="qnd-qty__btn" onClick={() => setQuantity((v) => Math.min(99, v + 1))} aria-label="Increase">
                      <svg viewBox="0 0 12 12" fill="none"><path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
                <div className="qnd-cta">
                  <button type="button" className="qnd-cta__order" disabled={!isInStock || !canAdd} onClick={() => handleCart(true)}>
                    {isInStock ? `Order now · ${formatMoney(lineTotal, currency)}` : 'Unavailable'}
                  </button>
                  <button type="button" className="qnd-cta__add" disabled={!isInStock || !canAdd} onClick={() => handleCart(false)}>
                    Add to cart
                  </button>
                </div>
              </div>

              {/* ── Description ── */}
              {product.description && (
                <div className="qnd-block">
                  <p className="qnd-about__label">About this item</p>
                  <div className="qnd-description">
                    <ReactMarkdown>{product.description}</ReactMarkdown>
                  </div>
                </div>
              )}

            </section>

            {/* Reviews card */}
            <ReviewsCard
              reviews={reviewList}
              rating={rating}
              reviewCount={reviewCount}
              breakdown={breakdown}
              onOpen={() => setReviewsOpen(true)}
            />

          </div>
        </div>
      </div>

      {/* ── Related ── */}
      {relatedProducts.length > 0 && (
        <section className="qnd-related">
          <div className="qnd-related__inner">
            <div className="qnd-related__header">
              <h2 className="qnd-section-title">You might also like</h2>
              <div className="qnd-related__nav">
                <button type="button" className="qnd-related__nav-btn" onClick={() => scrollRelated('prev')} aria-label="Previous">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                    <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="qnd-related__nav-btn" onClick={() => scrollRelated('next')} aria-label="Next">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="qnd-related__scroll" ref={relatedScrollRef}>
              {relatedProducts.map((item, i) => {
                const disc = item.pricing.compare_at_amount > item.pricing.sale_amount;
                const ic = item.currency || currency;
                return (
                  <Link key={`${item.id}-${i}`} to={`/products/${encodeURIComponent(item.slug || item.id)}`} className="qnd-related-card">
                    <div className="qnd-related-card__media">
                      <img src={item.media.thumbnail || item.media.image || '/vite.svg'} alt={item.title} loading="lazy" />
                      {!item.inventory.in_stock && <span className="qnd-related-card__sold">Sold out</span>}
                    </div>
                    <p className="qnd-related-card__name">{item.title}</p>
                    <div className="qnd-related-card__price">
                      <strong>{formatMoney(item.pricing.sale_amount, ic)}</strong>
                      {disc && <del>{formatMoney(item.pricing.compare_at_amount, ic)}</del>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <NovaFooter shopProfile={shopProfile ?? null} shopSlug={shopSlug ?? null} />

      {reviewsOpen && (
        <ReviewsSheet
          reviews={reviewList}
          rating={rating}
          reviewCount={reviewCount}
          breakdown={breakdown}
          onClose={() => setReviewsOpen(false)}
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

/* ── Exported view ── */

export const NovaDetailView = ({
  shopSlug, shopProfile, cartCount, onOpenCart,
  product, relatedProducts, reviewsData,
  isLoading, errorMessage,
}: ProductDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="qn-page">
        <div className="qnd-skeleton-layout">
          <div className="qnd-skeleton-gallery"><div className="qn-skeleton qn-skeleton--block" /></div>
          <div className="qnd-skeleton-panel">
            <div className="qn-skeleton qn-skeleton--line qn-skeleton--short" style={{ height: 12, marginBottom: 10 }} />
            <div className="qn-skeleton qn-skeleton--line" style={{ height: 20, marginBottom: 8 }} />
            <div className="qn-skeleton qn-skeleton--line qn-skeleton--mid" style={{ height: 14, marginBottom: 20 }} />
            <div className="qn-skeleton qn-skeleton--line qn-skeleton--short" style={{ height: 28, marginBottom: 14 }} />
            <div className="qn-skeleton qn-skeleton--line" style={{ height: 40 }} />
          </div>
        </div>
      </div>
    );
  }
  if (errorMessage) return <div className="qn-page"><p className="qn-empty qn-empty--page">{errorMessage}</p></div>;
  if (!product) return <div className="qn-page"><p className="qn-empty qn-empty--page">Product not found.</p></div>;

  return (
    <NovaDetailContent
      key={product.id}
      shopSlug={shopSlug} shopProfile={shopProfile}
      cartCount={cartCount} onOpenCart={onOpenCart}
      product={product} relatedProducts={relatedProducts}
      reviewsData={reviewsData}
    />
  );
};

export default NovaDetailView;
