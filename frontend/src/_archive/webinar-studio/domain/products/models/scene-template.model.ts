/**
 * Scene Template Model
 *
 * Defines the structure for webinar scene templates that control:
 * - Background (color, image, or video)
 * - Camera slot positions and sizes
 * - Overlays (banners, logos, GIFs)
 * - Layout presets
 */

export type LayoutPreset = 'grid' | 'speaker' | 'sidebar' | 'custom';
export type BackgroundType = 'color' | 'image' | 'video';
export type OverlayType = 'image' | 'gif' | 'text';
export type OverlayAnimation = 'none' | 'fade-in' | 'slide-in' | 'bounce';
export type CameraSlotType = 'camera' | 'screenshare';

/**
 * Background configuration for the scene
 */
export interface SceneBackground {
  type: BackgroundType;
  value: string; // Hex color (e.g., "#1a1a2e") or URL for image/video
}

/**
 * Camera slot definition - positions are percentages (0-100) of the canvas
 */
export interface CameraSlot {
  id: string;
  type?: CameraSlotType; // 'camera' (default) or 'screenshare'
  x: number;      // Left position (0-100%)
  y: number;      // Top position (0-100%)
  width: number;  // Width (0-100%)
  height: number; // Height (0-100%)
  zIndex: number;
  borderRadius?: number;  // px
  borderColor?: string;   // Hex color
  borderWidth?: number;   // px
  label?: string;         // e.g., "Host", "Guest 1", "Screen Share"
  participantId?: string; // Assigned participant (optional)
}

/**
 * Overlay element (banner, logo, GIF, text)
 */
export interface SceneOverlay {
  id: string;
  type: OverlayType;
  name: string;           // Display name for admin
  url?: string;           // Image/GIF URL
  text?: string;          // For text overlays
  x: number;              // Left position (0-100%)
  y: number;              // Top position (0-100%)
  width: number;          // Width (0-100%)
  height: number;         // Height (0-100%)
  zIndex: number;
  animation: OverlayAnimation;
  isVisible: boolean;     // Can be toggled during stream
  // Text styling (for text overlays)
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
  padding?: number;
}

/**
 * Scene Template - the complete scene configuration
 */
export interface SceneTemplate {
  id: string;
  name: string;
  description?: string;

  // Background settings
  background: SceneBackground;

  // Camera positions
  cameraSlots: CameraSlot[];

  // Overlay elements
  overlays: SceneOverlay[];

  // Layout type
  layoutPreset: LayoutPreset;

  // Metadata
  thumbnailUrl?: string;  // Preview image
  isActive: boolean;
  isDefault?: boolean;    // Default template for new webinars

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;     // Admin user ID
}

/**
 * Data for creating a new scene template
 */
export interface CreateSceneTemplateData {
  name: string;
  description?: string;
  background: SceneBackground;
  cameraSlots: Omit<CameraSlot, 'id'>[];
  overlays: Omit<SceneOverlay, 'id'>[];
  layoutPreset: LayoutPreset;
  thumbnailUrl?: string;
  isDefault?: boolean;
}

/**
 * Data for updating a scene template
 */
export interface UpdateSceneTemplateData {
  name?: string;
  description?: string;
  background?: SceneBackground;
  cameraSlots?: CameraSlot[];
  overlays?: SceneOverlay[];
  layoutPreset?: LayoutPreset;
  thumbnailUrl?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * Preset layout configurations
 */
export const LAYOUT_PRESETS: Record<LayoutPreset, { name: string; description: string; slots: number }> = {
  grid: {
    name: 'Grid',
    description: 'Equal-sized cameras in a grid layout',
    slots: 6,
  },
  speaker: {
    name: 'Speaker',
    description: 'One large main camera with smaller thumbnails',
    slots: 6,
  },
  sidebar: {
    name: 'Sidebar',
    description: 'Cameras in a sidebar with main content area',
    slots: 4,
  },
  custom: {
    name: 'Custom',
    description: 'Fully customizable camera positions',
    slots: 8,
  },
};

/**
 * Generate default camera slots for a layout preset
 */
export function generateDefaultSlots(preset: LayoutPreset, count: number = 4): Omit<CameraSlot, 'id'>[] {
  const slots: Omit<CameraSlot, 'id'>[] = [];

  switch (preset) {
    case 'grid': {
      // Calculate grid dimensions
      const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
      const rows = Math.ceil(count / cols);
      const slotWidth = 100 / cols - 2; // 2% gap
      const slotHeight = 100 / rows - 2;

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        slots.push({
          x: col * (slotWidth + 2) + 1,
          y: row * (slotHeight + 2) + 1,
          width: slotWidth,
          height: slotHeight,
          zIndex: 10,
          borderRadius: 8,
          label: i === 0 ? 'Host' : `Guest ${i}`,
        });
      }
      break;
    }

    case 'speaker': {
      // Main speaker takes 70% of space
      slots.push({
        x: 2,
        y: 2,
        width: 70,
        height: 96,
        zIndex: 10,
        borderRadius: 8,
        label: 'Speaker',
      });

      // Thumbnails on the right
      const thumbHeight = 96 / Math.max(count - 1, 1) - 2;
      for (let i = 1; i < count; i++) {
        slots.push({
          x: 74,
          y: 2 + (i - 1) * (thumbHeight + 2),
          width: 24,
          height: thumbHeight,
          zIndex: 10,
          borderRadius: 8,
          label: i === 1 ? 'Host' : `Guest ${i}`,
        });
      }
      break;
    }

    case 'sidebar': {
      // Main content area (60%)
      slots.push({
        x: 2,
        y: 2,
        width: 60,
        height: 96,
        zIndex: 10,
        borderRadius: 8,
        label: 'Main',
      });

      // Sidebar cameras
      const sidebarSlots = count - 1;
      const slotHeight = 96 / Math.max(sidebarSlots, 1) - 2;
      for (let i = 0; i < sidebarSlots; i++) {
        slots.push({
          x: 64,
          y: 2 + i * (slotHeight + 2),
          width: 34,
          height: slotHeight,
          zIndex: 10,
          borderRadius: 8,
          label: i === 0 ? 'Host' : `Guest ${i}`,
        });
      }
      break;
    }

    case 'custom':
    default: {
      // Scattered positions for custom layout
      const positions = [
        { x: 5, y: 5, w: 40, h: 45 },
        { x: 55, y: 5, w: 40, h: 45 },
        { x: 5, y: 52, w: 40, h: 45 },
        { x: 55, y: 52, w: 40, h: 45 },
        { x: 20, y: 20, w: 25, h: 30 },
        { x: 55, y: 20, w: 25, h: 30 },
      ];

      for (let i = 0; i < Math.min(count, positions.length); i++) {
        const pos = positions[i];
        slots.push({
          x: pos.x,
          y: pos.y,
          width: pos.w,
          height: pos.h,
          zIndex: 10 + i,
          borderRadius: 8,
          label: i === 0 ? 'Host' : `Guest ${i}`,
        });
      }
      break;
    }
  }

  return slots;
}

/**
 * Default scene template for new webinars
 */
export const DEFAULT_SCENE_TEMPLATE: Omit<SceneTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Grid',
  description: 'Simple grid layout with dark background',
  background: {
    type: 'color',
    value: '#1a1a2e',
  },
  cameraSlots: generateDefaultSlots('grid', 4).map((slot, i) => ({
    ...slot,
    id: `slot-${i}`,
  })),
  overlays: [],
  layoutPreset: 'grid',
  isActive: true,
  isDefault: true,
};
