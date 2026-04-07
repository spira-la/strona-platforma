import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service.js';
import { CouponsController } from './coupons.controller.js';
import { CouponEntity } from '../../db/entities/coupon.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
