import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { SlotHoldsService } from './slot-holds.service.js';

interface CreateSlotHoldDto {
  coachId: string;
  userId?: string | null;
  startTime: string;
  endTime: string;
}

@Controller('slot-holds')
export class SlotHoldsController {
  constructor(private readonly slotHolds: SlotHoldsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateSlotHoldDto) {
    const hold = await this.slotHolds.create({
      coachId: body.coachId,
      userId: body.userId ?? null,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
    return { success: true, data: hold };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async release(@Param('id') id: string) {
    await this.slotHolds.release(id);
  }
}
