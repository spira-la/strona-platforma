/**
 * useMediaPreview Hook
 *
 * Reusable hook for camera/microphone preview functionality.
 * Handles stream acquisition, video element connection, and cleanup.
 *
 * Features:
 * - Callback ref pattern for reliable video element connection
 * - Automatic stream cleanup on unmount or pause
 * - Support for pausing preview (e.g., when DeviceSelector opens)
 * - Device ID selection for camera and microphone
 * - Mobile-friendly constraint fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDeviceInfo, getDeviceInfoString } from '@/shared/utils/deviceInfo';

export interface UseMediaPreviewOptions {
  /** Whether to start the preview automatically */
  autoStart?: boolean;
  /** Video device ID to use */
  videoDeviceId?: string;
  /** Audio device ID to use */
  audioDeviceId?: string;
  /** Whether video is enabled (default: false for privacy) */
  videoEnabled?: boolean;
  /** Whether audio is enabled (default: false for privacy) */
  audioEnabled?: boolean;
  /** Whether the preview is paused (e.g., when DeviceSelector is open) */
  paused?: boolean;
}

export interface UseMediaPreviewReturn {
  /** Callback ref to attach to video element */
  videoRef: (node: HTMLVideoElement | null) => void;
  /** Current media stream */
  stream: MediaStream | null;
  /** Whether the stream is currently active */
  isActive: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether video is currently enabled */
  videoEnabled: boolean;
  /** Whether audio is currently enabled */
  audioEnabled: boolean;
  /** Toggle video on/off */
  toggleVideo: () => void;
  /** Toggle audio on/off */
  toggleAudio: () => void;
  /** Start the preview manually */
  startPreview: () => Promise<void>;
  /** Stop the preview manually */
  stopPreview: () => void;
}

/**
 * Check if we're in a secure context (HTTPS or localhost)
 */
function isSecureContext(): boolean {
  if (typeof window !== 'undefined') {
    return window.isSecureContext ||
           window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }
  return false;
}

/**
 * Check if mediaDevices API is available
 */
function isMediaDevicesAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
         navigator.mediaDevices !== undefined &&
         typeof navigator.mediaDevices.getUserMedia === 'function';
}

