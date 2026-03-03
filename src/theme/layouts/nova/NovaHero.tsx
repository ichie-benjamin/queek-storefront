import type { Product } from '../../../types/product';
import type { ProductListViewProps } from '../../view-types';
import { ratingStr, reviewLabel } from './helpers';

interface NovaHeroProps {
  shopName: string;
  shopProfile: ProductListViewProps['shopProfile'];
  products: Product[];
}

const NovaHero = ({ shopName, shopProfile, products }: NovaHeroProps) => {
  const rating = shopProfile?.rating_value ?? products[0]?.shop?.rating ?? 0;
  const ratingCount = shopProfile?.rating_count ?? products[0]?.shop?.rating_count ?? 0;
  const deliveryTime = shopProfile?.delivery_time;
  const tagline = shopProfile?.tagline;
  const reviews = reviewLabel(ratingCount);

  return (
    <section className="qn-hero">
      {shopProfile?.banner
        ? <img className="qn-hero__image" src={shopProfile.banner} alt={shopName} />
        : <div className="qn-hero__image qn-hero__gradient" />}
      <div className="qn-hero__overlay" />
      <div className="qn-hero__content">
        <div className="qn-hero__inner">
          {tagline && (
            <div className="qn-hero__badge">
              <span className="qn-hero__badge-dot" />
              {tagline}
            </div>
          )}
          <h1 className="qn-hero__name">{shopName}</h1>
          <a href="#catalogue" className="qn-hero__cta">
            Browse catalogue
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <div className="qn-hero__meta">
            {Number.isFinite(rating) && rating > 0 && (
              <span className="qn-hero__stat">
                <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 1l1.2 2.4 2.8.4-2 1.9.5 2.8L6 7.4l-2.5 1.3.5-2.8-2-1.9 2.8-.4z" /></svg>
                {ratingStr(rating)}
              </span>
            )}
            {reviews && <><span className="qn-hero__dot" /><span className="qn-hero__stat">{reviews}</span></>}
            {deliveryTime && (
              <><span className="qn-hero__dot" />
              <span className="qn-hero__stat">
                <svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" /><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                {deliveryTime}
              </span></>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NovaHero;
