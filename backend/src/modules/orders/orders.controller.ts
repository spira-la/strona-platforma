import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { OrdersService, CreateOrderInput } from './orders.service.js';

interface CreateOrderDto {
  serviceId: string;
  coachId: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  slots: Array<{ startTime: string; endTime: string; holdId?: string }>;
  couponCode?: string | null;
  invoiceData?: CreateOrderInput['invoiceData'];
  notes?: string | null;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateOrderDto) {
    const result = await this.orders.create(body);
    return {
      success: true,
      data: {
        orderId: result.order.id,
        status: result.order.status,
        amountCents: result.order.amountCents,
        currency: result.order.currency,
        paymentIntent: result.paymentIntent,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.orders.findById(id);
    return { success: true, data: order };
  }
}
