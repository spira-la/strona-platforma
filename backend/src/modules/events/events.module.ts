import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EventEntity,
  EventRegistrationEntity,
} from '../../db/entities/event.entity.js';
import { EventsService } from './events.service.js';
import {
  AdminEventsController,
  EventsController,
} from './events.controller.js';

/**
 * Events the coach manages from the admin panel + e-mail sign-ups
 * (page /wydarzenia). EmailModule and CoreModule (StorageService) are global.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, EventRegistrationEntity])],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
})
export class EventsModule {}
