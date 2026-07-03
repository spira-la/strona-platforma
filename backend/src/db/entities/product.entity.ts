import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductType } from './enums';

@Entity({ name: 'categories' })
@Index('categories_slug_idx', ['slug'])
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;

  @Column({ name: 'sort_order', type: 'int', default: 0, nullable: true })
  sortOrder: number | null;

  @Column({ name: 'name_en', type: 'text', nullable: true })
  nameEn: string | null;

  @Column({ name: 'name_es', type: 'text', nullable: true })
  nameEs: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}

@Entity({ name: 'products' })
@Index('products_slug_idx', ['slug'])
@Index('products_is_published_idx', ['isPublished'])
@Index('products_product_type_idx', ['productType'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
    nullable: true,
  })
  productType: ProductType | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number | null;

  @Column({ type: 'text', nullable: true })
  language: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ name: 'price_cents', type: 'int', nullable: true })
  priceCents: number | null;

  @Column({ type: 'text', default: 'PLN', nullable: true })
  currency: string | null;

  @Column({ name: 'stripe_product_id', type: 'text', nullable: true })
  stripeProductId: string | null;

  @Column({ name: 'stripe_price_id', type: 'text', nullable: true })
  stripePriceId: string | null;

  @Column({
    name: 'is_published',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  isPublished: boolean | null;

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
