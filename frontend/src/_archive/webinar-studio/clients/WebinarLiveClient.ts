/**
 * WebinarLiveClient
 *
 * API client for webinar live features:
 * - LiveKit token generation
 * - Registration and access checks
 * - Chat history
 * - Q&A management
 * - Polls
 * - Host controls
 * - Recording controls
 *
 * Uses BaseClient pattern for authenticated/public requests
 * Firestore direct reads for chat, questions, polls (real-time data)
 * Backend API for mutations and secured operations
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getDbLazy } from '@/firebase';
import { BaseClient } from './BaseClient';
import type {
  WebinarChatMessage,
  WebinarQuestion,
  WebinarPoll,
  WebinarRegistration,
  SessionConflictResponse,
  TakeoverSessionResponse,
} from '@/domain/products/models/webinar.model';

// ============================================
// Response Types
// ============================================

export interface JoinTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  participantIdentity: string;
  isHost: boolean;
}

export interface CheckAccessResponse {
  hasAccess: boolean;
}

export interface StartRecordingResponse {
  egressId: string;
  startSegmentIndex: number;
}

export interface StopRecordingResponse {
  url: string;
  path: string;
  duration: number;
}

// ============================================
// Client Class
// ============================================

export class WebinarLiveClient extends BaseClient {
  protected collectionName = 'webinar_live';

  // Collection names (environment suffix handled by getCollectionWithSuffix)
  private readonly CHAT_COLLECTION = 'webinar_chats';
  private readonly QUESTIONS_COLLECTION = 'webinar_questions';
  private readonly POLLS_COLLECTION = 'webinar_polls';
  private readonly REGISTRATIONS_COLLECTION = 'webinar_registrations';

  /**
   * Get collection name with environment suffix
   * Matches backend CollectionHelperService pattern
   */
  private getCollectionWithSuffix(baseName: string): string {
    const env = this.getCurrentEnvironment();
    return env === 'test' ? `${baseName}_test` : baseName;
  }

  // ============================================
  // LiveKit Token (Backend API)
  // ============================================

  /**
   * Get LiveKit join token for a session
   * Requires authentication - token is user-specific
   * @param sessionId - The webinar session ID
   * @param options - Token options including role and identity
   */
  async getJoinToken(
    sessionId: string,
    options: {
      isHost?: boolean;
      isShadow?: boolean; // Shadow host (same permissions as host but not on scene by default)
      isSpeaker?: boolean; // Guest speaker (can publish but not main host)
      isAdminSpeaker?: boolean; // Admin speaker (can edit visuals and control features like host/shadow)
      participantIdentity?: string; // Custom identity (useful for preview monitors)
      participantName?: string; // Custom display name
    } = {}
  ): Promise<JoinTokenResponse> {
    const { isHost = false, isShadow = false, isSpeaker = false, isAdminSpeaker = false, participantIdentity, participantName } = options;
    return this.authenticatedRequest<JoinTokenResponse>('/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ sessionId, isHost, isShadow, isSpeaker, isAdminSpeaker, participantIdentity, participantName }),
    });
  }

  // ============================================
  // Registration / Access Check
  // ============================================

  /**
   * Check if current user has access to a session
   */
  async checkAccess(sessionId: string): Promise<boolean> {
    try {
      const response = await this.authenticatedRequest<{ success: boolean; hasAccess: boolean }>(
        `/api/webinar-registrations/access/${sessionId}`
      );
      return response.hasAccess;
    } catch {
      return false;
    }
  }

  /**
   * Get current user's registration for a session
   */
  async getMyRegistration(sessionId: string): Promise<WebinarRegistration | null> {
    try {
      const response = await this.authenticatedRequest<{ success: boolean; registration: WebinarRegistration }>(
        `/api/webinar-registrations/my/${sessionId}`
      );
      return response.registration || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all registrations for current user
   */
  async getMyRegistrations(): Promise<WebinarRegistration[]> {
    const response = await this.authenticatedRequest<{ success: boolean; registrations: WebinarRegistration[]; total: number }>(
      '/api/webinar-registrations/my'
    );
    return response.registrations || [];
  }

  // ============================================
  // Chat (Firestore Direct for Read)
  // ============================================

  /**
   * Get chat history for a session
   * Direct Firestore read for real-time subscriptions
   */
  async getChatHistory(sessionId: string, limitCount: number = 100): Promise<WebinarChatMessage[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.CHAT_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as WebinarChatMessage));
    } catch (error) {
      this.handleError('get chat history', error);
    }
  }

  // ============================================
  // Q&A (Firestore Direct for Read)
  // ============================================

  /**
   * Get all questions for a session
   * Transforms stored format (answered/anonymous) to frontend format (status/isAnonymous)
   */
  async getQuestions(sessionId: string): Promise<WebinarQuestion[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.QUESTIONS_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        where('deleted', '==', false),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        // Transform stored format to frontend format
        return {
          id: doc.id,
          sessionId: data.sessionId,
          userId: data.anonymous ? undefined : data.userId,
          userName: data.anonymous ? undefined : data.userName,
          question: data.question,
          isAnonymous: data.anonymous ?? false,
          status: data.answered ? 'answered' : 'pending',
          answer: data.answer,
          answeredAt: data.answeredAt,
          upvotes: data.upvotes ?? 0,
          upvotedBy: data.upvotedBy ?? [],
          timestamp: data.timestamp,
        } as WebinarQuestion;
      });
    } catch (error) {
      this.handleError('get questions', error);
    }
  }

  /**
   * Get pending questions for a session (for host moderation)
   * Ordered by upvotes (descending) then timestamp (ascending)
   * Transforms stored format to frontend format
   */
  async getPendingQuestions(sessionId: string): Promise<WebinarQuestion[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.QUESTIONS_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        where('deleted', '==', false),
        where('answered', '==', false),
        orderBy('upvotes', 'desc'),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sessionId: data.sessionId,
          userId: data.anonymous ? undefined : data.userId,
          userName: data.anonymous ? undefined : data.userName,
          question: data.question,
          isAnonymous: data.anonymous ?? false,
          status: 'pending' as const,
          upvotes: data.upvotes ?? 0,
          upvotedBy: data.upvotedBy ?? [],
          timestamp: data.timestamp,
        } as WebinarQuestion;
      });
    } catch (error) {
      this.handleError('get pending questions', error);
    }
  }

  /**
   * Submit a question (via API for validation)
   */
  async submitQuestion(
    sessionId: string,
    question: string,
    anonymous: boolean
  ): Promise<WebinarQuestion> {
    return this.authenticatedRequest<WebinarQuestion>('/api/webinar-live/questions', {
      method: 'POST',
      body: JSON.stringify({ sessionId, question, anonymous }),
    });
  }

  /**
   * Upvote a question
   */
  async upvoteQuestion(questionId: string): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/questions/${questionId}/upvote`,
      { method: 'POST' }
    );
  }

  // ============================================
  // Polls (Firestore Direct for Read)
  // ============================================

  /**
   * Transform stored poll format to frontend format
   * Backend stores votedBy as object { [userId]: optionIndex }
   * Frontend expects votedBy as string[] of user IDs
   */
  private transformPoll(doc: any): WebinarPoll {
    const data = doc.data ? doc.data() : doc;
    const id = doc.id || data.id;

    // Convert votedBy object to array of user IDs
    const votedByObject = data.votedBy || {};
    const votedByArray = Object.keys(votedByObject);

    // Determine status — preserve draft status so callers can filter appropriately
    const status = data.status || (data.active ? 'active' : 'closed');

    return {
      id,
      sessionId: data.sessionId,
      question: data.question,
      options: data.options || [],
      totalVotes: data.totalVotes || 0,
      status: status as 'draft' | 'active' | 'closed',
      votedBy: votedByArray,
      showResults: status === 'closed',
      createdAt: data.createdAt,
      closedAt: data.closedAt,
    };
  }

  /**
   * Get active polls for a session
   * Transforms stored format (votedBy object) to frontend format (votedBy array)
   */
  async getActivePolls(sessionId: string): Promise<WebinarPoll[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.POLLS_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformPoll(doc));
    } catch (error) {
      this.handleError('get active polls', error);
    }
  }

  /**
   * Get all polls for a session (active and closed, excluding drafts)
   * Transforms stored format to frontend format
   */
  async getAllPolls(sessionId: string): Promise<WebinarPoll[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.POLLS_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      // Filter out drafts and transform
      return snapshot.docs
        .map((doc) => this.transformPoll(doc))
        .filter((poll) => poll.status !== 'draft');
    } catch (error) {
      this.handleError('get all polls', error);
    }
  }

  /**
   * Get draft polls for a session (host only)
   */
  async getDraftPolls(sessionId: string): Promise<WebinarPoll[]> {
    try {
      const collectionName = this.getCollectionWithSuffix(this.POLLS_COLLECTION);
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        where('status', '==', 'draft'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.transformPoll(doc));
    } catch (error) {
      this.handleError('get draft polls', error);
    }
  }

  /**
   * Submit a vote on a poll
   */
  async submitVote(pollId: string, optionIndex: number): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/polls/${pollId}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ optionIndex }),
      }
    );
  }

  // ============================================
  // Host Controls (Backend API)
  // ============================================

  /**
   * Create a new poll (host only)
   * @param saveAsDraft - If true, saves poll as draft instead of activating immediately
   */
  async createPoll(
    sessionId: string,
    question: string,
    options: string[],
    saveAsDraft: boolean = false
  ): Promise<WebinarPoll> {
    return this.authenticatedRequest<WebinarPoll>('/api/webinar-live/polls', {
      method: 'POST',
      body: JSON.stringify({ sessionId, question, options, saveAsDraft }),
    });
  }

  /**
   * Activate a draft poll (host only)
   */
  async activatePoll(pollId: string): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/polls/${pollId}/activate`,
      { method: 'POST' }
    );
  }

  /**
   * Close a poll (host only)
   */
  async closePoll(pollId: string): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/polls/${pollId}/close`,
      { method: 'POST' }
    );
  }

  /**
   * Delete a poll (host only, for drafts)
   */
  async deletePoll(pollId: string): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/polls/${pollId}`,
      { method: 'DELETE' }
    );
  }

  /**
   * Answer a question (host only)
   */
  async answerQuestion(questionId: string, answer: string): Promise<void> {
    await this.authenticatedRequest<void>(
      `/api/webinar-live/questions/${questionId}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({ answer }),
      }
    );
  }

  /**
   * Toggle Q&A feature (host only)
   */
  async toggleQA(sessionId: string, enabled: boolean): Promise<void> {
    await this.authenticatedRequest<void>('/api/webinar-live/controls/qa', {
      method: 'POST',
      body: JSON.stringify({ sessionId, enabled }),
    });
  }

  /**
   * Toggle chat feature (host only)
   */
  async toggleChat(sessionId: string, enabled: boolean): Promise<void> {
    await this.authenticatedRequest<void>('/api/webinar-live/controls/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, enabled }),
    });
  }

  // ============================================
  // Recording Controls (Host Only)
  // ============================================

  /**
   * Start recording a session (host only)
   */
  async startRecording(sessionId: string): Promise<StartRecordingResponse> {
    return this.authenticatedRequest<StartRecordingResponse>(
      '/api/livekit/recordings/start',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    );
  }

  /**
   * Stop recording a session (host only)
   * Concatenates HLS segments into MP4 and uploads to GCS
   */
  async stopRecording(sessionId: string, egressId: string, startSegmentIndex: number): Promise<StopRecordingResponse> {
    return this.authenticatedRequest<StopRecordingResponse>('/api/livekit/recordings/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId, egressId, startSegmentIndex }),
    });
  }

  // ============================================
  // Session Management (Single Session per User)
  // ============================================

  /**
   * Generate a unique device ID for this browser/device
   * Stored in localStorage to persist across page reloads
   */
  getDeviceId(): string {
    const DEVICE_ID_KEY = 'bwm_device_id';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Get device info for session tracking
   */
  getDeviceInfo(): string {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[1] || 'Unknown Browser';
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[1] || 'Unknown OS';
    return `${browser} on ${os}${isMobile ? ' (Mobile)' : ''}`;
  }

  /**
   * Check if there's an existing active session for this user
   * Returns conflict info if another device is connected
   */
  async checkSessionConflict(sessionId: string): Promise<SessionConflictResponse> {
    try {
      const deviceId = this.getDeviceId();
      const response = await this.authenticatedRequest<SessionConflictResponse>(
        '/api/webinar-live/session/check',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId, deviceId }),
        }
      );
      return response;
    } catch {
      // If error, assume no conflict to allow connection attempt
      return { hasConflict: false };
    }
  }

  /**
   * Takeover session from another device
   * This will disconnect the other device and return a new token
   * @param sessionId - The webinar session ID
   * @param isHost - Whether the user is the host (grants publish permissions)
   */
  async takeoverSession(sessionId: string, isHost: boolean = false): Promise<TakeoverSessionResponse> {
    const deviceId = this.getDeviceId();
    const deviceInfo = this.getDeviceInfo();
    return this.authenticatedRequest<TakeoverSessionResponse>(
      '/api/webinar-live/session/takeover',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, deviceId, deviceInfo, isHost }),
      }
    );
  }

  /**
   * Register active session when joining
   * This creates a new active session record
   * @param sessionId - The webinar session ID
   * @param isHost - Whether the user is the host
   */
  async registerActiveSession(sessionId: string, isHost: boolean = false): Promise<{ success: boolean; sessionToken: string }> {
    const deviceId = this.getDeviceId();
    const deviceInfo = this.getDeviceInfo();
    return this.authenticatedRequest<{ success: boolean; sessionToken: string }>(
      '/api/webinar-live/session/register',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, deviceId, deviceInfo, isHost }),
      }
    );
  }

  /**
   * Send heartbeat to keep session active
   * Should be called every 30 seconds while connected
   */
  async sendSessionHeartbeat(sessionId: string): Promise<{ active: boolean; kicked: boolean; reason?: string }> {
    try {
      const deviceId = this.getDeviceId();
      return await this.authenticatedRequest<{ active: boolean; kicked: boolean; reason?: string }>(
        '/api/webinar-live/session/heartbeat',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId, deviceId }),
        }
      );
    } catch {
      // If error, assume still active
      return { active: true, kicked: false };
    }
  }

  /**
   * Disconnect session when leaving
   */
  async disconnectSession(sessionId: string): Promise<void> {
    try {
      const deviceId = this.getDeviceId();
      const token = await this.getAuthToken();
      if (!token) return;

      const apiUrl = this.getApiUrl();
      await fetch(`${apiUrl}/api/webinar-live/session/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, deviceId }),
        keepalive: true,
      });
    } catch {
      // Ignore errors on disconnect
    }
  }

  /**
   * Synchronous disconnect for use in beforeunload handlers.
   * Requires a pre-cached auth token since we can't await in beforeunload.
   */
  disconnectSessionBeacon(sessionId: string, authToken: string): void {
    try {
      const deviceId = this.getDeviceId();
      const apiUrl = this.getApiUrl();

      fetch(`${apiUrl}/api/webinar-live/session/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId, deviceId }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Ignore errors on beacon disconnect
    }
  }

  // ============================================
  // HLS Streaming (Viewer)
  // ============================================

  /**
   * Get HLS streaming status for a session
   * Used by WebinarRoom to determine if HLS stream is available
   * @param sessionId - The webinar session ID
   */
  async getHlsStatus(sessionId: string): Promise<{
    active: boolean;
    hlsUrl: string | null;
    egressId: string | null;
    startedAt: number | null;
  }> {
    const roomName = `webinar-${sessionId}`;
    return this.authenticatedRequest<{
      active: boolean;
      hlsUrl: string | null;
      egressId: string | null;
      startedAt: number | null;
    }>(`/api/livekit/hls/status/${roomName}`);
  }

  // ============================================
  // Recording Template Token (Internal Use)
  // ============================================

  /**
   * Get LiveKit token for recording template
   * Used by the egress recording template page
   * This is a special endpoint that doesn't require user authentication
   * but is only accessible from internal network (egress container)
   */
  async getRecordingToken(sessionId: string): Promise<JoinTokenResponse> {
    // Use public request since recording template runs without auth
    return this.publicRequest<JoinTokenResponse>(
      `/api/livekit/recording-token/${sessionId}`
    );
  }
}

// Export singleton instance and class
export const webinarLiveClient = new WebinarLiveClient();
