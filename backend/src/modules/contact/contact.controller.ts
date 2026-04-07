import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactService } from './contact.service.js';

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('contact-messages')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /**
   * GET /api/contact-messages
   * Admin — list all contact messages ordered by createdAt DESC.
   */
  @Get()
  async findAll() {
    const data = await this.contact.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/contact-messages/:id
   * Admin — get a single contact message by id.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.contact.findById(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/contact-messages/:id/read
   * Admin — mark a contact message as read.
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.contact.markAsRead(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/contact-messages/:id/unread
   * Admin — mark a contact message as unread.
   */
  @Patch(':id/unread')
  async markAsUnread(@Param('id') id: string) {
    const data = await this.contact.markAsUnread(id);
    return { success: true, data };
  }

  /**
   * DELETE /api/contact-messages/:id
   * Admin — permanently delete a contact message.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.contact.remove(id);
    return { success: true, data: null };
  }
}
