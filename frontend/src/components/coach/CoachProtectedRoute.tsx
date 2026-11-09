import { Navigate } from 'react-router-dom';
import { useRoles } from '@/hooks/useRoles';
import { CoachLayout } from './CoachLayout';

function CoachLoadingSpinner() {
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

export default function CoachProtectedRoute() {
  const { isCoach, isLoading } = useRoles();

  if (isLoading) {
    return <CoachLoadingSpinner />;
  }

  if (!isCoach) {
    return <Navigate to="/" replace />;
  }

  return <CoachLayout />;
}
