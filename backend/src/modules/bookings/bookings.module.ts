import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingNotificationService } from './booking-notification.service.js';
import { OrderPaidListener } from './order-paid.listener.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { SlotHoldsModule } from '../slot-holds/slot-holds.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      CoachEntity,
      ProfileEntity,
      OrderEntity,
      CoachingServiceEntity,
    ]),
    SlotHoldsModule,
    OrdersModule,
    CouponsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingNotificationService, OrderPaidListener],
  exports: [BookingsService, BookingNotificationService],
})
export class BookingsModule {}
