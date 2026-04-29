import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { OrderStatus } from '../../db/entities/enums.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { SlotHoldsService } from '../slot-holds/slot-holds.service.js';
import { StripeService } from '../stripe/stripe.service.js';

export interface SlotInput {
  startTime: string; // ISO
  endTime: string; // ISO
  holdId?: string; // optional — if frontend pre-held the slot
}

export interface CreateOrderInput {
  serviceId: string;
  coachId: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  slots: SlotInput[]; // length must equal service.sessionCount
  couponCode?: string | null;
  invoiceData?: OrderEntity['invoiceData'];
  notes?: string | null;
}

export interface CreateOrderResult {
  order: OrderEntity;
  paymentIntent: {
    id: string;
    clientSecret: string;
    mocked: boolean;
  };
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(CoachingServiceEntity)
    private readonly services: Repository<CoachingServiceEntity>,
    private readonly coupons: CouponsService,
    private readonly slotHolds: SlotHoldsService,
    private readonly stripe: StripeService,
  ) {}

  async create(input: CreateOrderInput): Promise<CreateOrderResult> {
    const service = await this.services.findOne({
      where: { id: input.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service not found: ${input.serviceId}`);
    }
    if (!service.isActive) {
      throw new BadRequestException('This service is no longer available');
    }

    const sessionsTotal = service.sessionCount ?? 1;
    if (input.slots.length !== sessionsTotal) {
      throw new BadRequestException(
        `Service requires exactly ${sessionsTotal} slot(s), received ${input.slots.length}`,
      );
    }

    // Validate chronology + no duplicate timestamps
    const seen = new Set<number>();
    for (const s of input.slots) {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.endTime).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        throw new BadRequestException(`Invalid slot: ${JSON.stringify(s)}`);
      }
      if (seen.has(start)) {
        throw new BadRequestException(
          `Duplicate slot start time: ${s.startTime}`,
        );
      }
      seen.add(start);
    }

    // Re-verify availability for every slot at order creation time.
    // This closes the gap between frontend hold and backend commit.
    for (const slot of input.slots) {
      await this.slotHolds.assertAvailable({
        coachId: input.coachId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        excludeHoldId: slot.holdId,
      });
    }

    const subtotalCents = service.priceCents;
    const currency = service.currency ?? 'PLN';

    // Coupon
    let couponId: string | null = null;
    let discountCents = 0;
    if (input.couponCode) {
      const result = await this.coupons.validateCoupon(
        input.couponCode,
        subtotalCents,
      );
      if (!result.valid || !result.coupon) {
        throw new BadRequestException(result.error ?? 'Invalid coupon');
      }
      couponId = result.coupon.id;
      discountCents = result.discountAmountCents ?? 0;
    }

    const amountCents = Math.max(0, subtotalCents - discountCents);
    if (amountCents === 0) {
      throw new ConflictException(
        'Free orders not supported in this flow yet — discount covers the full price',
      );
    }

    // Persist the order in PENDING so the frontend can poll it.
    const order = this.orders.create({
      userId: input.userId ?? null,
      serviceId: input.serviceId,
      coachId: input.coachId,
      status: OrderStatus.PENDING,
      amountCents,
      taxCents: 0,
      discountCents,
      currency,
      couponId,
      sessionsTotal,
      sessionsRemaining: sessionsTotal,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? null,
      invoiceData: input.invoiceData ?? null,
      notes: input.notes ?? null,
      bookingSlots: input.slots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });

    const saved = await this.orders.save(order);

    // Attach existing holds to this order so webhook/cleanup can find them.
    const heldIds = input.slots.map((s) => s.holdId).filter(Boolean);
    if (heldIds.length > 0) {
      await this.slotHolds.attachToOrder(heldIds, saved.id);
    }

    const pi = await this.stripe.createPaymentIntent({
      amountCents,
      currency,
      orderId: saved.id,
      customerEmail: input.customerEmail,
      description: `${service.name} — ${sessionsTotal} session(s)`,
    });

    saved.stripePaymentIntentId = pi.id;
    await this.orders.save(saved);

    this.logger.log(
      `Created order ${saved.id} (PI ${pi.id}, mock=${pi.mocked})`,
    );

    return {
      order: saved,
      paymentIntent: {
        id: pi.id,
        clientSecret: pi.clientSecret,
        mocked: pi.mocked,
      },
    };
  }

  async findById(id: string): Promise<OrderEntity> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }
    return order;
  }

  async findByPaymentIntent(
    paymentIntentId: string,
  ): Promise<OrderEntity | null> {
    return this.orders.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
  }

  async markPaid(
    orderId: string,
    paidAt: Date = new Date(),
  ): Promise<OrderEntity> {
    await this.orders.update(
      { id: orderId },
      { status: OrderStatus.PAID, paidAt },
    );
    return this.findById(orderId);
  }
}
