import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { getDbLazy } from '../firebase';
import { getCurrentEnvironment } from '../config/environment';
import { BaseClient } from './BaseClient';

import type {
  WebinarProduct,
  WebinarSession,
  WebinarRegistration,
  CreateWebinarData,
  UpdateWebinarData,
} from '../domain/products/models/webinar.model';

export class WebinarsClient extends BaseClient {
  protected collectionName = 'webinars';
  private sessionsCollectionName = 'webinar_sessions';
  private registrationsCollectionName = 'webinar_registrations';

  // ============================================
  // Helper Methods
  // ============================================

  private getSessionsCollectionName(): string {
    const env = this.getCurrentEnvironment();
    return env === 'test' ? `${this.sessionsCollectionName}_test` : this.sessionsCollectionName;
  }

  private getRegistrationsCollectionName(): string {
    const env = this.getCurrentEnvironment();
    return env === 'test' ? `${this.registrationsCollectionName}_test` : this.registrationsCollectionName;
  }

  private mapFirestoreDataToWebinarProduct(docId: string, data: any): WebinarProduct {
    // Handle host: support both new ID-only format (hostId) and legacy object format (host)
    let host = data.host || { id: '', name: '' };
    if (!host.id && data.hostId) {
      // New format: only hostId stored, construct minimal object
      host = { id: data.hostId, name: '', bio: null, avatar: null };
    }

    // Handle shadowHost: support both new ID-only format (shadowHostId) and legacy object format (shadowHost)
    let shadowHost = data.shadowHost || undefined;
    if (!shadowHost && data.shadowHostId) {
      // New format: only shadowHostId stored, construct minimal object
      shadowHost = { id: data.shadowHostId, email: '', name: '', avatar: null };
    }

    // Handle guestSpeakers: new format stores {id, isAdmin}, legacy stores full objects
    const guestSpeakers = (data.guestSpeakers || []).map((speaker: any) => ({
      id: speaker.id || '',
      name: speaker.name || '',
      bio: speaker.bio || null,
      avatar: speaker.avatar || null,
      isAdmin: speaker.isAdmin || false,
    }));

    return {
      id: docId,
      slug: data.slug,
      name: data.name || '',
      description: data.description || '',
      highlightDescription: data.highlightDescription,
      emoji: data.emoji || '🎥',
      language: data.language || 'en',
      basePrices: data.basePrices || { pln: 0 },
      category: data.category || '',
      tags: data.tags || [],
      host,
      guestSpeakers,
      shadowHost,
      webinarType: data.webinarType || 'single',
      workshopDays: data.workshopDays,
      capacity: data.capacity || 100,
      duration: data.duration || 60,
      coverUrl: data.coverUrl,
      coverUrls: data.coverUrls,
      coverPath: data.coverPath,
      rating: data.rating || 0,
      totalReviews: data.totalReviews || 0,
      isActive: data.isActive ?? true,
      environment: data.environment || 'prod',
      archived: data.archived ?? false,
      archivedAt: data.archivedAt,
      archivedBy: data.archivedBy,
      archiveReason: data.archiveReason,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt,
      stripe: data.stripe,
      faqs: data.faqs || [],
    };
  }

  private mapFirestoreDataToWebinarSession(docId: string, data: any): WebinarSession {
    return {
      id: docId,
      webinarId: data.webinarId,
      scheduledAt: data.scheduledAt,
      endAt: data.endAt,
      status: data.status || 'scheduled',
      registeredCount: data.registeredCount || 0,
      attendedCount: data.attendedCount || 0,
      peakAttendees: data.peakAttendees,
      livekitRoomName: data.livekitRoomName,
      livekitRoomSid: data.livekitRoomSid,
      recordingStatus: data.recordingStatus || 'none',
      recordingUrl: data.recordingUrl,
      recordingPath: data.recordingPath,
      recordingDuration: data.recordingDuration,
      egressId: data.egressId,
      environment: data.environment || 'prod',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    };
  }

