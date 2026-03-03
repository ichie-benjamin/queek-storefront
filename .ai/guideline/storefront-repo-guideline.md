# Queek Storefront Guideline

## Purpose
This document is the handoff baseline for extracting `queek-storefront` into its own repository.
It defines architecture, implementation expectations, and release quality gates.

## 1) Migration Status
The migration to Vite storefront is complete for core flow:
- product listing
- product detail
- cart (local storage)
- checkout submit
- theme system with full layout swap

Current themes:
- `lagoon` (Shop Classic baseline)
- `savanna` (editorial layout)
- `metro` (dense catalog layout)

## 2) Core Product Contract
Frontend model must follow backend canonical customer product object (`CUSTOMER_PRODUCT_OBJECT_V1`):
- ownership: `shop_id`
- pricing: `pricing.*`
- shop data: `shop.*`
- media: `media.*`
- inventory: `inventory.*`
- variants summary: `variants_count`
- ratings: `review_summary.*`
- flags: `flags.*`

Legacy payload compatibility is allowed only inside `src/lib/product-normalizer.ts`.

## 3) Data and Endpoint Policy
- Base URL from `VITE_API_BASE_URL`.
- List endpoint policy (current backend rollout):
  - prefer `GET /vendors/{shop_slug}/products`
  - fallback to `GET /products` only if needed
- Detail endpoint:
  - `GET /products/{id_or_slug}` first
- Shop profile:
  - `GET /vendors/{shop_slug}`
- Checkout submit:
  - primary `POST /orders`
  - fallback `POST /order/checkout`

## 4) Theme Architecture Policy
- Pages (`src/pages/*.tsx`) are state/data containers only.
- Theme layouts own rendering and UX structure.
- Every theme must implement:
  - `ProductListView`
  - `ProductDetailView`
  - `CheckoutView`
- Theme registration must happen in:
  - `src/theme/themes.ts`
  - `src/theme/views.ts`

### Theme quality bar
- A new theme must be a distinct layout system, not only palette changes.
- Keep mobile behavior intentional (no desktop-only assumptions).
- Keep typography and spacing consistent across list/detail/checkout in that theme.

## 5) Cart and Checkout Policy
- Cart remains local to storefront web via Zustand persistence.
- Use `useShopCart` hook for derived shop-scoped cart state.
- Do not duplicate cart-derivation logic in page/theme files.
- On successful checkout:
  - clear shop cart
  - reset form fields
  - show user-facing success message/reference

## 6) Security and Auth Policy (Web)
- Session/cookie auth direction for web storefront.
- API requests must use `credentials: include`.
- Do not store access/refresh tokens in local storage in this web repo.

## 7) Code Style Policy
- Strict TypeScript; avoid `any` unless unavoidable.
- Keep domain types in `src/types/*`.
- Keep services in `src/services/*`.
- Keep visual components in theme layout modules or clearly scoped shared components.
- Remove dead code during refactors.

## 8) Definition of Done
Every significant change must pass:
1. `yarn lint`
2. `yarn build`
3. Manual validation:
   - list route loads
   - detail route loads
   - add/remove cart works
   - checkout flow submits
   - all themes render correctly

## 9) Repo Extraction Checklist
Before moving to standalone repo:
1. keep `AGENTS.md` at repo root
2. keep `.ai/guideline/storefront-repo-guideline.md`
3. copy `.env.example` with required keys
4. ensure `README.md` documents theme architecture and routes
5. run lint/build once more in fresh clone
6. verify default dev port does not conflict with other local projects

