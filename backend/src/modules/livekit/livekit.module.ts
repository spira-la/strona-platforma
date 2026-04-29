import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LivekitService } from './livekit.service.js';
import { LivekitEgressService } from './livekit-egress.service.js';
import { LivekitController } from './livekit.controller.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      CoachEntity,
      ProfileEntity,
      OrderEntity,
    ]),
  ],
  controllers: [LivekitController],
  providers: [LivekitService, LivekitEgressService],
  exports: [LivekitService, LivekitEgressService],
})
export class LivekitModule {}
