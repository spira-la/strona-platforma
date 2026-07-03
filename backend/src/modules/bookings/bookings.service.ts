import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { BookingStatus } from '../../db/entities/enums.js';
import { SlotHoldsService } from '../slot-holds/slot-holds.service.js';

export interface CreateBookingInput {
  orderId: string;
  userId: string | null;
  coachId: string;
  serviceId: string | null;
  startTime: Date;
  endTime: Date;
}

export interface RescheduleBookingInput {
  bookingId: string;
  userId?: string | null; // ownership check when present
  newStartTime: Date;
  newEndTime: Date;
  reason?: string;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
    private readonly slotHolds: SlotHoldsService,
  ) {}

  async create(input: CreateBookingInput): Promise<BookingEntity> {
    const booking = this.bookings.create({
      orderId: input.orderId,
      userId: input.userId ?? '00000000-0000-0000-0000-000000000000',
      coachId: input.coachId,
      serviceId: input.serviceId,
      startTime: input.startTime,
      endTime: input.endTime,
      status: BookingStatus.CONFIRMED,
    });

    const saved = await this.bookings.save(booking);

    // Deterministic LiveKit room name (matches BeWonderMe convention so
    // the recording template URL and host nginx CORS are interchangeable).
    saved.livekitRoomName = `meeting-${saved.id}`;
    saved.meetingLink = `${process.env.FRONTEND_URL ?? ''}/meeting/${saved.id}`;
    await this.bookings.save(saved);

    return saved;
  }

  async findById(id: string): Promise<BookingEntity> {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${id}`);
    }
    return booking;
  }

  async findByOrder(orderId: string): Promise<BookingEntity[]> {
    return this.bookings.find({
      where: { orderId },
      order: { startTime: 'ASC' },
    });
  }

  async findByUser(userId: string): Promise<BookingEntity[]> {
    return this.bookings.find({
      where: { userId },
      order: { startTime: 'DESC' },
    });
  }

  async findByCoach(coachId: string): Promise<BookingEntity[]> {
    return this.bookings.find({
      where: { coachId },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Reschedule a booking honoring the coach's minCancellationNotice policy
   * and checking availability for the new slot (with rest-time buffer).
   */
  async reschedule(
    input: RescheduleBookingInput,
  ): Promise<{ booking: BookingEntity; previousStart: Date }> {
    const booking = await this.findById(input.bookingId);

    if (input.userId && booking.userId !== input.userId) {
      throw new BadRequestException(
        'You are not allowed to reschedule this booking',
      );
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot reschedule a booking with status "${booking.status}"`,
      );
    }

    const coach = await this.coaches.findOne({
      where: { id: booking.coachId },
    });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    const noticeMinutes = coach.minCancellationNoticeMinutes ?? 1440;
    const noticeMs = noticeMinutes * 60 * 1000;
    const now = Date.now();
    const originalStart = booking.startTime.getTime();

    if (now + noticeMs > originalStart) {
      throw new BadRequestException(
        `Reschedules must be made at least ${Math.round(noticeMinutes / 60)} hours before the session`,
      );
    }

    if (input.newEndTime <= input.newStartTime) {
      throw new BadRequestException('Invalid new time range');
    }

    await this.slotHolds.assertAvailable({
      coachId: booking.coachId,
      startTime: input.newStartTime,
      endTime: input.newEndTime,
      excludeBookingId: booking.id,
    });

    const previousStart = booking.startTime;
    booking.rescheduledFrom = booking.startTime;
    booking.rescheduledAt = new Date();
    booking.rescheduleReason = input.reason ?? null;
    booking.rescheduleCount = (booking.rescheduleCount ?? 0) + 1;
    booking.startTime = input.newStartTime;
    booking.endTime = input.newEndTime;

    const saved = await this.bookings.save(booking);
    return { booking: saved, previousStart };
  }

  async cancel(id: string, reason?: string): Promise<BookingEntity> {
    const booking = await this.findById(id);
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason ?? null;
    return this.bookings.save(booking);
  }
}
