import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CouponsService } from './coupons.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateCouponDto {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxUses?: number | null;
  expiresAt?: string | null;
}

interface UpdateCouponDto extends Partial<CreateCouponDto> {
  isActive?: boolean;
}

interface ValidateCouponDto {
  code: string;
  totalAmountCents: number;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  /**
   * GET /api/coupons
   * Admin — list all coupons.
   */
  @Get()
  async findAll() {
    const data = await this.coupons.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/coupons/:id
   * Admin — get a single coupon by id.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.coupons.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/coupons
   * Admin — create a new coupon.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCouponDto) {
    const data = await this.coupons.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/coupons/:id
   * Admin — update an existing coupon.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCouponDto) {
    const data = await this.coupons.update(id, body);
    return { success: true, data };
  }

  /**
   * DELETE /api/coupons/:id
   * Admin — soft-delete a coupon (sets isActive=false).
   */
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    const data = await this.coupons.softDelete(id);
    return { success: true, data };
  }

  /**
   * POST /api/coupons/validate
   * Public — validate a coupon code at checkout.
   *
   * Note: This route must be declared before `:id` or NestJS will try to
   * match "validate" as an id parameter. NestJS resolves static segments
   * first, so the ordering here is correct as-is.
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() body: ValidateCouponDto) {
    const result = await this.coupons.validateCoupon(
      body.code,
      body.totalAmountCents,
    );
    return result;
  }
}
