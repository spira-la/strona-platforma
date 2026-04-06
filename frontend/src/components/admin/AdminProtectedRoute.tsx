import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from './AdminLayout';

function AdminLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-[#E8E4DF] border-t-[#B8963E] animate-spin"
          role="status"
          aria-label="Ładowanie..."
        />
        <p className="font-['Inter'] text-[14px] text-[#8A8A8A]">Weryfikacja uprawnień…</p>
      </div>
    </div>
  );
}

function isAdmin(user: ReturnType<typeof useAuth>['user']): boolean {
  return user?.app_metadata?.role === 'admin';
}

export default function AdminProtectedRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AdminLoadingSpinner />;
  }

  if (!isAuthenticated || !isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout />;
}
