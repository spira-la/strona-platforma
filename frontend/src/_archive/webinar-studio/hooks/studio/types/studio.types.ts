/**
 * Studio Hooks Types
 * Type definitions for WebinarStudio custom hooks
 */

import type {
  WebinarSession,
  WebinarProduct,
  SessionConflictResponse,
  RecordingSegment,
} from '@/domain/products/models/webinar.model';

// ============================================
// useStudioSession Types
// ============================================

export interface UseStudioSessionOptions {
  /** Webinar session ID from URL params */
  sessionId: string | undefined;
  /** Current user ID (Firebase Auth UID) */
  userId: string | undefined;
  /** Whether user is a coach */
  isCoach: boolean;
  /** Coach profile ID (different from Firebase UID) */
  coachProfileId: string | undefined;
  /** Callback when session conflict is detected */
  onConflictDetected?: (conflict: SessionConflictResponse) => void;
  /** Callback when user is kicked from session */
  onKicked?: (reason: string) => void;
  /** Translation function for error messages */
  t: (key: string, defaultValue?: string) => string;
}

export interface UseStudioSessionReturn {
  /** Loaded session data */
  session: WebinarSession | null;
  /** Loaded webinar data */
  webinar: WebinarProduct | null;
  /** LiveKit token for room connection */
  livekitToken: string | null;
  /** LiveKit server URL */
  livekitServerUrl: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Session conflict data */
  sessionConflict: SessionConflictResponse | null;
  /** Whether user is session host */
  isSessionHost: boolean;
  /** Whether user is shadow host */
  isShadowHost: boolean;
  /** Whether user is guest speaker */
  isGuestSpeaker: boolean;
  /** Whether user is admin speaker */
  isAdminSpeaker: boolean;
  /** Whether user is host or shadow (has full control permissions) */
  isHostOrShadow: boolean;
  /** Whether user can access studio */
  canAccessStudio: boolean;
  /** Whether user can edit visuals */
  canEditVisuals: boolean;
  /** Whether user can control features */
  canControlFeatures: boolean;
  /** Update session state locally */
  setSession: React.Dispatch<React.SetStateAction<WebinarSession | null>>;
  /** Update webinar state locally */
  setWebinar: React.Dispatch<React.SetStateAction<WebinarProduct | null>>;
  /** Handle session takeover */
  handleTakeoverSession: () => Promise<void>;
  /** Whether takeover is in progress */
  isTakingOver: boolean;
  /** Clear the token (for kicked scenario) */
  clearToken: () => void;
}

// ============================================
// useStudioMedia Types
// ============================================

export interface MediaPermissions {
  video: boolean;
  audio: boolean;
  requested: boolean;
  error: string | null;
}

export interface UseStudioMediaOptions {
  /** Webinar session ID */
  sessionId: string | undefined;
  /** Current user ID */
  userId: string | undefined;
  /** Whether user is a coach */
  isCoach: boolean;
  /** Current session status */
  sessionStatus: WebinarSession['status'] | undefined;
  /** Translation function for error messages */
  t: (key: string, defaultValue?: string) => string;
  /** Toast function for notifications */
  toast?: (options: { title: string; description: string; variant?: 'destructive' | 'default' }) => void;
  /** Whether user is currently on scene */
  isOnScene?: boolean;
}

