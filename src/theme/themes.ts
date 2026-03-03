export interface ThemePreset {
  key: string;
  name: string;
  description: string;
  className: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'nova',
    name: 'Nova',
    description: 'Clean, modern storefront with sectioned catalogue, hero banner, and slide-up item modal',
    className: 'theme-nova',
  },
];

export const DEFAULT_THEME_KEY = 'nova';

export const getThemeByKey = (key: string | null | undefined): ThemePreset => {
  return THEME_PRESETS.find((t) => t.key === key) ?? THEME_PRESETS[0];
};

export const pickThemeFromShop = (_shopSlug: string | null | undefined): ThemePreset => {
  return THEME_PRESETS[0];
};
