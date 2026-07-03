import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { SlotHoldsModule } from '../slot-holds/slot-holds.module.js';
import { StripeModule } from '../stripe/stripe.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, CoachingServiceEntity]),
    CouponsModule,
    SlotHoldsModule,
    StripeModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
