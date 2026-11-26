import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/auth.store';
import { AdminLayout } from './AdminLayout';

function AdminLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-line border-t-brand animate-spin"
          role="status"
          aria-label="Ładowanie..."
        />
        <p className="font-['Inter'] text-[14px] text-ink-muted">
          Weryfikacja uprawnień…
        </p>
      </div>
    </div>
  );
}

export default function AdminProtectedRoute() {
  const { isAdmin, isLoading } = useRoles();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLogin } = useAuthStore();
  const needsLogin = !isLoading && !authLoading && !isAuthenticated;

  // Not logged in → go home with the login window open. This is how the
  // admin logs in while the public "Zaloguj się" button is hidden
  // (`publicAccounts` flag off): she opens spira-la.com/admin.
  useEffect(() => {
    if (needsLogin) openLogin();
  }, [needsLogin, openLogin]);

  if (isLoading || authLoading) {
    return <AdminLoadingSpinner />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout />;
}