export function useMediaPreview(options: UseMediaPreviewOptions = {}): UseMediaPreviewReturn {
  const {
    autoStart = true,
    videoDeviceId,
    audioDeviceId,
    videoEnabled: initialVideoEnabled = false,
    audioEnabled: initialAudioEnabled = false,
    paused = false,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(initialVideoEnabled);
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled);

  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  // Callback ref for video element
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    setVideoElement(node);
  }, []);

  // Stop the current stream
  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }, [videoElement]);

  // Start the preview
  const startPreview = useCallback(async () => {
    if (!isSecureContext()) {
      setError('HTTPS required for camera/microphone access');
      return;
    }

    if (!isMediaDevicesAvailable()) {
      setError('Media devices API not available');
      return;
    }

    // Stop existing stream first
    stopPreview();
    setError(null);

    const deviceInfo = getDeviceInfo();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    console.log(`[useMediaPreview] Starting preview | ${getDeviceInfoString()}`);

    // Audio constraints with echo cancellation for all devices
    const audioConstraints: MediaTrackConstraints | boolean = audioDeviceId
      ? { deviceId: isMobileDevice ? { ideal: audioDeviceId } : { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    // Build constraint strategies with progressive fallback (best practices from Jitsi/Google Meet)
    // Key: Always use `ideal` not `exact` for resolution/frameRate to avoid OverconstrainedError
    const constraintStrategies: MediaStreamConstraints[] = [];

    // Strategy 1: Specific device ID + quality appropriate for device age
    if (videoDeviceId || audioDeviceId) {
      constraintStrategies.push({
        video: videoDeviceId
          ? {
              deviceId: isMobileDevice ? { ideal: videoDeviceId } : { exact: videoDeviceId },
              ...(deviceInfo.isOldDevice
                ? { width: { ideal: 640, max: 640 }, height: { ideal: 480, max: 480 }, frameRate: { ideal: 20, max: 24 } }
                : { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 24, max: 30 } }),
            }
          : true,
        audio: audioConstraints,
      });
    }

    // Strategy 2: For mobile, facingMode + resolution caps
    if (isMobileDevice) {
      constraintStrategies.push({
        video: {
          facingMode: 'user', // bare value = preference, not strict (avoids OverconstrainedError on devices with only rear camera)
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          frameRate: { ideal: 20, max: 24 },
        },
        audio: audioConstraints,
      });
    }

    // Strategy 3: Medium quality, no device-specific constraints
    constraintStrategies.push({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 20, max: 24 },
      },
      audio: audioConstraints,
    });

    // Strategy 4: Low quality for very old devices
    constraintStrategies.push({
      video: {
        facingMode: 'user',
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15, max: 20 },
      },
      audio: true,
    });

    // Strategy 5: Absolute minimum - no constraints at all
    constraintStrategies.push({
      video: true,
      audio: true,
    });

    let newStream: MediaStream | null = null;
    let lastError: unknown = null;

    // Try each strategy until one works
    for (let i = 0; i < constraintStrategies.length; i++) {
      const constraints = constraintStrategies[i];
      try {
        console.log(`[useMediaPreview] Trying constraint level ${i}/${constraintStrategies.length - 1}:`, JSON.stringify(constraints));
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoTrack = newStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        console.log(`[useMediaPreview] Success at level ${i} | ${getDeviceInfoString()} | resolution=${settings?.width}x${settings?.height} fps=${settings?.frameRate}`);
        break;
      } catch (err) {
        const errName = err instanceof DOMException ? err.name : 'Unknown';
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[useMediaPreview] Level ${i} failed | ${getDeviceInfoString()} | error=${errName} | message=${errMsg}`);
        lastError = err;
        // Don't retry on permission denial or no device found - these won't change with different constraints
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
          break;
        }
      }
    }

    if (!mountedRef.current) {
      // Component unmounted during async operation
      if (newStream) {
        newStream.getTracks().forEach((track) => track.stop());
      }
      return;
    }

    if (newStream) {
      streamRef.current = newStream;
      setStream(newStream);
      setIsActive(true);

      // Apply initial enabled states
      newStream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });
      newStream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
    } else {
      // Provide a descriptive error based on the actual failure
      const errName = lastError instanceof DOMException ? lastError.name : 'Unknown';
      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      console.error(`[useMediaPreview] All strategies failed | ${getDeviceInfoString()} | lastError=${errName} | message=${errMsg}`);
      if (lastError instanceof DOMException) {
        switch (lastError.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setError('Camera/microphone permission denied');
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            setError('Camera/microphone is being used by another app');
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setError('No camera/microphone found');
            break;
          case 'OverconstrainedError':
            setError('Camera/microphone does not support the required settings');
            break;
          case 'AbortError':
            setError('Camera/microphone access was interrupted');
            break;
          default:
            setError(`Failed to access camera/microphone: ${lastError.name}`);
        }
      } else {
        setError('Failed to access camera/microphone');
      }
    }
  }, [videoDeviceId, audioDeviceId, videoEnabled, audioEnabled, stopPreview]);

  // Connect stream to video element when both are ready
  useEffect(() => {
    if (videoElement && stream && stream.getVideoTracks().length > 0) {
      console.log('[useMediaPreview] Connecting stream to video element');
      videoElement.srcObject = stream;

      // Use a small delay for Firefox which may abort play() if called too early
      const playTimeout = setTimeout(() => {
        if (!mountedRef.current || videoElement.srcObject !== stream) return;
        videoElement.play().then(() => {
          console.log('[useMediaPreview] Video playing');
        }).catch((err) => {
          // AbortError is expected in Firefox when the stream or element is cleaned up
          // (e.g., user navigated away, DeviceSelector opened, or stream was replaced)
          if (err.name === 'AbortError') {
            console.log('[useMediaPreview] Video play aborted (expected during cleanup)');
            return;
          }
          console.error('[useMediaPreview] Failed to play video:', err);
        });
      }, 50);

      return () => clearTimeout(playTimeout);
    }
  }, [videoElement, stream]);

  // Auto-start preview when conditions are met
  useEffect(() => {
    if (autoStart && !paused && videoElement) {
      startPreview();
    }

    // Cleanup when paused or unmounted
    return () => {
      if (paused && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStream(null);
        setIsActive(false);
      }
    };
  }, [autoStart, paused, videoElement, startPreview]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  }, [videoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  }, [audioEnabled]);

  return {
    videoRef,
    stream,
    isActive,
    error,
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
    startPreview,
    stopPreview,
  };
}
