import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';
import { CoachingServicesService } from './coaching-services.service.js';
import { CoachingServicesController } from './coaching-services.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CoachingServiceEntity])],
  controllers: [CoachingServicesController],
  providers: [CoachingServicesService],
  exports: [CoachingServicesService],
})
export class CoachingServicesModule {}
