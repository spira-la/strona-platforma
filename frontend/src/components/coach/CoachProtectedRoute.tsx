import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CoachLayout } from './CoachLayout';

function CoachLoadingSpinner() {
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

function isCoachOrAdmin(user: ReturnType<typeof useAuth>['user']): boolean {
  const role = user?.app_metadata?.role;
  return role === 'coach' || role === 'admin';
}

export default function CoachProtectedRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <CoachLoadingSpinner />;
  }

  if (!isAuthenticated || !isCoachOrAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return <CoachLayout />;
}
