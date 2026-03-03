import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../types/product';

export interface CartAddon {
  addon_id: string;
  item_id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  shop_id: string;
  title: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  addons: CartAddon[];
}

interface CartState {
  items: CartItem[];
  addProduct: (product: Product, quantity?: number) => void;
  addItemWithAddons: (product: Product, quantity: number, addons: CartAddon[]) => void;
  removeItem: (id: string, shopId: string) => void;
  setQuantity: (id: string, shopId: string, quantity: number) => void;
  clearShopCart: (shopId: string) => void;
  getShopItems: (shopId: string) => CartItem[];
  getShopCount: (shopId: string) => number;
  getShopTotal: (shopId: string) => number;
}

const makeItemId = (productId: string, addons: CartAddon[]): string => {
  if (addons.length === 0) return productId;
  const key = addons
    .map((a) => a.item_id)
    .sort()
    .join(',');
  return `${productId}-${key}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItemWithAddons: (product, quantity = 1, addons = []) => {
        const safeQty = Math.max(1, quantity);
        const itemId = makeItemId(product.id, addons);
        const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
        const unitPrice = product.pricing.sale_amount + addonTotal;

        set((state) => {
          const index = state.items.findIndex(
            (entry) => entry.id === itemId && entry.shop_id === product.shop_id,
          );

          if (index >= 0) {
            const next = [...state.items];
            next[index] = { ...next[index], quantity: next[index].quantity + safeQty, unit_price: unitPrice };
            return { items: next };
          }

          const newItem: CartItem = {
            id: itemId,
            product_id: product.id,
            shop_id: product.shop_id,
            title: product.title,
            image: product.media.thumbnail || product.media.image || null,
            unit_price: unitPrice,
            quantity: safeQty,
            addons,
          };
          return { items: [...state.items, newItem] };
        });
      },

      addProduct: (product, quantity = 1) => {
        get().addItemWithAddons(product, quantity, []);
      },

      removeItem: (id, shopId) => {
        set((state) => ({
          items: state.items.filter((entry) => !(entry.id === id && entry.shop_id === shopId)),
        }));
      },

      setQuantity: (id, shopId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, shopId);
          return;
        }

        set((state) => ({
          items: state.items.map((entry) => {
            if (entry.id === id && entry.shop_id === shopId) {
              return { ...entry, quantity };
            }
            return entry;
          }),
        }));
      },

      clearShopCart: (shopId) => {
        set((state) => ({ items: state.items.filter((entry) => entry.shop_id !== shopId) }));
      },

      getShopItems: (shopId) => get().items.filter((entry) => entry.shop_id === shopId),

      getShopCount: (shopId) =>
        get()
          .items.filter((entry) => entry.shop_id === shopId)
          .reduce((sum, entry) => sum + entry.quantity, 0),

      getShopTotal: (shopId) =>
        get()
          .items.filter((entry) => entry.shop_id === shopId)
          .reduce((sum, entry) => sum + entry.unit_price * entry.quantity, 0),
    }),
    {
      name: 'queek-storefront-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
