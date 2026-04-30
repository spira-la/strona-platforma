import { format } from 'date-fns';
import { es, pl, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns/locale';

// Global date/time format settings - change these to update format across the app
export const DATE_TIME_FORMATS = {
  // Time formats (24-hour)
  TIME: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',

  // Date formats
  DATE_SHORT: 'd MMM',
  DATE_MEDIUM: 'EEE, MMM d, yyyy',
  DATE_LONG: 'EEEE, MMMM d, yyyy',
  DATE_NUMERIC: 'dd/MM/yyyy',

  // Combined formats
  DATE_TIME: 'EEE, MMM d, yyyy HH:mm',
  DATE_TIME_FULL: 'EEEE, MMMM d, yyyy HH:mm',
} as const;

// Get date-fns locale based on language code
export const getDateLocale = (language: string): Locale => {
  switch (language) {
    case 'es': {
      return es;
    }
    case 'pl': {
      return pl;
    }
    default: {
      return enUS;
    }
  }
};

// Helper to parse Firestore-compatible timestamp shapes to Date.
// Spirala has no Firestore but legacy archived code still calls this.
type FirestoreLikeTimestamp = {
  toDate?: () => Date;
  _seconds?: number;
};

export const parseFirestoreDate = (
  timestamp: Date | string | number | FirestoreLikeTimestamp | null | undefined,
): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object') {
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (typeof timestamp._seconds === 'number')
      return new Date(timestamp._seconds * 1000);
    return new Date();
  }
  return new Date(timestamp);
};

// Format time (24-hour format)
export const formatTime = (date: Date): string => {
  return format(date, DATE_TIME_FORMATS.TIME);
};

// Format time range (start - end)
export const formatTimeRange = (
  startDate: Date,
  durationMinutes: number,
): string => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
};

// Format date for display (short)
export const formatDateShort = (date: Date, locale: Locale): string => {
  return format(date, DATE_TIME_FORMATS.DATE_SHORT, { locale });
};

// Format date for display (medium)
export const formatDateMedium = (date: Date, locale: Locale): string => {
  return format(date, DATE_TIME_FORMATS.DATE_MEDIUM, { locale });
};

// Format full date
export const formatDateLong = (date: Date, locale: Locale): string => {
  return format(date, DATE_TIME_FORMATS.DATE_LONG, { locale });
};

// Format date and time
export const formatDateTime = (date: Date, locale: Locale): string => {
  return format(date, DATE_TIME_FORMATS.DATE_TIME, { locale });
};

// Format date and time with end time for sessions
export const formatDateTimeRange = (
  startDate: Date,
  durationMinutes: number,
  locale: Locale,
): string => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return `${format(startDate, DATE_TIME_FORMATS.DATE_TIME, { locale })} - ${format(endDate, DATE_TIME_FORMATS.TIME)}`;
};

// Legacy format functions using toLocaleString (for backward compatibility)
export const formatDateLocale = (date: Date, locale: string): string => {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateShortLocale = (date: Date, locale: string): string => {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

/**
 * Get the next rounded time slot from now.
 * Rounds up to the next interval boundary (e.g. 11:05 → 11:15, 11:14 → 11:15, 11:15 → 11:30).
 * @param intervalMinutes - rounding interval in minutes (default: 15)
 * @returns "HH:mm" string
 */
export const getNextTimeSlot = (intervalMinutes: number = 15): string => {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlot =
    Math.ceil((totalMinutes + 1) / intervalMinutes) * intervalMinutes;
  const hours = Math.floor(nextSlot / 60) % 24;
  const minutes = nextSlot % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Check if a given date is today.
 */
export const isToday = (date: Date): boolean => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};
