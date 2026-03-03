import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  username: string;
  avatar: string | null;
  delivery_info?: {
    map_lat: number;
    map_lng: number;
    address: string;
  };
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateDeliveryInfo: (info: { map_lat: number; map_lng: number; address: string }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      updateDeliveryInfo: (info) =>
        set((state) => ({
          user: state.user ? { ...state.user, delivery_info: info } : null,
        })),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'queek-storefront-user',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
