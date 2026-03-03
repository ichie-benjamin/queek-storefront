import { NovaCheckoutView, NovaDetailView, NovaListView } from './layouts/nova';
import type { ThemeViewSet } from './view-types';

const themeViewMap: Record<string, ThemeViewSet> = {
  nova: {
    ProductListView: NovaListView,
    ProductDetailView: NovaDetailView,
    CheckoutView: NovaCheckoutView,
  },
};

export const getThemeViews = (themeKey: string): ThemeViewSet => {
  return themeViewMap[themeKey] ?? themeViewMap.nova;
};
