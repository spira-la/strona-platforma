import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service.js';
import { AvailabilityController } from './availability.controller.js';
import {
  AvailabilityEntity,
  AvailabilityBlockEntity,
} from '../../db/entities/availability.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { SlotHoldEntity } from '../../db/entities/slot-hold.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityEntity,
      AvailabilityBlockEntity,
      BookingEntity,
      SlotHoldEntity,
      CoachEntity,
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
