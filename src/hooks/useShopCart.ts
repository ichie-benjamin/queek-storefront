import { useMemo } from 'react';
import { useCartStore } from '../stores/cartStore';

export const useShopCart = (shopId: string | null | undefined) => {
  const resolvedShopId = shopId ?? '';

  const allItems = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearShopCart = useCartStore((state) => state.clearShopCart);

  const items = useMemo(
    () => allItems.filter((entry) => entry.shop_id === resolvedShopId),
    [allItems, resolvedShopId],
  );

  const count = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => items.reduce((sum, entry) => sum + entry.unit_price * entry.quantity, 0),
    [items],
  );

  return {
    items,
    count,
    total,
    setQuantity,
    removeItem,
    clearShopCart,
  };
};