  // ============================================
  // Public Methods (Frontend - Firestore Direct)
  // ============================================

  async getWebinars(): Promise<WebinarProduct[]> {
    try {
      const collectionName = this.getCollectionName();
      const currentEnv = await getCurrentEnvironment();

      const q = query(
        collection(getDbLazy(), collectionName),
        where('environment', '==', currentEnv),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const webinars: WebinarProduct[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        webinars.push(this.mapFirestoreDataToWebinarProduct(doc.id, data));
      });

      return webinars;
    } catch (error) {
      throw new Error('Failed to get webinars');
    }
  }

  /**
   * Get webinar by ID or slug from API
   * Backend handles both ID and slug lookup
   */
  async getWebinarById(id: string): Promise<WebinarProduct | null> {
    try {
      const result = await this.publicRequest<{ success: boolean; webinar: any }>(`/api/webinars/${id}`);

      if (!result.success || !result.webinar) {
        return null;
      }

      const webinar: WebinarProduct = {
        id: result.webinar.id,
        slug: result.webinar.slug,
        name: result.webinar.name || '',
        description: result.webinar.description || '',
        highlightDescription: result.webinar.highlightDescription,
        emoji: result.webinar.emoji || '🎥',
        language: result.webinar.language || 'en',
        basePrices: result.webinar.basePrices || { pln: 0 },
        category: result.webinar.category || '',
        tags: result.webinar.tags || [],
        host: result.webinar.host || { id: '', name: '' },
        guestSpeakers: result.webinar.guestSpeakers || [],
        shadowHost: result.webinar.shadowHost || undefined,
        webinarType: result.webinar.webinarType || 'single',
        workshopDays: result.webinar.workshopDays,
        capacity: result.webinar.capacity || 100,
        duration: result.webinar.duration || 60,
        coverUrl: result.webinar.coverUrl,
        coverUrls: result.webinar.coverUrls,
        coverPath: result.webinar.coverPath,
        rating: result.webinar.rating || 0,
        totalReviews: result.webinar.totalReviews || 0,
        isActive: result.webinar.isActive ?? true,
        environment: result.webinar.environment || 'prod',
        archived: result.webinar.archived || false,
        archivedAt: result.webinar.archivedAt,
        archivedBy: result.webinar.archivedBy,
        archiveReason: result.webinar.archiveReason,
        createdAt: result.webinar.createdAt,
        updatedAt: result.webinar.updatedAt,
        stripe: result.webinar.stripe,
        faqs: result.webinar.faqs || [],
      };

      return webinar;
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null;
      }
      throw new Error('Failed to get webinar');
    }
  }

  async getWebinarBySlug(slug: string): Promise<WebinarProduct | null> {
    // The getWebinarById method handles both ID and slug lookup via the API
    return this.getWebinarById(slug);
  }

  /**
   * Get active webinars from API
   * Uses backend REST API
   */
  async getActiveWebinars(limitCount: number = 10): Promise<WebinarProduct[]> {
    try {
      const result = await this.publicRequest<{ success: boolean; webinars: any[]; total: number }>(`/api/webinars?limit=${limitCount}&offset=0&activeOnly=true`);

      if (!result.success) {
        return [];
      }

      const webinars: WebinarProduct[] = result.webinars.map((webinar) => ({
        id: webinar.id,
        slug: webinar.slug,
        name: webinar.name || '',
        description: webinar.description || '',
        highlightDescription: webinar.highlightDescription,
        emoji: webinar.emoji || '🎥',
        language: webinar.language || 'en',
        basePrices: webinar.basePrices || { pnl: 0, usd: 0, eur: 0 },
        category: webinar.category || '',
        tags: webinar.tags || [],
        host: webinar.host || { id: '', name: '' },
        guestSpeakers: webinar.guestSpeakers || [],
        shadowHost: webinar.shadowHost || undefined,
        webinarType: webinar.webinarType || 'single',
        workshopDays: webinar.workshopDays,
        capacity: webinar.capacity || 100,
        duration: webinar.duration || 60,
        coverUrl: webinar.coverUrl,
        coverUrls: webinar.coverUrls,
        coverPath: webinar.coverPath,
        rating: webinar.rating || 0,
        totalReviews: webinar.totalReviews || 0,
        isActive: webinar.isActive ?? true,
        environment: webinar.environment || 'prod',
        archived: false,
        createdAt: webinar.createdAt || new Date(),
        updatedAt: webinar.updatedAt,
        stripe: webinar.stripe,
        faqs: webinar.faqs || [],
      }));

      return webinars;
    } catch (error: any) {
      return [];
    }
  }

  /**
   * Get ALL webinars from API (including inactive)
   * Used for coach dashboard to manage all their webinars
   */
  async getAllWebinars(limitCount: number = 100): Promise<WebinarProduct[]> {
    try {
      const result = await this.publicRequest<{ success: boolean; webinars: any[]; total: number }>(`/api/webinars?limit=${limitCount}&offset=0&activeOnly=false`);

      if (!result.success) {
        return [];
      }

      const webinars: WebinarProduct[] = result.webinars.map((webinar) => ({
        id: webinar.id,
        slug: webinar.slug,
        name: webinar.name || '',
        description: webinar.description || '',
        highlightDescription: webinar.highlightDescription,
        emoji: webinar.emoji || '🎥',
        language: webinar.language || 'en',
        basePrices: webinar.basePrices || { pnl: 0, usd: 0, eur: 0 },
        category: webinar.category || '',
        tags: webinar.tags || [],
        host: webinar.host || { id: '', name: '' },
        guestSpeakers: webinar.guestSpeakers || [],
        shadowHost: webinar.shadowHost || undefined,
        webinarType: webinar.webinarType || 'single',
        workshopDays: webinar.workshopDays,
        capacity: webinar.capacity || 100,
        duration: webinar.duration || 60,
        coverUrl: webinar.coverUrl,
        coverUrls: webinar.coverUrls,
        coverPath: webinar.coverPath,
        rating: webinar.rating || 0,
        totalReviews: webinar.totalReviews || 0,
        isActive: webinar.isActive ?? true,
        environment: webinar.environment || 'prod',
        archived: false,
        createdAt: webinar.createdAt || new Date(),
        updatedAt: webinar.updatedAt,
        stripe: webinar.stripe,
        faqs: webinar.faqs || [],
      }));

      return webinars;
    } catch (error: any) {
      return [];
    }
  }

  async getWebinarsByCategory(category: string): Promise<WebinarProduct[]> {
    try {
      const collectionName = this.getCollectionName();
      const q = query(
        collection(getDbLazy(), collectionName),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const webinars: WebinarProduct[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const webinar = this.mapFirestoreDataToWebinarProduct(doc.id, data);
        if (!webinar.archived) {
          webinars.push(webinar);
        }
      });

      return webinars;
    } catch (error) {
      throw new Error('Failed to get webinars by category');
    }
  }

  async getWebinarsByLanguage(language: 'en' | 'es' | 'pl'): Promise<WebinarProduct[]> {
    try {
      const collectionName = this.getCollectionName();
      const q = query(
        collection(getDbLazy(), collectionName),
        where('language', '==', language),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const webinars: WebinarProduct[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const webinar = this.mapFirestoreDataToWebinarProduct(doc.id, data);
        if (!webinar.archived) {
          webinars.push(webinar);
        }
      });

      return webinars;
    } catch (error) {
      throw new Error('Failed to get webinars by language');
    }
  }

  // Get non-archived webinars
  async getNonArchivedWebinars(): Promise<WebinarProduct[]> {
    try {
      const collectionName = this.getCollectionName();
      const currentEnv = await getCurrentEnvironment();

      console.log('🎥 [WebinarsClient] getNonArchivedWebinars:', {
        collectionName,
        currentEnv,
      });

      // Simple query - just get all docs without ordering to avoid index issues
      const collectionRef = collection(getDbLazy(), collectionName);
      console.log('🎥 [WebinarsClient] Fetching from collection...');

      let querySnapshot;
      try {
        querySnapshot = await getDocs(collectionRef);
        console.log('🎥 [WebinarsClient] Query completed');
      } catch (queryError: any) {
        console.error('🎥 [WebinarsClient] Query error:', queryError?.message || queryError);
        throw queryError;
      }
      const webinars: WebinarProduct[] = [];

      console.log('🎥 [WebinarsClient] Found docs:', querySnapshot.size);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🎥 [WebinarsClient] Doc:', doc.id, {
          archived: data.archived,
          environment: data.environment,
        });
        const webinar = this.mapFirestoreDataToWebinarProduct(doc.id, data);
        // Filter by environment and non-archived in memory
        if (!webinar.archived && webinar.environment === currentEnv) {
          webinars.push(webinar);
        }
      });

      console.log('🎥 [WebinarsClient] Filtered webinars:', webinars.length);

      return webinars;
    } catch (error: any) {
      // Return empty array for missing index or empty collection
      console.warn('getNonArchivedWebinars:', error?.message || error);
      return [];
    }
  }

  // Get archived webinars
  async getArchivedWebinars(): Promise<WebinarProduct[]> {
    try {
      const collectionName = this.getCollectionName();
      const currentEnv = await getCurrentEnvironment();

      // Simple query without composite index requirement
      const q = query(
        collection(getDbLazy(), collectionName),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const webinars: WebinarProduct[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const webinar = this.mapFirestoreDataToWebinarProduct(doc.id, data);
        // Filter by environment and archived in memory
        if (webinar.archived && webinar.environment === currentEnv) {
          webinars.push(webinar);
        }
      });

      return webinars;
    } catch (error: any) {
      // Return empty array for missing index or empty collection
      console.warn('getArchivedWebinars:', error?.message || error);
      return [];
    }
  }

  // ============================================
  // Session Methods (Frontend - Firestore Direct)
  // ============================================

  async getSessionsByWebinarId(webinarId: string): Promise<WebinarSession[]> {
    try {
      const collectionName = this.getSessionsCollectionName();
      const q = query(
        collection(getDbLazy(), collectionName),
        where('webinarId', '==', webinarId),
        orderBy('scheduledAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const sessions: WebinarSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push(this.mapFirestoreDataToWebinarSession(doc.id, data));
      });

      return sessions;
    } catch (error) {
      throw new Error('Failed to get webinar sessions');
    }
  }

  async getSessionById(sessionId: string): Promise<WebinarSession | null> {
    try {
      const collectionName = this.getSessionsCollectionName();
      const docRef = doc(getDbLazy(), collectionName, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapFirestoreDataToWebinarSession(docSnap.id, docSnap.data());
    } catch (error) {
      throw new Error('Failed to get webinar session');
    }
  }

  async getUpcomingSessions(limitCount: number = 5): Promise<WebinarSession[]> {
    try {
      const collectionName = this.getSessionsCollectionName();
      const now = new Date().toISOString();

      const q = query(
        collection(getDbLazy(), collectionName),
        where('status', '==', 'scheduled'),
        where('scheduledAt', '>=', now),
        orderBy('scheduledAt', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions: WebinarSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push(this.mapFirestoreDataToWebinarSession(doc.id, data));
      });

      return sessions;
    } catch (error) {
      throw new Error('Failed to get upcoming sessions');
    }
  }

  // ============================================
  // Admin Methods (Backend API)
  // ============================================

  /**
   * Create webinar via API
   */
  async createWebinar(webinarData: CreateWebinarData): Promise<WebinarProduct> {
    try {
      const currentEnv = await getCurrentEnvironment();

      const response = await this.authenticatedRequest<{
        success: boolean;
        id: string;
        webinar?: any;
        message?: string;
      }>('/api/webinars', {
        method: 'POST',
        body: JSON.stringify({
          ...webinarData,
          isActive: true,
          archived: false,
          environment: currentEnv,
        }),
      });

      if (!response.success) {
        throw new Error('Failed to create webinar via API');
      }

      const webinarId = response.id || response.webinar?.id;
      if (!webinarId) {
        throw new Error('No webinar ID returned from API');
      }

      return {
        id: webinarId,
        ...webinarData,
        isActive: true,
        archived: false,
        environment: currentEnv,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WebinarProduct;
    } catch (error) {
      throw new Error('Failed to create webinar');
    }
  }

  /**
   * Update webinar via API
   */
  async updateWebinar(id: string, webinarData: UpdateWebinarData): Promise<WebinarProduct> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message?: string;
      }>(`/api/webinars/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(webinarData),
      });

      if (!response.success) {
        throw new Error('Failed to update webinar via API');
      }

      return {
        id,
        ...webinarData,
        updatedAt: new Date(),
      } as WebinarProduct;
    } catch (error) {
      throw new Error('Failed to update webinar');
    }
  }

  /**
   * Archive webinar via API (soft delete)
   */
  async archiveWebinar(id: string, _reason?: string, _archivedBy?: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message?: string;
      }>(`/api/webinars/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error('Failed to archive webinar via API');
      }
    } catch (error) {
      throw new Error('Failed to archive webinar');
    }
  }

  /**
   * Unarchive webinar via API (toggle back to active)
   */
  async unarchiveWebinar(id: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message?: string;
      }>(`/api/webinars/${id}/toggle`, {
        method: 'PATCH',
      });

      if (!response.success) {
        throw new Error('Failed to unarchive webinar via API');
      }
    } catch (error) {
      throw new Error('Failed to unarchive webinar');
    }
  }

  /**
   * Toggle webinar status via API
   */
  async toggleWebinarStatus(id: string, _isActive: boolean): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message?: string;
      }>(`/api/webinars/${id}/toggle`, {
        method: 'PATCH',
      });

      if (!response.success) {
        throw new Error('Failed to toggle webinar status via API');
      }
    } catch (error) {
      throw new Error('Failed to toggle webinar status');
    }
  }

  /**
   * Delete webinar (archives instead of deleting)
   */
  async deleteWebinar(id: string): Promise<void> {
    try {
      await this.archiveWebinar(id, 'Deleted by admin', 'system');
    } catch (error) {
      throw new Error('Failed to archive webinar');
    }
  }

  /**
   * Check if a webinar can be permanently deleted (no purchases)
   */
  async canDelete(id: string): Promise<{ canDelete: boolean; purchaseCount: number }> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        canDelete: boolean;
        purchaseCount: number;
      }>(`/api/webinars/${id}/can-delete`, {
        method: 'GET',
      });

      return {
        canDelete: response.canDelete,
        purchaseCount: response.purchaseCount,
      };
    } catch (error) {
      console.error('Error checking canDelete:', error);
      throw new Error('Failed to check delete eligibility');
    }
  }

  /**
   * Permanently delete a webinar (only if no purchases exist)
   */
  async permanentlyDeleteWebinar(id: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message: string;
      }>(`/api/webinars/${id}/permanent`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete webinar');
      }
    } catch (error: any) {
      // Check if error is due to existing purchases
      if (error?.message?.includes('purchase')) {
        throw new Error(error.message);
      }
      throw new Error('Failed to permanently delete webinar');
    }
  }

  // ============================================
  // Registration Methods
  // ============================================

  /**
   * Get user's registration for a session
   */
  async getUserRegistration(sessionId: string, userId: string): Promise<WebinarRegistration | null> {
    try {
      const collectionName = this.getRegistrationsCollectionName();
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        where('userId', '==', userId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        webinarId: data.webinarId,
        sessionId: data.sessionId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        status: data.status || 'registered',
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
        watchTime: data.watchTime,
        orderId: data.orderId,
        purchaseKey: data.purchaseKey,
        environment: data.environment || 'prod',
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      throw new Error('Failed to get user registration');
    }
  }

  /**
   * Get all registrations for a session (admin)
   */
  async getSessionRegistrations(sessionId: string): Promise<WebinarRegistration[]> {
    try {
      const collectionName = this.getRegistrationsCollectionName();
      const q = query(
        collection(getDbLazy(), collectionName),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const registrations: WebinarRegistration[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registrations.push({
          id: doc.id,
          webinarId: data.webinarId,
          sessionId: data.sessionId,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          status: data.status || 'registered',
          joinedAt: data.joinedAt,
          leftAt: data.leftAt,
          watchTime: data.watchTime,
          orderId: data.orderId,
          purchaseKey: data.purchaseKey,
          environment: data.environment || 'prod',
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt,
        });
      });

      return registrations;
    } catch (error) {
      throw new Error('Failed to get session registrations');
    }
  }

  /**
   * Register user for a webinar session via API
   */
  async registerForSession(webinarId: string, sessionId: string): Promise<WebinarRegistration> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        registration: WebinarRegistration;
        message: string;
      }>('/api/webinar/register', {
        method: 'POST',
        body: JSON.stringify({ webinarId, sessionId }),
      });

      if (!response.success || !response.registration) {
        throw new Error('Failed to register for session');
      }

      return response.registration;
    } catch (error) {
      throw new Error('Failed to register for webinar session');
    }
  }

  // ============================================
  // LiveKit Room Methods (Backend API)
  // ============================================

  /**
   * Get LiveKit token for joining webinar
   */
  async getJoinToken(sessionId: string): Promise<{ token: string; roomName: string }> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        token: string;
        roomName: string;
      }>(`/api/webinar/session/${sessionId}/join-token`, {
        method: 'POST',
      });

      if (!response.success || !response.token) {
        throw new Error('Failed to get join token');
      }

      return {
        token: response.token,
        roomName: response.roomName,
      };
    } catch (error) {
      throw new Error('Failed to get webinar join token');
    }
  }

  /**
   * Start webinar session (host only)
   */
  async startSession(sessionId: string): Promise<{ token: string; roomName: string }> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        token: string;
        roomName: string;
        message: string;
      }>(`/api/admin/webinar/session/${sessionId}/start`, {
        method: 'POST',
      });

      if (!response.success || !response.token) {
        throw new Error('Failed to start session');
      }

      return {
        token: response.token,
        roomName: response.roomName,
      };
    } catch (error) {
      throw new Error('Failed to start webinar session');
    }
  }

  /**
   * End webinar session (host only)
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message: string;
      }>(`/api/admin/webinar/session/${sessionId}/end`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Failed to end session');
      }
    } catch (error) {
      throw new Error('Failed to end webinar session');
    }
  }

  /**
   * Start recording (host only)
   */
  async startRecording(sessionId: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        egressId: string;
        message: string;
      }>(`/api/admin/webinar/session/${sessionId}/recording/start`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Failed to start recording');
      }
    } catch (error) {
      throw new Error('Failed to start webinar recording');
    }
  }

  /**
   * Stop recording (host only)
   */
  async stopRecording(sessionId: string): Promise<void> {
    try {
      const response = await this.authenticatedRequest<{
        success: boolean;
        message: string;
      }>(`/api/admin/webinar/session/${sessionId}/recording/stop`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Failed to stop recording');
      }
    } catch (error) {
      throw new Error('Failed to stop webinar recording');
    }
  }
}

// Singleton instance
export const webinarsClient = new WebinarsClient();
