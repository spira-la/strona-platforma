import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageEntity } from '../../db/entities/language.entity.js';
import { LanguagesService } from './languages.service.js';
import { LanguagesController } from './languages.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([LanguageEntity])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
