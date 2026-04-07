import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { ContactMessageEntity } from '../../db/entities/contact.entity.js';

const CACHE_KEY_ALL = 'contact-messages:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type ContactMessage = ContactMessageEntity;

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly repo: Repository<ContactMessageEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<ContactMessage[]> {
    const cached = this.cache.get<ContactMessage[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { createdAt: 'DESC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<ContactMessage> {
    const message = await this.repo.findOne({ where: { id } });

    if (!message) {
      throw new NotFoundException(`Contact message with id "${id}" not found`);
    }

    return message;
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    await this.findById(id);
    await this.repo.update({ id }, { isRead: true });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async markAsUnread(id: string): Promise<ContactMessage> {
    await this.findById(id);
    await this.repo.update({ id }, { isRead: false });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.delete({ id });
    this.cache.delete(CACHE_KEY_ALL);
  }
}
