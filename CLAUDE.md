# CLAUDE.md — Queek Storefront

Primary reference for Claude Code and all AI-assisted work in this repo.

ALWAYS USE THE dev-guideline skill

---

## Project Overview

**Queek Storefront** is a Vite + React 19 + TypeScript multi-tenant storefront engine.
Goal: installable themes in the style of `npx queek add nova`.
Design benchmark: jazzysburger.com — light, clean, premium, modern.

Related codebases:
- Main shop (Next.js): `/Users/benny/Documents/nextjs/queek-shop`
- Backend API docs: `/Users/benny/Documents/laravel/queek_backend/.ai/v1/endpoints/customer/CUSTOMER.md`

---

## Stack

| Tool | Notes |
|------|-------|
| React 19 + Vite 8 (beta, SWC) | |
| TypeScript 5.9 strict | |
| React Router v7 | `useSearchParams`, `Link` |
| TanStack Query v5 | `useQuery`, `staleTime` caching |
| Zustand v5 | `persist` middleware for cart |
| Raw CSS | No framework — scoped by theme class |

**Package manager:** yarn. **Build gate:** `yarn build` (tsc -b && vite build) must pass with zero TS errors.

---

## Project Structure

```
src/
├── App.tsx                      # Root — picks theme, declares routes
├── index.css                    # All CSS — global + per-theme blocks
├── types/
│   ├── product.ts               # Product, ProductSection, CartAddon, etc.
│   └── shop.ts                  # ShopProfile
├── lib/
│   ├── api.ts                   # apiGet() — base fetch wrapper
│   ├── format.ts                # formatMoney(), toPercent()
│   └── product-normalizer.ts    # normalizeProduct() — maps legacy API → Product
├── services/
│   ├── products.ts              # fetchVendorProductSections, fetchProductByIdOrSlug, fetchProductReviews
│   ├── shop.ts                  # fetchShopProfile
│   └── collections.ts           # fetchVendorCollections, fetchVendorPromotions (kept, not used in list view)
├── stores/
│   ├── cartStore.ts             # CartItem, CartAddon, addItemWithAddons
│   └── themeStore.ts
├── hooks/
│   └── useShopCart.ts
├── components/
│   └── CartPanel.tsx
├── pages/
│   ├── ProductListPage.tsx      # Route /
│   ├── ProductDetailPage.tsx    # Route /products/:idOrSlug
│   ├── CategoryPage.tsx         # Route /category/:categoryId
│   └── CheckoutPage.tsx         # Route /checkout
└── theme/
    ├── view-types.ts            # ProductListViewProps, ProductDetailViewProps, CheckoutViewProps
    ├── views.ts                 # themeViewMap registry
    ├── themes.ts                # Theme metadata
    └── layouts/
        ├── nova/                # Nova theme (only active theme)
        │   ├── index.ts         # Barrel: exports 3 views + NovaCard + ProductItemModal
        │   ├── helpers.ts       # shopLabel, ratingStr, reviewLabel, relativeDate, address storage
        │   ├── NovaListView.tsx
        │   ├── NovaDetailView.tsx
        │   ├── NovaCheckoutView.tsx
        │   ├── NovaCard.tsx
        │   ├── NovaHero.tsx
        │   ├── NovaNav.tsx
        │   ├── ProductItemModal.tsx
        │   ├── FloatingSearch.tsx   # FloatingSearch + FloatingSearchFab
        │   ├── AddressModal.tsx
        │   └── VendorInfoModal.tsx
        └── useProductDetailState.ts
```

---

## Routing

| Route | Page |
|-------|------|
| `/` | `ProductListPage` — sectioned catalogue |
| `/products/:idOrSlug` | `ProductDetailPage` — detail + variants + addons |
| `/category/:categoryId` | `CategoryPage` — single-section grid |
| `/checkout` | `CheckoutPage` |

`shopSlug` resolved from `VITE_DEFAULT_SHOP_SLUG` env or `?shop=` URL param.

---

## Theme System

- Each theme exports exactly **3 views**: `ProductListView`, `ProductDetailView`, `CheckoutView`
- Theme CSS class (`theme-nova`) applied to `.app-root` in `App.tsx`
- All theme CSS scoped under `.theme-nova { ... }` in `src/index.css`
- Registered in `src/theme/views.ts` (views) and `src/theme/themes.ts` (metadata)

**Adding a new theme:**
1. Create `src/theme/layouts/<name>/` — export the 3 view components + `index.ts` barrel
2. Register in `views.ts` and `themes.ts`
3. Add `.theme-<name>` CSS block in `index.css`

**Active theme:** `nova` only.

---

## Nova Theme — Design System

### CSS prefix: `qn-` (Queek Nova)

### Colour tokens (`.theme-nova`)

