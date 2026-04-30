/**
 * useStudioMedia Hook
 *
 * Manages audio/video/screenshare state for WebinarStudio.
 * Handles:
 * - Media permissions
 * - Audio/video/screenshare enabled states
 * - Device selection (video/audio device IDs)
 * - Video quality state
 * - Audio processing options
 * - Local preview stream management
 * - Scene presence media state (mute when off scene)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  UseStudioMediaOptions,
  UseStudioMediaReturn,
  MediaPermissions,
  VideoQualityPreset,
  AudioBitratePreset,
} from './types/studio.types';

export function useStudioMedia(options: UseStudioMediaOptions): UseStudioMediaReturn {
  const {
    sessionId,
    userId,
    isCoach,
    sessionStatus,
    t,
    toast,
    isOnScene = true,
  } = options;

  // Detect if we're on a mobile/tablet device
  const isMobileDevice = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Helper to get localStorage key for media state
  const getMediaStateKey = useCallback(() => {
    if (!sessionId || !userId) return null;
    return `webinar_media_state_${sessionId}_${userId}`;
  }, [sessionId, userId]);

  // Media permissions state
  const [mediaPermissions, setMediaPermissions] = useState<MediaPermissions>({
    video: false,
    audio: false,
    requested: false,
    error: null,
  });

  // Local preview refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Track media state initialization: 'pending' -> 'loaded' -> 'ready'
  const mediaStatePhaseRef = useRef<'pending' | 'loaded' | 'ready'>('pending');

  // Track "desired" media state when on scene (for restoring after coming back on scene)
  const desiredAudioEnabledRef = useRef(true);
  const desiredVideoEnabledRef = useRef(true);
  const wasOnSceneRef = useRef<boolean | null>(null);

  // Media controls state - initialized from localStorage if available
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Device selection state
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  // Video quality state
  const [transmitQuality, setTransmitQuality] = useState<VideoQualityPreset>('720p');

  // Audio processing options (LiveKit WebRTC built-in)
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  // Advanced audio publish options
  // DTX (Discontinuous Transmission) - disabled by default to prevent choppy audio
  const [dtxEnabled, setDtxEnabled] = useState(false);
  // RED (Redundant Audio Data) - enabled by default to help with packet loss
  const [redEnabled, setRedEnabled] = useState(true);
  // Audio bitrate - 64kbps recommended for voice
  const [audioBitrate, setAudioBitrate] = useState<AudioBitratePreset>(64000);

  // Load saved media state from localStorage when session and user are available
  useEffect(() => {
    const key = getMediaStateKey();
    if (!key || mediaStatePhaseRef.current !== 'pending') return;

    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('[useStudioMedia] Found saved media state:', parsed);
        if (typeof parsed.audioEnabled === 'boolean') {
          setIsAudioEnabled(parsed.audioEnabled);
        }
        if (typeof parsed.videoEnabled === 'boolean') {
          setIsVideoEnabled(parsed.videoEnabled);
        }
        console.log('[useStudioMedia] Restored media state from localStorage');
      }
    } catch (err) {
      console.error('[useStudioMedia] Error loading media state from localStorage:', err);
    }
    // Mark as loaded - will transition to ready on next render
    mediaStatePhaseRef.current = 'loaded';
  }, [getMediaStateKey]);

  // Transition from 'loaded' to 'ready' after state updates are applied
  useEffect(() => {
    if (mediaStatePhaseRef.current === 'loaded') {
      // Use setTimeout to ensure state updates have been applied
      const timer = setTimeout(() => {
        mediaStatePhaseRef.current = 'ready';
        console.log('[useStudioMedia] Media state ready for saving');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAudioEnabled, isVideoEnabled]);

  // Save media state to localStorage whenever it changes (only after ready)
  useEffect(() => {
    const key = getMediaStateKey();
    // Only save when fully initialized and ready
    if (!key || mediaStatePhaseRef.current !== 'ready') return;

    // Capture current values for the async save
    const audioState = isAudioEnabled;
    const videoState = isVideoEnabled;

    // Use requestIdleCallback for non-blocking save, fallback to setTimeout
    const saveInBackground = () => {
      try {
        const state = {
          audioEnabled: audioState,
          videoEnabled: videoState,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        console.error('[useStudioMedia] Error saving media state:', err);
      }
    };

    // Schedule save when browser is idle
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(saveInBackground, { timeout: 1000 });
      return () => cancelIdleCallback(idleId);
    } else {
      const timerId = setTimeout(saveInBackground, 0);
      return () => clearTimeout(timerId);
    }
  }, [getMediaStateKey, isAudioEnabled, isVideoEnabled]);

  // Handle scene presence changes - mute/unmute based on whether user is on scene
  useEffect(() => {
    // Skip if media state hasn't been initialized yet
    if (mediaStatePhaseRef.current !== 'ready') return;

    // Skip initial render (wasOnSceneRef.current is null)
    if (wasOnSceneRef.current === null) {
      wasOnSceneRef.current = isOnScene;
      return;
    }

    // Only act when on-scene status actually changes
    if (wasOnSceneRef.current === isOnScene) return;

    console.log('[useStudioMedia] Scene presence changed:', { isOnScene, wasOnScene: wasOnSceneRef.current });

    if (!isOnScene) {
      // Going OFF scene: save current desired state, then mute everything
      desiredAudioEnabledRef.current = isAudioEnabled;
      desiredVideoEnabledRef.current = isVideoEnabled;
      console.log('[useStudioMedia] Removed from scene - muting. Saved state:', {
        audio: desiredAudioEnabledRef.current,
        video: desiredVideoEnabledRef.current,
      });
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    } else {
      // Coming back ON scene: restore saved state
      console.log('[useStudioMedia] Added to scene - restoring state:', {
        audio: desiredAudioEnabledRef.current,
        video: desiredVideoEnabledRef.current,
      });
      setIsAudioEnabled(desiredAudioEnabledRef.current);
      setIsVideoEnabled(desiredVideoEnabledRef.current);
    }

    wasOnSceneRef.current = isOnScene;
  }, [isOnScene, isAudioEnabled, isVideoEnabled]);

  // Request media permissions and start local preview
  useEffect(() => {
    const requestMediaPermissions = async () => {
      // Check if mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[useStudioMedia] mediaDevices API not available');
        setMediaPermissions({
          video: false,
          audio: false,
          requested: true,
          error: t('webinars.error.mediaNotSupported', 'Media devices not supported. Make sure you are using HTTPS.'),
        });
        return;
      }

      // Stop existing stream before getting a new one
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Try different constraint strategies
      const constraintStrategies: MediaStreamConstraints[] = [];

      // Strategy 1: Use specific device IDs if selected (use 'ideal' instead of 'exact' for mobile compatibility)
      if (selectedVideoDeviceId || selectedAudioDeviceId) {
        constraintStrategies.push({
          video: selectedVideoDeviceId
            ? { deviceId: isMobileDevice ? { ideal: selectedVideoDeviceId } : { exact: selectedVideoDeviceId } }
            : true,
          audio: selectedAudioDeviceId
            ? { deviceId: isMobileDevice ? { ideal: selectedAudioDeviceId } : { exact: selectedAudioDeviceId } }
            : true,
        });
      }

      // Strategy 2: For mobile, use facingMode for front camera
      if (isMobileDevice) {
        constraintStrategies.push({
          video: { facingMode: 'user' },
          audio: true,
        });
      }

      // Strategy 3: Simple true/true - most compatible
      constraintStrategies.push({
        video: true,
        audio: true,
      });

      // Strategy 4: Video only (in case audio is causing issues)
      constraintStrategies.push({
        video: isMobileDevice ? { facingMode: 'user' } : true,
        audio: false,
      });

      // Strategy 5: Audio only (in case video is causing issues)
      constraintStrategies.push({
        video: false,
        audio: true,
      });

      let lastError: Error | null = null;
      let stream: MediaStream | null = null;

      // Try each strategy until one works
      for (const constraints of constraintStrategies) {
        try {
          console.log('[useStudioMedia] Trying media constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('[useStudioMedia] Media access successful with constraints:', constraints);
          break;
        } catch (err) {
          const error = err as Error;
          console.warn('[useStudioMedia] Media constraint failed:', constraints, error.name, error.message);
          lastError = error;
          // Continue to next strategy
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        setMediaPermissions({
          video: hasVideo,
          audio: hasAudio,
          requested: true,
          error: (!hasVideo || !hasAudio)
            ? t('webinars.error.partialMedia', `Partial access: ${hasVideo ? '' : 'No camera. '}${hasAudio ? '' : 'No microphone.'}`)
            : null,
        });

        // Show local preview
        if (localVideoRef.current && hasVideo) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // All strategies failed
        console.error('[useStudioMedia] All media permission strategies failed:', lastError);
        let errorMsg = t('webinars.error.mediaPermissionDenied', 'Camera/microphone access denied');

        if (lastError) {
          if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
            errorMsg = t('webinars.error.noMediaDevices', 'No camera or microphone found on this device');
          } else if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
            errorMsg = t('webinars.error.mediaPermissionDenied', 'Camera/microphone access denied. Please check your browser permissions and try again.');
          } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
            errorMsg = t('webinars.error.mediaInUse', 'Camera or microphone is being used by another application. Please close other apps and try again.');
          } else if (lastError.name === 'OverconstrainedError') {
            errorMsg = t('webinars.error.mediaOverconstrained', 'Could not find a camera matching the requirements. Try refreshing the page.');
          } else if (lastError.name === 'AbortError') {
            errorMsg = t('webinars.error.mediaAborted', 'Media access was interrupted. Please try again.');
          } else if (lastError.name === 'SecurityError') {
            errorMsg = t('webinars.error.mediaSecurityError', 'Media access blocked due to security settings. Make sure you are using HTTPS.');
          } else if (lastError.name === 'TypeError') {
            errorMsg = t('webinars.error.mediaTypeError', 'Invalid media configuration. Please refresh the page and try again.');
          }
        }

        // Add device-specific hints for mobile
        if (isMobileDevice) {
          errorMsg += ' ' + t('webinars.error.mobileHint', 'On mobile: Check that no other app is using the camera, and that browser permissions are enabled in Settings > Apps > Chrome > Permissions.');
        }

        setMediaPermissions({
          video: false,
          audio: false,
          requested: true,
          error: errorMsg,
        });
      }
    };

    // Only request media permissions for local preview if:
    // 1. User is a coach
    // 2. Permissions haven't been requested OR device selection changed
    // 3. Session is NOT in planning/live mode (LiveKit will handle media in those cases)
    // On mobile, this is critical to avoid camera conflicts with LiveKit
    const isActiveSession = sessionStatus === 'planning' || sessionStatus === 'live';
    const shouldRequestMedia = isCoach && (!mediaPermissions.requested || (selectedVideoDeviceId || selectedAudioDeviceId)) && !isActiveSession;

    if (shouldRequestMedia) {
      requestMediaPermissions();
    }

    // Cleanup on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCoach, mediaPermissions.requested, selectedVideoDeviceId, selectedAudioDeviceId, sessionStatus, t, isMobileDevice]);

  // Stop local stream helper (for LiveKit handoff)
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('[useStudioMedia] Stopping local preview stream...');
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      // Also clear the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  }, []);

  // Media toggle handlers
  const handleToggleAudio = useCallback(() => {
    // If not on scene, don't allow toggling - user is muted
    if (!isOnScene) {
      console.log('[useStudioMedia] Cannot toggle audio - not on scene');
      return;
    }
    setIsAudioEnabled((prev) => {
      const newValue = !prev;
      // Update desired ref so we remember preference when coming back on scene
      desiredAudioEnabledRef.current = newValue;
      return newValue;
    });
  }, [isOnScene]);

  const handleToggleVideo = useCallback(() => {
    // If not on scene, don't allow toggling - user is muted
    if (!isOnScene) {
      console.log('[useStudioMedia] Cannot toggle video - not on scene');
      return;
    }
    setIsVideoEnabled((prev) => {
      const newValue = !prev;
      // Update desired ref so we remember preference when coming back on scene
      desiredVideoEnabledRef.current = newValue;
      return newValue;
    });
  }, [isOnScene]);

  const handleToggleScreenShare = useCallback((isPresentationSharing?: boolean) => {
    // If already sharing, just stop
    if (isScreenShareEnabled) {
      setIsScreenShareEnabled(false);
      return;
    }

    // Block if presentation sharing is active
    if (isPresentationSharing) {
      toast?.({
        title: t('webinars.presentation.title', 'Presentation'),
        description: t('webinars.presentation.stopFirst', 'Stop presentation sharing first'),
        variant: 'destructive',
      });
      return;
    }

    // Screen sharing is NOT supported on mobile/tablet devices
    // Even if getDisplayMedia exists, it typically throws DeviceUnsupportedError
    if (isMobileDevice) {
      toast?.({
        title: t('webinars.screenShareNotSupported', 'Screen Sharing Not Supported'),
        description: t('webinars.screenShareNotSupportedMobile', 'Screen sharing is not available on tablets and mobile devices. Please use a desktop or laptop computer to share your screen.'),
        variant: 'destructive',
      });
      return;
    }

    // Desktop - proceed with screen share
    setIsScreenShareEnabled(true);
  }, [isMobileDevice, isScreenShareEnabled, toast, t]);

  // Pause/Resume all media streams
  const handleTogglePause = useCallback((socketTogglePause?: (isPaused: boolean) => void) => {
    // If not on scene, don't allow pausing
    if (!isOnScene) {
      console.log('[useStudioMedia] Cannot toggle pause - not on scene');
      return;
    }
    setIsPaused((prev) => {
      const newPaused = !prev;
      if (newPaused) {
        // Pause: disable both audio and video
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
        desiredAudioEnabledRef.current = false;
        desiredVideoEnabledRef.current = false;
      } else {
        // Resume: enable both
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);
        desiredAudioEnabledRef.current = true;
        desiredVideoEnabledRef.current = true;
      }
      // Notify clients via WebSocket if provided
      socketTogglePause?.(newPaused);
      return newPaused;
    });
  }, [isOnScene]);

  return {
    mediaPermissions,
    isAudioEnabled,
    isVideoEnabled,
    isScreenShareEnabled,
    isPaused,
    handleToggleAudio,
    handleToggleVideo,
    handleToggleScreenShare,
    handleTogglePause,
    setIsAudioEnabled,
    setIsVideoEnabled,
    setIsScreenShareEnabled,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    setSelectedVideoDeviceId,
    setSelectedAudioDeviceId,
    transmitQuality,
    setTransmitQuality,
    echoCancellation,
    noiseSuppression,
    autoGainControl,
    setEchoCancellation,
    setNoiseSuppression,
    setAutoGainControl,
    dtxEnabled,
    setDtxEnabled,
    redEnabled,
    setRedEnabled,
    audioBitrate,
    setAudioBitrate,
    localVideoRef,
    localStreamRef,
    isMobileDevice,
    stopLocalStream,
    desiredAudioEnabledRef,
    desiredVideoEnabledRef,
  };
}

export default useStudioMedia;
