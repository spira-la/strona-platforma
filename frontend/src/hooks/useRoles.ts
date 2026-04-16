import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authClient, type EffectiveUser } from '@/clients/auth.client';

export const ROLES_QUERY_KEY = ['auth', 'me'] as const;

export interface UseRolesResult {
  effectiveUser: EffectiveUser | null;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Single source of truth for the authenticated user's effective roles.
 * Backed by GET /api/auth/me, which reads from DB (profiles, admin_emails, coaches).
 * Use this instead of user.app_metadata.role — the JWT is never refreshed on role changes.
 */
export function useRoles(): UseRolesResult {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const query = useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => authClient.getMe(),
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 60_000,
  });

  const effectiveUser = query.data ?? null;

  return {
    effectiveUser,
    isAdmin: effectiveUser?.isAdmin ?? false,
    isCoach: effectiveUser?.isCoach ?? false,
    isClient: isAuthenticated,
    isLoading: isAuthLoading || query.isLoading,
    isError: query.isError,
  };
}
