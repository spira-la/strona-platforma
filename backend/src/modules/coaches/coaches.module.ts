import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { CoachesService } from './coaches.service.js';
import { CoachesController } from './coaches.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CoachEntity, ProfileEntity])],
  providers: [CoachesService],
  controllers: [CoachesController],
  exports: [CoachesService],
})
export class CoachesModule {}
