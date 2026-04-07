import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation.js';
import { ALL_ENTITIES } from './db/entities/index.js';
import { CoreModule } from './core/core.module.js';
import { CmsModule } from './modules/cms/cms.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { CoachingServicesModule } from './modules/coaching-services/coaching-services.module.js';
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
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('DATABASE_SCHEMA') ?? 'spirala_dev_schema';
        const useSSL = config.get<string>('DATABASE_SSL') === 'true';
        return {
          type: 'postgres' as const,
          host: config.getOrThrow<string>('DATABASE_HOST'),
          port: config.get<number>('DATABASE_PORT') ?? 5432,
          username: config.getOrThrow<string>('DATABASE_USER'),
          password: config.getOrThrow<string>('DATABASE_PASSWORD'),
          database: config.getOrThrow<string>('DATABASE_NAME'),
          schema,
          entities: ALL_ENTITIES,
          synchronize: false,
          migrationsRun: true,
          migrations: [__dirname + '/db/migrations/*.js'],
          uuidExtension: 'pgcrypto' as const,
          ...(useSSL ? {
            ssl: { rejectUnauthorized: false },
            extra: { ssl: { rejectUnauthorized: false } },
          } : {}),
          logging: config.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    CoreModule,
    EmailModule,
    CmsModule,
    CouponsModule,
    CoachingServicesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
