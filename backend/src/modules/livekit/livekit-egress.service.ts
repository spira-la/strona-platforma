import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EgressClient,
  EncodedFileType,
  EncodedFileOutput,
  SegmentedFileOutput,
  SegmentedFileProtocol,
  type EgressInfo,
  EncodingOptionsPreset,
} from 'livekit-server-sdk';
import * as fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { RecordingFormat } from './dto/start-recording.dto.js';
import { StorageService } from '../../core/storage.service.js';

const execFileAsync = promisify(execFile);

/**
 * Egress status types matching LiveKit's protobuf enum (string form).
 */
export type EgressStatus =
  | 'EGRESS_STARTING'
  | 'EGRESS_ACTIVE'
  | 'EGRESS_ENDING'
  | 'EGRESS_COMPLETE'
  | 'EGRESS_FAILED'
  | 'EGRESS_ABORTED'
  | 'EGRESS_LIMIT_REACHED'
  | 'UNKNOWN';

export interface EgressResponse {
  egressId: string;
  roomName: string;
  status: EgressStatus;
  startedAt?: number;
  endedAt?: number;
  error?: string;
  fileUri?: string;
}

export interface HlsEgressResponse {
  egressId: string;
  roomName: string;
  hlsUrl: string;
  status: EgressStatus;
  startedAt?: number;
}

/**
 * LiveKit Egress Service — ported from BeWonderMe.
 *
 * Architecture (HLS-based recording):
 *  - When a meeting starts, the coach kicks off a single HLS egress.
 *    LiveKit writes 1-second .ts segments + live.m3u8 to /hls/<roomName>/.
 *  - "Start recording" is a no-op on egress: we just remember the current
 *    segment index. "Stop recording" reads the current segment index again
 *    and ffmpeg-concats segments [start..end] into a single MP4.
 *  - This avoids running two parallel egress (HLS + MP4) which would double
 *    CPU usage. CPU cost ~50% lower than dual-egress recording.
 *
 * Storage: BeWonderMe uploaded to GCS; Spirala uploads to Cloudflare R2 via
 * the existing StorageService.
 */
@Injectable()
export class LivekitEgressService implements OnModuleInit {
  private readonly logger = new Logger(LivekitEgressService.name);
  private egressClient: EgressClient | null = null;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly livekitHost: string;
  private readonly recordingTemplateBaseUrl: string | null;
  private readonly recordingApiKey: string | null;
  private readonly recordingInternalApiUrl: string | null;
  private readonly hlsOutputPath: string;
  private readonly hlsBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {
    const httpUrl = this.configService.get<string>('LIVEKIT_HTTP_URL');
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- internal Docker service URL, not a public HTTP call
    this.livekitHost = httpUrl ?? 'http://livekit:7880';
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY') ?? '';
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') ?? '';

    this.recordingTemplateBaseUrl =
      this.configService.get<string>('RECORDING_TEMPLATE_URL') || null;
    this.recordingApiKey =
      this.configService.get<string>('RECORDING_API_KEY') || null;
    this.recordingInternalApiUrl =
      this.configService.get<string>('RECORDING_INTERNAL_API_URL') || null;

    this.hlsOutputPath =
      this.configService.get<string>('HLS_OUTPUT_PATH') ?? '/hls';
    this.hlsBaseUrl =
      this.configService.get<string>('HLS_BASE_URL') ??
      'https://stream.spira-la.com/hls';
  }

  onModuleInit(): void {
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn(
        'LiveKit API credentials missing — egress service disabled',
      );
      return;
    }

