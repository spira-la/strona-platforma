import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CoachPanelService,
  UpdateProfileData,
  AvailabilitySlot,
  CreateBlockData,
  RescheduleSessionData,
  CreateManualSessionData,
  CoachClientDto,
} from './coach-panel.service.js';

// ---------------------------------------------------------------------------
// Request body interfaces
// ---------------------------------------------------------------------------

type UpdateProfileBody = UpdateProfileData;

// Body can be either { slots: [...] } or the array directly
type UpdateAvailabilityBody =
  | { slots?: AvailabilitySlot[] }
  | AvailabilitySlot[];

type CreateBlockBody = CreateBlockData;
type RescheduleBody = RescheduleSessionData;
type CreateManualSessionBody = CreateManualSessionData;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * Coach Panel — all endpoints scoped to the authenticated coach.
 *
 * Auth flow:
 *   1. SupabaseAuthGuard verifies the JWT and populates request.user
 *   2. RolesGuard ensures only users with the 'coach' role can access
 *   3. @CurrentUser() extracts the verified Supabase user
 *   4. CoachPanelService.resolveCoach() maps user.id → CoachEntity.id
 */
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('coach')
@Controller('coach/me')
export class CoachPanelController {
  constructor(private readonly coachPanel: CoachPanelService) {}

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/dashboard
   * Returns high-level stats for the authenticated coach.
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: User) {
    const data = await this.coachPanel.getDashboard(user.id);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/profile
   * Returns the full CoachEntity for the authenticated coach.
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const data = await this.coachPanel.getProfile(user.id);
    return { success: true, data };
  }

  /**
   * PATCH /api/coach/me/profile
   * Partially updates the coach's own profile.
   * Updatable fields: bio, expertise, languages, location, website,
   * timezone, acceptingClients, yearsExperience, certifications.
   */
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() body: UpdateProfileBody,
  ) {
    const data = await this.coachPanel.updateProfile(user.id, body);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/availability
   * Returns all weekly availability slots, ordered by dayOfWeek + startTime.
   */
  @Get('availability')
  async getAvailability(@CurrentUser() user: User) {
    const data = await this.coachPanel.getAvailability(user.id);
    return { success: true, data };
  }

  /**
   * PUT /api/coach/me/availability
   * Replaces all availability slots for this coach.
   * Body: { slots: [{ dayOfWeek, startTime, endTime, isActive? }] }
   */
  @Put('availability')
  async updateAvailability(
    @CurrentUser() user: User,
    @Body() body: UpdateAvailabilityBody,
  ) {
    const slots: AvailabilitySlot[] = Array.isArray(body)
      ? body
      : ((body as { slots?: AvailabilitySlot[] }).slots ?? []);
    const data = await this.coachPanel.updateAvailability(user.id, slots);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Availability Blocks
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/availability/blocks
   * Returns all availability blocks (vacations, time-off) for this coach.
   */
  @Get('availability/blocks')
  async getBlocks(@CurrentUser() user: User) {
    const blocks = await this.coachPanel.getBlocks(user.id);
    const data = blocks.map((b) => ({
      id: b.id,
      startAt: b.startTime.toISOString(),
      endAt: b.endTime.toISOString(),
      reason: b.reason ?? null,
    }));
    return { success: true, data };
  }

  /**
   * POST /api/coach/me/availability/blocks
   * Creates a new availability block.
   * Body: { startDate, endDate, reason? }
   */
  @Post('availability/blocks')
  @HttpCode(HttpStatus.CREATED)
  async createBlock(@CurrentUser() user: User, @Body() body: CreateBlockBody) {
    const data = await this.coachPanel.createBlock(user.id, body);
    return { success: true, data };
  }

  /**
   * DELETE /api/coach/me/availability/blocks/:id
   * Deletes an availability block owned by this coach.
   */
  @Delete('availability/blocks/:id')
  @HttpCode(HttpStatus.OK)
  async deleteBlock(@CurrentUser() user: User, @Param('id') id: string) {
    await this.coachPanel.deleteBlock(user.id, id);
    return { success: true, data: null };
  }

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/services
   * Returns coaching services belonging to this coach.
   */
  @Get('services')
  async getServices(@CurrentUser() user: User) {
    const data = await this.coachPanel.getServices(user.id);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  /**
   * GET /api/coach/me/clients
   * Returns distinct past clients (from orders + manual sessions).
   */
  @Get('clients')
  async getClients(
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: CoachClientDto[] }> {
    const data = await this.coachPanel.getClients(user.id);
    return { success: true, data };
  }

  /**
   * GET /api/coach/me/sessions
   * Returns all bookings for this coach, ordered by startTime DESC.
   */
  @Get('sessions')
  async getSessions(@CurrentUser() user: User) {
    const data = await this.coachPanel.getSessions(user.id);
    return { success: true, data };
  }

  /**
   * POST /api/coach/me/sessions/manual
   * Create a manual (coach-initiated) session for a client.
   */
  @Post('sessions/manual')
  @HttpCode(HttpStatus.CREATED)
  async createManualSession(
    @CurrentUser() user: User,
    @Body() body: CreateManualSessionBody,
  ) {
    const data = await this.coachPanel.createManualSession(user.id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/coach/me/sessions/:id/cancel
   * Cancel a session owned by this coach.
   */
  @Patch('sessions/:id/cancel')
  async cancelSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    await this.coachPanel.cancelSession(user.id, id, body.reason);
    return { success: true, data: null };
  }

  /**
   * PATCH /api/coach/me/sessions/:id/reschedule
   * Reschedule a session to a new time.
   */
  @Patch('sessions/:id/reschedule')
  async rescheduleSession(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: RescheduleBody,
  ) {
    await this.coachPanel.rescheduleSession(user.id, id, body);
    return { success: true, data: null };
  }
}