export interface UseStudioMediaReturn {
  /** Media permissions state */
  mediaPermissions: MediaPermissions;
  /** Whether audio is enabled */
  isAudioEnabled: boolean;
  /** Whether video is enabled */
  isVideoEnabled: boolean;
  /** Whether screen share is enabled */
  isScreenShareEnabled: boolean;
  /** Whether media is paused */
  isPaused: boolean;
  /** Toggle audio on/off */
  handleToggleAudio: () => void;
  /** Toggle video on/off */
  handleToggleVideo: () => void;
  /** Toggle screen share on/off. Pass isPresentationSharing to block when presentation is active. */
  handleToggleScreenShare: (isPresentationSharing?: boolean) => void;
  /** Toggle pause (mute all) */
  handleTogglePause: (socketTogglePause?: (isPaused: boolean) => void) => void;
  /** Set audio enabled state directly */
  setIsAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** Set video enabled state directly */
  setIsVideoEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** Set screen share state directly */
  setIsScreenShareEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** Selected video device ID */
  selectedVideoDeviceId: string;
  /** Selected audio device ID */
  selectedAudioDeviceId: string;
  /** Set video device ID */
  setSelectedVideoDeviceId: React.Dispatch<React.SetStateAction<string>>;
  /** Set audio device ID */
  setSelectedAudioDeviceId: React.Dispatch<React.SetStateAction<string>>;
  /** Video quality preset */
  transmitQuality: VideoQualityPreset;
  /** Set video quality */
  setTransmitQuality: React.Dispatch<React.SetStateAction<VideoQualityPreset>>;
  /** Echo cancellation enabled */
  echoCancellation: boolean;
  /** Noise suppression enabled */
  noiseSuppression: boolean;
  /** Auto gain control enabled */
  autoGainControl: boolean;
  /** Set echo cancellation */
  setEchoCancellation: React.Dispatch<React.SetStateAction<boolean>>;
  /** Set noise suppression */
  setNoiseSuppression: React.Dispatch<React.SetStateAction<boolean>>;
  /** Set auto gain control */
  setAutoGainControl: React.Dispatch<React.SetStateAction<boolean>>;
  /** DTX (Discontinuous Transmission) - can cause choppy audio if enabled */
  dtxEnabled: boolean;
  /** Set DTX enabled */
  setDtxEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** RED (Redundant Audio Data) - helps with packet loss */
  redEnabled: boolean;
  /** Set RED enabled */
  setRedEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  /** Audio bitrate in bps */
  audioBitrate: AudioBitratePreset;
  /** Set audio bitrate */
  setAudioBitrate: React.Dispatch<React.SetStateAction<AudioBitratePreset>>;
  /** Local video ref for preview */
  localVideoRef: React.RefObject<HTMLVideoElement>;
  /** Local stream ref */
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  /** Detect if on mobile device */
  isMobileDevice: boolean;
  /** Stop local stream (for LiveKit handoff) */
  stopLocalStream: () => void;
  /** Desired audio state ref (for scene toggling) */
  desiredAudioEnabledRef: React.MutableRefObject<boolean>;
  /** Desired video state ref (for scene toggling) */
  desiredVideoEnabledRef: React.MutableRefObject<boolean>;
}

export type VideoQualityPreset = '480p' | '720p' | '1080p' | '4k';

/** Audio bitrate presets in bps */
export type AudioBitratePreset = 32000 | 48000 | 64000 | 96000 | 128000;

/** Audio bitrate options with labels */
export const AUDIO_BITRATE_OPTIONS: { value: AudioBitratePreset; label: string; description: string }[] = [
  { value: 32000, label: '32 kbps', description: 'Low quality (saves bandwidth)' },
  { value: 48000, label: '48 kbps', description: 'Standard voice quality' },
  { value: 64000, label: '64 kbps', description: 'High quality voice (recommended)' },
  { value: 96000, label: '96 kbps', description: 'Professional quality' },
  { value: 128000, label: '128 kbps', description: 'Studio quality' },
];

// ============================================
// useStudioSessionControls Types
// ============================================

export interface UseStudioSessionControlsOptions {
  /** Webinar session ID */
  sessionId: string | undefined;
  /** Current session */
  session: WebinarSession | null;
  /** Update session state */
  setSession: React.Dispatch<React.SetStateAction<WebinarSession | null>>;
  /** Clear LiveKit token */
  clearToken: () => void;
  /** Navigate function */
  navigate: (path: string) => void;
  /** Translation function */
  t: (key: string, defaultValue?: string) => string;
  /** Set error state */
  setError: (error: string | null) => void;
}

export interface UseStudioSessionControlsReturn {
  /** Start planning mode (green room) */
  handleStartPlanning: () => Promise<void>;
  /** Cancel planning and return to scheduled */
  handleCancelPlanning: () => Promise<void>;
  /** Start session (go live) */
  handleStartSession: () => Promise<void>;
  /** Stop broadcast (return to planning) */
  handleStopBroadcast: () => Promise<void>;
  /** End session permanently */
  handleEndSession: () => Promise<void>;
  /** Restart from stopped to planning */
  handleRestartToPlanning: () => Promise<void>;
  /** Restart from stopped to live */
  handleRestartToLive: () => Promise<void>;
  /** Start recording (creates new segment) */
  handleStartRecording: () => Promise<void>;
  /** Stop recording (finalizes current segment) */
  handleStopRecording: () => Promise<void>;
  /** Leave studio without ending session */
  handleLeaveWithoutEnding: () => void;
  /** Whether currently recording */
  isRecording: boolean;
  /** Current egress ID (recording ID) */
  egressId: string | null;
  /** Recording segments array */
  recordingSegments: RecordingSegment[];
  /** Current segment number */
  currentSegmentNumber: number;
  /** HLS segment index when current recording started */
  startSegmentIndex: number | null;
}
