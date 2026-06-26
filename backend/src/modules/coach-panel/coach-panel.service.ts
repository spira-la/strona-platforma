import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import {
  AvailabilityEntity,
  AvailabilityBlockEntity,
} from '../../db/entities/availability.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { BookingStatus, OrderStatus } from '../../db/entities/enums.js';
import { BookingNotificationService } from '../bookings/booking-notification.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface CreateBlockData {
  startAt: string;
  endAt: string;
  reason?: string | null;
}

export interface RescheduleSessionData {
  newStartAt: string;
  newEndAt: string;
  reason?: string;
}

export interface CreateManualSessionData {
  clientEmail: string;
  clientName?: string;
  serviceId?: string;
  startAt: string;
  endAt: string;
  notes?: string;
}

export interface UpdateProfileData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  title?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  location?: string | null;
  website?: string | null;
  timezone?: string | null;
  acceptingClients?: boolean | null;
  yearsExperience?: number | null;
  certifications?: string[] | null;
}

export interface DashboardStats {
  upcomingSessions: number;
  totalClients: number;
  thisMonthEarnings: number;
  totalSessions: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CoachPanelService {
  constructor(
    @InjectRepository(CoachEntity)
    private readonly coachRepo: Repository<CoachEntity>,

    @InjectRepository(BookingEntity)
    private readonly bookingRepo: Repository<BookingEntity>,

    @InjectRepository(CoachingServiceEntity)
    private readonly serviceRepo: Repository<CoachingServiceEntity>,

    @InjectRepository(AvailabilityEntity)
    private readonly availRepo: Repository<AvailabilityEntity>,

    @InjectRepository(AvailabilityBlockEntity)
    private readonly blockRepo: Repository<AvailabilityBlockEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,

    private readonly notifications: BookingNotificationService,
  ) {}

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolves the CoachEntity for a given Supabase user id.
   * Throws NotFoundException if the user has no coach record.
   */
  async resolveCoach(userId: string): Promise<CoachEntity> {
    const coach = await this.coachRepo.findOne({ where: { userId } });
    if (!coach) {
      throw new NotFoundException(
        `No coach profile found for user "${userId}". Contact support.`,
      );
    }
    return coach;
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  async getDashboard(userId: string): Promise<DashboardStats> {
    const coach = await this.resolveCoach(userId);
    const coachId = coach.id;
    const now = new Date();

    // Upcoming confirmed sessions
    const upcomingSessions = await this.bookingRepo.count({
      where: {
        coachId,
        status: BookingStatus.CONFIRMED,
        startTime: MoreThan(now),
      },
    });

    // Total unique clients
    const clientsResult = await this.bookingRepo
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b.user_id)', 'count')
      .where('b.coach_id = :coachId', { coachId })
      .getRawOne<{ count: string }>();
    const totalClients = Number.parseInt(clientsResult?.count ?? '0', 10);

    // This month earnings: sum amountCents from paid orders linked to this coach's bookings
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const earningsResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.amount_cents), 0)', 'total')
      .innerJoin(
        BookingEntity,
        'b',
        'b.order_id = o.id AND b.coach_id = :coachId',
        { coachId },
      )
      .where('o.status = :status', { status: OrderStatus.PAID })
      .andWhere('o.paid_at >= :start', { start: startOfMonth })
      .andWhere('o.paid_at <= :end', { end: endOfMonth })
      .getRawOne<{ total: string }>();
    const thisMonthEarnings = Number.parseInt(earningsResult?.total ?? '0', 10);

    // Total sessions ever
    const totalSessions = await this.bookingRepo.count({ where: { coachId } });

