import { api } from '@/clients/api';

export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
  participantIdentity: string;
  serverUrl: string;
  isHost: boolean;
  expiresAt: number;
}

export interface MeetingTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  participantIdentity: string;
  isHost: boolean;
}

export interface MeetingRecordingResponse {
  egressId: string;
  startSegmentIndex: number;
  roomName: string;
  hlsEgressId?: string;
}

export interface HlsStartResponse {
  egressId: string;
  roomName: string;
  hlsUrl: string;
  status: string;
  startedAt: number;
}

export interface HlsStatusResponse {
  active: boolean;
  hlsUrl: string | null;
  egressId: string | null;
  startedAt: number | null;
}

export interface RecordingStartResponse {
  egressId: string;
  roomName: string;
  startSegmentIndex: number;
  status: string;
}

export interface RecordingStopResponse {
  url: string;
  path: string;
  duration: number;
  egressId: string;
  roomName: string;
  status: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const livekitClient = {
  config(): Promise<{ available: boolean; egressAvailable: boolean }> {
    return api.get<{ available: boolean; egressAvailable: boolean }>(
      '/livekit/config',
    );
  },

  tokenForBooking(payload: {
    bookingId: string;
    userId?: string | null;
    displayName?: string;
  }): Promise<LiveKitTokenResponse> {
    return api
      .post<Envelope<LiveKitTokenResponse>>('/livekit/token/booking', payload)
      .then((r) => r.data);
  },

  // ---- Meeting (1-on-1) flow — replicates BWM MeetingClient ----

  /**
   * Coach starts recording. Flow: ensure HLS active → mark current segment
   * index. The coach stops it later, which concatenates segments into MP4.
   */
  async startRecording(
    bookingId: string,
    userId?: string | null,
  ): Promise<MeetingRecordingResponse> {
    const roomName = `meeting-${bookingId}`;

    let hlsEgressId: string | undefined;
    try {
      const status = await api.get<HlsStatusResponse>(
        `/livekit/hls/status/${encodeURIComponent(roomName)}`,
      );
      if (status.active && status.egressId) {
        hlsEgressId = status.egressId;
      }
    } catch {
      // continue — will start fresh
    }

    if (!hlsEgressId) {
      const hlsResult = await api.post<HlsStartResponse>('/livekit/hls/start', {
        bookingId,
        userId,
      });
      hlsEgressId = hlsResult.egressId;
      await waitForHlsActive(roomName);
    }

    const recording = await api.post<RecordingStartResponse>(
      '/livekit/recordings/start',
      { bookingId, userId },
    );

    return {
      egressId: recording.egressId,
      startSegmentIndex: recording.startSegmentIndex,
      roomName: recording.roomName,
      hlsEgressId,
    };
  },

  async stopRecording(
    egressId: string,
    bookingId: string,
    startSegmentIndex: number,
    userId?: string | null,
  ): Promise<RecordingStopResponse> {
    const result = await api.post<RecordingStopResponse>(
      '/livekit/recordings/stop',
      { egressId, bookingId, startSegmentIndex, userId },
    );

    try {
      await api.post('/livekit/hls/stop', { bookingId, userId });
    } catch (error) {
      // HLS may have already been stopped — log and move on
      console.warn('[livekit] hls/stop failed:', (error as Error).message);
    }

    return result;
  },

  async getMeetingToken(
    bookingId: string,
    participantName: string,
    isCoach: boolean,
    userId?: string | null,
  ): Promise<MeetingTokenResponse> {
    const res = await api.post<Envelope<LiveKitTokenResponse>>(
      '/livekit/token/booking',
      {
        bookingId,
        userId,
        displayName: participantName,
      },
    );
    void isCoach; // role is decided server-side from userId↔coach.userId
    return {
      token: res.data.token,
      roomName: res.data.roomName,
      serverUrl: res.data.serverUrl,
      participantIdentity: res.data.participantIdentity,
      isHost: res.data.isHost,
    };
  },

  async checkRoomActive(bookingId: string): Promise<boolean> {
    const roomName = `meeting-${bookingId}`;
    try {
      const res = await api.get<{
        active: boolean;
        participantCount: number;
      }>(`/livekit/rooms/${encodeURIComponent(roomName)}/status`);
      return res.active && res.participantCount > 0;
    } catch {
      return false;
    }
  },
};

async function waitForHlsActive(
  roomName: string,
  maxAttempts = 10,
  intervalMs = 2000,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      const status = await api.get<HlsStatusResponse>(
        `/livekit/hls/status/${encodeURIComponent(roomName)}`,
      );
      if (status.active) return;
    } catch {
      // keep polling
    }
  }
}

export const meetingClient = livekitClient;
