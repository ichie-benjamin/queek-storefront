#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const usage = `\nUsage:\n  npx add-theme <theme-key> [Theme Name]\n\nExamples:\n  npx add-theme linen-premium \"Linen Premium\"\n  yarn add-theme mono-luxe \"Mono Luxe\"\n`;

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const toPascalCase = (value) => value.split('-').filter(Boolean).map(capitalize).join('');
const toTitleCase = (value) => value.split('-').filter(Boolean).map(capitalize).join(' ');

const ensure = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const args = process.argv.slice(2);
const rawKey = args[0];

if (!rawKey || rawKey === '--help' || rawKey === '-h') {
  console.log(usage.trim());
  process.exit(0);
}

const key = rawKey.toLowerCase();
ensure(/^[a-z][a-z0-9-]*$/.test(key), 'Theme key must match: ^[a-z][a-z0-9-]*$');

const themeName = args.slice(1).join(' ').trim() || toTitleCase(key);
const pascal = toPascalCase(key);
const className = `theme-${key}`;

const root = process.cwd();
const layoutPath = path.join(root, 'src/theme/layouts', `${key}.tsx`);
const viewsPath = path.join(root, 'src/theme/views.ts');
const themesPath = path.join(root, 'src/theme/themes.ts');
const cssPath = path.join(root, 'src/index.css');

ensure(fs.existsSync(viewsPath), 'Could not find src/theme/views.ts');
ensure(fs.existsSync(themesPath), 'Could not find src/theme/themes.ts');
ensure(fs.existsSync(cssPath), 'Could not find src/index.css');
ensure(!fs.existsSync(layoutPath), `Theme layout already exists: ${layoutPath}`);

