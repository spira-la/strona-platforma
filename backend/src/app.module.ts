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
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('DB_SCHEMA') ?? 'spirala_dev_schema';
        return {
          type: 'postgres' as const,
          url: config.getOrThrow<string>('DATABASE_URL'),
          schema,
          entities: ALL_ENTITIES,
          synchronize: false,
          migrationsRun: true,
          migrations: [__dirname + '/db/migrations/*.js'],
          // Use gen_random_uuid() — built into PostgreSQL 13+, no extension needed
          uuidExtension: 'pgcrypto' as const,
          ssl: { rejectUnauthorized: false },
          extra: {
            ssl: { rejectUnauthorized: false },
            options: `-c search_path=${schema},public`,
          },
          logging: config.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    CoreModule,
    EmailModule,
    CmsModule,
    CouponsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
