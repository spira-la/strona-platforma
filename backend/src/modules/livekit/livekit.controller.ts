import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { LivekitService } from './livekit.service.js';
import {
  LivekitEgressService,
  type EgressResponse,
  type HlsEgressResponse,
} from './livekit-egress.service.js';
import type { StartRecordingDto } from './dto/start-recording.dto.js';
import type { StopRecordingDto } from './dto/stop-recording.dto.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { BookingStatus } from '../../db/entities/enums.js';

interface TokenForBookingDto {
  bookingId: string;
  userId?: string | null;
  displayName?: string;
}

/**
 * Time window (minutes) around the booking start during which tokens
 * can be issued. Before/after this window, joins are refused.
 */
const JOIN_WINDOW_MINUTES_BEFORE = 10;
const JOIN_WINDOW_MINUTES_AFTER = 120;

/**
 * Room naming convention (matches BeWonderMe):
 *  - 1-on-1 booking sessions: `meeting-${bookingId}`
 *  - Webinars:                `webinar-${sessionId}`
 */
function meetingRoomName(bookingId: string): string {
  return `meeting-${bookingId}`;
}

@Controller('livekit')
export class LivekitController {
  constructor(
    private readonly livekit: LivekitService,
    private readonly egress: LivekitEgressService,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profiles: Repository<ProfileEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
  ) {}

  @Get('config')
  config() {
    return {
      available: this.livekit.isAvailable(),
      egressAvailable: this.egress.isAvailable(),
    };
  }

  // ============================================================
  // TOKEN
  // ============================================================