    return { upcomingSessions, totalClients, thisMonthEarnings, totalSessions };
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  async getProfile(userId: string) {
    const coach = await this.resolveCoach(userId);
    const profile = await this.profileRepo.findOne({ where: { id: userId } });
    return {
      ...coach,
      fullName: profile?.fullName ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const coach = await this.resolveCoach(userId);

    // Update profile fields (fullName, email, phone)
    if (
      data.fullName !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined
    ) {
      const profilePatch: Partial<ProfileEntity> = {};
      if (data.fullName !== undefined) profilePatch.fullName = data.fullName;
      if (data.email !== undefined) profilePatch.email = data.email!;
      if (data.phone !== undefined) profilePatch.phone = data.phone ?? null;
      await this.profileRepo.update({ id: userId }, profilePatch);
    }

    // Update coach fields
    const patch: Partial<CoachEntity> = {};
    if (data.bio !== undefined) patch.bio = data.bio ?? null;
    if (data.title !== undefined) patch.title = data.title ?? null;
    if (data.expertise !== undefined) patch.expertise = data.expertise ?? null;
    if (data.languages !== undefined) patch.languages = data.languages ?? null;
    if (data.location !== undefined) patch.location = data.location ?? null;
    if (data.website !== undefined) patch.website = data.website ?? null;
    if (data.timezone !== undefined) patch.timezone = data.timezone ?? null;
    if (data.acceptingClients !== undefined)
      patch.acceptingClients = data.acceptingClients ?? null;
    if (data.yearsExperience !== undefined)
      patch.yearsExperience = data.yearsExperience ?? null;
    if (data.certifications !== undefined)
      patch.certifications = data.certifications ?? null;

    if (Object.keys(patch).length > 0) {
      await this.coachRepo.update({ id: coach.id }, patch);
    }

    return this.getProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------

  async getAvailability(userId: string): Promise<AvailabilityEntity[]> {
    const coach = await this.resolveCoach(userId);
    return this.availRepo.find({
      where: { coachId: coach.id },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateAvailability(
    userId: string,
    slots: AvailabilitySlot[],
  ): Promise<AvailabilityEntity[]> {
    const coach = await this.resolveCoach(userId);
    const coachId = coach.id;

    // Replace strategy: delete all existing, insert new
    await this.availRepo.delete({ coachId });

    if (slots.length === 0) {
      return [];
    }

    const entities = slots.map((slot) =>
      this.availRepo.create({
        coachId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive ?? true,
      }),
    );

    return this.availRepo.save(entities);
  }

  // ---------------------------------------------------------------------------
  // Availability Blocks
  // ---------------------------------------------------------------------------

  async getBlocks(userId: string): Promise<AvailabilityBlockEntity[]> {
    const coach = await this.resolveCoach(userId);
    return this.blockRepo.find({
      where: { coachId: coach.id },
      order: { startTime: 'ASC' },
    });
  }

  async createBlock(
    userId: string,
    data: CreateBlockData,
  ): Promise<AvailabilityBlockEntity> {
    const coach = await this.resolveCoach(userId);

    const entity = this.blockRepo.create({
      coachId: coach.id,
      startTime: new Date(data.startAt),
      endTime: new Date(data.endAt),
      reason: data.reason ?? null,
    });

    return this.blockRepo.save(entity);
  }

  async deleteBlock(userId: string, blockId: string): Promise<void> {
    const coach = await this.resolveCoach(userId);

    const block = await this.blockRepo.findOne({ where: { id: blockId } });
    if (!block) {
      throw new NotFoundException(`Availability block "${blockId}" not found`);
    }

    // Ensure the block belongs to this coach
    if (block.coachId !== coach.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this block',
      );
    }

    await this.blockRepo.delete({ id: blockId });
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  async getServices(userId: string): Promise<CoachingServiceEntity[]> {
    const coach = await this.resolveCoach(userId);
    return this.serviceRepo.find({
      where: { coachId: coach.id },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  async getSessions(userId: string): Promise<CoachSessionDto[]> {
    const coach = await this.resolveCoach(userId);

    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .leftJoin(OrderEntity, 'o', 'o.id = b.order_id')
      .leftJoin(CoachingServiceEntity, 's', 's.id = b.service_id')
      .select('b.id', 'id')
      .addSelect('b.status', 'status')
      .addSelect('b.startTime', 'startAt')
      .addSelect('b.endTime', 'endAt')
      .addSelect("COALESCE(o.customer_name, 'Nieznany')", 'clientName')
      .addSelect("COALESCE(o.customer_email, '')", 'clientEmail')
      .addSelect("COALESCE(s.name, '')", 'serviceName')
      .addSelect('b.meetingUrl', 'meetingUrl')
      .addSelect('b.notes', 'notes')
      .addSelect('b.rescheduledAt', 'rescheduledAt')
      .addSelect('b.cancellationReason', 'cancellationReason')
      .where('b.coach_id = :coachId', { coachId: coach.id })
      .orderBy('b.start_time', 'DESC')
      .getRawMany<CoachSessionDto>();

    // For manual sessions (no order), parse client info from notes JSON
    return rows.map((row) => {
      if (row.clientName === 'Nieznany' && row.notes) {
        try {
          const parsed = JSON.parse(row.notes) as {
            manualClient?: { name?: string; email?: string };
          };
          if (parsed.manualClient) {
            return {
              ...row,
              clientName: parsed.manualClient.name || 'Klient',
              clientEmail: parsed.manualClient.email || '',
            };
          }
        } catch {
          // ignore malformed notes
        }
      }
      return row;
    });
  }

  // ---------------------------------------------------------------------------
  // Session actions (coach-initiated)
  // ---------------------------------------------------------------------------

  async cancelSession(
    userId: string,
    bookingId: string,
    reason?: string,
  ): Promise<void> {
    const coach = await this.resolveCoach(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Session not found');
    if (booking.coachId !== coach.id)
      throw new ForbiddenException('Not your session');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Session is already cancelled');
    }
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason ?? null;
    await this.bookingRepo.save(booking);

    // Resolve client info for cancellation email
    let customerEmail: string | null = null;
    let customerName = 'Klient';
    if (booking.orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: booking.orderId },
      });
      customerEmail = order?.customerEmail ?? null;
      customerName = order?.customerName ?? 'Klient';
    } else if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes) as {
          manualClient?: { email?: string; name?: string };
        };
        customerEmail = parsed.manualClient?.email ?? null;
        customerName = parsed.manualClient?.name || 'Klient';
      } catch {
        /* ignore */
      }
    }

    if (customerEmail) {
      const profile = await this.profileRepo.findOne({ where: { id: userId } });
      void this.notifications.sendCancellation({
        booking,
        customerEmail,
        customerName,
        coachName: profile?.fullName ?? null,
        coachEmail: profile?.email ?? null,
      });
    }
  }

  async rescheduleSession(
    userId: string,
    bookingId: string,
    data: RescheduleSessionData,
  ): Promise<void> {
    const coach = await this.resolveCoach(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Session not found');
    if (booking.coachId !== coach.id)
      throw new ForbiddenException('Not your session');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only reschedule confirmed sessions');
    }

    const newStart = new Date(data.newStartAt);
    const newEnd = new Date(data.newEndAt);
    if (newEnd <= newStart)
      throw new BadRequestException('End must be after start');

    // Conflict check (coach's other confirmed bookings)
    const conflict = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.coach_id = :coachId', { coachId: coach.id })
      .andWhere('b.id != :id', { id: bookingId })
      .andWhere('b.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('b.start_time < :end', { end: newEnd })
      .andWhere('b.end_time > :start', { start: newStart })
      .getOne();
    if (conflict) {
      throw new ConflictException(
        'New time conflicts with an existing session',
      );
    }

    const previousStart = booking.startTime;
    booking.rescheduledFrom = booking.startTime;
    booking.rescheduledAt = new Date();
    booking.rescheduleReason = data.reason ?? null;
    booking.rescheduleCount = (booking.rescheduleCount ?? 0) + 1;
    booking.startTime = newStart;
    booking.endTime = newEnd;
    await this.bookingRepo.save(booking);

    // Resolve client info for reschedule email
    let customerEmail: string | null = null;
    let customerName = 'Klient';
    if (booking.orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: booking.orderId },
      });
      customerEmail = order?.customerEmail ?? null;
      customerName = order?.customerName ?? 'Klient';
    } else if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes) as {
          manualClient?: { email?: string; name?: string };
        };
        customerEmail = parsed.manualClient?.email ?? null;
        customerName = parsed.manualClient?.name || 'Klient';
      } catch {
        /* ignore */
      }
    }

    if (customerEmail) {
      const profile = await this.profileRepo.findOne({ where: { id: userId } });
      void this.notifications.sendRescheduled(
        {
          booking,
          customerEmail,
          customerName,
          coachName: profile?.fullName ?? null,
          coachEmail: profile?.email ?? null,
        },
        previousStart,
      );
    }
  }

  async createManualSession(
    userId: string,
    data: CreateManualSessionData,
  ): Promise<CoachSessionDto> {
    const coach = await this.resolveCoach(userId);

    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    if (end <= start) throw new BadRequestException('End must be after start');

    // Store client info in notes as JSON for manual sessions without an order
    const notes = JSON.stringify({
      manualClient: { name: data.clientName ?? '', email: data.clientEmail },
      ...(data.notes ? { coachNotes: data.notes } : {}),
    });

    let booking = this.bookingRepo.create({
      coachId: coach.id,
      userId: null,
      orderId: null,
      serviceId: data.serviceId ?? null,
      startTime: start,
      endTime: end,
      status: BookingStatus.CONFIRMED,
      notes,
    });

    booking = await this.bookingRepo.save(booking);
    booking.meetingUrl = `${process.env.FRONTEND_URL ?? ''}/meeting/${booking.id}`;
    await this.bookingRepo.save(booking);

    // Resolve service and coach profile for email
    let svc: CoachingServiceEntity | null = null;
    if (data.serviceId) {
      svc = await this.serviceRepo.findOne({ where: { id: data.serviceId } });
    }
    const profile = await this.profileRepo.findOne({ where: { id: userId } });

    // Send confirmation email to client (non-blocking)
    void this.notifications.sendConfirmation({
      booking,
      service: svc,
      customerEmail: data.clientEmail,
      customerName: data.clientName || 'Klient',
      coachName: profile?.fullName ?? null,
      coachEmail: profile?.email ?? null,
    });

    return {
      id: booking.id,
      status: booking.status ?? BookingStatus.CONFIRMED,
      startAt: booking.startTime.toISOString(),
      endAt: booking.endTime.toISOString(),
      clientName: data.clientName || 'Klient',
      clientEmail: data.clientEmail,
      serviceName: svc?.name ?? '',
      meetingUrl: booking.meetingUrl,
      notes: booking.notes,
      rescheduledAt: null,
      cancellationReason: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Past clients list (for manual session autocomplete)
  // ---------------------------------------------------------------------------

  async getClients(userId: string): Promise<CoachClientDto[]> {
    const coach = await this.resolveCoach(userId);

    // Clients from paid orders
    const orderClients = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.customer_email', 'email')
      .addSelect('MAX(o.customer_name)', 'name')
      .innerJoin(
        BookingEntity,
        'b',
        'b.order_id = o.id AND b.coach_id = :coachId',
        { coachId: coach.id },
      )
      .where('o.customer_email IS NOT NULL')
      .andWhere("o.customer_email != ''")
      .groupBy('o.customer_email')
      .orderBy('MAX(o.created_at)', 'DESC')
      .getRawMany<{ email: string; name: string }>();

    // Clients from manual sessions (stored in notes JSON, orderId IS NULL)
    const manualBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.notes', 'notes')
      .where('b.coach_id = :coachId', { coachId: coach.id })
      .andWhere('b.order_id IS NULL')
      .andWhere('b.notes IS NOT NULL')
      .getRawMany<{ notes: string }>();

    const manualClients: CoachClientDto[] = [];
    const seenEmails = new Set(orderClients.map((c) => c.email.toLowerCase()));

    for (const b of manualBookings) {
      if (!b.notes) continue; // already filtered by IS NOT NULL, but guard anyway
      try {
        const parsed = JSON.parse(b.notes) as {
          manualClient?: { email?: string; name?: string };
        };
        const email = parsed.manualClient?.email;
        const name = parsed.manualClient?.name ?? '';
        if (email && !seenEmails.has(email.toLowerCase())) {
          seenEmails.add(email.toLowerCase());
          manualClients.push({ email, name });
        }
      } catch {
        // ignore malformed notes
      }
    }

    return [
      ...orderClients.map((c) => ({ email: c.email, name: c.name ?? '' })),
      ...manualClients,
    ];
  }
}

export interface CoachClientDto {
  email: string;
  name: string;
}

export interface CoachSessionDto {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  meetingUrl: string | null;
  notes: string | null;
  rescheduledAt: string | null;
  cancellationReason: string | null;
}
