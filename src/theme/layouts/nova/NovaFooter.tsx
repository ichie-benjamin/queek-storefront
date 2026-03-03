import type { ShopProfile } from '../../../types/shop';

interface SocialLink {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const IconTikTok = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
  </svg>
);

// Dummy social links — replace with real data from shop profile later
const SOCIAL_LINKS: SocialLink[] = [
  { key: 'facebook',  label: 'Facebook',  href: '#', icon: <IconFacebook /> },
  { key: 'instagram', label: 'Instagram', href: '#', icon: <IconInstagram /> },
  { key: 'x',         label: 'X',         href: '#', icon: <IconX /> },
  { key: 'youtube',   label: 'YouTube',   href: '#', icon: <IconYouTube /> },
  { key: 'tiktok',    label: 'TikTok',    href: '#', icon: <IconTikTok /> },
];

interface NovaFooterProps {
  shopProfile: ShopProfile | null;
  shopSlug: string | null;
}

export const NovaFooter = ({ shopProfile, shopSlug }: NovaFooterProps) => {
  const name = shopProfile?.name || (shopSlug
    ? shopSlug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : '');
  const year = new Date().getFullYear();

  return (
    <footer className="qn-footer-v2">
      <div className="qn-footer-v2__inner">

        {/* ── Brand + social ── */}
        <div className="qn-footer-v2__top">
          <div className="qn-footer-v2__brand">
            {shopProfile?.logo && (
              <img
                src={shopProfile.logo}
                alt={name}
                className="qn-footer-v2__logo"
              />
            )}
            {name && <span className="qn-footer-v2__name">{name}</span>}
            {shopProfile?.tagline && (
              <p className="qn-footer-v2__tagline">{shopProfile.tagline}</p>
            )}
            {shopProfile?.address && (
              <p className="qn-footer-v2__address">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 1.5A4.5 4.5 0 013.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 018 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                {shopProfile.address}
              </p>
            )}
          </div>

          <div className="qn-footer-v2__social">
            <p className="qn-footer-v2__social-label">Follow us</p>
            <div className="qn-footer-v2__social-row">
              {SOCIAL_LINKS.map(({ key, label, href, icon }) => (
                <a
                  key={key}
                  href={href}
                  aria-label={label}
                  className="qn-footer-v2__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="qn-footer-v2__bottom">
          <span className="qn-footer-v2__copy">
            {name ? `© ${year} ${name}` : `© ${year}`}
          </span>
          <a
            href="https://business.queek.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="qn-footer-v2__powered"
          >
            Powered by <strong>Queek Merchant OS</strong>
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 9.5l7-7M9.5 9.5V2.5H2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </footer>
  );
};
