import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatMoney } from '../../../lib/format';
import type { Product, ProductAddon, ProductAddonItem } from '../../../types/product';
import { fetchProductByIdOrSlug } from '../../../services/products';
import { useCartStore, type CartAddon } from '../../../stores/cartStore';

interface ProductItemModalProps {
  product: Product;
  shopSlug: string | null;
  currency: string;
  onClose: () => void;
}

export const ProductItemModal = ({ product, currency, onClose }: ProductItemModalProps) => {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, CartAddon[]>>({});
  const addItemWithAddons = useCartStore((s) => s.addItemWithAddons);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['product-modal', product.slug || product.id],
    queryFn: () => fetchProductByIdOrSlug(product.slug || product.id),
    staleTime: 1000 * 60 * 5,
  });

  const displayProduct = detail ?? product;
  const addons: ProductAddon[] = displayProduct.addons ?? [];
  const img = displayProduct.media.image || displayProduct.media.thumbnail;

  const canAdd = addons
    .filter((a) => a.required)
    .every((addon) => {
      const sel = selectedAddons[addon.id];
      return sel && sel.length >= (addon.min || 1);
    });

  const addonTotal = Object.values(selectedAddons).flat().reduce((sum, a) => sum + a.price, 0);
  const total = (displayProduct.pricing.sale_amount + addonTotal) * qty;

  const handleSelectAddonItem = (addon: ProductAddon, item: ProductAddonItem) => {
    setSelectedAddons((prev) => {
      const current = prev[addon.id] ?? [];
      if (addon.multiple_selection) {
        const exists = current.some((a) => a.item_id === item.id);
        const next = exists
          ? current.filter((a) => a.item_id !== item.id)
          : [...current, { addon_id: addon.id, item_id: item.id, name: item.name, price: item.price }];
        return { ...prev, [addon.id]: next };
      }
      if (current.length === 1 && current[0].item_id === item.id) {
        const { [addon.id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addon.id]: [{ addon_id: addon.id, item_id: item.id, name: item.name, price: item.price }] };
    });
  };

  const handleAdd = () => {
    const flatAddons = Object.values(selectedAddons).flat();
    addItemWithAddons(displayProduct, qty, flatAddons);
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="qn-modal-overlay qn-item-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={product.title}
    >
      <div className="qn-item-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qn-modal__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>

        {img && (
          <div className="qn-item-modal__image">
            <img src={img} alt={displayProduct.title} />
          </div>
        )}

        <div className="qn-item-modal__body">
          <h2 className="qn-item-modal__title">{displayProduct.title}</h2>
          {(displayProduct.excerpt || displayProduct.description) && (
            <p className="qn-item-modal__desc">{displayProduct.excerpt || displayProduct.description}</p>
          )}
          <div className="qn-item-modal__price">
            <strong>{formatMoney(displayProduct.pricing.sale_amount, currency)}</strong>
            {displayProduct.pricing.compare_at_amount > displayProduct.pricing.sale_amount && (
              <del>{formatMoney(displayProduct.pricing.compare_at_amount, currency)}</del>
            )}
          </div>

          {isLoading && addons.length === 0 && (
            <p className="qn-item-modal__loading">Loading options…</p>
          )}

          {addons.map((addon) => (
            <div key={addon.id} className="qn-addon-group">
              <div className="qn-addon-group__head">
                <span className="qn-addon-group__title">{addon.title}</span>
                {addon.required && <span className="qn-addon-group__badge">Required</span>}
                {addon.max > 1 && <span className="qn-addon-group__hint">Choose up to {addon.max}</span>}
              </div>
              <div className="qn-addon-items">
                {addon.items.map((item) => {
                  const isSelected = (selectedAddons[addon.id] ?? []).some((a) => a.item_id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`qn-addon-item${isSelected ? ' qn-addon-item--selected' : ''}`}
                      onClick={() => handleSelectAddonItem(addon, item)}
                      disabled={!item.in_stock}
                    >
                      <span className="qn-addon-item__name">{item.display_name || item.name}</span>
                      {item.price > 0 && (
                        <span className="qn-addon-item__price">+{formatMoney(item.price, currency)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="qn-qty-stepper">
            <button
              type="button"
              className="qn-qty-stepper__btn"
              onClick={() => setQty((v) => Math.max(1, v - 1))}
              aria-label="Decrease quantity"
            >−</button>
            <span className="qn-qty-stepper__count">{qty}</span>
            <button
              type="button"
              className="qn-qty-stepper__btn"
              onClick={() => setQty((v) => Math.min(99, v + 1))}
              aria-label="Increase quantity"
            >+</button>
          </div>

          <button
            type="button"
            className="qn-modal-add-btn"
            onClick={handleAdd}
            disabled={!displayProduct.inventory.in_stock || !canAdd}
          >
            {displayProduct.inventory.in_stock
              ? `Add ${qty} · ${formatMoney(total, currency)}`
              : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductItemModal;
