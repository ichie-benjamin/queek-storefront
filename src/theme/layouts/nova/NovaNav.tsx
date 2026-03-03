import type { User } from '../../../stores/userStore';
import type { ProductListViewProps } from '../../view-types';

interface NovaNavProps {
  shopName: string;
  shopProfile: ProductListViewProps['shopProfile'];
  cartCount: number;
  onOpenCart: () => void;
  onOpenVendorInfo: () => void;
  onOpenAddress: () => void;
  deliveryAddress: string;
  scrolled: boolean;
  user: User | null;
  onOpenProfile: () => void;
}

const PersonIcon = () => (
  <svg viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NovaNav = ({
  shopName,
  shopProfile,
  cartCount,
  onOpenCart,
  onOpenVendorInfo,
  onOpenAddress,
  deliveryAddress,
  scrolled,
  user,
  onOpenProfile,
}: NovaNavProps) => (
  <header className={`qn-nav${scrolled ? ' qn-nav--scrolled' : ''}`}>
    <div className="qn-nav__inner">
      <button type="button" className="qn-nav__logo-btn" onClick={onOpenVendorInfo} aria-label="Vendor info">
        {shopProfile?.logo
          ? <img src={shopProfile.logo} alt={shopName} />
          : <span>{shopName.charAt(0)}</span>}
      </button>

      <button type="button" className="qn-nav__address" onClick={onOpenAddress} aria-label="Set delivery address">
        <svg viewBox="0 0 14 14" fill="none">
          <path d="M7 1C4.79 1 3 2.79 3 5c0 3.08 4 8 4 8s4-4.92 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="5" r="1.3" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="qn-nav__address-text">
          {deliveryAddress || 'Set address'}
        </span>
        <svg className="qn-nav__address-chevron" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="qn-nav__actions">
        <button type="button" className="qn-nav__profile-btn" onClick={onOpenProfile} aria-label="Account">
          {user?.avatar
            ? <img src={user.avatar} alt={user.first_name} />
            : <span>{user ? user.first_name.charAt(0).toUpperCase() : <PersonIcon />}</span>}
        </button>

        <button type="button" className="qn-nav__icon-btn qn-nav__cart" onClick={onOpenCart} aria-label="Open cart">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M2 3h2l2.4 9.6a1 1 0 001 .4H15a1 1 0 00.97-.76L17 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="17" r="1" fill="currentColor" />
            <circle cx="14" cy="17" r="1" fill="currentColor" />
          </svg>
          {cartCount > 0 && <span className="qn-nav__cart-badge">{cartCount}</span>}
        </button>
      </div>
    </div>
  </header>
);

export default NovaNav;
