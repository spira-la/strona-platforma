import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsController } from './cms.controller.js';
import { CmsService } from './cms.service.js';
import { CmsContentEntity } from '../../db/entities/cms-content.entity.js';
import { CmsContentBackupEntity } from '../../db/entities/cms-content-backup.entity.js';

// StorageService and CacheService are provided by CoreModule (@Global),
// so they are available for injection here without an explicit import.

@Module({
  imports: [
    TypeOrmModule.forFeature([CmsContentEntity, CmsContentBackupEntity]),
  ],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
