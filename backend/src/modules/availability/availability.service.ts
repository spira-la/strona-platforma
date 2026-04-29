import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AvailabilityEntity,
  AvailabilityBlockEntity,
} from '../../db/entities/availability.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { SlotHoldEntity } from '../../db/entities/slot-hold.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { BookingStatus } from '../../db/entities/enums.js';

export interface AvailableSlot {
  startTime: string; // ISO
  endTime: string; // ISO
  available: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private readonly availability: Repository<AvailabilityEntity>,
    @InjectRepository(AvailabilityBlockEntity)
    private readonly blocks: Repository<AvailabilityBlockEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(SlotHoldEntity)
    private readonly holds: Repository<SlotHoldEntity>,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
  ) {}

  /**
   * Returns concrete time slots for a coach on a given local date.
   * Slots are generated from the coach's weekly schedule (availability
   * table), every `durationMinutes` minutes, then filtered against
   * confirmed bookings, active slot holds, availability blocks
   * (PTO/holidays), and the coach's rest-time buffer.
   */
  async getSlots(input: {
    coachId: string;
    date: string; // YYYY-MM-DD (local date; interpretation uses the coach's timezone)
    durationMinutes: number;
  }): Promise<AvailableSlot[]> {
    const coach = await this.coaches.findOne({ where: { id: input.coachId } });
    if (!coach) throw new NotFoundException('Coach not found');

    const dayStart = new Date(`${input.date}T00:00:00Z`);
    const dayOfWeek = dayStart.getUTCDay(); // 0=Sunday … 6=Saturday
    // availability table uses Postgres DOW (0=Sun .. 6=Sat)

    // Weekly schedule rows for this day
    const schedules = await this.availability.find({
      where: {
        coachId: input.coachId,
        dayOfWeek,
        isActive: true,
      },
    });
    if (schedules.length === 0) return [];

    // Full-day blocks covering this date
    const blocks = await this.blocks.find({
      where: { coachId: input.coachId },
    });
    const isBlocked = blocks.some((b) => {
      return input.date >= b.startDate && input.date <= b.endDate;
    });
    if (isBlocked) return [];

    // All existing bookings overlapping this day (widened by rest-time)
    const rest = (coach.restTimeBetweenSessionsMinutes ?? 15) * 60 * 1000;
    const dayStartMs = new Date(`${input.date}T00:00:00`).getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

    const [bookings, activeHolds] = await Promise.all([
      this.bookings
        .createQueryBuilder('b')
        .where('b.coach_id = :coachId', { coachId: input.coachId })
        .andWhere('b.status = :status', { status: BookingStatus.CONFIRMED })
        .andWhere('b.start_time < :end', { end: new Date(dayEndMs) })
        .andWhere('b.end_time > :start', { start: new Date(dayStartMs) })
        .getMany(),
      this.holds
        .createQueryBuilder('h')
        .where('h.coach_id = :coachId', { coachId: input.coachId })
        .andWhere('h.expires_at > :now', { now: new Date() })
        .andWhere('h.start_time < :end', { end: new Date(dayEndMs) })
        .andWhere('h.end_time > :start', { start: new Date(dayStartMs) })
        .getMany(),
    ]);

    const busyIntervals: Array<[number, number]> = [
      ...bookings.map((b): [number, number] => [
        b.startTime.getTime() - rest,
        b.endTime.getTime() + rest,
      ]),
      ...activeHolds.map((h): [number, number] => [
        h.startTime.getTime() - rest,
        h.endTime.getTime() + rest,
      ]),
    ];

    const slots: AvailableSlot[] = [];
    const now = Date.now();

    for (const s of schedules) {
      // "HH:MM:SS" local; interpret as local wall-clock on the requested date
      const start = this.toDateOnDate(input.date, s.startTime);
      const end = this.toDateOnDate(input.date, s.endTime);

      for (
        let t = start.getTime();
        t + input.durationMinutes * 60 * 1000 <= end.getTime();
        t += input.durationMinutes * 60 * 1000
      ) {
        const slotStart = t;
        const slotEnd = t + input.durationMinutes * 60 * 1000;

        if (slotEnd <= now) continue; // past
        const overlap = busyIntervals.some(
          ([bs, be]) => slotStart < be && slotEnd > bs,
        );

        slots.push({
          startTime: new Date(slotStart).toISOString(),
          endTime: new Date(slotEnd).toISOString(),
          available: !overlap,
        });
      }
    }

    return slots.toSorted((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private toDateOnDate(date: string, time: string): Date {
    // time format: "HH:MM:SS" or "HH:MM"
    const [h = '0', m = '0', s = '0'] = time.split(':');
    const d = new Date(`${date}T00:00:00`);
    d.setHours(Number(h), Number(m), Number(s), 0);
    return d;
  }
}
