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
  const { signUp } = useAuth();
  const { openLogin, closeModals } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd rejestracji');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#B8944A]/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8944A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-['Cormorant_Garamond'] text-[24px] font-bold text-[#2D2D2D]">
          Sprawdź swoją skrzynkę
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed max-w-[320px]">
          Wysłaliśmy link potwierdzający na Twój adres e-mail. Kliknij go, aby aktywować konto.
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-name" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
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
          <span className="font-['Lato'] text-[12px] text-red-500">{errors.fullName.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-email" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
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
          <span className="font-['Lato'] text-[12px] text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-password" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
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
          <span className="font-['Lato'] text-[12px] text-red-500">{errors.password.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-confirm" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
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
          <span className="font-['Lato'] text-[12px] text-red-500">{errors.confirmPassword.message}</span>
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
