import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotHoldsService } from './slot-holds.service.js';
import { SlotHoldsController } from './slot-holds.controller.js';
import { SlotHoldEntity } from '../../db/entities/slot-hold.entity.js';
import { BookingEntity } from '../../db/entities/booking.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlotHoldEntity, BookingEntity, CoachEntity]),
  ],
  controllers: [SlotHoldsController],
  providers: [SlotHoldsService],
  exports: [SlotHoldsService],
})
export class SlotHoldsModule {}
