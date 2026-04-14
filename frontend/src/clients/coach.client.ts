import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachDashboardStats {
  upcomingSessions: number;
  totalClients: number;
  thisMonthEarnings: number;
  totalSessions: number;
}

export interface CoachProfile {
  id: string;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  location: string | null;
  website: string | null;
  timezone: string;
  acceptingClients: boolean;
  yearsExperience: number | null;
  certifications: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCoachProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  expertise?: string[];
  languages?: string[];
  location?: string;
  website?: string;
  timezone?: string;
  acceptingClients?: boolean;
  yearsExperience?: number;
  certifications?: string[];
}

export interface CoachAvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateAvailabilitySlotData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CoachBlock {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
}

export interface CreateBlockData {
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface CoachService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  sessionCount: number;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateCoachServiceData {
  name: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  sessionCount?: number;
  sortOrder?: number;
}

export type UpdateCoachServiceData = Partial<CreateCoachServiceData>;

export interface CoachSession {
  id: string;
  clientName: string;
  clientEmail: string;
  startAt: string;
  endAt: string;
  status: string;
  serviceName: string;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const coachClient = {
  getDashboard: (): Promise<CoachDashboardStats> =>
    api.get<CoachDashboardStats>('/coach/me/dashboard'),

  getProfile: (): Promise<CoachProfile> =>
    api.get<CoachProfile>('/coach/me/profile'),

  updateProfile: (data: UpdateCoachProfileData): Promise<CoachProfile> =>
    api.patch<CoachProfile>('/coach/me/profile', data),

  getAvailability: (): Promise<CoachAvailabilitySlot[]> =>
    api.get<CoachAvailabilitySlot[]>('/coach/me/availability'),

  updateAvailability: (
    slots: CreateAvailabilitySlotData[],
  ): Promise<CoachAvailabilitySlot[]> =>
    api.put<CoachAvailabilitySlot[]>('/coach/me/availability', slots),

  getBlocks: (): Promise<CoachBlock[]> =>
    api.get<CoachBlock[]>('/coach/me/blocks'),

  createBlock: (data: CreateBlockData): Promise<CoachBlock> =>
    api.post<CoachBlock>('/coach/me/blocks', data),

  deleteBlock: (id: string): Promise<void> =>
    api.delete<void>(`/coach/me/blocks/${id}`),

  getServices: (): Promise<CoachService[]> =>
    api.get<CoachService[]>('/coach/me/services'),

  createService: (data: CreateCoachServiceData): Promise<CoachService> =>
    api.post<CoachService>('/coach/me/services', data),

  updateService: (
    id: string,
    data: UpdateCoachServiceData,
  ): Promise<CoachService> =>
    api.put<CoachService>(`/coach/me/services/${id}`, data),

  archiveService: (id: string): Promise<CoachService> =>
    api.patch<CoachService>(`/coach/me/services/${id}/archive`),

  restoreService: (id: string): Promise<CoachService> =>
    api.patch<CoachService>(`/coach/me/services/${id}/restore`),

  getSessions: (): Promise<CoachSession[]> =>
    api.get<CoachSession[]>('/coach/me/sessions'),
};
