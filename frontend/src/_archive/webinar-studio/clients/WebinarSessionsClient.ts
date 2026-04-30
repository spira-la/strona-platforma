/**
 * WebinarSessionsClient
 *
 * API client for webinar session operations.
 * Uses backend REST API for all reads to ensure correct Firestore collection
 * is used regardless of frontend environment configuration.
 *
 * Sessions are scheduled instances of webinars - each webinar can have multiple sessions.
 */

import { BaseClient } from './BaseClient';
import type {
  WebinarSession,
  WebinarSessionStatus,
  CreateWebinarSessionData,
  UpdateWebinarSessionData,
} from '@/domain/products/models/webinar.model';

export class WebinarSessionsClient extends BaseClient {
  protected collectionName = 'webinar_sessions';
  private readonly basePath = '/api/webinar-sessions';

  // ============================================
  // Public Methods (Backend API)
  // ============================================

  /**
   * Get a session by its ID
   * Uses backend API to ensure correct collection is always used
   */
  async getSessionById(id: string): Promise<WebinarSession | null> {
    try {
      return await this.publicRequest<WebinarSession>(
        `${this.basePath}/${id}`
      );
    } catch (error: unknown) {
      // Return null for 404 errors
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        return null;
      }
      this.handleError('get session by ID', error);
    }
  }

  /**
   * Get all sessions for a specific webinar (excluding cancelled)
   * Uses backend API to ensure correct collection is always used regardless of frontend environment config
   */
  async getSessionsForWebinar(webinarId: string): Promise<WebinarSession[]> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}/webinar/${webinarId}`
      );

      const sessions = response.sessions || [];

      // Filter out cancelled and sort by scheduledAt ascending
      return sessions
        .filter(s => s.status !== 'cancelled')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    } catch (error: unknown) {
      console.error('❌ [WebinarSessionsClient] getSessionsForWebinar error:', error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }

  /**
   * Get upcoming sessions across all webinars
   * Uses backend API to ensure correct collection is always used
   */
  async getUpcomingSessions(limitCount: number = 10): Promise<WebinarSession[]> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}/upcoming`
      );

      const sessions = response.sessions || [];
      return sessions.slice(0, limitCount);
    } catch (error: unknown) {
      console.warn('getUpcomingSessions:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Get all currently live sessions
   * Uses backend API to ensure correct collection is always used
   */
  async getLiveSessions(): Promise<WebinarSession[]> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}?status=live`
      );
      return response.sessions || [];
    } catch (error) {
      this.handleError('get live sessions', error);
    }
  }

  /**
   * Get past sessions with available recordings for a webinar
   * Uses backend API to ensure correct collection is always used
   */
  async getPastSessions(webinarId: string): Promise<WebinarSession[]> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}/webinar/${webinarId}`
      );

      const sessions = response.sessions || [];

      // Filter for ended sessions with recordings and sort by scheduledAt desc
      return sessions
        .filter(s => s.status === 'ended' && s.recordingStatus === 'available')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    } catch (error: unknown) {
      console.error('❌ [WebinarSessionsClient] getPastSessions error:', error);
      return [];
    }
  }

  /**
   * Get the next upcoming session for a specific webinar
   * Uses backend API to ensure correct collection is always used
   */
  async getNextSession(webinarId: string): Promise<WebinarSession | null> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}/webinar/${webinarId}`
      );

      const sessions = response.sessions || [];
      const now = new Date();

      // Filter for scheduled sessions in the future and get the first one
      const upcomingSessions = sessions
        .filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) >= now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      return upcomingSessions[0] || null;
    } catch (error: unknown) {
      console.error('❌ [WebinarSessionsClient] getNextSession error:', error);
      return null;
    }
  }

  /**
   * Get all sessions for a webinar (including cancelled) - for admin views
   * Uses backend API to ensure correct collection is always used regardless of frontend environment config
   */
  async getAllSessionsForWebinar(webinarId: string): Promise<WebinarSession[]> {
    try {
      const response = await this.publicRequest<{ sessions: WebinarSession[] }>(
        `${this.basePath}/webinar/${webinarId}`
      );

      const sessions = response.sessions || [];

      // Sort by scheduledAt descending in memory
      sessions.sort((a, b) => {
        const dateA = new Date(a.scheduledAt).getTime();
        const dateB = new Date(b.scheduledAt).getTime();
        return dateB - dateA;
      });

      return sessions;
    } catch (error: unknown) {
      console.error('❌ [WebinarSessionsClient] getAllSessionsForWebinar error:', error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }

  // ============================================
  // Admin/Coach Methods (Backend API)
  // ============================================

  /**
   * Create a new webinar session (requires authentication)
   */
  async createSession(data: CreateWebinarSessionData): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a webinar session (requires authentication)
   */
  async updateSession(id: string, data: UpdateWebinarSessionData): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update session status (requires authentication)
   */
  async updateSessionStatus(
    id: string,
    status: WebinarSessionStatus
  ): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(`${this.basePath}/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Reschedule a session and notify attendees (requires authentication, admin only)
   */
  async rescheduleSession(
    id: string,
    data: { scheduledAt: string; rescheduleReason: string },
  ): Promise<{ success: boolean; session: WebinarSession; notificationsSent: number; failedNotifications: number }> {
    return this.authenticatedRequest<{
      success: boolean;
      session: WebinarSession;
      notificationsSent: number;
      failedNotifications: number;
    }>(`${this.basePath}/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Resend reschedule notifications to all attendees (admin only)
   * Resolves missing emails from Firebase Auth and re-sends notifications
   */
  async resendRescheduleNotifications(
    id: string,
    data?: { rescheduleReason?: string; previousScheduledAt?: string },
  ): Promise<{ success: boolean; notificationsSent: number; failedNotifications: number; emailsResolved: number }> {
    return this.authenticatedRequest<{
      success: boolean;
      notificationsSent: number;
      failedNotifications: number;
      emailsResolved: number;
    }>(`${this.basePath}/${id}/resend-reschedule`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  /**
   * Send reminder notifications to all attendees (admin only)
   */
  async sendReminder(
    id: string,
  ): Promise<{ success: boolean; notificationsSent: number; failedNotifications: number; emailsResolved: number }> {
    return this.authenticatedRequest<{
      success: boolean;
      notificationsSent: number;
      failedNotifications: number;
      emailsResolved: number;
    }>(`${this.basePath}/${id}/send-reminder`, {
      method: 'POST',
    });
  }

  /**
   * Cancel a session (requires authentication)
   */
  async cancelSession(id: string): Promise<void> {
    return this.authenticatedRequest<void>(`${this.basePath}/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get sessions for a specific coach (requires authentication)
   */
  async getCoachSessions(coachId: string): Promise<WebinarSession[]> {
    return this.authenticatedRequest<WebinarSession[]>(
      `${this.basePath}/coach/${coachId}`,
      { method: 'GET' }
    );
  }

  /**
   * Start a live session (requires authentication)
   * Sets status to 'live' and records startedAt timestamp
   */
  async startSession(id: string): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(`${this.basePath}/${id}/start`, {
      method: 'POST',
    });
  }

  /**
   * End a live session (requires authentication)
   * Sets status to 'ended' and records endedAt timestamp
   */
  async endSession(id: string): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(`${this.basePath}/${id}/end`, {
      method: 'POST',
    });
  }

  /**
   * Start recording for a session (requires authentication)
   */
  async startRecording(id: string): Promise<{ egressId: string }> {
    return this.authenticatedRequest<{ egressId: string }>(
      `${this.basePath}/${id}/recording/start`,
      { method: 'POST' }
    );
  }

  /**
   * Stop recording for a session (requires authentication)
   */
  async stopRecording(id: string): Promise<WebinarSession> {
    return this.authenticatedRequest<WebinarSession>(
      `${this.basePath}/${id}/recording/stop`,
      { method: 'POST' }
    );
  }
}

// Export singleton instance
export const webinarSessionsClient = new WebinarSessionsClient();
