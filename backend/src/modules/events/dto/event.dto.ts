import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Admin — create an event. */
export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsISO8601()
  startsAt!: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string | null;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  priceLabel?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;
}

/** Admin — update an event (every field optional). */
export class UpdateEventDto extends PartialType(CreateEventDto) {}

/** Public — sign up for an event through the e-mail form. */
export class CreateEventRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
