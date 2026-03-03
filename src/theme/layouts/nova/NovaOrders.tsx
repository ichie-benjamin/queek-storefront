import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders, fetchOrderDetail, type OrderListItem, type OrderDetail } from '../../../services/orders';
import { formatMoney } from '../../../lib/format';
import { relativeDate } from './helpers';

/* ── Helpers ── */

export const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'delivered' || s === 'completed') return 'qn-status-badge qn-status-badge--green';
  if (s === 'cancelled' || s === 'failed' || s === 'rejected') return 'qn-status-badge qn-status-badge--red';
  if (s === 'pending') return 'qn-status-badge qn-status-badge--yellow';
  return 'qn-status-badge qn-status-badge--blue';
};

const orderTotal = (order: { grand_total?: number | string; total_price: number | string }) =>
  order.grand_total ?? order.total_price;

const fmtAmount = (amount: number | string, currency: string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(n) ? String(amount) : formatMoney(n, currency);
};

/* ── Icons ── */

export const OrdersIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const LogoutIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M13 10H3m10 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5H5a2 2 0 00-2 2v6a2 2 0 002 2h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
    <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ── Order Detail Panel ── */

interface OrderDetailPanelProps {
  orderId: string;
  currency: string;
  onBack: () => void;
}

const OrderDetailPanel = ({ orderId, currency, onBack }: OrderDetailPanelProps) => {
  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ['order-detail', orderId],
    queryFn: () => fetchOrderDetail(orderId),
    staleTime: 30_000,
  });

  const summaryRows = order?.amount_summary?.items ?? [];
  const showSummary = summaryRows.length > 0;

  return (
    <div className="qn-order-detail">
      <button type="button" className="qn-order-detail__back" onClick={onBack}>
        <BackIcon />
        <span>Order Details</span>
      </button>

      {isLoading && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="qn-skeleton qn-skeleton--line" style={{ width: '55%', height: '18px' }} />
          <div className="qn-skeleton qn-skeleton--line" style={{ width: '35%', height: '14px' }} />
        </div>
      )}

      {order && (
        <>
          <div className="qn-order-detail__header">
            <div className="qn-order-detail__no">#{order.order_no}</div>
            <span className={statusClass(order.status_label ?? order.status)}>
              {order.status_label ?? order.status}
            </span>
          </div>

          {order.timeline && order.timeline.length > 0 && (
            <div className="qn-order-timeline">
              {order.timeline.map((step, i) => (
                <div key={i} className={`qn-timeline-step${step.time ? ' is-done' : ''}`}>
                  <div className="qn-timeline-step__dot" />
                  <div className="qn-timeline-step__info">
                    <span className="qn-timeline-step__label">{step.title}</span>
                    {step.description && (
                      <span className="qn-timeline-step__desc">{step.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="qn-order-detail__items">
            {order.items.map((item) => (
              <div key={item.id} className="qn-order-detail__item">
                <div className="qn-order-detail__item-row">
                  <span className="qn-order-detail__item-qty">{item.quantity}×</span>
                  <span className="qn-order-detail__item-title">{item.title}</span>
                  <span className="qn-order-detail__item-price">{fmtAmount(item.total_price, currency)}</span>
                </div>
                {item.addons.length > 0 && (
                  <div className="qn-order-detail__addons">
                    {item.addons.map((a, ai) => (
                      <span key={ai} className="qn-order-detail__addon">
                        {String((a as Record<string, unknown>).name ?? '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {showSummary ? (
            <div className="qn-order-detail__summary">
              {summaryRows.map((row) => (
                <div key={row.key} className={`qn-order-detail__summary-row${row.is_total ? ' is-total' : ''}`}>
                  <span>{row.label}</span>
                  <span>{fmtAmount(row.amount, currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="qn-order-detail__total">
              <span>Total</span>
              <strong>{fmtAmount(orderTotal(order), currency)}</strong>
            </div>
          )}

          {(order.pay_link || order.payment_link) && (
            <a
              href={(order.pay_link ?? order.payment_link) as string}
              target="_blank"
              rel="noopener noreferrer"
              className="qn-modal-add-btn qn-order-detail__pay"
            >
              Pay Now
            </a>
          )}
        </>
      )}
    </div>
  );
};

/* ── Orders Modal ── */

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'delivered', label: 'Delivered' },
];

interface OrdersModalProps {
  currency: string;
  onClose: () => void;
  onOpenDetail: (id: string) => void;
  activeOrderId: string | null;
  onCloseDetail: () => void;
}

export const OrdersModal = ({ currency, onClose, onOpenDetail, activeOrderId, onCloseDetail }: OrdersModalProps) => {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<OrderListItem[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, tab],
    queryFn: () => fetchOrders(page, tab),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllOrders(data.data);
      } else {
        setAllOrders((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  const handleTabChange = (key: string) => {
    setTab(key);
    setPage(1);
    setAllOrders([]);
  };

  const hasMore = data ? data.meta.current_page * data.meta.per_page < data.meta.total : false;

  return (
    <div className="qn-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qn-orders-sheet">
        <div className="qn-orders-sheet__head">
          <h3 className="qn-orders-sheet__title">My Orders</h3>
          <button type="button" className="qn-modal__close" style={{ position: 'static' }} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="qn-order-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`qn-order-tab${tab === t.key ? ' is-active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="qn-order-list">
          {isLoading && page === 1 && (
            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="qn-skeleton qn-skeleton--line" style={{ height: '56px', borderRadius: '10px' }} />
              ))}
            </div>
          )}

          {!isLoading && allOrders.length === 0 && (
            <p className="qn-orders-sheet__empty">No orders found.</p>
          )}

          {allOrders.map((order) => (
            <button
              key={order.id}
              type="button"
              className="qn-order-row"
              onClick={() => onOpenDetail(order.id)}
            >
              <div className="qn-order-row__main">
                <div className="qn-order-row__top">
                  <span className="qn-order-row__no">#{order.order_no}</span>
                  <span className={statusClass(order.status)}>{order.status}</span>
                </div>
                <div className="qn-order-row__sub">
                  <span>{fmtAmount(orderTotal(order), currency)}</span>
                  {order.items_count != null && (
                    <span>· {order.items_count} item{order.items_count !== 1 ? 's' : ''}</span>
                  )}
                  <span>· {relativeDate(order.created_at)}</span>
                </div>
              </div>
              <svg viewBox="0 0 12 12" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}

          {hasMore && (
            <button
              type="button"
              className="qn-orders-sheet__load-more"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>

        {activeOrderId && (
          <OrderDetailPanel
            orderId={activeOrderId}
            currency={currency}
            onBack={onCloseDetail}
          />
        )}
      </div>
    </div>
  );
};
