import { apiGet } from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';

export interface OrderListItem {
  id: string;
  order_no: string;
  status: string;
  total_price: number | string;
  grand_total?: number | string;
  items_count: number | null;
  payment_status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  title: string;
  total_price: number | string;
  unit_price: number | string;
  addons: Array<Record<string, unknown>>;
}

export interface OrderTimeline {
  time: string | null;
  title: string;
  description: string;
}

export interface AmountSummaryRow {
  key: string;
  label: string;
  type?: string;
  amount: number | string;
  is_total?: boolean;
}

export interface OrderDetail {
  id: string;
  order_no: string;
  status: string;
  status_label?: string;
  payment_status: string;
  payment_method?: string;
  total_price: number | string;
  grand_total?: number | string;
  payment_link: string | null;
  pay_link?: string | null;
  items: OrderItem[];
  timeline?: OrderTimeline[];
  amount_summary?: {
    title?: string;
    items: AmountSummaryRow[];
  };
}

export const fetchOrders = (page = 1, status?: string) =>
  apiGet<{ data: OrderListItem[]; meta: { current_page: number; total: number; per_page: number } }>(
    ENDPOINTS.store.orders,
    { page, ...(status && status !== 'all' ? { status } : {}) },
  );

export const fetchOrderDetail = async (id: string): Promise<OrderDetail> => {
  const res = await apiGet<{ data: OrderDetail }>(ENDPOINTS.store.orderDetail(id));
  return res.data;
};
