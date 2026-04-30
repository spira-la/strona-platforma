import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, In } from 'typeorm';
import { SlotHoldEntity } from '../../db/entities/slot-hold.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { BookingStatus } from '../../db/entities/enums.js';

export const SLOT_HOLD_TTL_MINUTES = 15;

export interface CreateSlotHoldInput {
  coachId: string;
  userId?: string | null;
  startTime: Date;
  endTime: Date;
}

export interface AvailabilityCheckInput {
  coachId: string;
  startTime: Date;
  endTime: Date;
  excludeHoldId?: string;
  excludeBookingId?: string;
}

@Injectable()
export class SlotHoldsService {
  private readonly logger = new Logger(SlotHoldsService.name);

  constructor(
    @InjectRepository(SlotHoldEntity)
    private readonly holds: Repository<SlotHoldEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
  ) {}

  /**
   * Ensure the requested slot does not collide with an active hold
   * or a confirmed booking, taking the coach's rest time buffer into
   * account. Throws ConflictException on overlap.
   */
  async assertAvailable(input: AvailabilityCheckInput): Promise<void> {
    const coach = await this.coaches.findOne({ where: { id: input.coachId } });
    if (!coach) {
      throw new NotFoundException(`Coach not found: ${input.coachId}`);
    }
    const restMs = (coach.restTimeBetweenSessionsMinutes ?? 15) * 60 * 1000;

    // Widen the requested window by rest-time on both sides so we catch
    // bookings that would abut this slot without the required gap.
    const bufferedStart = new Date(input.startTime.getTime() - restMs);
    const bufferedEnd = new Date(input.endTime.getTime() + restMs);

    // Active (unexpired) holds overlapping the buffered window.
    const now = new Date();
    const qb = this.holds
      .createQueryBuilder('h')
      .where('h.coach_id = :coachId', { coachId: input.coachId })
      .andWhere('h.expires_at > :now', { now })
      .andWhere('h.start_time < :end', { end: bufferedEnd })
      .andWhere('h.end_time > :start', { start: bufferedStart });

    if (input.excludeHoldId) {
      qb.andWhere('h.id <> :excludeId', { excludeId: input.excludeHoldId });
    }

    const conflictingHold = await qb.getOne();
    if (conflictingHold) {
      throw new ConflictException('This time slot is already being booked');
    }

    // Active bookings (confirmed) overlapping the buffered window.
    const bookingQb = this.bookings
      .createQueryBuilder('b')
      .where('b.coach_id = :coachId', { coachId: input.coachId })
      .andWhere('b.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('b.start_time < :end', { end: bufferedEnd })
      .andWhere('b.end_time > :start', { start: bufferedStart });

    if (input.excludeBookingId) {
      bookingQb.andWhere('b.id <> :excludeId', {
        excludeId: input.excludeBookingId,
      });
    }

    const conflictingBooking = await bookingQb.getOne();
    if (conflictingBooking) {
      throw new ConflictException('This time slot is no longer available');
    }
  }

  /**
   * Reserve a slot for 15 minutes. Idempotent on (coachId, userId, startTime):
   * if the same user requests the same slot again, refresh the expiry rather
   * than create a duplicate.
   */
  async create(input: CreateSlotHoldInput): Promise<SlotHoldEntity> {
    await this.assertAvailable({
      coachId: input.coachId,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    const existing = input.userId
      ? await this.holds.findOne({
          where: {
            coachId: input.coachId,
            userId: input.userId,
            startTime: input.startTime,
          },
        })
      : null;

    const expiresAt = new Date(Date.now() + SLOT_HOLD_TTL_MINUTES * 60 * 1000);

    if (existing) {
      existing.expiresAt = expiresAt;
      existing.endTime = input.endTime;
      return this.holds.save(existing);
    }

    const hold = this.holds.create({
      coachId: input.coachId,
      userId: input.userId ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      expiresAt,
    });
    return this.holds.save(hold);
  }

  async attachToOrder(holdIds: string[], orderId: string): Promise<void> {
    if (holdIds.length === 0) return;
    await this.holds
      .createQueryBuilder()
      .update()
      .set({ orderId })
      .whereInIds(holdIds)
      .execute();
  }

  async release(holdId: string): Promise<void> {
    await this.holds.delete({ id: holdId });
  }

  async releaseByOrder(orderId: string): Promise<void> {
    await this.holds.delete({ orderId });
  }

  async purgeExpired(): Promise<number> {
    const result = await this.holds.delete({
      expiresAt: LessThan(new Date()),
      orderId: IsNull(),
    });
    return result.affected ?? 0;
  }

  async getByIds(ids: string[]): Promise<SlotHoldEntity[]> {
    if (ids.length === 0) return [];
    return this.holds.find({ where: { id: In(ids) } });
  }
}
