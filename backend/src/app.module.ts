import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation.js';
import { ALL_ENTITIES } from './db/entities/index.js';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        schema: process.env.DB_SCHEMA ?? 'spirala_dev_schema',
        entities: ALL_ENTITIES,
        synchronize: false,
        migrationsRun: false,
        migrations: [],
        ssl: { rejectUnauthorized: false },
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    CoreModule,
    EmailModule,
    CmsModule,
    CouponsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
