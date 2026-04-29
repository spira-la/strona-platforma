import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripe: StripeService) {}

  /**
   * GET /api/stripe/config
   * Lets the frontend know whether to render the mock button or real
   * Stripe Elements, and exposes the publishable key when real.
   */
  @Get('config')
  getConfig() {
    return {
      mockMode: this.stripe.isMockMode,
      publishableKey: this.stripe.isMockMode
        ? null
        : (process.env.STRIPE_PUBLISHABLE_KEY ?? null),
    };
  }

  /**
   * POST /api/stripe/webhook
   * Stripe posts here in real mode. The body must be the raw request
   * buffer so the signature can be verified — handled in main.ts via
   * bodyParser raw() on this exact path.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      throw new BadRequestException(
        'Raw body not available — configure raw body parsing for /api/stripe/webhook',
      );
    }
    return this.stripe.handleWebhook(raw, signature);
  }

  /**
   * POST /api/stripe/mock/confirm/:paymentIntentId
   * Mock-mode only. Frontend calls this instead of confirming with Stripe.js.
   */
  @Post('mock/confirm/:paymentIntentId')
  @HttpCode(HttpStatus.OK)
  async mockConfirm(@Param('paymentIntentId') id: string) {
    const result = await this.stripe.mockConfirm(id);
    return { success: true, data: result };
  }
}
