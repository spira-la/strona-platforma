import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { AdminEmailEntity } from '../../db/entities/admin-email.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, AdminEmailEntity, CoachEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
