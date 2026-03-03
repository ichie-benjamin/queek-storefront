import { type FormEvent, useEffect, useState } from 'react';
import { formatMoney } from '../lib/format';
import { ApiError, apiPost } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useShopCart } from '../hooks/useShopCart';
import { useAuthModal } from '../stores/authModalStore';
import { useUserStore } from '../stores/userStore';
import { useLocationStore } from '../stores/locationStore';
import { fetchVendorConfig, type VendorConfig, type DeliveryScheduleDay, type DeliverySlot } from '../services/shop';
import AddressModal from '../theme/layouts/nova/AddressModal';

interface SelectedSlot extends DeliverySlot {
  date: string;
}

const formatTimeRange = (minIso?: string, maxIso?: string): string => {
  if (!minIso || !maxIso) return '';
  try {
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(new Date(minIso))} – ${fmt(new Date(maxIso))}`;
  } catch { return ''; }
};

const supportsOrderTypes = (mode: string) =>
  mode === 'delivery' || mode === 'pickup_delivery' || mode === 'self_service';

// ── Schedule Modal ────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  days: DeliveryScheduleDay[];
  selectedSlot: SelectedSlot | null;
  onSelect: (slot: SelectedSlot) => void;
  onClose: () => void;
}

const ScheduleModal = ({ days, selectedSlot, onSelect, onClose }: ScheduleModalProps) => {
  const firstDay = days.find((d) => d.slots.some((s) => s.available))?.date ?? null;
  const [activeDayDate, setActiveDayDate] = useState<string | null>(selectedSlot?.date ?? firstDay);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const activeDay = days.find((d) => d.date === activeDayDate);
  const slots = activeDay?.slots.filter((s) => s.available) ?? [];

  return (
    <div className="qn-modal-overlay qn-schedule-overlay" onClick={onClose} role="dialog" aria-modal aria-label="Choose delivery time">
      <div className="qn-schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qn-schedule-modal__head">
          <h2 className="qn-schedule-modal__title">Choose delivery time</h2>
          <button type="button" className="qn-schedule-modal__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="qn-schedule-modal__dates">
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`qn-schedule-modal__date${activeDayDate === day.date ? ' is-active' : ''}`}
              onClick={() => setActiveDayDate(day.date)}
            >
              <span className="qn-schedule-modal__date-day">{day.day_name.slice(0, 3)}</span>
              <span className="qn-schedule-modal__date-num">{day.formatted_date}</span>
            </button>
          ))}
        </div>

        {slots.length === 0 ? (
          <p className="qn-schedule-modal__empty">No slots available for this day.</p>
        ) : (
          <div className="qn-schedule-modal__slots">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`qn-schedule-modal__slot${selectedSlot?.id === slot.id && selectedSlot?.date === activeDayDate ? ' is-active' : ''}`}
                onClick={() => { onSelect({ ...slot, date: activeDayDate! }); onClose(); }}
              >
                {formatTimeRange(slot.min_time, slot.max_time)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── CartPanel ─────────────────────────────────────────────────────────────────

interface CartPanelProps {
  shopId: string;
  currency: string;
  open: boolean;
  onClose: () => void;
}

interface CheckoutFee {
  id: string;
  title: string;
  value: number;
  cap: number;
  info: boolean;
}

interface DeliveryMessage {
  type: string;
  message: string;
}

type PanelView = 'cart' | 'checkout' | 'success';

export const CartPanel = ({ shopId, currency, open, onClose }: CartPanelProps) => {
  const { items, total, setQuantity, removeItem, clearShopCart } = useShopCart(shopId);
  const openAuthModal = useAuthModal((s) => s.open);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);
  const location = useLocationStore();

  const [config, setConfig] = useState<VendorConfig | null>(null);

  const allowedPaymentMethods = config?.checkout_config.payment_methods ?? ['bank_transfer', 'online'];
  const deliveryModes = config?.delivery_modes ?? [
    { id: 'pickup', value: 'Pickup', message: '', requires_delivery_address: false },
    { id: 'delivery', value: 'Delivery', message: '', requires_delivery_address: true },
  ];
  const minOrderAmount = config ? Number(config.checkout_config.min_order_amount) : 0;
  const notesEnabled = config ? config.checkout_config.enable_notes : true;

  const [view, setView] = useState<PanelView>('cart');
  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [orderType, setOrderType] = useState<'instant' | 'schedule'>('instant');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [vendorNote, setVendorNote] = useState('');
  const [addressOpen, setAddressOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [fees, setFees] = useState<CheckoutFee[]>([]);
  const [deliveryMessage, setDeliveryMessage] = useState<DeliveryMessage | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Derived
  const requiresAddress = deliveryModes.find((m) => m.id === deliveryMode)?.requires_delivery_address ?? deliveryMode === 'delivery';
  const showOrderTypes = supportsOrderTypes(deliveryMode) && (config?.order_types?.length ?? 0) > 0;
  const instantOrderType = config?.order_types?.find((ot) => ot.id === 'instant');
  const scheduledOrderType = config?.order_types?.find((ot) => ot.id === 'schedule');
  const availableDays = scheduledOrderType?.delivery_schedule?.filter(
    (d) => d.available && d.slots.some((s) => s.available),
  ) ?? [];

  const gatewayFee = fees.find((f) => f.id === 'payment_gateway_fee');
  const displayFees = fees.filter((f) => f.id !== 'payment_gateway_fee');
  const gatewayFeeValue = gatewayFee?.value ?? 0;
  const gatewayPercent = total > 0 && gatewayFee ? Math.round((gatewayFee.value / total) * 1000) / 10 : 0;
  const feesTotal = displayFees.reduce((s, f) => s + f.value, 0);
  const grandTotal = total + feesTotal + gatewayFeeValue;

  const isPlaceOrderDisabled =
    isSubmitting ||
    (showOrderTypes && orderType === 'schedule' && !selectedSlot) ||
    (showOrderTypes && orderType === 'instant' && !!instantOrderType && !instantOrderType.available);

  // Load config
  useEffect(() => {
    fetchVendorConfig().then((cfg) => {
      if (!cfg) return;
      setConfig(cfg);
      // Snap delivery mode
      const modes = cfg.delivery_modes;
      if (modes.length > 0 && !modes.find((m) => m.id === deliveryMode)) {
        setDeliveryMode(modes[0].id);
      }
      // Snap payment method
      const methods = cfg.checkout_config.payment_methods;
      if (methods.length > 0 && !methods.includes(paymentMethod)) {
        setPaymentMethod(methods[0]);
      }
      // Auto-switch to schedule if instant is unavailable
      const instant = cfg.order_types?.find((ot) => ot.id === 'instant');
      if (instant && !instant.available) {
        setOrderType('schedule');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate fees
  useEffect(() => {
    if (view !== 'checkout' || total <= 0) return;
    let cancelled = false;
    setIsLoadingFees(true);
    setFees([]);
    setDeliveryMessage(null);
    const payload: Record<string, unknown> = { delivery_mode: deliveryMode, total_value: total, payment_method: paymentMethod };
    if (requiresAddress) { payload.map_lat = location.latitude; payload.map_lng = location.longitude; }
    apiPost<{ data: { fees: CheckoutFee[]; delivery_message?: DeliveryMessage } }>(ENDPOINTS.store.checkoutFees, payload)
      .then((res) => {
        if (cancelled) return;
        setFees(res.data?.fees ?? []);
        const dm = res.data?.delivery_message;
        setDeliveryMessage(dm && !Array.isArray(dm) && dm.message ? dm : null);
      })
      .catch(() => { if (!cancelled) setFees([]); })
      .finally(() => { if (!cancelled) setIsLoadingFees(false); });
    return () => { cancelled = true; };
  }, [deliveryMode, paymentMethod, view, shopId, total, location.latitude, location.longitude]);

  const handleClose = () => {
    if (view === 'success') { setView('cart'); setOrderRef(null); setPaymentLink(null); }
    onClose();
  };

  const goToCheckout = () => { setSubmitError(null); setFees([]); setDeliveryMessage(null); setView('checkout'); };

  const handleCheckoutClick = () => {
    if (!isAuthenticated) { openAuthModal(goToCheckout); return; }
    goToCheckout();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (requiresAddress && !location.address) { setSubmitError('Please set a delivery address first.'); return; }
    if (showOrderTypes && orderType === 'schedule' && !selectedSlot) { setSubmitError('Please select a delivery time slot.'); return; }
    setSubmitError(null);
    setIsSubmitting(true);

    const cartItems = items.map((item) => ({
      id: item.product_id,
      item_id: item.product_id,
      title: item.title,
      price: item.unit_price,
      quantity: item.quantity,
      selectedAddons: item.addons.map((a) => ({ id: a.item_id, name: a.name, price: a.price })),
    }));

    const payload: Record<string, unknown> = {
      delivery_mode: deliveryMode,
      payment_method: paymentMethod,
      cart_items: cartItems,
      ...(vendorNote.trim() && { vendor_note: vendorNote.trim() }),
      ...(user?.phone && { customer_phone: user.phone }),
    };
    if (requiresAddress) { payload.delivery_address = location.address; payload.map_lat = location.latitude; payload.map_lng = location.longitude; }
    if (showOrderTypes) {
      payload.order_type = orderType;
      if (orderType === 'schedule' && selectedSlot) {
        payload.schedule_date = selectedSlot.date;
        payload.schedule_time = selectedSlot.time ?? selectedSlot.min_time;
      }
    }

    try {
      const res = await apiPost<{ data: { order: { id: string; order_no: string }; payment_link?: string } }>(ENDPOINTS.store.checkout, payload);
      clearShopCart(shopId);
      setOrderRef(res.data?.order?.order_no || res.data?.order?.id || null);
      setPaymentLink(res.data?.payment_link ?? null);
      setView('success');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        openAuthModal(goToCheckout);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`qn-cart-backdrop${open ? ' qn-cart-backdrop--open' : ''}`} onClick={handleClose} aria-hidden />
      <aside className={`qn-cart${open ? ' qn-cart--open' : ''}`} aria-hidden={!open}>

        {/* Header */}
        <div className="qn-cart__head">
          <div className="qn-cart__head-left">
            {view === 'checkout' && (
              <button type="button" className="qn-cart__back" onClick={() => { setSubmitError(null); setView('cart'); }} aria-label="Back">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="qn-cart__title">
                {view === 'cart' && 'Your order'}
                {view === 'checkout' && 'Checkout'}
                {view === 'success' && 'Order placed'}
              </h2>
              {view === 'cart' && items.length > 0 && (
                <p className="qn-cart__subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <button type="button" className="qn-cart__close" onClick={handleClose} aria-label="Close cart">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Cart view ── */}
        {view === 'cart' && (
          <>
            {items.length === 0 ? (
              <div className="qn-cart__empty">
                <div className="qn-cart__empty-bag">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M16 20V14a8 8 0 0116 0v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <rect x="8" y="20" width="32" height="22" rx="6" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                </div>
                <p className="qn-cart__empty-title">Nothing here yet</p>
                <p className="qn-cart__empty-sub">Add items to start your order</p>
              </div>
            ) : (
              <>
                <ul className="qn-cart__items">
                  {items.map((item) => (
                    <li key={`${item.shop_id}-${item.id}`} className="qn-cart__item">
                      <div className="qn-cart__item-info">
                        <p className="qn-cart__item-name">{item.title}</p>
                        {item.addons.length > 0 && (
                          <p className="qn-cart__item-addons">{item.addons.map((a) => a.name).join(', ')}</p>
                        )}
                        <p className="qn-cart__item-price">{formatMoney(item.unit_price * item.quantity, currency)}</p>
                      </div>
                      <div className="qn-cart__item-controls">
                        <button type="button" className="qn-cart__qty-btn" onClick={() => setQuantity(item.id, item.shop_id, item.quantity - 1)} aria-label="Decrease">
                          <svg viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        </button>
                        <span className="qn-cart__qty">{item.quantity}</span>
                        <button type="button" className="qn-cart__qty-btn" onClick={() => setQuantity(item.id, item.shop_id, item.quantity + 1)} aria-label="Increase">
                          <svg viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        </button>
                        <button type="button" className="qn-cart__remove" onClick={() => removeItem(item.id, item.shop_id)} aria-label="Remove">
                          <svg viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="qn-cart__foot">
                  <div className="qn-cart__total-row">
                    <span>Subtotal</span>
                    <strong>{formatMoney(total, currency)}</strong>
                  </div>
                  {minOrderAmount > 0 && total < minOrderAmount && (
                    <p className="qn-cart__min-warning">Minimum order is {formatMoney(minOrderAmount, currency)}</p>
                  )}
                  <button
                    type="button"
                    className="qn-cart__checkout-btn"
                    onClick={handleCheckoutClick}
                    disabled={minOrderAmount > 0 && total < minOrderAmount}
                  >
                    Checkout
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="qn-cart__clear-btn" onClick={() => clearShopCart(shopId)}>
                    Clear order
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Checkout view ── */}
        {view === 'checkout' && (
          <form className="qn-cart__checkout" onSubmit={handleSubmit}>

            {/* Compact order summary */}
            <div className="qn-cart__checkout-summary">
              {items.map((item) => (
                <div key={item.id} className="qn-cart__checkout-item">
                  <span className="qn-cart__checkout-item-name">
                    {item.title}
                    {item.quantity > 1 && <em> ×{item.quantity}</em>}
                    {item.addons.length > 0 && <small>{item.addons.map((a) => a.name).join(', ')}</small>}
                  </span>
                  <span>{formatMoney(item.unit_price * item.quantity, currency)}</span>
                </div>
              ))}
            </div>

            {/* Delivery mode */}
            <div className="qn-cart__section">
              <p className="qn-cart__section-label">Delivery</p>
              <div className="qn-cart__toggle-group">
                {deliveryModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`qn-cart__toggle-btn${deliveryMode === mode.id ? ' is-active' : ''}`}
                    onClick={() => setDeliveryMode(mode.id)}
                  >
                    {mode.id === 'pickup' ? (
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M8 2a4 4 0 100 8A4 4 0 008 2zM2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M2 10h10M10 7l3 3-3 3M8 4H4a2 2 0 00-2 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {mode.value}
                  </button>
                ))}
              </div>
              {deliveryModes.find((m) => m.id === deliveryMode)?.message && (
                <p className="qn-cart__payment-hint">{deliveryModes.find((m) => m.id === deliveryMode)!.message}</p>
              )}
              {requiresAddress && (
                <button type="button" className="qn-cart__address-row" onClick={() => setAddressOpen(true)}>
                  <svg viewBox="0 0 16 16" fill="none" className="qn-cart__address-pin">
                    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span className="qn-cart__address-text">{location.address || 'Set delivery address'}</span>
                  <svg viewBox="0 0 16 16" fill="none" className="qn-cart__address-edit">
                    <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              {requiresAddress && deliveryMessage && (
                <div className={`qn-cart__delivery-msg qn-cart__delivery-msg--${deliveryMessage.type}`}>
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  {deliveryMessage.message}
                </div>
              )}
            </div>

            {/* When — order type */}
            {showOrderTypes && (
              <div className="qn-cart__section">
                <p className="qn-cart__section-label">When</p>
                <div className="qn-cart__toggle-group">
                  {instantOrderType && (
                    <button
                      type="button"
                      className={`qn-cart__toggle-btn${orderType === 'instant' ? ' is-active' : ''}`}
                      onClick={() => { if (instantOrderType.available) setOrderType('instant'); }}
                      disabled={!instantOrderType.available}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {instantOrderType.value}
                    </button>
                  )}
                  {scheduledOrderType && (
                    <button
                      type="button"
                      className={`qn-cart__toggle-btn${orderType === 'schedule' ? ' is-active' : ''}`}
                      onClick={() => setOrderType('schedule')}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M5 1.5v3M11 1.5v3M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      {scheduledOrderType.value}
                    </button>
                  )}
                </div>

                {/* Instant unavailability */}
                {instantOrderType && !instantOrderType.available && instantOrderType.unavailable_message && (
                  <div className={`qn-cart__delivery-msg qn-cart__delivery-msg--${instantOrderType.unavailable_message.type}`}>
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {instantOrderType.unavailable_message.message}
                  </div>
                )}

                {/* Instant: ready time */}
                {orderType === 'instant' && config?.ready_time?.value && (
                  <p className="qn-cart__payment-hint">Estimated ready: {config.ready_time.value}</p>
                )}

                {/* Schedule: slot picker row */}
                {orderType === 'schedule' && (
                  <button
                    type="button"
                    className={`qn-cart__slot-row${!selectedSlot ? ' qn-cart__slot-row--empty' : ''}`}
                    onClick={() => setScheduleOpen(true)}
                  >
                    <svg viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5 1.5v3M11 1.5v3M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span>
                      {selectedSlot
                        ? `${availableDays.find((d) => d.date === selectedSlot.date)?.day_name} · ${formatTimeRange(selectedSlot.min_time, selectedSlot.max_time)}`
                        : 'Choose a delivery time'}
                    </span>
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Note */}
            {notesEnabled && (
              <div className="qn-cart__section">
                <p className="qn-cart__section-label">Note <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span></p>
                <div className="qn-cart__field">
                  <textarea
                    id="cp-note"
                    value={vendorNote}
                    onChange={(e) => setVendorNote(e.target.value)}
                    placeholder="Any special instructions for the vendor?"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Payment method */}
            {allowedPaymentMethods.length > 0 && (
              <div className="qn-cart__section">
                <p className="qn-cart__section-label">Payment</p>
                <div className="qn-cart__toggle-group">
                  {allowedPaymentMethods.includes('bank_transfer') && (
                    <button
                      type="button"
                      className={`qn-cart__toggle-btn${paymentMethod === 'bank_transfer' ? ' is-active' : ''}`}
                      onClick={() => setPaymentMethod('bank_transfer')}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                      Bank Transfer
                    </button>
                  )}
                  {allowedPaymentMethods.includes('online') && (
                    <button
                      type="button"
                      className={`qn-cart__toggle-btn${paymentMethod === 'online' ? ' is-active' : ''}`}
                      onClick={() => setPaymentMethod('online')}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M8 2l2 4h4l-3 3 1 4-4-2.5L4 13l1-4L2 6h4L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                      Pay Online
                    </button>
                  )}
                </div>
                {paymentMethod === 'bank_transfer' && (
                  <p className="qn-cart__payment-hint">Order is placed, then you transfer payment to the vendor's account.</p>
                )}
                {paymentMethod === 'online' && (
                  <p className="qn-cart__payment-hint">You'll be redirected to complete payment securely.</p>
                )}
              </div>
            )}

            {/* Fees */}
            <div className="qn-cart__fees">
              <div className="qn-cart__fee-row qn-cart__fee-row--sub">
                <span>Subtotal</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
              {isLoadingFees ? (
                <div className="qn-cart__fee-loading">
                  <span className="qn-cart__fee-spinner" />
                  Calculating fees…
                </div>
              ) : displayFees.map((fee) => (
                <div key={fee.id} className="qn-cart__fee-row">
                  <span>{fee.title}</span>
                  <span>{formatMoney(fee.value, currency)}</span>
                </div>
              ))}
              <div className="qn-cart__fee-row qn-cart__fee-row--total">
                <div>
                  <strong>Total</strong>
                  {gatewayFeeValue > 0 && (
                    <span className="qn-cart__fee-note">incl. {gatewayPercent}% payment fee</span>
                  )}
                </div>
                <strong>{formatMoney(grandTotal, currency)}</strong>
              </div>
            </div>

            {submitError && <p className="qn-cart__error">{submitError}</p>}

            {/* Place order */}
            <div className="qn-cart__place-wrap">
              <button type="submit" className="qn-cart__place-btn" disabled={isPlaceOrderDisabled}>
                {isSubmitting ? (
                  <span className="qn-cart__place-spinner" />
                ) : (
                  <>
                    <span>Place order</span>
                    <span className="qn-cart__place-total">{formatMoney(grandTotal, currency)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Success view ── */}
        {view === 'success' && (
          <div className="qn-cart__success">
            <div className="qn-cart__success-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
                <path d="M14 24l7 7 13-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="qn-cart__success-title">Order placed!</h3>
            {orderRef && <p className="qn-cart__success-ref">Ref: <strong>{orderRef}</strong></p>}
            {paymentLink ? (
              <>
                <p className="qn-cart__success-sub">Complete your payment to confirm the order.</p>
                <a href={paymentLink} target="_blank" rel="noreferrer" className="qn-cart__checkout-btn qn-cart__checkout-btn--link">
                  Complete payment →
                </a>
              </>
            ) : (
              <p className="qn-cart__success-sub">
                {paymentMethod === 'bank_transfer'
                  ? "Transfer payment to the vendor's account. Your order is pending confirmation."
                  : "We've received your order and notified the vendor."}
              </p>
            )}
            <button type="button" className="qn-cart__clear-btn" onClick={handleClose}>
              Continue shopping
            </button>
          </div>
        )}

      </aside>

      {addressOpen && (
        <AddressModal current={location.address} onSave={() => {}} onClose={() => setAddressOpen(false)} />
      )}

      {scheduleOpen && availableDays.length > 0 && (
        <ScheduleModal
          days={availableDays}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
          onClose={() => setScheduleOpen(false)}
        />
      )}
    </>
  );
};
