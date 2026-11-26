export const featureFlags = {
  // Active for Spirala launch
  booking: true,
  packages: true,
  // Blog hidden from navbar, footer and Home (2026-11 redesign). Routes and
  // admin editor stay live — flip to true to bring the links back.
  blog: false,
  newsletter: true,
  seoManagement: true,

  // Simple 4-tab menu (Start · O mnie · Wydarzenia · Kontakt) when false.
  // true restores the previous menu: Jak pracuję, Usługi, Specjalizacje, Treści.
  extendedNav: false,

  // "/" renders the new light Home (pages/HomeNow.tsx) when false.
  // true brings back the previous Home (pages/Home.tsx, dark forest hero).
  classicHome: false,

  // /o-mnie renders the new light page (pages/AboutNow.tsx) when false.
  // true brings back the previous About (pages/About.tsx, dark hero).
  classicAbout: false,

  // /kontakt uses the light sunny hero when false; true restores the dark
  // forest hero. The form and contact details are the same in both.
  classicContact: false,

  // Calendly booking row on /kontakt. The client contacts people by e-mail,
  // phone and the contact form only (2026-11). true shows the row again.
  contactCalendly: false,

  // "Strona bez zbierania danych" (client 2026-11-26: no company / NIP yet, so
  // the site collects no personal data and needs no privacy policy or terms).
  // Each switch hides one piece; flip it back to true to restore it.
  // Google Analytics (gtag.js) — loaded by lib/analytics.ts only when true.
  analytics: false,
  // Contact form on /kontakt — when false, big e-mail / WhatsApp / phone /
  // Instagram / Facebook buttons take its place.
  contactForm: false,
  // E-mail sign-up form on /wydarzenia — when false, each event offers
  // "napisz do mnie" buttons (WhatsApp / e-mail / phone) instead.
  eventSignUp: false,
  // Public "Zaloguj się" button and registration. When false, the admin
  // still logs in by opening /admin (the login window opens there).
  publicAccounts: false,
  // Full privacy policy + regulamin pages. When false, /polityka-prywatnosci
  // shows a short note that the site collects no data, and /regulamin and its
  // footer link are hidden.
  legalDocuments: false,

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
