import { create } from 'zustand';
import type { ShopProfile } from '../types/shop';

type VendorStatus = 'loading' | 'ready' | 'forbidden' | 'error';

interface VendorStore {
  profile: ShopProfile | null;
  status: VendorStatus;
  setProfile: (profile: ShopProfile) => void;
  setStatus: (status: VendorStatus) => void;
}

export const useVendorStore = create<VendorStore>()((set) => ({
  profile: null,
  status: 'loading',
  setProfile: (profile) => set({ profile, status: 'ready' }),
  setStatus: (status) => set({ status }),
}));
