import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import spiralaLogo from '@/assets/spirala.png';

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type PasswordData = z.infer<typeof passwordSchema>;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [mode, setMode] = useState<'loading' | 'reset' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (!supabase) {
      navigate('/', { replace: true });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      } else if (event === 'SIGNED_IN') {
        // Email confirmation or magic link — redirect home
        if (mode === 'loading') {
          setTimeout(() => navigate('/', { replace: true }), 500);
        }
      }
    });

    // Fallback: if no event fires within 3s, redirect home
    const timeout = setTimeout(() => {
      if (mode === 'loading') {
        navigate('/', { replace: true });
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, mode]);

  const onSubmit = async (data: PasswordData) => {
    setError('');
    setIsSubmitting(true);
    try {
      await updatePassword(data.password);
      setMode('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#B8944A] border-t-transparent rounded-full animate-spin" />
          <p className="font-['Lato'] text-[15px] text-[#6B6B6B]">Potwierdzanie...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (mode === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0] px-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] p-8 text-center">
          <img src={spiralaLogo} alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <div className="w-14 h-14 rounded-full bg-[#B8944A]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8944A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-['Playfair_Display'] text-[24px] font-bold text-[#2D2D2D] mb-2">
            Hasło zmienione
          </h1>
          <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed mb-6">
            Twoje hasło zostało pomyślnie zaktualizowane. Możesz teraz korzystać z konta.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors duration-200 rounded-lg px-8 py-3"
          >
            Przejdź do strony głównej
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0] px-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] p-8 text-center">
          <img src={spiralaLogo} alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="font-['Playfair_Display'] text-[24px] font-bold text-[#2D2D2D] mb-2">
            Link wygasł
          </h1>
          <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed mb-6">
            Ten link do resetowania hasła jest nieaktualny. Spróbuj ponownie.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors duration-200 rounded-lg px-8 py-3"
          >
            Wróć na stronę główną
          </button>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0] px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] p-8">
        <div className="flex justify-center mb-4">
          <img src={spiralaLogo} alt="" className="w-20 h-20 object-contain" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="text-center mb-2">
            <h1 className="font-['Playfair_Display'] text-[28px] font-bold text-[#2D2D2D]">
              Nowe hasło
            </h1>
            <p className="font-['Lato'] text-[14px] text-[#8A8A8A] mt-1">
              Wpisz swoje nowe hasło poniżej
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-['Lato'] rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
              Nowe hasło
            </label>
            <input
              id="new-password"
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
            <label htmlFor="confirm-new-password" className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D]">
              Potwierdź hasło
            </label>
            <input
              id="confirm-new-password"
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
            {isSubmitting ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      </div>
    </div>
  );
}
