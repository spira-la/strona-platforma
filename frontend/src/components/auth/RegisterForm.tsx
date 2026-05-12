import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/auth.store';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    email: z.string().email('Podaj poprawny adres e-mail'),
    password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type RegisterData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { signUp, signInWithGoogle } = useAuth();
  const { openLogin, closeModals } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      setSuccess(true);
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Wystąpił błąd rejestracji',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : 'Wystąpił błąd rejestracji przez Google',
      );
      setIsGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#B8944A]/10 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B8944A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-['Cormorant_Garamond'] text-[24px] font-bold text-[#2D2D2D]">
          Sprawdź swoją skrzynkę
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed max-w-[320px]">
          Wysłaliśmy link potwierdzający na Twój adres e-mail. Kliknij go, aby
          aktywować konto.
        </p>
        <button
          type="button"
          onClick={closeModals}
          className="font-['Lato'] text-[14px] font-semibold text-[#B8944A] hover:underline mt-2"
        >
          Zamknij
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="text-center mb-1">
        <h2 className="font-['Cormorant_Garamond'] text-[28px] font-bold text-[#2D2D2D]">
          Utwórz konto
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#8A8A8A] mt-1">
          Dołącz do Spirala
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-['Lato'] rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isSubmitting}
        className="font-['Lato'] text-[14px] font-medium text-[#2D2D2D] bg-white border border-[#E8E4DF] hover:bg-[#FAF8F4] hover:border-[#D4C9B8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg px-6 py-3 flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
          />
        </svg>
        {isGoogleLoading ? 'Łączenie...' : 'Zarejestruj się z Google'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E8E4DF]" />
        <span className="font-['Lato'] text-[12px] text-[#8A8A8A] uppercase tracking-wider">
          lub
        </span>
        <div className="flex-1 h-px bg-[#E8E4DF]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reg-name"
          className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]"
        >
          Imię i nazwisko
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          {...register('fullName')}
          className="font-['Lato'] text-[14px] text-[#2D2D2D] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none transition-colors focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 placeholder:text-[#AAAAAA]"
          placeholder="Anna Kowalska"
        />
        {errors.fullName && (
          <span className="font-['Lato'] text-[12px] text-red-500">
            {errors.fullName.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reg-email"
          className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]"
        >
          Adres e-mail
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="font-['Lato'] text-[14px] text-[#2D2D2D] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none transition-colors focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 placeholder:text-[#AAAAAA]"
          placeholder="twoj@email.com"
        />
        {errors.email && (
          <span className="font-['Lato'] text-[12px] text-red-500">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reg-password"
          className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]"
        >
          Hasło
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="font-['Lato'] text-[14px] text-[#2D2D2D] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none transition-colors focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 placeholder:text-[#AAAAAA]"
          placeholder="Min. 6 znaków"
        />
        {errors.password && (
          <span className="font-['Lato'] text-[12px] text-red-500">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reg-confirm"
          className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]"
        >
          Potwierdź hasło
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="font-['Lato'] text-[14px] text-[#2D2D2D] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none transition-colors focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 placeholder:text-[#AAAAAA]"
          placeholder="Powtórz hasło"
        />
        {errors.confirmPassword && (
          <span className="font-['Lato'] text-[12px] text-red-500">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg px-6 py-3 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
      >
        {isSubmitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
      </button>

      <p className="text-center font-['Lato'] text-[13px] text-[#8A8A8A]">
        Masz już konto?{' '}
        <button
          type="button"
          onClick={openLogin}
          className="text-[#B8944A] font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Zaloguj się
        </button>
      </p>
    </form>
  );
}
