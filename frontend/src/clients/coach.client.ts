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
  title: string | null;
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
  title?: string;
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
  meetingUrl: string | null;
  notes: string | null;
  rescheduledAt: string | null;
  cancellationReason: string | null;
}

export interface RescheduleSessionData {
  newStartAt: string;
  newEndAt: string;
  reason?: string;
}

export interface CreateManualSessionData {
  clientEmail: string;
  clientName?: string;
  serviceId?: string;
  startAt: string;
  endAt: string;
  notes?: string;
}

// ─── API methods ──────────────────────────────────────────────────────────────

type Envelope<T> = { success: boolean; data: T };

export const coachClient = {
  getDashboard: (): Promise<CoachDashboardStats> =>
    api
      .get<Envelope<CoachDashboardStats>>('/coach/me/dashboard')
      .then((r) => r.data),

  getProfile: (): Promise<CoachProfile> =>
    api.get<Envelope<CoachProfile>>('/coach/me/profile').then((r) => r.data),

  updateProfile: (data: UpdateCoachProfileData): Promise<CoachProfile> =>
    api
      .patch<Envelope<CoachProfile>>('/coach/me/profile', data)
      .then((r) => r.data),

  getAvailability: (): Promise<CoachAvailabilitySlot[]> =>
    api
      .get<Envelope<CoachAvailabilitySlot[]>>('/coach/me/availability')
      .then((r) => r.data),

  updateAvailability: (
    slots: CreateAvailabilitySlotData[],
  ): Promise<CoachAvailabilitySlot[]> =>
    api
      .put<Envelope<CoachAvailabilitySlot[]>>('/coach/me/availability', slots)
      .then((r) => r.data),

  getBlocks: (): Promise<CoachBlock[]> =>
    api
      .get<Envelope<CoachBlock[]>>('/coach/me/availability/blocks')
      .then((r) => r.data),

  createBlock: (data: CreateBlockData): Promise<CoachBlock> =>
    api
      .post<Envelope<CoachBlock>>('/coach/me/availability/blocks', data)
      .then((r) => r.data),

  deleteBlock: (id: string): Promise<void> =>
    api.delete<void>(`/coach/me/availability/blocks/${id}`),

  getServices: (): Promise<CoachService[]> =>
    api.get<Envelope<CoachService[]>>('/coach/me/services').then((r) => r.data),

  createService: (data: CreateCoachServiceData): Promise<CoachService> =>
    api
      .post<Envelope<CoachService>>('/coach/me/services', data)
      .then((r) => r.data),

  updateService: (
    id: string,
    data: UpdateCoachServiceData,
  ): Promise<CoachService> =>
    api
      .put<Envelope<CoachService>>(`/coach/me/services/${id}`, data)
      .then((r) => r.data),

  archiveService: (id: string): Promise<CoachService> =>
    api
      .patch<Envelope<CoachService>>(`/coach/me/services/${id}/archive`)
      .then((r) => r.data),

  restoreService: (id: string): Promise<CoachService> =>
    api
      .patch<Envelope<CoachService>>(`/coach/me/services/${id}/restore`)
      .then((r) => r.data),

  getSessions: (): Promise<CoachSession[]> =>
    api.get<Envelope<CoachSession[]>>('/coach/me/sessions').then((r) => r.data),

  cancelSession: (id: string, reason?: string): Promise<void> =>
    api.patch<void>(`/coach/me/sessions/${id}/cancel`, { reason }),

  rescheduleSession: (id: string, data: RescheduleSessionData): Promise<void> =>
    api.patch<void>(`/coach/me/sessions/${id}/reschedule`, data),

  createManualSession: (data: CreateManualSessionData): Promise<CoachSession> =>
    api
      .post<Envelope<CoachSession>>('/coach/me/sessions/manual', data)
      .then((r) => r.data),

  getClients: (): Promise<{ email: string; name: string }[]> =>
    api
      .get<Envelope<{ email: string; name: string }[]>>('/coach/me/clients')
      .then((r) => r.data),
};
