import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { CoreModule } from './core/core.module.js';
import { CmsModule } from './modules/cms/cms.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    CoreModule,
    CmsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
