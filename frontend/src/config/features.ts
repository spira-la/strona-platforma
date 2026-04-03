export const featureFlags = {
  // Active for Spirala launch
  booking: true,
  packages: true,
  blog: true,
  newsletter: true,
  seoManagement: true,

  // Hidden — preserved for future
  multiCoach: false,
  webinars: false,
  audioCourses: false,
  ebooks: false,
  youtubeContent: false,
  giftPurchases: false,
  stripeConnect: false,
  reviews: false,
  multiCurrency: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
