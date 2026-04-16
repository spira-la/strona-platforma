import { api } from './api';

export interface EffectiveUser {
  userId: string;
  email: string | null;
  fullName: string | null;
  profileRole: 'user' | 'coach' | 'admin' | null;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
}

export const authClient = {
  getMe(): Promise<EffectiveUser> {
    return api.get<EffectiveUser>('/auth/me');
  },
};
