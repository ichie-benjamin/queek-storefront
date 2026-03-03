import { Link } from 'react-router-dom';
import { formatMoney } from '../../../lib/format';
import type { CheckoutViewProps } from '../../view-types';
import { shopLabel } from './helpers';

export const NovaCheckoutView = ({
  shopSlug, shopProfile, items, total, currency,
  address, phone, submitMessage, submitError, isSubmitting,
  onAddressChange, onPhoneChange, onSubmit, onClearCart,
}: CheckoutViewProps) => {
  const shopName = shopLabel(shopProfile?.name, shopSlug);
  return (
    <div className="qn-page">
      <header className="qn-checkout-nav">
        <div className="qn-checkout-nav__inner">
          <Link to="/" className="qn-checkout-nav__back">
            <svg viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Continue shopping
          </Link>
        </div>
      </header>

      <div className="qn-checkout qn-container">
        <div className="qn-checkout__head">
          <h1 className="qn-checkout__title">Checkout</h1>
          <p className="qn-checkout__shop">{shopName}</p>
        </div>
        {items.length === 0 ? (
          <div className="qn-empty-state">
            <span className="qn-empty-state__icon">🛒</span>
            <p>Your cart is empty.</p>
            <Link to="/" className="qn-btn qn-btn--primary">Browse catalogue</Link>
          </div>
        ) : (
          <div className="qn-checkout__grid">
            <section className="qn-checkout-summary">
              <h2 className="qn-checkout-summary__title">Order summary</h2>
              <div className="qn-checkout-summary__items">
                {items.map((item) => (
                  <div key={`${item.shop_id}-${item.id}`} className="qn-checkout-item">
                    <div className="qn-checkout-item__info"><strong>{item.title}</strong><span>× {item.quantity}</span></div>
                    <strong>{formatMoney(item.unit_price * item.quantity, currency)}</strong>
                  </div>
                ))}
              </div>
              <div className="qn-checkout-summary__total"><span>Total</span><strong>{formatMoney(total, currency)}</strong></div>
              <button type="button" className="qn-btn qn-btn--ghost qn-btn--sm" onClick={onClearCart}>Clear cart</button>
            </section>
            <form className="qn-checkout-form" onSubmit={onSubmit}>
              <h2 className="qn-checkout-form__title">Delivery details</h2>
              {submitError && <p className="qn-form-error">{submitError}</p>}
              {submitMessage && <p className="qn-form-success">{submitMessage}</p>}
              <div className="qn-field">
                <label className="qn-field__label" htmlFor="co-address">Delivery address</label>
                <input id="co-address" className="qn-field__input" value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Enter your full delivery address" required />
              </div>
              <div className="qn-field">
                <label className="qn-field__label" htmlFor="co-phone">Phone number</label>
                <input id="co-phone" className="qn-field__input" value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="+234 800 000 0000" required />
              </div>
              <button type="submit" className="qn-btn qn-btn--primary qn-btn--full" disabled={isSubmitting}>
                {isSubmitting ? 'Placing order…' : `Place order · ${formatMoney(total, currency)}`}
              </button>
            </form>
          </div>
        )}
      </div>
      <footer className="qn-footer"><p>Powered by <strong>Queek</strong></p></footer>
    </div>
  );
};

export default NovaCheckoutView;
