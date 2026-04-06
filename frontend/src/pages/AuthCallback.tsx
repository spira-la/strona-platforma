import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabase';

/**
 * Handles Supabase auth callbacks (email confirmation, password reset, magic link).
 * Supabase appends tokens as URL hash fragments — the client library picks them up
 * automatically via onAuthStateChange. We just wait briefly and redirect home.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate('/', { replace: true });
      return;
    }

    // Supabase JS client automatically processes the hash fragment.
    // Give it a moment to complete, then redirect.
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#B8944A] border-t-transparent rounded-full animate-spin" />
        <p className="font-['Lato'] text-[15px] text-[#6B6B6B]">Potwierdzanie...</p>
      </div>
    </div>
  );
}
