import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthService, type EffectiveUser } from './auth.service.js';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<EffectiveUser> {
    return this.authService.resolveEffectiveUser(user);
  }
}
