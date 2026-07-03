import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { BookingNotificationService } from './booking-notification.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';

interface RescheduleBookingDto {
  newStartTime: string;
  newEndTime: string;
  reason?: string;
  userId?: string;
}

interface CanRescheduleResponse {
  canReschedule: boolean;
  reason?: string;
  minCancellationNoticeMinutes?: number;
  minutesUntilSession?: number;
}

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly notifications: BookingNotificationService,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profiles: Repository<ProfileEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
  ) {}

  @Get('by-user/:userId')
  async findByUser(@Param('userId') userId: string) {
    const data = await this.bookings.findByUser(userId);
    return { success: true, data };
  }

  @Get('by-coach/:coachId')
  async findByCoach(@Param('coachId') coachId: string) {
    const data = await this.bookings.findByCoach(coachId);
    return { success: true, data };
  }

  @Get('by-order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    const data = await this.bookings.findByOrder(orderId);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.bookings.findById(id);
    return { success: true, data };
  }

  @Get(':id/can-reschedule')
  async canReschedule(
    @Param('id') id: string,
  ): Promise<{ success: true; data: CanRescheduleResponse }> {
    const booking = await this.bookings.findById(id);
    const coach = await this.coaches.findOne({
      where: { id: booking.coachId },
    });
    const notice = coach?.minCancellationNoticeMinutes ?? 1440;
    const minutesUntilSession = Math.floor(
      (booking.startTime.getTime() - Date.now()) / 60_000,
    );
    const canReschedule = minutesUntilSession >= notice;
    return {
      success: true,
      data: {
        canReschedule,
        reason: canReschedule
          ? undefined
          : `Changes require at least ${Math.round(notice / 60)}h notice`,
        minCancellationNoticeMinutes: notice,
        minutesUntilSession,
      },
    };
  }

  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  async reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleBookingDto,
  ) {
    const result = await this.bookings.reschedule({
      bookingId: id,
      userId: body.userId,
      newStartTime: new Date(body.newStartTime),
      newEndTime: new Date(body.newEndTime),
      reason: body.reason,
    });

    // Fire notification
    const order = result.booking.orderId
      ? await this.orders.findOne({ where: { id: result.booking.orderId } })
      : null;
    const coach = await this.coaches.findOne({
      where: { id: result.booking.coachId },
    });
    const coachProfile = coach?.userId
      ? await this.profiles.findOne({ where: { id: coach.userId } })
      : null;

    if (order?.customerEmail) {
      await this.notifications.sendRescheduled(
        {
          booking: result.booking,
          customerEmail: order.customerEmail,
          customerName: order.customerName ?? '',
          coachName: coachProfile?.fullName ?? null,
          coachEmail: coachProfile?.email ?? null,
        },
        result.previousStart,
      );
    }

    return { success: true, data: result.booking };
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Query('reason') reason?: string) {
    const data = await this.bookings.cancel(id, reason);
    return { success: true, data };
  }
}