  @Post('token/booking')
  @HttpCode(HttpStatus.OK)
  async tokenForBooking(@Body() body: TokenForBookingDto) {
    if (!body.bookingId) throw new BadRequestException('bookingId is required');
    if (!this.livekit.isAvailable()) {
      throw new BadRequestException('LiveKit is not configured on this server');
    }

    const booking = await this.bookings.findOne({
      where: { id: body.bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking is ${booking.status} — cannot join`,
      );
    }

    const now = Date.now();
    const start = booking.startTime.getTime();
    const end = booking.endTime.getTime();
    if (
      now < start - JOIN_WINDOW_MINUTES_BEFORE * 60 * 1000 ||
      now > end + JOIN_WINDOW_MINUTES_AFTER * 60 * 1000
    ) {
      throw new BadRequestException(
        'This session is not open for joining right now',
      );
    }

    const coach = await this.coaches.findOne({
      where: { id: booking.coachId },
    });
    const callerIsCoach = !!(
      body.userId &&
      coach?.userId &&
      body.userId === coach.userId
    );

    if (!callerIsCoach && body.userId) {
      const ownsBooking = booking.userId === body.userId;
      let ownsOrder = false;
      if (!ownsBooking && booking.orderId) {
        const order = await this.orders.findOne({
          where: { id: booking.orderId },
        });
        ownsOrder = order?.userId === body.userId;
      }
      if (!ownsBooking && !ownsOrder) {
        throw new ForbiddenException('You do not have access to this session');
      }
    }

    const roomName = booking.livekitRoomName ?? meetingRoomName(booking.id);
    const identity =
      body.userId ??
      `guest-${booking.id}-${randomUUID().replaceAll('-', '').slice(0, 8)}`;

    let displayName = body.displayName;
    if (!displayName && body.userId) {
      const profile = await this.profiles.findOne({
        where: { id: body.userId },
      });
      displayName = profile?.fullName ?? profile?.email ?? body.userId;
    }

    await this.livekit.ensureRoom(roomName, {
      metadata: JSON.stringify({
        bookingId: booking.id,
        orderId: booking.orderId,
      }),
    });

    const token = await this.livekit.generateToken(roomName, identity, {
      isHost: callerIsCoach,
      isSpeaker: !callerIsCoach,
      displayName,
    });

    return { success: true, data: token };
  }

  // ============================================================
  // ROOM STATUS (clients poll while waiting for coach)
  // ============================================================

  @Get('rooms/:roomName/status')
  async roomStatus(@Param('roomName') roomName: string) {
    if (!this.livekit.isAvailable()) {
      return { active: false, participantCount: 0 };
    }
    const status = await this.livekit.getRoomStatus(roomName);
    return status;
  }

  /**
   * Public viewer-only token used by the egress Chrome instance to join
   * a room and render the recording template. The template URL embeds
   * `recordingKey` which we verify against `RECORDING_API_KEY` so this
   * cannot be called from the open internet without the key.
   */
  @Get('recording-token/:roomName')
  async recordingToken(
    @Param('roomName') roomName: string,
    @Query('recordingKey') recordingKey: string,
  ) {
    const expected = process.env.RECORDING_API_KEY;
    if (!expected) {
      throw new BadRequestException(
        'RECORDING_API_KEY is not configured on this server',
      );
    }
    if (recordingKey !== expected) {
      throw new ForbiddenException('Invalid recording key');
    }
    if (!this.livekit.isAvailable()) {
      throw new BadRequestException('LiveKit is not configured');
    }

    const token = await this.livekit.generateToken(
      roomName,
      `egress-recorder-${Date.now()}`,
      {
        isHost: false,
        isSpeaker: false,
        canPublishScreen: false,
        ttlSeconds: 6 * 60 * 60,
        displayName: 'Recorder',
      },
    );
    return { success: true, data: token };
  }

  // ============================================================
  // HLS EGRESS (coach starts when entering meeting; required for recording)
  // ============================================================

  @Post('hls/start')
  @HttpCode(HttpStatus.OK)
  async hlsStart(
    @Body()
    body: {
      bookingId?: string;
      sessionId?: string;
      roomName?: string;
      userId?: string;
    },
  ): Promise<HlsEgressResponse> {
    this.ensureEgress();
    const roomName = await this.resolveRoomNameAndAssertCoach(body);
    return this.egress.startHlsEgress(roomName, {
      sessionId: body.sessionId ?? body.bookingId,
    });
  }

  @Post('hls/stop')
  @HttpCode(HttpStatus.OK)
  async hlsStop(
    @Body()
    body: {
      egressId?: string;
      bookingId?: string;
      sessionId?: string;
      roomName?: string;
      userId?: string;
    },
  ): Promise<EgressResponse> {
    this.ensureEgress();
    const roomName = await this.resolveRoomNameAndAssertCoach(body);

    if (body.egressId) {
      const result = await this.egress.stopHlsEgress(body.egressId);
      this.egress.cleanupHlsSegments(roomName);
      return result;
    }

    const status = await this.egress.getHlsEgressStatus(roomName);
    if (status.active && status.egressId) {
      const result = await this.egress.stopHlsEgress(status.egressId);
      this.egress.cleanupHlsSegments(roomName);
      return result;
    }
    throw new NotFoundException(`No active HLS egress for ${roomName}`);
  }

  @Get('hls/status/:roomName')
  async hlsStatus(@Param('roomName') roomName: string) {
    this.ensureEgress();
    return this.egress.getHlsEgressStatus(roomName);
  }

  // ============================================================
  // RECORDING (mark range of HLS segments → ffmpeg concat → R2)
  // ============================================================

  @Post('recordings/start')
  @HttpCode(HttpStatus.OK)
  async startRecording(
    @Body() dto: StartRecordingDto & { userId?: string },
  ): Promise<{
    egressId: string;
    roomName: string;
    startSegmentIndex: number;
    status: string;
  }> {
    this.ensureEgress();
    const roomName = await this.resolveRoomNameAndAssertCoach(dto);

    const startSegmentIndex = this.egress.getCurrentHlsSegmentIndex(roomName);
    if (startSegmentIndex < 0) {
      throw new BadRequestException(
        `HLS is not active for room ${roomName}. Start HLS streaming before recording.`,
      );
    }

    return {
      egressId: `rec-${randomUUID()}`,
      roomName,
      startSegmentIndex,
      status: 'EGRESS_ACTIVE',
    };
  }

  @Post('recordings/stop')
  @HttpCode(HttpStatus.OK)
  async stopRecording(
    @Body() dto: StopRecordingDto & { userId?: string },
  ): Promise<{
    url: string;
    path: string;
    duration: number;
    egressId: string;
    roomName: string;
    status: string;
  }> {
    this.ensureEgress();
    const roomName = await this.resolveRoomNameAndAssertCoach(dto);

    const endSegmentIndex = this.egress.getCurrentHlsSegmentIndex(roomName);
    if (endSegmentIndex < 0) {
      throw new BadRequestException(`HLS segments not found for ${roomName}`);
    }

    const outputFilename = `recording-${roomName}-${Date.now()}`;
    const localPath = await this.egress.concatenateHlsSegments(
      roomName,
      dto.startSegmentIndex,
      endSegmentIndex,
      outputFilename,
    );

    const storagePath = `recordings/${roomName}/${outputFilename}.mp4`;
    const { url, path } = await this.egress.uploadRecording(
      localPath,
      storagePath,
    );

    // Each segment ≈ 1 second (matches livekit.yaml segmentDuration: 1)
    const duration = endSegmentIndex - dto.startSegmentIndex + 1;

    return {
      url,
      path,
      duration,
      egressId: dto.egressId ?? `rec-${randomUUID()}`,
      roomName,
      status: 'EGRESS_COMPLETE',
    };
  }

  @Get('recordings/:egressId')
  async getRecording(
    @Param('egressId') egressId: string,
  ): Promise<EgressResponse> {
    this.ensureEgress();
    const info = await this.egress.getEgressInfo(egressId);
    if (!info) throw new NotFoundException(`Recording '${egressId}' not found`);
    return info;
  }

  @Get('rooms/:roomName/recordings')
  async listRoomRecordings(
    @Param('roomName') roomName: string,
    @Query('active') active?: string,
  ): Promise<EgressResponse[]> {
    this.ensureEgress();
    return this.egress.listRoomEgress(roomName, active === 'true');
  }

  // ============================================================
  // ADMIN — emergency cleanup
  // ============================================================

  @Post('egress/cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanup(): Promise<{ stopped: number; total: number }> {
    this.ensureEgress();
    const active = await this.egress.listAllActiveEgress();
    let stopped = 0;
    for (const e of active) {
      try {
        await this.egress.stopRecording(e.egressId);
        stopped++;
      } catch {
        // continue
      }
    }
    return { stopped, total: active.length };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private ensureEgress(): void {
    if (!this.egress.isAvailable()) {
      throw new BadRequestException(
        'LiveKit Egress is not configured on this server',
      );
    }
  }

  /**
   * Resolve roomName from body (bookingId / sessionId / roomName) and verify
   * that the caller is the coach of the booking. Returns the resolved
   * roomName so endpoints can keep their handler bodies short.
   */
  private async resolveRoomNameAndAssertCoach(body: {
    bookingId?: string;
    sessionId?: string;
    roomName?: string;
    userId?: string;
  }): Promise<string> {
    let roomName = body.roomName;
    if (!roomName && body.bookingId) roomName = meetingRoomName(body.bookingId);
    if (!roomName && body.sessionId) roomName = `webinar-${body.sessionId}`;
    if (!roomName) {
      throw new BadRequestException(
        'bookingId, sessionId or roomName is required',
      );
    }

    if (body.bookingId) {
      const booking = await this.bookings.findOne({
        where: { id: body.bookingId },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      if (body.userId) {
        const coach = await this.coaches.findOne({
          where: { id: booking.coachId },
        });
        if (!coach || coach.userId !== body.userId) {
          throw new ForbiddenException(
            'Only the coach of this session can control recording',
          );
        }
      }
    }

    return roomName;
  }
}
