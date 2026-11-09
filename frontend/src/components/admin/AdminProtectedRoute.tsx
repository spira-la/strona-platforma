import { Navigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
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

  if (isLoading) {
    return <AdminLoadingSpinner />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout />;
}