const layoutTemplate = `import { Link } from 'react-router-dom';
import { formatMoney } from '../../lib/format';
import type {
  CheckoutViewProps,
  ProductDetailViewProps,
  ProductListViewProps,
} from '../view-types';
import { ThemeSwitcher } from '../../components/storefront/ThemeSwitcher';

const readShopName = (name: string | null | undefined, slug: string | null) => {
  if (name) return name;
  if (!slug) return 'Queek Shop';
  return slug.replace(/-/g, ' ');
};

export const ${pascal}ListView = ({
  themeKey,
  onThemeChange,
  shopSlug,
  shopProfile,
  cartCount,
  onOpenCart,
  search,
  onSearchChange,
  products,
  isLoading,
  errorMessage,
  onAddToCart,
}: ProductListViewProps) => {
  const shopName = readShopName(shopProfile?.name || products[0]?.shop?.name, shopSlug);

  return (
    <section className="${key}-shell">
      <header className="${key}-sticky">
        <div className="${key}-brand">
          <p>Storefront theme</p>
          <h1>{shopName}</h1>
        </div>

        <div className="${key}-search-wrap">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products"
          />
        </div>

        <div className="${key}-actions">
          <ThemeSwitcher activeKey={themeKey} onChange={onThemeChange} compact />
          <button type="button" className="${key}-btn ${key}-btn--solid" onClick={onOpenCart}>
            Cart ({cartCount})
          </button>
        </div>
      </header>

      {isLoading ? <p className="${key}-empty">Loading products...</p> : null}
      {errorMessage ? <p className="${key}-empty">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && products.length === 0 ? (
        <p className="${key}-empty">No products available.</p>
      ) : null}

      <div className="${key}-grid">
        {products.map((product) => (
          <article key={\`${'${product.shop_id}'}-${'${product.id}'}\`} className="${key}-card">
            <Link to={\`/products/${'${encodeURIComponent(product.slug || product.id)}'}\`}>
              <img src={product.media.thumbnail || product.media.image || '/vite.svg'} alt={product.title} />
            </Link>

            <div>
              <h2>
                <Link to={\`/products/${'${encodeURIComponent(product.slug || product.id)}'}\`}>{product.title}</Link>
              </h2>
              <strong>{formatMoney(product.pricing.sale_amount, product.currency)}</strong>
              <button
                type="button"
                className="${key}-btn"
                onClick={() => onAddToCart(product)}
                disabled={!product.inventory.in_stock}
              >
                {product.inventory.in_stock ? 'Add to cart' : 'Out of stock'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export const ${pascal}DetailView = ({
  themeKey,
  onThemeChange,
  shopSlug,
  shopProfile,
  cartCount,
  onOpenCart,
  product,
  isLoading,
  errorMessage,
  onAddToCart,
}: ProductDetailViewProps) => {
  const shopName = readShopName(shopProfile?.name || product?.shop?.name, shopSlug);

  if (isLoading) return <p className="${key}-empty">Loading product...</p>;
  if (errorMessage) return <p className="${key}-empty">{errorMessage}</p>;
  if (!product) return <p className="${key}-empty">Product not found.</p>;

  return (
    <section className="${key}-detail">
      <header className="${key}-detail-toolbar">
        <div>
          <p>{shopName}</p>
          <h1>{product.title}</h1>
        </div>

        <div className="${key}-actions">
          <ThemeSwitcher activeKey={themeKey} onChange={onThemeChange} compact />
          <button type="button" className="${key}-btn ${key}-btn--solid" onClick={onOpenCart}>
            Cart ({cartCount})
          </button>
        </div>
      </header>

      <Link className="${key}-back" to="/">← Back to products</Link>

      <article className="${key}-detail-grid">
        <img src={product.media.image || product.media.thumbnail || '/vite.svg'} alt={product.title} />
        <div>
          <p>{product.excerpt || product.description || 'Premium ecommerce layout starter.'}</p>
          <strong>{formatMoney(product.pricing.sale_amount, product.currency)}</strong>
          <button
            type="button"
            className="${key}-btn ${key}-btn--solid"
            onClick={() => onAddToCart(product, 1)}
            disabled={!product.inventory.in_stock}
          >
            {product.inventory.in_stock ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </article>
    </section>
  );
};

export const ${pascal}CheckoutView = ({
  themeKey,
  onThemeChange,
  shopSlug,
  shopProfile,
  cartCount,
  items,
  total,
  currency,
  address,
  phone,
  submitMessage,
  submitError,
  isSubmitting,
  onAddressChange,
  onPhoneChange,
  onSubmit,
  onClearCart,
}: CheckoutViewProps) => {
  const shopName = readShopName(shopProfile?.name, shopSlug);

  return (
    <section className="${key}-checkout">
      <header className="${key}-detail-toolbar">
        <div>
          <p>Checkout</p>
          <h1>{shopName}</h1>
        </div>

        <div className="${key}-actions">
          <ThemeSwitcher activeKey={themeKey} onChange={onThemeChange} compact />
          <span className="${key}-pill">Cart ({cartCount})</span>
        </div>
      </header>

      <Link className="${key}-back" to="/">← Continue shopping</Link>

      {items.length === 0 ? (
        <p className="${key}-empty">Cart is empty for this shop.</p>
      ) : (
        <div className="${key}-checkout-grid">
          <section>
            <h2>Summary</h2>
            {items.map((item) => (
              <div key={\`${'${item.shop_id}'}-${'${item.id}'}\`}>
                <span>{item.title} × {item.quantity}</span>
                <strong>{formatMoney(item.unit_price * item.quantity, currency)}</strong>
              </div>
            ))}

            <div>
              <span>Total</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>

            <button type="button" className="${key}-btn" onClick={onClearCart}>Clear cart</button>
          </section>

          <form onSubmit={onSubmit}>
            <h2>Delivery details</h2>
            {submitError ? <p className="${key}-empty">{submitError}</p> : null}
            {submitMessage ? <p className="${key}-status">{submitMessage}</p> : null}

            <label>
              Delivery address
              <input value={address} onChange={(event) => onAddressChange(event.target.value)} required />
            </label>

            <label>
              Phone number
              <input value={phone} onChange={(event) => onPhoneChange(event.target.value)} required />
            </label>

            <button type="submit" className="${key}-btn ${key}-btn--solid" disabled={isSubmitting}>
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
`;

fs.writeFileSync(layoutPath, layoutTemplate, 'utf8');

const importLine = `import { ${pascal}CheckoutView, ${pascal}DetailView, ${pascal}ListView } from './layouts/${key}';`;
const viewsSource = fs.readFileSync(viewsPath, 'utf8');
let nextViews = viewsSource;

if (!nextViews.includes(importLine)) {
  const importAnchor = "import type { ThemeViewSet } from './view-types';";
  ensure(nextViews.includes(importAnchor), `Could not find import anchor in ${viewsPath}`);
  nextViews = nextViews.replace(importAnchor, `${importLine}\n${importAnchor}`);
}

if (!nextViews.includes(`${key}: {`)) {
  const mapAnchor = '};\n\nexport const getThemeViews';
  const mapEntry = `  ${key}: {\n    ProductListView: ${pascal}ListView,\n    ProductDetailView: ${pascal}DetailView,\n    CheckoutView: ${pascal}CheckoutView,\n  },\n`;
  ensure(nextViews.includes(mapAnchor), `Could not find map anchor in ${viewsPath}`);
  nextViews = nextViews.replace(mapAnchor, `${mapEntry}};\n\nexport const getThemeViews`);
}

