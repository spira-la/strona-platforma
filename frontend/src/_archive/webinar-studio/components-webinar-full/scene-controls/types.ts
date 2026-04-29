/**
 * Scene Controls Types
 *
 * Shared types, constants, and utility components for scene control sub-components.
 */

import type { LucideIcon } from 'lucide-react';
import {
  CornerUpLeft,
  CornerUpRight,
  CornerDownLeft,
  CornerDownRight,
} from 'lucide-react';

// Re-export types from StudioAssetsClient for convenience
export type {
  SavedBackground,
  SavedCornerImage,
  CornerImage,
  CornerPosition,
  TextBanner,
  BannerAnimation,
  BannerPosition,
  SavedSceneConfig,
  SpeakerNameStyle,
} from '@/clients/StudioAssetsClient';

export { DEFAULT_SPEAKER_NAME_STYLE } from '@/clients/StudioAssetsClient';

/** Custom overlay added during stream */
export interface CustomOverlay {
  id: string;
  name: string;
  url: string;
  position: OverlayPosition;
  isVisible: boolean;
  width: number;
  height: number;
}

/** Preset positions for overlays */
export type OverlayPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Camera slot border customization */
export interface CameraSlotStyle {
  slotId: string;
  borderColor: string;
  borderWidth: number;
}

/** Speaker display name override */
export type SpeakerDisplayNames = Record<string, string>; // participantId -> displayName

// ============================================
// Preset Colors
// ============================================

export const PRESET_COLORS = [
  '#000000', '#1e293b', '#0f172a', '#1e1b4b', '#4c1d95',
  '#581c87', '#831843', '#164e63', '#0a1f13', '#18181b',
];

export const BORDER_COLORS = [
  '#22d3ee', '#a855f7', '#f43f5e', '#22c55e', '#eab308',
  '#3b82f6', '#f97316', '#ec4899', '#ffffff', '#000000',
];

export const BANNER_BG_COLORS = [
  'rgba(0, 0, 0, 0.8)',
  'rgba(0, 0, 0, 0.6)',
  'rgba(255, 255, 255, 0.9)',
  'rgba(34, 211, 238, 0.9)',
  'rgba(168, 85, 247, 0.9)',
  'rgba(244, 63, 94, 0.9)',
  'rgba(34, 197, 94, 0.9)',
  'rgba(59, 130, 246, 0.9)',
];

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#22d3ee', '#a855f7', '#f43f5e',
  '#22c55e', '#eab308', '#3b82f6',
];

// ============================================
// Animation Options
// ============================================

import type { BannerAnimation } from '@/clients/StudioAssetsClient';

export const ANIMATION_OPTIONS: { value: BannerAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'pulse', label: 'Pulse' },
];

// ============================================
// Corner Icons Mapping
// ============================================

export const CORNER_ICONS: Record<string, LucideIcon> = {
  'top-left': CornerUpLeft,
  'top-right': CornerUpRight,
  'bottom-left': CornerDownLeft,
  'bottom-right': CornerDownRight,
};

// ============================================
// Position Arrays for UI
// ============================================

export const BANNER_POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
] as const;

export const CORNER_POSITIONS = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
] as const;
