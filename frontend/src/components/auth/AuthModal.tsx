import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { supabase } from '@/config/supabase';
import spiralaLogo from '@/assets/spirala.png';

export function AuthModal() {
  const { isLoginModalOpen, isRegisterModalOpen, isForgotPasswordOpen, closeModals } = useAuthStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  const isOpen = isLoginModalOpen || isRegisterModalOpen || isForgotPasswordOpen;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModals();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeModals]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) closeModals();
  };

  // Supabase not configured
  if (!supabase) {
    return (
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      >
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[420px] mx-4 p-8 text-center">
          <button
            type="button"
            onClick={closeModals}
            className="absolute top-4 right-4 text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors"
            aria-label="Zamknij"
          >
            <X size={20} />
          </button>
          <img src={spiralaLogo} alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h2 className="font-['Playfair_Display'] text-[22px] font-bold text-[#2D2D2D] mb-2">
            Konfiguracja w toku
          </h2>
          <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed">
            System logowania jest w trakcie konfiguracji. Spróbuj ponownie za chwilę.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={isLoginModalOpen ? 'Logowanie' : isForgotPasswordOpen ? 'Resetowanie hasła' : 'Rejestracja'}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[420px] mx-4 p-8 animate-in zoom-in-95 fade-in duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={closeModals}
          className="absolute top-4 right-4 text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
          aria-label="Zamknij"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={spiralaLogo} alt="" className="w-20 h-20 object-contain" />
        </div>

        {/* Form */}
        {isLoginModalOpen && <LoginForm />}
        {isRegisterModalOpen && <RegisterForm />}
        {isForgotPasswordOpen && <ForgotPasswordForm />}
      </div>
    </div>
  );
}
