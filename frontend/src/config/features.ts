export const featureFlags = {
  // Active for Spirala launch
  booking: true,
  packages: true,
  blog: true,
  newsletter: true,
  seoManagement: true,

  // Hidden — preserved for future
  purchaseFlow: false,
  multiCoach: false,
  webinars: false,
  audioCourses: false,
  ebooks: false,
  youtubeNavLink: true, // Botón "Wideo" en el navbar
  youtubeHomeSection: false, // Sección de vídeos en la Home
  youtubeContent: true, // Página /wideo completa
  giftPurchases: false,
  stripeConnect: false,
  reviews: false,
  multiCurrency: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
