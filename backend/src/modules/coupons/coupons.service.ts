import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import { DatabaseService } from '../../core/database.service.js';
import { CacheService } from '../../core/cache.service.js';
import { coupons, type Coupon } from '../../db/schema/coupons.js';

const CACHE_KEY_ALL = 'coupons:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    private readonly db: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<Coupon[]> {
    const cached = this.cache.get<Coupon[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.db.db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<Coupon> {
    const [coupon] = await this.db.db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const [coupon] = await this.db.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    return coupon ?? null;
  }

  async create(data: CreateCouponData): Promise<Coupon> {
    const upperCode = data.code.toUpperCase();

    const existing = await this.findByCode(upperCode);
    if (existing) {
      throw new ConflictException(`Coupon code "${upperCode}" already exists`);
    }

    const [created] = await this.db.db
      .insert(coupons)
      .values({
        code: upperCode,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

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

    const updatePayload: Partial<typeof coupons.$inferInsert> = {};

    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.discountType !== undefined) updatePayload.discountType = data.discountType;
    if (data.discountValue !== undefined) updatePayload.discountValue = data.discountValue;
    if (data.maxUses !== undefined) updatePayload.maxUses = data.maxUses ?? null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if ('expiresAt' in data) {
      updatePayload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const [updated] = await this.db.db
      .update(coupons)
      .set(updatePayload)
      .where(eq(coupons.id, id))
      .returning();

    this.cache.delete(CACHE_KEY_ALL);
    return updated;
  }

  async softDelete(id: string): Promise<Coupon> {
    // Ensure the coupon exists
    await this.findById(id);

    const [updated] = await this.db.db
      .update(coupons)
      .set({ isActive: false })
      .where(eq(coupons.id, id))
      .returning();

    this.cache.delete(CACHE_KEY_ALL);
    return updated;
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

    if (coupon.discountType === 'percentage') {
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
    await this.db.db
      .update(coupons)
      .set({ currentUses: sql`${coupons.currentUses} + 1` })
      .where(eq(coupons.id, id));

    this.cache.delete(CACHE_KEY_ALL);
  }
}
