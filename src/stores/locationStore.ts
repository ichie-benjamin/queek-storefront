import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const DEFAULT_LAT = 4.77149;
const DEFAULT_LNG = 7.01435;

interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  setLocation: (lat: number, lng: number, address: string) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      address: '',
      setLocation: (latitude, longitude, address) => set({ latitude, longitude, address }),
      clearLocation: () => set({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, address: '' }),
    }),
    {
      name: 'queek-storefront-location',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
