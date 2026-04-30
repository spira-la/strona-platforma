/**
 * Webinar Shared Utilities
 *
 * Common utility functions used across webinar components.
 * Extracted to follow DRY principles and avoid code duplication.
 */

/**
 * Formats a timestamp to a localized time string (HH:MM format)
 * Used for displaying timestamps in chat messages and Q&A questions.
 *
 * @param timestamp - Date string or Date object to format
 * @returns Formatted time string (e.g., "14:30", "2:30 PM")
 */
export function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Extracts initials from a user's name (up to 2 characters)
 * Used for avatar fallbacks when no profile image is available.
 *
 * @param name - User's display name (can be undefined)
 * @returns Uppercase initials (e.g., "JD" for "John Doe") or "?" if name is undefined/empty
 */
export function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return (
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

/**
 * Color palette for poll options (supports up to 10 options)
 * Each color is a Tailwind CSS background class.
 */
export const POLL_OPTION_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-[#5eb8a8]',
] as const;

export type PollOptionColor = (typeof POLL_OPTION_COLORS)[number];
