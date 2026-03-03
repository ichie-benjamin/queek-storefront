import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, toPercent } from '../../../lib/format';
import type { Product } from '../../../types/product';

interface NovaCardProps {
  product: Product;
  onOpen: (product: Product) => void;
}

export const NovaCard = ({ product, onOpen }: NovaCardProps) => {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  const hasDiscount = product.pricing.compare_at_amount > product.pricing.sale_amount;
  const rating = product.review_summary?.rating ?? 0;
  const reviewCount = product.review_summary?.review_count ?? 0;
  const hasVariants = product.variants_count > 0;

  const handleOpen = () => {
    if (hasVariants) {
      navigate(`/products/${encodeURIComponent(product.slug || product.id)}`);
    } else {
      onOpen(product);
    }
  };

  return (
    <article className="qn-card" onClick={handleOpen}>
      <div className="qn-card__media">
        <img
          src={product.media.image || product.media.thumbnail || '/vite.svg'}
          alt={product.title}
          loading="lazy"
        />
        {hasDiscount && (
          <span className="qn-card__discount">-{toPercent(product.pricing.discount_percent)}</span>
        )}
        {!product.inventory.in_stock && (
          <div className="qn-card__sold-overlay">Sold out</div>
        )}

        <button
          type="button"
          className={`qn-card__like${liked ? ' is-liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
          aria-label={liked ? 'Remove from saved' : 'Save item'}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 13.5C8 13.5 1.5 9.8 1.5 5.5a3.25 3.25 0 016.5 0 3.25 3.25 0 016.5 0C14.5 9.8 8 13.5 8 13.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          className="qn-card__add-hover"
          onClick={(e) => { e.stopPropagation(); handleOpen(); }}
          disabled={!product.inventory.in_stock}
          aria-label={hasVariants ? `View ${product.title}` : `Add ${product.title}`}
        >
          {hasVariants ? (
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      <div className="qn-card__body">
        <h3 className="qn-card__title">{product.title}</h3>

        <div className="qn-card__rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} className="qn-card__rating-star" viewBox="0 0 12 12">
              <path
                d="M6 1l1.35 2.73L10.5 4.2l-2.25 2.2.53 3.1L6 8l-2.78 1.5.53-3.1L1.5 4.2l3.15-.47L6 1z"
                fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
                stroke={i <= Math.round(rating) ? '#f59e0b' : '#d6d3cd'}
                strokeWidth="0.9"
              />
            </svg>
          ))}
          <span className="qn-card__rating-val">{rating.toFixed(1)}</span>
          {reviewCount > 0 && <span className="qn-card__rating-count">({reviewCount})</span>}
        </div>

        <div className="qn-card__price">
          <strong>{formatMoney(product.pricing.sale_amount, product.currency)}</strong>
          {hasDiscount && <del>{formatMoney(product.pricing.compare_at_amount, product.currency)}</del>}
          {hasVariants && <span className="qn-card__variants-label">Options</span>}
        </div>
      </div>
    </article>
  );
};

export default NovaCard;