fs.writeFileSync(viewsPath, nextViews, 'utf8');

const themesSource = fs.readFileSync(themesPath, 'utf8');
let nextThemes = themesSource;
if (!nextThemes.includes(`key: '${key}'`)) {
  const arrayEnd = '];';
  const themeEntry = `  {\n    key: '${key}',\n    name: '${themeName}',\n    description: 'Premium minimal theme generated with add-theme',\n    className: '${className}',\n  },\n`;
  ensure(nextThemes.includes(arrayEnd), `Could not find theme array end in ${themesPath}`);
  nextThemes = nextThemes.replace(arrayEnd, `${themeEntry}${arrayEnd}`);
}
fs.writeFileSync(themesPath, nextThemes, 'utf8');

const cssSource = fs.readFileSync(cssPath, 'utf8');
if (!cssSource.includes(`.${className}`)) {
  const cssBlock = `\n\n/* ${themeName} (generated premium starter) */\n.${className} {\n  --font-display: 'Cormorant Garamond', serif;\n  --font-body: 'Manrope', sans-serif;\n  --bg: #f6f2ec;\n  --bg-soft: #fbf8f3;\n  --surface: #ffffff;\n  --surface-soft: #f8f2ea;\n  --text: #201812;\n  --text-muted: #6d5f51;\n  --border: #ebdece;\n  --accent: #23180f;\n  --accent-contrast: #fffdf8;\n  --shadow: 0 20px 52px rgba(45, 32, 20, 0.14);\n}\n\n.${key}-shell,\n.${key}-detail,\n.${key}-checkout {\n  max-width: 1240px;\n  margin: 0 auto;\n  padding: 0.92rem 1rem 3rem;\n}\n\n.${key}-sticky {\n  position: sticky;\n  top: 0;\n  z-index: 36;\n  display: grid;\n  grid-template-columns: minmax(220px, 1fr) minmax(300px, 1fr) minmax(220px, auto);\n  gap: 0.66rem;\n  border-radius: 20px;\n  padding: 0.74rem;\n  background: color-mix(in srgb, var(--surface) 86%, white 14%);\n  backdrop-filter: blur(8px);\n  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);\n}\n\n.${key}-brand p,\n.${key}-brand h1 {\n  margin: 0;\n}\n\n.${key}-brand p {\n  text-transform: uppercase;\n  letter-spacing: 0.09em;\n  font-size: 0.64rem;\n  color: var(--text-muted);\n}\n\n.${key}-brand h1 {\n  margin-top: 0.18rem;\n  font-family: var(--font-display);\n  font-size: clamp(1.1rem, 2.1vw, 1.5rem);\n}\n\n.${key}-search-wrap input,\n.${key}-checkout form input {\n  width: 100%;\n  height: 42px;\n  border-radius: 999px;\n  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);\n  background: color-mix(in srgb, var(--surface) 80%, var(--surface-soft) 20%);\n  color: var(--text);\n  padding: 0 0.84rem;\n}\n\n.${key}-actions {\n  display: flex;\n  align-items: center;\n  gap: 0.46rem;\n}\n\n.${key}-btn {\n  border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);\n  border-radius: 999px;\n  height: 38px;\n  padding: 0 0.86rem;\n  background: color-mix(in srgb, var(--surface) 86%, var(--surface-soft) 14%);\n  color: var(--text);\n  font-size: 0.8rem;\n  font-weight: 700;\n  cursor: pointer;\n  transition: transform 140ms ease, box-shadow 170ms ease;\n}\n\n.${key}-btn:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.1);\n}\n\n.${key}-btn--solid {\n  background: var(--accent);\n  border-color: var(--accent);\n  color: var(--accent-contrast);\n}\n\n.${key}-btn:disabled {\n  opacity: 0.54;\n  cursor: not-allowed;\n  transform: none;\n  box-shadow: none;\n}\n\n.${key}-empty {\n  margin: 0.84rem 0;\n  border: 1px dashed color-mix(in srgb, var(--border) 92%, transparent);\n  border-radius: 16px;\n  background: color-mix(in srgb, var(--surface) 78%, var(--bg-soft) 22%);\n  color: var(--text-muted);\n  text-align: center;\n  padding: 0.9rem;\n}\n\n.${key}-grid {\n  margin-top: 0.86rem;\n  display: grid;\n  gap: 0.86rem;\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n}\n\n.${key}-card {\n  border-radius: 16px;\n  overflow: hidden;\n  background: var(--surface);\n  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.09);\n}\n\n.${key}-card img {\n  width: 100%;\n  aspect-ratio: 4 / 3;\n  object-fit: cover;\n}\n\n.${key}-card > div {\n  padding: 0.74rem;\n  display: grid;\n  gap: 0.38rem;\n}\n\n.${key}-card h2,\n.${key}-card strong {\n  margin: 0;\n}\n\n.${key}-card h2 {\n  font-size: 0.95rem;\n  line-height: 1.28;\n}\n\n.${key}-card h2 a {\n  text-decoration: none;\n}\n\n.${key}-detail-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.66rem;\n}\n\n.${key}-detail-toolbar h1,\n.${key}-detail-toolbar p {\n  margin: 0;\n}\n\n.${key}-detail-toolbar p {\n  text-transform: uppercase;\n  letter-spacing: 0.09em;\n  color: var(--text-muted);\n  font-size: 0.64rem;\n}\n\n.${key}-detail-toolbar h1 {\n  margin-top: 0.16rem;\n  font-family: var(--font-display);\n  font-size: clamp(1.3rem, 2.6vw, 1.8rem);\n}\n\n.${key}-back {\n  margin-top: 0.56rem;\n  display: inline-flex;\n  text-decoration: none;\n  color: var(--accent);\n  font-size: 0.84rem;\n  font-weight: 700;\n}\n\n.${key}-detail-grid {\n  margin-top: 0.76rem;\n  display: grid;\n  gap: 0.76rem;\n  grid-template-columns: minmax(260px, 1fr) minmax(320px, 1fr);\n  border-radius: 20px;\n  overflow: hidden;\n  background: var(--surface);\n  box-shadow: var(--shadow);\n}\n\n.${key}-detail-grid img {\n  width: 100%;\n  height: 100%;\n  min-height: 320px;\n  object-fit: cover;\n}\n\n.${key}-detail-grid > div {\n  padding: 0.94rem;\n  display: grid;\n  gap: 0.68rem;\n}\n\n.${key}-detail-grid > div p,\n.${key}-detail-grid > div strong {\n  margin: 0;\n}\n\n.${key}-pill {\n  display: inline-flex;\n  align-items: center;\n  min-height: 36px;\n  border-radius: 999px;\n  background: color-mix(in srgb, var(--surface) 74%, var(--surface-soft) 26%);\n  color: var(--text-muted);\n  font-size: 0.8rem;\n  font-weight: 700;\n  padding: 0.26rem 0.74rem;\n}\n\n.${key}-checkout-grid {\n  margin-top: 0.76rem;\n  display: grid;\n  gap: 0.76rem;\n  grid-template-columns: repeat(2, minmax(280px, 1fr));\n}\n\n.${key}-checkout-grid > section,\n.${key}-checkout-grid form {\n  border-radius: 18px;\n  background: var(--surface);\n  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.09);\n  padding: 0.92rem;\n  display: grid;\n  gap: 0.62rem;\n}\n\n.${key}-checkout-grid h2 {\n  margin: 0;\n  font-family: var(--font-display);\n}\n\n.${key}-checkout-grid > section > div {\n  border-radius: 13px;\n  background: color-mix(in srgb, var(--surface) 72%, var(--surface-soft) 28%);\n  padding: 0.66rem;\n  display: flex;\n  justify-content: space-between;\n  gap: 0.5rem;\n}\n\n.${key}-checkout-grid form label {\n  display: grid;\n  gap: 0.3rem;\n  color: var(--text-muted);\n  font-size: 0.82rem;\n}\n\n.${key}-status {\n  margin: 0;\n  border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);\n  border-radius: 13px;\n  background: color-mix(in srgb, var(--accent) 12%, var(--surface));\n  color: color-mix(in srgb, var(--accent) 72%, #253144);\n  padding: 0.66rem;\n  font-size: 0.82rem;\n}\n\n@media (max-width: 980px) {\n  .${key}-sticky,\n  .${key}-detail-toolbar {\n    grid-template-columns: 1fr;\n    flex-direction: column;\n    align-items: flex-start;\n  }\n\n  .${key}-actions {\n    width: 100%;\n    flex-wrap: wrap;\n  }\n\n  .${key}-detail-grid,\n  .${key}-checkout-grid {\n    grid-template-columns: 1fr;\n  }\n}\n`;

  fs.writeFileSync(cssPath, `${cssSource}${cssBlock}`, 'utf8');
}

console.log(`Created theme layout: ${path.relative(root, layoutPath)}`);
console.log(`Registered theme key "${key}" in src/theme/views.ts and src/theme/themes.ts`);
console.log('Added premium starter CSS block in src/index.css');
console.log('Done.');
