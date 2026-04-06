import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { CoreModule } from './core/core.module.js';
import { CmsModule } from './modules/cms/cms.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    CoreModule,
    EmailModule,
    CmsModule,
    CouponsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
