export const ENDPOINTS = {
  store: {
    info:               '/client/store/info',
    config:             '/client/store/config',
    products:           '/client/store/products',
    collections:        '/client/store/collections',
    collectionProducts: (id: string) => `/client/store/collections/${id}/products`,
    promotions:         '/client/store/promotions',
    promotionProducts:  (id: string) => `/client/store/promotions/${id}/products`,
    orders:             '/client/store/orders',
    orderDetail:        (id: string) => `/client/store/orders/${id}`,
    orderPay:           (id: string) => `/client/store/orders/${id}/pay`,
    productDetail:      (slug: string) => `/client/store/products/${slug}`,
    productReviews:     (slug: string) => `/client/store/products/${slug}/reviews`,
    checkoutFees:       '/client/store/checkout/fees',
    checkout:           '/client/store/order/checkout',
  },
  address: {
    autocomplete: '/client/address/autocomplete',
    coordinates:  '/client/address/coordinates',
  },
} as const;
