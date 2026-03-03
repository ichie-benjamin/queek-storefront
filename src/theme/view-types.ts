import type { FormEvent, ReactElement } from 'react';
import type { CartItem } from '../stores/cartStore';
import type { Product, ProductReviewsData, ProductSection } from '../types/product';
import type { ShopProfile } from '../types/shop';
import type { VendorCollection, VendorPromotion } from '../services/collections';

export type { VendorCollection, VendorPromotion };

export interface BaseViewProps {
  themeKey: string;
  onThemeChange: (key: string) => void;
  shopSlug: string | null;
  shopProfile: ShopProfile | null;
  cartCount: number;
}

export interface ProductListViewProps extends BaseViewProps {
  search: string;
  onSearchChange: (value: string) => void;
  products: Product[];
  sections: ProductSection[];
  collections?: VendorCollection[];
  promotions?: VendorPromotion[];
  isLoading: boolean;
  errorMessage: string | null;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
}

export interface ProductDetailViewProps extends BaseViewProps {
  product: Product | null;
  relatedProducts: Product[];
  reviewsData: ProductReviewsData | null;
  isLoading: boolean;
  errorMessage: string | null;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenCart: () => void;
}

export interface CheckoutViewProps extends BaseViewProps {
  items: CartItem[];
  total: number;
  currency: string;
  address: string;
  phone: string;
  submitMessage: string | null;
  submitError: string | null;
  isSubmitting: boolean;
  onAddressChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClearCart: () => void;
}

export interface ThemeViewSet {
  ProductListView: (props: ProductListViewProps) => ReactElement;
  ProductDetailView: (props: ProductDetailViewProps) => ReactElement;
  CheckoutView: (props: CheckoutViewProps) => ReactElement;
}
