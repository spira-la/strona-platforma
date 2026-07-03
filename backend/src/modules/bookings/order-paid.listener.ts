import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service.js';
import { BookingsService } from './bookings.service.js';
import { BookingNotificationService } from './booking-notification.service.js';
import { SlotHoldsService } from '../slot-holds/slot-holds.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { PAYMENT_SUCCEEDED_EVENT } from '../stripe/stripe.types.js';
import type { PaymentSucceededEvent } from '../stripe/stripe.types.js';
import { OrderStatus } from '../../db/entities/enums.js';

@Injectable()
export class OrderPaidListener {
  private readonly logger = new Logger(OrderPaidListener.name);

  constructor(
    private readonly orders: OrdersService,
    private readonly bookings: BookingsService,
    private readonly notifications: BookingNotificationService,
    private readonly slotHolds: SlotHoldsService,
    private readonly coupons: CouponsService,
    @InjectRepository(CoachEntity)
    private readonly coachesRepo: Repository<CoachEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profilesRepo: Repository<ProfileEntity>,
  ) {}

  @OnEvent(PAYMENT_SUCCEEDED_EVENT, { async: true })
  async handle(event: PaymentSucceededEvent): Promise<void> {
    this.logger.log(
      `Processing payment success for order ${event.orderId} (PI ${event.paymentIntentId})`,
    );

    const order = await this.orders.findById(event.orderId);

    // Idempotency — webhook may fire twice.
    if (order.status === OrderStatus.PAID) {
      this.logger.warn(`Order ${order.id} already paid — skipping`);
      return;
    }

    if (!order.bookingSlots || order.bookingSlots.length === 0) {
      this.logger.error(
        `Order ${order.id} has no booking slots — cannot create bookings`,
      );
      await this.orders.markPaid(order.id);
      return;
    }

    await this.orders.markPaid(order.id);

    const coach = order.coachId
      ? await this.coachesRepo.findOne({ where: { id: order.coachId } })
      : null;
    const coachProfile =
      coach && coach.userId
        ? await this.profilesRepo.findOne({ where: { id: coach.userId } })
        : null;

    // Create one booking per slot (packages = N bookings under one order).
    const createdBookings = [];
    for (const slot of order.bookingSlots) {
      const booking = await this.bookings.create({
        orderId: order.id,
        userId: order.userId ?? null,
        coachId: order.coachId!,
        serviceId: order.serviceId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      });
      createdBookings.push(booking);
    }

    // Release holds attached to the order (they're now promoted to bookings).
    await this.slotHolds.releaseByOrder(order.id);

    // Record coupon usage once per order.
    if (order.couponId) {
      try {
        await this.coupons.recordUsage(order.couponId);
      } catch (error) {
        this.logger.warn(
          `Could not record coupon usage for order ${order.id}: ${(error as Error).message}`,
        );
      }
    }

    // Send confirmation emails — one per booking so the client gets one
    // .ics attachment per session they can add to their calendar.
    const customerEmail = order.customerEmail ?? '';
    const customerName = order.customerName ?? '';
    const coachName = coachProfile?.fullName ?? null;
    const coachEmail = coachProfile?.email ?? null;

    if (!customerEmail) {
      this.logger.warn(
        `Order ${order.id} has no customerEmail — skipping notifications`,
      );
      return;
    }

    for (const booking of createdBookings) {
      await this.notifications.sendConfirmation({
        booking,
        customerEmail,
        customerName,
        coachName,
        coachEmail,
      });
    }

    this.logger.log(
      `Created ${createdBookings.length} booking(s) for order ${order.id}`,
    );
  }
}
