import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { AvailabilityEntity, AvailabilityBlockEntity } from '../../db/entities/availability.entity.js';
import { OrderEntity } from '../../db/entities/order.entity.js';
import { CoachPanelService } from './coach-panel.service.js';
import { CoachPanelController } from './coach-panel.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoachEntity,
      BookingEntity,
      CoachingServiceEntity,
      AvailabilityEntity,
      AvailabilityBlockEntity,
      OrderEntity,
    ]),
  ],
  controllers: [CoachPanelController],
  providers: [CoachPanelService],
  exports: [CoachPanelService],
})
export class CoachPanelModule {}
