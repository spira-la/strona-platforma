import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/auth.store';

const forgotSchema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
});

type ForgotData = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const { openLogin } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#B8944A]/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8944A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 className="font-['Cormorant_Garamond'] text-[24px] font-bold text-[#2D2D2D]">
          Sprawdź swoją skrzynkę
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed max-w-[320px]">
          Jeśli konto z tym adresem istnieje, wysłaliśmy link do zresetowania hasła.
        </p>
        <button
          type="button"
          onClick={openLogin}
          className="font-['Lato'] text-[14px] font-semibold text-[#B8944A] hover:underline mt-2"
        >
          Wróć do logowania
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h2 className="font-['Cormorant_Garamond'] text-[28px] font-bold text-[#2D2D2D]">
          Resetuj hasło
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#8A8A8A] mt-1">
          Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-['Lato'] rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
          Adres e-mail
        </label>
        <input
          id="forgot-email"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg px-6 py-3 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
      >
        {isSubmitting ? 'Wysyłanie...' : 'Wyślij link'}
      </button>

      <p className="text-center font-['Lato'] text-[13px] text-[#8A8A8A]">
        Pamiętasz hasło?{' '}
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
