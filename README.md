# Queek Storefront (Vite)

Standalone React + Vite storefront for Queek shops.

## What is implemented
- Product list, detail, and checkout flow
- Product contract aligned to backend `CUSTOMER_PRODUCT_OBJECT_V1.json`
- `shop_id` canonical ownership field
- Local cart persistence with `zustand` + `localStorage`
- Checkout submit integration:
  - primary: `POST /orders`
  - fallback: `POST /order/checkout`
- Theme renderer architecture (full layout swap per theme, not color-only):
  - `lagoon` (`Dawn Luxe`) — premium minimal baseline with Dawn-inspired product detail hierarchy
  - `savanna` (`Editorial Gallery`) — asymmetric storytelling storefront with editorial merchandising
  - `metro` (`Conversion Grid`) — dense, conversion-focused catalog for rapid add-to-cart flow

## Environment
Create `.env` in this folder:

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
VITE_DEFAULT_SHOP_ID=
VITE_DEFAULT_SHOP_SLUG=
```

Notes:
- If `VITE_API_BASE_URL` does not end with `/api/v1`, the app appends it automatically.
- For local host-based tenant routing, you can pass query params:
  - `?shop_id=<shop-uuid>`
  - `?shop_slug=<shop-slug>`
  - `?theme=lagoon|savanna|metro`

## Scripts
```bash
yarn dev
yarn lint
yarn build
yarn preview
yarn add-theme <theme-key> "Theme Name"
# optional (same repo):
npx add-theme <theme-key> "Theme Name"
```

## Routes
- `/` -> Product listing
- `/products/:idOrSlug` -> Product detail
- `/checkout?shop_id=<shop-id>` -> Checkout summary from local cart

## Theme Architecture
- `src/theme/layouts/*.tsx` defines view components for each theme
- `src/theme/views.ts` maps `themeKey` -> `{ ProductListView, ProductDetailView, CheckoutView }`
- page containers (`src/pages/*.tsx`) own data/query/state and delegate rendering to selected theme views
- cart derivation is centralized in `src/hooks/useShopCart.ts`

## Data contract notes
The UI expects backend product shape:
- `shop_id`
- `pricing.*`
- `shop.*`
- `media.*`
- `inventory.in_stock`
- `review_summary.review_count`

A compatibility normalizer is included for temporary fallback if older endpoints still return legacy fields.
