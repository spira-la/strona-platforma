import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
  type VideoGrant,
} from 'livekit-server-sdk';

export interface TokenResponse {
  token: string;
  roomName: string;
  participantIdentity: string;
  serverUrl: string;
  isHost: boolean;
  expiresAt: number;
}

export interface GenerateTokenOptions {
  isHost?: boolean; // Coach — can control the session
  isSpeaker?: boolean; // Client — can publish audio/video
  canPublishScreen?: boolean;
  ttlSeconds?: number;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * LivekitService — wraps livekit-server-sdk for room + token management.
 * Ported from BeWonderMe. Focused on 1-on-1 coaching sessions; webinar-specific
 * features (HLS, egress, scene controls) live behind the `webinars` feature
 * flag and are not included here.
 */
@Injectable()
export class LivekitService implements OnModuleInit {
  private readonly logger = new Logger(LivekitService.name);
  private roomService: RoomServiceClient | null = null;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly httpUrl: string;
  private readonly publicWsUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('LIVEKIT_API_KEY') ?? '';
    this.apiSecret = this.config.get<string>('LIVEKIT_API_SECRET') ?? '';

    const defaultLivekitUrl = 'http://livekit:7880'; // eslint-disable-line sonarjs/no-clear-text-protocols -- internal Docker service URL
    this.httpUrl =
      this.config.get<string>('LIVEKIT_HTTP_URL') ?? defaultLivekitUrl;
    this.publicWsUrl =
      this.config.get<string>('LIVEKIT_PUBLIC_WS_URL') ??
      'wss://stream.spira-la.com';
  }

  onModuleInit(): void {
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn(
        'LiveKit credentials missing (LIVEKIT_API_KEY / LIVEKIT_API_SECRET) — service disabled',
      );
      return;
    }
    try {
      this.roomService = new RoomServiceClient(
        this.httpUrl,
        this.apiKey,
        this.apiSecret,
      );
      this.logger.log(`LiveKit initialized → ${this.httpUrl}`);
    } catch (error) {
      this.logger.error(
        `Failed to init LiveKit RoomServiceClient: ${(error as Error).message}`,
      );
    }
  }

  isAvailable(): boolean {
    return !!this.roomService && !!this.apiKey && !!this.apiSecret;
  }

  /**
   * Generate an access token for a participant to join a room.
   * Host (coach): can publish + admin permissions.
   * Speaker (client): can publish audio/video/screen but not admin.
   * Otherwise viewer (subscribe-only).
   */
  async generateToken(
    roomName: string,
    participantIdentity: string,
    opts: GenerateTokenOptions = {},
  ): Promise<TokenResponse> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        'LiveKit is not configured — set LIVEKIT_API_KEY and LIVEKIT_API_SECRET',
      );
    }

    const {
      isHost = false,
      isSpeaker = false,
      canPublishScreen = true,
      ttlSeconds = 6 * 60 * 60,
      displayName,
      avatarUrl,
    } = opts;

    const canPublish = isHost || isSpeaker;
    const sources: TrackSource[] = [];
    if (canPublish) {
      sources.push(TrackSource.MICROPHONE, TrackSource.CAMERA);
      if (canPublishScreen) {
        sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
      }
    }

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    };
    if (canPublish && sources.length > 0) {
      grant.canPublishSources = sources;
    }

    const roleWhenNotHost = isSpeaker ? 'speaker' : 'viewer';
    const role = isHost ? 'host' : roleWhenNotHost;

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: displayName ?? participantIdentity,
      ttl: ttlSeconds,
      metadata: JSON.stringify({
        role,
        canControl: isHost,
        ...(avatarUrl ? { avatarUrl } : {}),
      }),
    });
    at.addGrant(grant);

    const token = await at.toJwt();
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;

    return {
      token,
      roomName,
      participantIdentity,
      serverUrl: this.publicWsUrl,
      isHost,
      expiresAt,
    };
  }

  /**
   * Optionally pre-create a room. LiveKit auto-creates on first join, so
   * this is only needed if you want to set custom room metadata upfront.
   */
  async ensureRoom(
    roomName: string,
    options: {
      maxParticipants?: number;
      emptyTimeout?: number;
      metadata?: string;
    } = {},
  ): Promise<void> {
    if (!this.roomService) return;
    try {
      await this.roomService.createRoom({
        name: roomName,
        maxParticipants: options.maxParticipants ?? 10,
        emptyTimeout: options.emptyTimeout ?? 5 * 60,
        metadata: options.metadata,
      });
    } catch (error) {
      // "already exists" is expected and fine.
      const msg = (error as Error).message ?? '';
      if (!/already exists|duplicate/i.test(msg)) {
        this.logger.warn(`createRoom(${roomName}) failed: ${msg}`);
      }
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    if (!this.roomService) return;
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (error) {
      this.logger.warn(
        `deleteRoom(${roomName}) failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Whether a room currently exists on the LiveKit server and how many
   * participants it has. Used by clients to detect "coach has started" so
   * they can join early (within the BWM 30-min before-window pattern).
   */
  async getRoomStatus(
    roomName: string,
  ): Promise<{ active: boolean; participantCount: number }> {
    if (!this.roomService) return { active: false, participantCount: 0 };
    try {
      const rooms = await this.roomService.listRooms([roomName]);
      if (rooms.length === 0) {
        return { active: false, participantCount: 0 };
      }
      const room = rooms[0];
      return {
        active: room.numParticipants > 0,
        participantCount: room.numParticipants,
      };
    } catch (error) {
      this.logger.warn(
        `getRoomStatus(${roomName}) failed: ${(error as Error).message}`,
      );
      return { active: false, participantCount: 0 };
    }
  }
}
