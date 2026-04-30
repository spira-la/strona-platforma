/**
 * WebinarPlayer - Wrapper component that detects browser and renders appropriate version
 * 
 * - Safari iOS (iPhone): Uses WebinarPlayerSafariIOS with fullscreen optimizations
 * - All other browsers: Uses WebinarPlayerStandard (Chrome, Desktop, Android, etc.)
 */

import { ReactNode } from 'react';
import { WebinarPlayerSafariIOS } from './WebinarPlayerSafariIOS';
import { WebinarPlayerStandard } from './WebinarPlayerStandard';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import type { ReactionType } from './ReactionOverlay';

// Detect any browser on iPhone (Safari, Chrome, etc.)
// All browsers on iOS use WebKit, so they all have the same fullscreen limitations
const isIPhone = () => {
  const ua = navigator.userAgent;
  return /iPhone/.test(ua); // Any browser on iPhone
};

export interface WebinarPlayerProps {
  className?: string;
  showControls?: boolean;
  isHost?: boolean;
  // Host controls (only used when isHost=true)
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenShareEnabled?: boolean;
  // Fullscreen overlay content (chat, poll, Q&A)
  chatComponent?: ReactNode;
  pollComponent?: ReactNode;
  qaComponent?: ReactNode;
  // Giveaway winner banner (shown in fullscreen when user won)
  winnerBannerComponent?: ReactNode;
  // Giveaway winner overlay (full celebration, rendered inside player for fullscreen support)
  winnerOverlayComponent?: ReactNode;
  // Callback when fullscreen changes
  onFullscreenChange?: (isFullscreen: boolean) => void;
  // Scene template for StreamYard-like layouts
  sceneTemplate?: SceneTemplate | null;
  // Overlay visibility overrides (used with sceneTemplate)
  overlayVisibility?: Record<string, boolean>;
  // Scene state elements (synced from host)
  cameraScale?: number;
  cameraSlotStyles?: Array<{ slotId: string; borderColor?: string; borderWidth?: number }>;
  cornerImages?: Array<any>;
  activeTextBanner?: any | null;
  speakerDisplayNames?: Record<string, string>;
  speakerNameStyle?: {
    showNames: boolean;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    position: string;
    padding: number;
    borderRadius: number;
  };
  // Reactions
  reactionsEnabled?: boolean;
  onSendReaction?: (type: ReactionType) => void;
  onReactionReceived?: (type: ReactionType) => void;
  // Attendee count from WebSocket (more accurate than LiveKit participants)
  attendeeCount?: number;
  // IDs of participants who should be visible on scene (from host/shadow scene management)
  onSceneIds?: string[];
  // Unread chat messages count (for badge)
  unreadChatCount?: number;
  // Callback when panel open state changes
  onPanelOpenChange?: (isOpen: boolean) => void;
}

export function WebinarPlayer(props: WebinarPlayerProps) {
  // Detect iPhone (any browser) and use optimized component
  // All browsers on iOS use WebKit with the same fullscreen limitations
  if (isIPhone()) {
    return <WebinarPlayerSafariIOS {...props} />;
  }

  // Use standard component for all other browsers (Android, Desktop, iPad)
  return <WebinarPlayerStandard {...props} />;
}

export default WebinarPlayer;
