/**
 * Studio Hooks - Barrel Export
 *
 * Custom hooks for WebinarStudio component to reduce complexity.
 * Each hook handles a specific concern:
 * - useStudioSession: Session/webinar loading and LiveKit token management
 * - useStudioMedia: Audio/video/screenshare state management
 * - useStudioSessionControls: Session lifecycle controls
 */

// Main hooks
export { useStudioSession, default as useStudioSessionDefault } from './useStudioSession';
export { useStudioMedia, default as useStudioMediaDefault } from './useStudioMedia';
export { useStudioSessionControls, default as useStudioSessionControlsDefault } from './useStudioSessionControls';

// Types - re-export all types for convenience
export type {
  // Session types
  UseStudioSessionOptions,
  UseStudioSessionReturn,
  // Media types
  UseStudioMediaOptions,
  UseStudioMediaReturn,
  MediaPermissions,
  VideoQualityPreset,
  // Session controls types
  UseStudioSessionControlsOptions,
  UseStudioSessionControlsReturn,
} from './types/studio.types';
