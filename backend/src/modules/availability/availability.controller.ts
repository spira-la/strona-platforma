import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service.js';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  /**
   * GET /api/availability/slots?coachId=<uuid>&date=YYYY-MM-DD&durationMinutes=60
   */
  @Get('slots')
  async getSlots(
    @Query('coachId') coachId: string,
    @Query('date') date: string,
    @Query('durationMinutes', new DefaultValuePipe(60), ParseIntPipe)
    durationMinutes: number,
  ) {
    if (!coachId || !date) {
      throw new BadRequestException('coachId and date are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }
    const data = await this.availability.getSlots({
      coachId,
      date,
      durationMinutes,
    });
    return { success: true, data };
  }
}
