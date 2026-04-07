import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { CouponEntity } from '../../db/entities/coupon.entity.js';
import { DiscountType } from '../../db/entities/enums.js';

const CACHE_KEY_ALL = 'coupons:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Re-export the Coupon type from the entity for backwards compatibility
export type Coupon = CouponEntity;

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmountCents?: number;
  error?: string;
  errorCode?: string;
}

export interface CreateCouponData {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxUses?: number | null;
  expiresAt?: string | null;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {
  isActive?: boolean;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly repo: Repository<CouponEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<Coupon[]> {
    const cached = this.cache.get<Coupon[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { createdAt: 'DESC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<Coupon> {
    const coupon = await this.repo.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase() } });
  }

  async create(data: CreateCouponData): Promise<Coupon> {
    const upperCode = data.code.toUpperCase();

    const existing = await this.findByCode(upperCode);
    if (existing) {
      throw new ConflictException(`Coupon code "${upperCode}" already exists`);
    }

    const entity = this.repo.create({
      code: upperCode,
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    const created = await this.repo.save(entity);

    this.cache.delete(CACHE_KEY_ALL);
    return created;
  }

  async update(id: string, data: UpdateCouponData): Promise<Coupon> {
    // Ensure the coupon exists
    await this.findById(id);

    // If code is being changed, verify uniqueness
    if (data.code !== undefined) {
      const upperCode = data.code.toUpperCase();
      const existing = await this.findByCode(upperCode);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Coupon code "${upperCode}" already exists`);
      }
      data = { ...data, code: upperCode };
    }

    const updatePayload: Partial<CouponEntity> = {};

    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.discountType !== undefined)
      updatePayload.discountType = data.discountType as DiscountType;
    if (data.discountValue !== undefined)
      updatePayload.discountValue = data.discountValue;
    if (data.maxUses !== undefined) updatePayload.maxUses = data.maxUses ?? null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if ('expiresAt' in data) {
      updatePayload.expiresAt = data.expiresAt
        ? new Date(data.expiresAt)
        : null;
    }

    await this.repo.update({ id }, updatePayload);

    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<Coupon> {
    // Ensure the coupon exists
    await this.findById(id);

    await this.repo.update({ id }, { isActive: false });

    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async validateCoupon(
    code: string,
    totalAmountCents: number,
  ): Promise<ValidateCouponResult> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return {
        valid: false,
        error: 'Coupon code not found',
        errorCode: 'COUPON_NOT_FOUND',
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        error: 'This coupon is no longer active',
        errorCode: 'COUPON_INACTIVE',
      };
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return {
        valid: false,
        error: 'This coupon has expired',
        errorCode: 'COUPON_EXPIRED',
      };
    }

    if (
      coupon.maxUses !== null &&
      coupon.maxUses !== undefined &&
      (coupon.currentUses ?? 0) >= coupon.maxUses
    ) {
      return {
        valid: false,
        error: 'This coupon has reached its usage limit',
        errorCode: 'COUPON_MAX_USES_REACHED',
      };
    }

    // Calculate discount amount in cents
    let discountAmountCents: number;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmountCents = Math.round(
        (totalAmountCents * coupon.discountValue) / 100,
      );
    } else {
      // 'fixed' — discountValue is stored as cents
      discountAmountCents = coupon.discountValue;
    }

    // Clamp so discount never exceeds total
    discountAmountCents = Math.min(discountAmountCents, totalAmountCents);

    return {
      valid: true,
      coupon,
      discountAmountCents,
    };
  }

  async recordUsage(id: string): Promise<void> {
    await this.repo.increment({ id }, 'currentUses', 1);
    this.cache.delete(CACHE_KEY_ALL);
  }
}
