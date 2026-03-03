import type { Product } from '../../../types/product';
import type { ProductListViewProps, VendorCollection } from '../../view-types';
import { ratingStr, reviewCountLabel, relativeDate } from './helpers';

interface VendorInfoModalProps {
  shopName: string;
  shopProfile: ProductListViewProps['shopProfile'];
  collections: VendorCollection[];
  products: Product[];
  onClose: () => void;
}

const VendorInfoModal = ({ shopName, shopProfile, collections, products, onClose }: VendorInfoModalProps) => {
  const rating = shopProfile?.rating_value ?? products[0]?.shop?.rating ?? 0;
  const ratingCount = shopProfile?.rating_count ?? products[0]?.shop?.rating_count ?? 0;
  const reviews = products.flatMap((p) => p.reviews).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: shopName, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  return (
    <div className="qn-modal-overlay qn-vendor-modal-overlay" onClick={onClose} role="dialog" aria-modal aria-label="Vendor info">
      <div className="qn-vendor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qn-vendor-modal__toolbar">
          <button type="button" className="qn-vendor-modal__tool-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="qn-vendor-modal__tool-btn" onClick={handleShare} aria-label="Share">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M11 2l3 3-3 3M14 5H6a3 3 0 000 6h1M5 14l-3-3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="qn-vendor-modal__head">
          <div className="qn-vendor-modal__logo">
            {shopProfile?.logo
              ? <img src={shopProfile.logo} alt={shopName} />
              : <span>{shopName.charAt(0)}</span>}
          </div>
          <div>
            <h2 className="qn-vendor-modal__name">{shopName}</h2>
            <div className="qn-vendor-modal__rating">
              <span className="qn-vendor-modal__rating-star">★</span>
              <span>{ratingStr(rating)}</span>
              {ratingCount > 0 && <span className="qn-vendor-modal__rating-count">({reviewCountLabel(ratingCount)})</span>}
            </div>
          </div>
        </div>

        {collections.length > 0 && (
          <div className="qn-vendor-modal__collections">
            <div className="qn-vendor-modal__col-row">
              <div className="qn-vendor-modal__col-icon qn-vendor-modal__col-icon--all">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" /></svg>
              </div>
              <span>Shop all</span>
            </div>
            {collections.map((col) => (
              <div key={col.id} className="qn-vendor-modal__col-row" onClick={onClose}>
                <div
                  className="qn-vendor-modal__col-icon"
                  style={col.image ? { backgroundImage: `url(${col.image})` } : undefined}
                >
                  {!col.image && <span>{col.name.charAt(0)}</span>}
                </div>
                <span>{col.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="qn-vendor-modal__reviews">
          <div className="qn-vendor-modal__reviews-head">
            <h3>Reviews</h3>
            <span>→</span>
          </div>
          <div className="qn-vendor-modal__reviews-summary">
            <span className="qn-vendor-modal__reviews-avg">{ratingStr(rating)}</span>
            <div>
              <span className="qn-vendor-modal__stars">{'★'.repeat(Math.round(rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}</span>
              {ratingCount > 0 && <p className="qn-vendor-modal__reviews-count">{reviewCountLabel(ratingCount)} ratings</p>}
            </div>
          </div>
          {reviews.length > 0 && (
            <div className="qn-vendor-modal__review-card">
              <p className="qn-vendor-modal__review-text">{reviews[0].description || 'Great experience.'}</p>
              <div className="qn-vendor-modal__review-meta">
                <span className="qn-vendor-modal__stars-sm">{'★'.repeat(Math.round(reviews[0].rating))}</span>
                <span>{reviews[0].customer_name || 'Anonymous'}</span>
                {relativeDate(reviews[0].created_at) && <span>· {relativeDate(reviews[0].created_at)}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorInfoModal;