```css
--qn-bg: #ffffff
--qn-surface: #f5f5f5           /* card / panel background */
--qn-surface-raised: #ebebeb
--qn-text: #1a1917
--qn-text-muted: #716e68
--qn-text-light: #a09d97
--qn-accent: #e8441a            /* primary CTA */
--qn-accent-hover: #d43a14
--qn-accent-light: #fff2ee
--qn-border: #e2e0db
--qn-radius: 16px
--qn-nav-height: 68px
```

### Typography
- Price/headings: `Bricolage Grotesque` 700/800 (Google Fonts)
- Body/labels: System UI stack

### NovaListView layout

1. `NovaNav` — sticky top nav: logo, delivery address, cart
2. `NovaHero` — full-bleed banner
3. Category pill strip — sticky; toggles `?category=<id>`; active pill shows ×
4. Catalogue sections (`qn-sections`) — one `qn-section` per API section; `?q=` for search
5. `NovaCard` grid — 2→3→4→5 columns at breakpoints
6. `ProductItemModal` — slide-up sheet; fetches full product for addons
7. Footer + `FloatingSearchFab` + back-to-top

### NovaCard
- 4:3 image (zoom on hover), heart button (top-right, always visible), "+" button (bottom-right, hover only)
- Body: title (600) → rating row (when `review_count > 0`) → price (Bricolage 700, accent)
- Click anywhere → `ProductItemModal`
- Background `#f5f5f5`, border `1px solid rgba(0,0,0,0.06)`

### ProductItemModal
- Fetches full product via `fetchProductByIdOrSlug` for addon groups
- Image: `media.image || media.thumbnail`
- Required addon groups gate the "Add" CTA
- Calls `addItemWithAddons(product, qty, flatAddons)`

### URL-driven filtering
```
?category=<id>   filter to one section
?q=<term>        client-side search: title, excerpt, categories
```
Both coexist. "Clear filters" → `setSearchParams({})`.

---

## Data Flow

```
ProductListPage  → fetchVendorProductSections(slug) → ProductSection[] → NovaListView
CategoryPage     → fetchVendorProductSections(slug) → filter by categoryId → NovaCard grid
ProductDetailPage → fetchProductByIdOrSlug → fetchProductReviews → NovaDetailView
```

---

## API

Base: `VITE_API_BASE_URL` → `/api/v1` · Auth: `credentials: 'include'`

| Endpoint | Purpose |
|----------|---------|
| `GET /vendors/{slug}` | Shop profile |
| `GET /vendors/{slug}/products` | Sectioned product list |
| `GET /products/{idOrSlug}` | Product detail + addons |
| `GET /products/{slug}/reviews` | Reviews |
| `POST /orders` | Checkout (primary) |
| `POST /order/checkout` | Checkout (fallback) |

---

## Cart Store

```ts
CartAddon { addon_id, item_id, name, price }
CartItem  { id, product_id, shop_id, title, image, unit_price, quantity, addons }
```

- `id` = `productId` (no addons) or `productId-sortedAddonItemIds` (with addons)
- Same product + different addons = separate cart entries
- `addItemWithAddons(product, qty, addons[])` — primary method
- `addProduct(product, qty)` — delegates with `[]`
- Persisted via Zustand `persist` to `localStorage`

---

## Domain Model Rules

- Canonical fields only: `shop_id`, `pricing`, `media`, `inventory`, `review_summary`, `flags`
- **Never** use legacy names in UI: `price`, `discount_price`, `vendor_id`, `stock`
- `pricing.sale_amount` = display price; `pricing.compare_at_amount` = original (strikethrough)
- `media.image` preferred over `media.thumbnail` for full-size display

---

## Code Rules

- No CSS framework — raw CSS only, `.theme-nova` scoped
- No over-engineering: no abstractions, helpers, or error handling beyond current requirements
- No docstrings or comments on code you didn't change
- Prefer editing existing files over creating new ones
- Page components stay thin and data-driven; visual logic belongs in theme layout files
- Delete dead code — don't comment it out
- `yarn build` must pass with zero TypeScript errors after every change

---

## Commands

```bash
yarn dev                              # dev server
yarn dev --host 0.0.0.0 --port 5180  # exposed on LAN
yarn build                            # CI gate
yarn lint
yarn preview
```

## Environment (`.env`)

```
VITE_API_BASE_URL=http://queek_backend.test/api/v1
VITE_DEFAULT_SHOP_ID=
VITE_DEFAULT_SHOP_SLUG=
```

---

## Pre-merge Checklist

- [ ] `yarn build` passes (zero TS errors)
- [ ] `yarn lint` passes
- [ ] `/` loads product sections for a known shop slug
- [ ] Card click opens `ProductItemModal`; addons render
- [ ] Add to cart → cart count increments
- [ ] Checkout submit executes
- [ ] No legacy field names introduced
