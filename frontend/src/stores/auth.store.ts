import { create } from 'zustand';

type AuthView = 'login' | 'register' | 'forgotPassword' | null;

interface AuthUIState {
  activeView: AuthView;
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isForgotPasswordOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeModals: () => void;
}

export const useAuthStore = create<AuthUIState>((set) => ({
  activeView: null,
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isForgotPasswordOpen: false,

  openLogin: () =>
    set({
      activeView: 'login',
      isLoginModalOpen: true,
      isRegisterModalOpen: false,
      isForgotPasswordOpen: false,
    }),

  openRegister: () =>
    set({
      activeView: 'register',
      isRegisterModalOpen: true,
      isLoginModalOpen: false,
      isForgotPasswordOpen: false,
    }),

  openForgotPassword: () =>
    set({
      activeView: 'forgotPassword',
      isForgotPasswordOpen: true,
      isLoginModalOpen: false,
      isRegisterModalOpen: false,
    }),

  closeModals: () =>
    set({
      activeView: null,
      isLoginModalOpen: false,
      isRegisterModalOpen: false,
      isForgotPasswordOpen: false,
    }),
}));