    try {
      this.egressClient = new EgressClient(
        this.livekitHost,
        this.apiKey,
        this.apiSecret,
      );
      this.logger.log(`LiveKit Egress initialized → ${this.livekitHost}`);

      if (this.recordingTemplateBaseUrl) {
        this.logger.log(
          `Recording template URL: ${this.recordingTemplateBaseUrl}`,
        );
      } else {
        this.logger.warn(
          'RECORDING_TEMPLATE_URL not set — recordings will use grid layout',
        );
      }

      // Cleanup orphaned egress after services have warmed up.
      setTimeout(() => void this.cleanupOrphanedEgress(), 10_000);
    } catch (error) {
      this.logger.error(
        `Failed to init LiveKit EgressClient: ${(error as Error).message}`,
      );
    }
  }

  isAvailable(): boolean {
    return !!this.egressClient && !!this.apiKey && !!this.apiSecret;
  }

  private ensureAvailable(): void {
    if (!this.isAvailable()) {
      throw new Error(
        'LiveKit Egress not configured (LIVEKIT_API_KEY/SECRET missing)',
      );
    }
  }

  /**
   * Build the URL the egress Chrome will load to render the scene.
   * Includes recordingKey (auth) and internalApiUrl (Docker-network access
   * to the backend, since Chrome inside the egress container can't resolve
   * the public API domain).
   */
  private buildTemplateUrl(sessionOrBookingId: string): string | undefined {
    if (!this.recordingTemplateBaseUrl) return undefined;

    const baseUrl = `${this.recordingTemplateBaseUrl}/${sessionOrBookingId}`;
    const params = new URLSearchParams();
    if (this.recordingApiKey) params.set('recordingKey', this.recordingApiKey);
    if (this.recordingInternalApiUrl)
      params.set('internalApiUrl', this.recordingInternalApiUrl);
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  // ============================================================
  // HLS streaming egress (started ONCE per meeting; recording uses it)
  // ============================================================

  async startHlsEgress(
    roomName: string,
    options: { sessionId?: string; segmentDuration?: number } = {},
  ): Promise<HlsEgressResponse> {
    this.ensureAvailable();
    const { sessionId, segmentDuration = 1 } = options;

    // Best-effort cleanup of any leftover egress for this room.
    await this.stopAllActiveEgress(roomName);

    // Wipe stale HLS files so viewers don't see content from a prior session.
    const hlsDir = `${this.hlsOutputPath}/${roomName}`;
    if (fs.existsSync(hlsDir)) {
      try {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      } catch (error) {
        this.logger.warn(
          `Failed to clean stale HLS for ${roomName}: ${(error as Error).message}`,
        );
      }
    }

    const effectiveId =
      sessionId ?? roomName.replace(/^(webinar|meeting)-/, '');
    const customBaseUrl = this.buildTemplateUrl(effectiveId);

    const segmentOutput = new SegmentedFileOutput({
      protocol: SegmentedFileProtocol.HLS_PROTOCOL,
      filenamePrefix: `${this.hlsOutputPath}/${roomName}/segment`,
      playlistName: 'playlist.m3u8',
      livePlaylistName: 'live.m3u8',
      segmentDuration,
      disableManifest: true,
    });

    const egressInfo: EgressInfo =
      await this.egressClient!.startRoomCompositeEgress(
        roomName,
        { segments: segmentOutput },
        {
          layout: 'grid',
          customBaseUrl,
          encodingOptions: EncodingOptionsPreset.H264_720P_30,
          audioOnly: false,
          videoOnly: false,
        },
      );

    const hlsUrl = `${this.hlsBaseUrl}/${roomName}/live.m3u8`;
    this.logger.log(
      `HLS egress started for ${roomName} (egressId=${egressInfo.egressId})`,
    );

    return {
      egressId: egressInfo.egressId,
      roomName: egressInfo.roomName,
      hlsUrl,
      status: this.mapEgressStatus(egressInfo.status),
      startedAt: egressInfo.startedAt
        ? Number(egressInfo.startedAt)
        : undefined,
    };
  }

  async stopHlsEgress(egressId: string): Promise<EgressResponse> {
    return this.stopRecording(egressId);
  }

  async getHlsEgressStatus(roomName: string): Promise<{
    active: boolean;
    hlsUrl: string | null;
    egressId: string | null;
    startedAt: number | null;
  }> {
    this.ensureAvailable();

    try {
      const activeEgresses = await this.egressClient!.listEgress({
        roomName,
        active: true,
      });

      // Pick HLS egress: prefer one with segments already produced.
      const hlsEgress =
        activeEgresses.find(
          (e) => e.segmentResults && e.segmentResults.length > 0,
        ) ??
        activeEgresses.find(
          (e) => !e.fileResults || e.fileResults.length === 0,
        );

      if (!hlsEgress) {
        return { active: false, hlsUrl: null, egressId: null, startedAt: null };
      }

      const hlsDir = `${this.hlsOutputPath}/${roomName}`;
      const m3u8Path = `${hlsDir}/live.m3u8`;
      const rawStarted = hlsEgress.startedAt ? Number(hlsEgress.startedAt) : 0;
      const egressStartedNanos =
        rawStarted > 1e12 ? rawStarted / 1e3 : rawStarted * 1000;
      const egressStartedMs =
        rawStarted > 1e15 ? rawStarted / 1e6 : egressStartedNanos;

      if (fs.existsSync(m3u8Path)) {
        try {
          const stat = fs.statSync(m3u8Path);

          // Reject stale m3u8 left over from a previous session.
          if (egressStartedMs > 0 && stat.mtimeMs < egressStartedMs) {
            this.logger.warn(
              `Stale m3u8 for ${roomName} (file older than current egress)`,
            );
            try {
              fs.rmSync(hlsDir, { recursive: true, force: true });
            } catch {
              // No write access — silently skip
            }
            return {
              active: false,
              hlsUrl: null,
              egressId: hlsEgress.egressId,
              startedAt: null,
            };
          }

          const content = fs.readFileSync(m3u8Path, 'utf8');
          if (content.includes('#EXTINF')) {
            const cacheBust = Math.floor(egressStartedMs / 1000);
            const hlsUrl = `${this.hlsBaseUrl}/${roomName}/live.m3u8?v=${cacheBust}`;
            return {
              active: true,
              hlsUrl,
              egressId: hlsEgress.egressId,
              startedAt: hlsEgress.startedAt
                ? Number(hlsEgress.startedAt)
                : null,
            };
          }
        } catch {
          // File read error → treat as not ready
        }
      }

      // Egress active but m3u8 not written yet
      return {
        active: false,
        hlsUrl: null,
        egressId: hlsEgress.egressId,
        startedAt: null,
      };
    } catch (error) {
      this.logger.error(
        `getHlsEgressStatus(${roomName}) failed: ${(error as Error).message}`,
      );
      return { active: false, hlsUrl: null, egressId: null, startedAt: null };
    }
  }

  // ============================================================
  // HLS-based recording (mark range + ffmpeg concat)
  // ============================================================

  /**
   * Read playlist.m3u8 and return the highest segment index. -1 if HLS not
   * yet writing segments.
   */
  getCurrentHlsSegmentIndex(roomName: string): number {
    const playlistPath = `${this.hlsOutputPath}/${roomName}/playlist.m3u8`;
    if (!fs.existsSync(playlistPath)) {
      this.logger.warn(`HLS playlist not found: ${playlistPath}`);
      return -1;
    }

    try {
      const content = fs.readFileSync(playlistPath, 'utf8');
      // LiveKit names segments segment_NNNNN.ts
      const segmentRegex = /segment_(\d+)\.ts/g;
      let maxIndex = -1;
      let match: RegExpExecArray | null;
      while ((match = segmentRegex.exec(content)) !== null) {
        const idx = Number.parseInt(match[1], 10);
        if (idx > maxIndex) maxIndex = idx;
      }
      return maxIndex;
    } catch (error) {
      this.logger.error(
        `Failed to read HLS playlist for ${roomName}: ${(error as Error).message}`,
      );
      return -1;
    }
  }

  /**
   * ffmpeg-concat HLS .ts segments [start..end] into a single .mp4.
   * Uses `-c copy` so the operation is a remux (no re-encode) → near-instant.
   */
  async concatenateHlsSegments(
    roomName: string,
    startIndex: number,
    endIndex: number,
    outputFilename: string,
  ): Promise<string> {
    const hlsDir = `${this.hlsOutputPath}/${roomName}`;
    const concatListPath = `/tmp/${outputFilename}.txt`;
    const outputPath = `/tmp/${outputFilename}.mp4`;

    try {
      const lines: string[] = [];
      for (let i = startIndex; i <= endIndex; i++) {
        const padded = String(i).padStart(5, '0');
        const segmentPath = `${hlsDir}/segment_${padded}.ts`;
        if (fs.existsSync(segmentPath)) {
          lines.push(`file '${segmentPath}'`);
        } else {
          this.logger.warn(`Missing HLS segment: ${segmentPath}`);
        }
      }

      if (lines.length === 0) {
        throw new Error(
          `No segments found in range ${startIndex}-${endIndex} for ${roomName}`,
        );
      }

      this.logger.log(
        `Concatenating ${lines.length} segments (${startIndex}-${endIndex}) for ${roomName}`,
      );

      fs.writeFileSync(concatListPath, lines.join('\n'), 'utf8');

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatListPath,
          '-c',
          'copy',
          '-movflags',
          '+faststart',
          outputPath,
        ],
        { timeout: 120_000 },
      );

      this.logger.log(`Created MP4: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(
        `concatenateHlsSegments failed for ${roomName}: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      try {
        if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Upload a recording MP4 to Cloudflare R2 (via StorageService) and
   * return the public URL. Local temp file is deleted afterwards.
   * Replaces BeWonderMe's GCS upload + signed URL.
   */
  async uploadRecording(
    localPath: string,
    storagePath: string,
  ): Promise<{ url: string; path: string }> {
    try {
      const buffer = fs.readFileSync(localPath);
      const url = await this.storage.upload(storagePath, buffer, 'video/mp4');
      this.logger.log(`Uploaded recording → ${storagePath} (${url})`);
      return { url, path: storagePath };
    } finally {
      try {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch {
        // ignore
      }
    }
  }

  // ============================================================
  // Egress lifecycle / management
  // ============================================================

  async stopRecording(egressId: string): Promise<EgressResponse> {
    this.ensureAvailable();
    try {
      const egressInfo = await this.egressClient!.stopEgress(egressId);
      this.logger.log(`Stopped egress ${egressId}`);
      return this.mapEgressToResponse(egressInfo);
    } catch (error) {
      const msg = (error as { message?: string }).message ?? '';
      const code = (error as { code?: string }).code ?? '';

      if (
        code === 'deadline_exceeded' ||
        msg.includes('request timed out') ||
        msg.includes('deadline_exceeded')
      ) {
        this.logger.warn(
          `stopEgress(${egressId}) timed out — likely already gone`,
        );
        const current = await this.getEgressInfo(egressId);
        if (current) return current;
        return {
          egressId,
          roomName: '',
          status: 'EGRESS_COMPLETE',
          startedAt: 0,
          endedAt: Date.now(),
        };
      }

      if (
        msg.includes('EGRESS_ABORTED') ||
        msg.includes('EGRESS_COMPLETE') ||
        msg.includes('EGRESS_ENDING') ||
        msg.includes('cannot be stopped')
      ) {
        const current = await this.getEgressInfo(egressId);
        if (current) return current;
        return {
          egressId,
          roomName: '',
          status: 'EGRESS_ABORTED',
          startedAt: 0,
          endedAt: Date.now(),
        };
      }

      throw error;
    }
  }

  async getEgressInfo(egressId: string): Promise<EgressResponse | null> {
    this.ensureAvailable();
    try {
      const list = await this.egressClient!.listEgress({ egressId });
      if (list.length === 0) return null;
      return this.mapEgressToResponse(list[0]);
    } catch (error) {
      this.logger.error(
        `getEgressInfo(${egressId}) failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async listRoomEgress(
    roomName: string,
    active?: boolean,
  ): Promise<EgressResponse[]> {
    this.ensureAvailable();
    try {
      const list = await this.egressClient!.listEgress({ roomName, active });
      return list.map((e) => this.mapEgressToResponse(e));
    } catch (error) {
      this.logger.error(
        `listRoomEgress(${roomName}) failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async listAllActiveEgress(): Promise<EgressResponse[]> {
    this.ensureAvailable();
    try {
      const list = await this.egressClient!.listEgress({ active: true });
      return list.map((e) => this.mapEgressToResponse(e));
    } catch (error) {
      this.logger.error(
        `listAllActiveEgress failed: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async stopAllActiveEgress(roomName: string): Promise<void> {
    try {
      const active = await this.listRoomEgress(roomName, true);
      if (active.length === 0) return;

      this.logger.warn(
        `Stopping ${active.length} active egress for ${roomName}…`,
      );
      const results = await Promise.allSettled(
        active.map(async (e) => {
          try {
            await this.egressClient!.stopEgress(e.egressId);
            return 'stopped' as const;
          } catch (error) {
            this.logger.warn(
              `stop ${e.egressId} failed (ghost?): ${(error as Error).message}`,
            );
            return 'failed' as const;
          }
        }),
      );

      const stopped = results.filter(
        (r) => r.status === 'fulfilled' && r.value === 'stopped',
      ).length;
      if (stopped > 0) await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      this.logger.warn(
        `stopAllActiveEgress(${roomName}) failed: ${(error as Error).message}`,
      );
    }
  }

  async cleanupOrphanedEgress(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const active = await this.listAllActiveEgress();
      if (active.length === 0) {
        this.logger.log('No orphaned egress on startup');
        return;
      }
      this.logger.warn(
        `Found ${active.length} orphaned egress on startup, stopping…`,
      );
      let stopped = 0;
      for (const e of active) {
        try {
          await this.stopRecording(e.egressId);
          stopped++;
        } catch (error) {
          this.logger.warn(
            `Failed to stop orphaned ${e.egressId}: ${(error as Error).message}`,
          );
        }
      }
      this.logger.log(`Orphan cleanup: ${stopped}/${active.length} stopped`);
    } catch (error) {
      this.logger.error(
        `cleanupOrphanedEgress failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Delete /hls/<roomName>/ after a delay so viewers can finish their buffer.
   */
  cleanupHlsSegments(roomName: string, delayMs = 30_000): void {
    setTimeout(() => {
      try {
        const hlsDir = `${this.hlsOutputPath}/${roomName}`;
        if (!fs.existsSync(hlsDir)) return;
        fs.accessSync(hlsDir, fs.constants.W_OK);
        fs.rmSync(hlsDir, { recursive: true, force: true });
        this.logger.log(`Cleaned HLS segments for ${roomName}`);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== 'EACCES' && code !== 'EROFS') {
          this.logger.warn(
            `cleanupHlsSegments(${roomName}) failed: ${(error as Error).message}`,
          );
        }
      }
    }, delayMs);
  }

  // ============================================================
  // Mappers
  // ============================================================

  private mapFormatToFileType(format: RecordingFormat): EncodedFileType {
    const map: Record<RecordingFormat, EncodedFileType> = {
      mp4: EncodedFileType.MP4,
      ogg: EncodedFileType.OGG,
      webm: EncodedFileType.DEFAULT_FILETYPE,
    };
    return map[format] ?? EncodedFileType.MP4;
  }

  private mapEgressStatus(status: number): EgressStatus {
    const map: Record<number, EgressStatus> = {
      0: 'EGRESS_STARTING',
      1: 'EGRESS_ACTIVE',
      2: 'EGRESS_ENDING',
      3: 'EGRESS_COMPLETE',
      4: 'EGRESS_FAILED',
      5: 'EGRESS_ABORTED',
      6: 'EGRESS_LIMIT_REACHED',
    };
    return map[status] ?? 'UNKNOWN';
  }

  private mapEgressToResponse(egress: EgressInfo): EgressResponse {
    let fileUri: string | undefined;
    if (egress.fileResults && egress.fileResults.length > 0) {
      fileUri = egress.fileResults[0].location;
    }
    return {
      egressId: egress.egressId,
      roomName: egress.roomName,
      status: this.mapEgressStatus(egress.status),
      startedAt: egress.startedAt ? Number(egress.startedAt) : undefined,
      endedAt: egress.endedAt ? Number(egress.endedAt) : undefined,
      error: egress.error || undefined,
      fileUri,
    };
  }

  /**
   * Optional: persisted MP4 recording (separate egress). Currently unused —
   * kept for compatibility with code that may need a dedicated MP4 egress
   * instead of HLS-derived MP4.
   */
  async startRoomRecording(
    roomName: string,
    options: {
      outputPath?: string;
      format?: RecordingFormat;
      sessionId?: string;
    } = {},
  ): Promise<EgressResponse> {
    this.ensureAvailable();
    const {
      outputPath = `recordings/${roomName}/${Date.now()}.mp4`,
      format = 'mp4',
      sessionId,
    } = options;

    const fileOutput = new EncodedFileOutput({
      fileType: this.mapFormatToFileType(format),
      filepath: outputPath,
      disableManifest: true,
    });

    const effectiveId =
      sessionId ?? roomName.replace(/^(webinar|meeting)-/, '');
    const customBaseUrl = this.buildTemplateUrl(effectiveId);

    const egressInfo = await this.egressClient!.startRoomCompositeEgress(
      roomName,
      { file: fileOutput },
      {
        layout: 'grid',
        customBaseUrl,
        encodingOptions: EncodingOptionsPreset.H264_1080P_30,
        audioOnly: false,
        videoOnly: false,
      },
    );

    this.logger.log(
      `Started MP4 egress for ${roomName} (egressId=${egressInfo.egressId})`,
    );
    return this.mapEgressToResponse(egressInfo);
  }
}
