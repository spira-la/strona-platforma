/**
 * BWM-compat re-export. Maps `coachesClient.getMyCoachProfile()` to Spirala's
 * `coachClient.getProfile()` which returns the same shape (CoachProfile).
 */

import { coachClient, type CoachProfile } from './coach.client';

export type { CoachProfile };

export const coachesClient = {
  async getMyCoachProfile(): Promise<CoachProfile | null> {
    try {
      return await coachClient.getProfile();
    } catch {
      return null;
    }
  },
};
