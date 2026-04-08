import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const { openRegister, openForgotPassword, closeModals } = useAuthStore();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
      closeModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd logowania');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="text-center mb-2">
        <h2 className="font-['Cormorant_Garamond'] text-[28px] font-bold text-[#2D2D2D]">
          Zaloguj się
        </h2>
        <p className="font-['Lato'] text-[14px] text-[#8A8A8A] mt-1">
          Witaj ponownie w Spirala
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-['Lato'] rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
          Adres e-mail
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
          Hasło
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="font-['Lato'] text-[14px] text-[#2D2D2D] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none transition-colors focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 placeholder:text-[#AAAAAA]"
          placeholder="••••••••"
        />
        {errors.password && (
          <span className="font-['Lato'] text-[12px] text-red-500">{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg px-6 py-3 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
      >
        {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
      </button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={openForgotPassword}
          className="font-['Lato'] text-[13px] text-[#B8944A] font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Nie pamiętasz hasła?
        </button>
      </div>

      <p className="text-center font-['Lato'] text-[13px] text-[#8A8A8A]">
        Nie masz konta?{' '}
        <button
          type="button"
          onClick={openRegister}
          className="text-[#B8944A] font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Zarejestruj się
        </button>
      </p>
    </form>
  );
}
