/**
 * Scene Controls Sub-components
 *
 * Barrel export for all scene control sub-components.
 * These components are used to compose the main SceneControls component.
 */

// Sub-components
export { LayoutController } from './LayoutController';
export type { LayoutControllerProps } from './LayoutController';

export { BackgroundManager } from './BackgroundManager';
export type { BackgroundManagerProps } from './BackgroundManager';

export { CameraStyler } from './CameraStyler';
export type { CameraStylerProps } from './CameraStyler';

export { CornerImageManager } from './CornerImageManager';
export type { CornerImageManagerProps } from './CornerImageManager';

export { TextBannerManager } from './TextBannerManager';
export type { TextBannerManagerProps } from './TextBannerManager';

export { SpeakerNameStyler } from './SpeakerNameStyler';
export type { SpeakerNameStylerProps } from './SpeakerNameStyler';

export { ScenePresetsManager } from './ScenePresetsManager';
export type { ScenePresetsManagerProps } from './ScenePresetsManager';

// Re-export types and constants from types.ts
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
  CustomOverlay,
  OverlayPosition,
  CameraSlotStyle,
  SpeakerDisplayNames,
} from './types';

export {
  DEFAULT_SPEAKER_NAME_STYLE,
  PRESET_COLORS,
  BORDER_COLORS,
  BANNER_BG_COLORS,
  TEXT_COLORS,
  ANIMATION_OPTIONS,
  CORNER_ICONS,
  BANNER_POSITIONS,
  CORNER_POSITIONS,
} from './types';
