import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_THEME_KEY, getThemeByKey } from '../theme/themes';

interface ThemeState {
  themeKey: string;
  setThemeKey: (key: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeKey: DEFAULT_THEME_KEY,
      setThemeKey: (key: string) => set({ themeKey: getThemeByKey(key).key }),
    }),
    {
      name: 'queek-storefront-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
