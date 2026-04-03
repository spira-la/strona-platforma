import { create } from 'zustand';

interface AuthUIState {
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  closeModals: () => void;
}

export const useAuthStore = create<AuthUIState>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,

  openLogin: () =>
    set({ isLoginModalOpen: true, isRegisterModalOpen: false }),

  openRegister: () =>
    set({ isRegisterModalOpen: true, isLoginModalOpen: false }),

  closeModals: () =>
    set({ isLoginModalOpen: false, isRegisterModalOpen: false }),
}));
