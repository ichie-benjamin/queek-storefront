import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { QueekSdkError } from '@queekai/client-sdk';
import { getShopContext } from './lib/shop-context';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { useThemeStore } from './stores/themeStore';
import { getThemeByKey, pickThemeFromShop } from './theme/themes';
import { AuthModal } from './components/AuthModal';
import { useAuthModal } from './stores/authModalStore';
import { useUserStore } from './stores/userStore';
import { useVendorStore } from './stores/vendorStore';
import { fetchMe } from './services/auth';
import { fetchShopProfile } from './services/shop';
import { VendorMeta } from './components/VendorMeta';

const WEBSITE_URL = (import.meta.env.VITE_WEBSITE_URL as string) || 'https://queek.com.ng';

function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      gap: '1.5rem',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="30" stroke="#e2e0db" strokeWidth="2" />
        <path d="M22 32h20M32 22v20" stroke="#a09d97" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 24l16 16M40 24L24 40" stroke="#e8441a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1917' }}>Store not found</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#716e68', fontSize: '0.95rem' }}>
          This storefront is not available or has been removed.
        </p>
      </div>
      <a
        href={WEBSITE_URL}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#e8441a',
          color: '#fff',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}
      >
        Go to Queek
      </a>
    </div>
  );
}

function App() {
  const shopContext = useMemo(() => getShopContext(), []);
  const themeKey = useThemeStore((state) => state.themeKey);
  const setThemeKey = useThemeStore((state) => state.setThemeKey);
  const { isOpen: authOpen, onSuccess: authOnSuccess, close: closeAuth } = useAuthModal();
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);
  const { status: vendorStatus, setProfile, setStatus } = useVendorStore();

  useEffect(() => {
    fetchMe().then((u) => u ? setUser(u) : logout());
  }, []);

  useEffect(() => {
    fetchShopProfile()
      .then((profile) => setProfile(profile))
      .catch((err) => {
        if (err instanceof QueekSdkError && err.status === 403) {
          setStatus('forbidden');
        } else {
          setStatus('error');
        }
      });
  }, []);

  useEffect(() => {
    if (shopContext.themeKey) {
      setThemeKey(shopContext.themeKey);
      return;
    }

    const derived = pickThemeFromShop(shopContext.shopSlug);
    if (themeKey !== derived.key) {
      setThemeKey(derived.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vendorStatus === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #e2e0db',
          borderTopColor: '#e8441a',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (vendorStatus === 'forbidden') {
    return <NotFoundPage />;
  }

  const theme = getThemeByKey(themeKey);

  return (
    <div className={`app-root ${theme.className}`}>
      <VendorMeta />
      <Routes>
        <Route
          path="/"
          element={
            <ProductListPage
              shopSlug={shopContext.shopSlug}
              themeKey={theme.key}
              onThemeChange={setThemeKey}
            />
          }
        />

        <Route
          path="/products/:idOrSlug"
          element={
            <ProductDetailPage
              shopSlug={shopContext.shopSlug}
              themeKey={theme.key}
              onThemeChange={setThemeKey}
            />
          }
        />

        <Route
          path="/category/:categoryId"
          element={
            <CategoryPage
              shopSlug={shopContext.shopSlug}
              themeKey={theme.key}
              onThemeChange={setThemeKey}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {authOpen && (
        <AuthModal onClose={closeAuth} onSuccess={authOnSuccess} />
      )}
    </div>
  );
}

export default App;
