import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface UpdateProfileData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
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
      order: { startDate: 'ASC' },
    });
  }

  async createBlock(
    userId: string,
    data: CreateBlockData,
  ): Promise<AvailabilityBlockEntity> {
    const coach = await this.resolveCoach(userId);

    const entity = this.blockRepo.create({
      coachId: coach.id,
      startDate: data.startDate,
      endDate: data.endDate,
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

  async getSessions(userId: string): Promise<BookingEntity[]> {
    const coach = await this.resolveCoach(userId);
    return this.bookingRepo.find({
      where: { coachId: coach.id },
      order: { startTime: 'DESC' },
    });
  }
}
