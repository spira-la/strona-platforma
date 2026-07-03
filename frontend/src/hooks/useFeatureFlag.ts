import { featureFlags, type FeatureFlag } from '@/config/features';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
