import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Marks a controller or route as requiring a feature flag to be enabled.
 * FeatureFlagGuard will return 404 if the flag is disabled —
 * the feature "doesn't exist" from the client's perspective.
 *
 * @example
 * @FeatureFlag('webinars')
 * @Controller('api/webinars')
 * export class WebinarsController {}
 */
export const FeatureFlag = (flag: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flag);
