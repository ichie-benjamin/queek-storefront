import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  onSuccess?: () => void;
  open: (onSuccess?: () => void) => void;
  close: () => void;
}

export const useAuthModal = create<AuthModalState>()((set) => ({
  isOpen: false,
  onSuccess: undefined,
  open: (onSuccess) => set({ isOpen: true, onSuccess }),
  close: () => set({ isOpen: false, onSuccess: undefined }),
}));
