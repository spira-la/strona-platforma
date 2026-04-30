import { useEffect, useRef, useCallback } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track, type LocalAudioTrack } from 'livekit-client';

export interface LiveKitMediaControllerProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShareEnabled: boolean;
  onAudioChange: (enabled: boolean) => void;
  onVideoChange: (enabled: boolean) => void;
  onScreenShareChange: (enabled: boolean) => void;
  onMediaError?: (error: Error, type: 'audio' | 'video' | 'screen') => void;
  isMobile?: boolean;
  onDebugLog?: (message: string) => void;
  isPresentationSharing?: boolean;
  /** RNNoise noise suppression */
  rnnoiseEnabled?: boolean;
  processAudioTrack?: (track: MediaStreamTrack) => Promise<MediaStreamTrack>;
  cleanupRnnoise?: () => void;
}

/**
 * LiveKitMediaController - Controls audio/video/screenshare using LiveKit hooks
 * Must be rendered inside LiveKitRoom
 * This is a controller component with no UI - it syncs React state with LiveKit
 */
export function LiveKitMediaController({
  isAudioEnabled,
  isVideoEnabled,
  isScreenShareEnabled,
  onAudioChange,
  onVideoChange,
  onScreenShareChange,
  onMediaError,
  isMobile = false,
  onDebugLog,
  isPresentationSharing = false,
  rnnoiseEnabled = false,
  processAudioTrack,
  cleanupRnnoise,
}: LiveKitMediaControllerProps) {
  const { localParticipant } = useLocalParticipant();
  const prevAudioRef = useRef<boolean | null>(null); // null = not initialized
  const prevVideoRef = useRef<boolean | null>(null);
  const prevScreenShareRef = useRef(isScreenShareEnabled);
  const hasInitializedRef = useRef(false);
  const originalTrackRef = useRef<MediaStreamTrack | null>(null);
  const prevRnnoiseRef = useRef(rnnoiseEnabled);

  const log = useCallback((msg: string) => {
    console.log(`[LiveKitMediaController] ${msg}`);
    onDebugLog?.(msg);
  }, [onDebugLog]);

  // Helper: apply or remove RNNoise processing on the current mic track
  const applyRnnoise = useCallback(async (enable: boolean) => {
    if (!localParticipant) return;

    const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
    const audioTrack = micPub?.track as LocalAudioTrack | undefined;
    if (!audioTrack) return;

    if (enable && processAudioTrack) {
      try {
        // Save the original track before processing
        originalTrackRef.current = audioTrack.mediaStreamTrack;
        log('RNNoise: processing audio track...');
        const processedTrack = await processAudioTrack(audioTrack.mediaStreamTrack);
        if (processedTrack !== audioTrack.mediaStreamTrack) {
          await audioTrack.replaceTrack(processedTrack, true);
          log('RNNoise: track replaced with processed version');
        }
      } catch (error) {
        console.error('[LiveKitMediaController] RNNoise processing failed:', error);
        log(`RNNoise: FAILED - ${error}`);
      }
    } else if (!enable) {
      // Restore original track
      cleanupRnnoise?.();
      if (originalTrackRef.current && originalTrackRef.current !== audioTrack.mediaStreamTrack) {
        try {
          log('RNNoise: restoring original audio track...');
          await audioTrack.replaceTrack(originalTrackRef.current, true);
          log('RNNoise: original track restored');
        } catch (error) {
          console.error('[LiveKitMediaController] Failed to restore original track:', error);
          log(`RNNoise restore: FAILED - ${error}`);
        }
      }
      originalTrackRef.current = null;
    }
  }, [localParticipant, processAudioTrack, cleanupRnnoise, log]);

  // Reset initialization when disconnected so re-entering planning re-initializes media
  useEffect(() => {
    if (!localParticipant && hasInitializedRef.current) {
      log('LocalParticipant gone — resetting initialization state');
      hasInitializedRef.current = false;
      prevAudioRef.current = null;
      prevVideoRef.current = null;
    }
  }, [localParticipant, log]);

  // Initial sync when localParticipant first becomes available
  // This is needed because we connect with audio/video=false for mobile compatibility
  useEffect(() => {
    if (!localParticipant) {
      log('Waiting for localParticipant...');
      return;
    }
    if (hasInitializedRef.current) return;

    const initializeMedia = async () => {
      log(`Init media: audio=${isAudioEnabled}, video=${isVideoEnabled}, mobile=${isMobile}`);
      hasInitializedRef.current = true;

      // On mobile, add a small delay to ensure room is fully connected
      if (isMobile) {
        log('Mobile delay 300ms...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Enable audio if desired
      if (isAudioEnabled) {
        try {
          log('Enabling microphone...');
          await localParticipant.setMicrophoneEnabled(true);
          log('Microphone OK');
          prevAudioRef.current = true;

          // Apply RNNoise if enabled
          if (rnnoiseEnabled && processAudioTrack) {
            // Small delay to ensure track is fully published
            await new Promise(resolve => setTimeout(resolve, 100));
            await applyRnnoise(true);
          }
        } catch (error: any) {
          log(`Mic FAILED: ${error.name} - ${error.message}`);
          onAudioChange(false);
          onMediaError?.(error, 'audio');
          prevAudioRef.current = false;
        }
      } else {
        prevAudioRef.current = false;
      }

      // Enable video if desired (with mobile-specific options)
      if (isVideoEnabled) {
        try {
          log(`Enabling camera (mobile=${isMobile})...`);
          if (isMobile) {
            await localParticipant.setCameraEnabled(true, {
              facingMode: 'user',
            });
          } else {
            await localParticipant.setCameraEnabled(true);
          }
          log('Camera OK');
          prevVideoRef.current = true;
        } catch (error: any) {
          log(`Camera FAILED: ${error.name} - ${error.message}`);
          onVideoChange(false);
          onMediaError?.(error, 'video');
          prevVideoRef.current = false;
        }
      } else {
        prevVideoRef.current = false;
      }

      log('Init complete');
    };

    initializeMedia();
  }, [localParticipant, isAudioEnabled, isVideoEnabled, isMobile, onAudioChange, onVideoChange, onMediaError, log]);

  // Sync audio state changes with LiveKit (after initialization)
  useEffect(() => {
    // Skip if not initialized or no change
    if (prevAudioRef.current === null || prevAudioRef.current === isAudioEnabled || !localParticipant) return;

    const enableMic = async () => {
      try {
        await localParticipant.setMicrophoneEnabled(isAudioEnabled);
        prevAudioRef.current = isAudioEnabled;
      } catch (error: any) {
        console.error('[LiveKitMediaController] Failed to set microphone:', error);
        onAudioChange(prevAudioRef.current);
        onMediaError?.(error, 'audio');
      }
    };
    enableMic();
  }, [isAudioEnabled, localParticipant, onAudioChange, onMediaError]);

  // Sync RNNoise toggle while mic is active
  useEffect(() => {
    if (prevRnnoiseRef.current === rnnoiseEnabled) return;
    prevRnnoiseRef.current = rnnoiseEnabled;

    // Only process if mic is currently active
    if (!isAudioEnabled || prevAudioRef.current !== true || !localParticipant) return;

    applyRnnoise(rnnoiseEnabled);
  }, [rnnoiseEnabled, isAudioEnabled, localParticipant, applyRnnoise]);

  // Sync video state changes with LiveKit (after initialization)
  useEffect(() => {
    // Skip if not initialized or no change
    if (prevVideoRef.current === null || prevVideoRef.current === isVideoEnabled || !localParticipant) return;

    const enableCam = async () => {
      try {
        if (isVideoEnabled && isMobile) {
          await localParticipant.setCameraEnabled(isVideoEnabled, {
            facingMode: 'user',
          });
        } else {
          await localParticipant.setCameraEnabled(isVideoEnabled);
        }
        prevVideoRef.current = isVideoEnabled;
      } catch (error: any) {
        console.error('[LiveKitMediaController] Failed to set camera:', error);
        onVideoChange(prevVideoRef.current);
        onMediaError?.(error, 'video');
      }
    };
    enableCam();
  }, [isVideoEnabled, localParticipant, isMobile, onVideoChange, onMediaError]);

  // Sync screen share state with LiveKit
  // Skip when presentation sharing is active — it publishes its own ScreenShare track directly
  useEffect(() => {
    if (isPresentationSharing) return;
    if (prevScreenShareRef.current !== isScreenShareEnabled && localParticipant) {
      const enableScreenShare = async () => {
        try {
          await localParticipant.setScreenShareEnabled(isScreenShareEnabled);
          prevScreenShareRef.current = isScreenShareEnabled;
        } catch (error: any) {
          console.error('[LiveKitMediaController] Screen share error:', error?.name, error?.message);
          // Revert state on error
          onScreenShareChange(false);
          prevScreenShareRef.current = false;
          onMediaError?.(error, 'screen');
        }
      };
      enableScreenShare();
    }
  }, [isScreenShareEnabled, isPresentationSharing, localParticipant, onScreenShareChange, onMediaError]);

  // Listen for track changes from LiveKit and sync back to parent state
  useEffect(() => {
    if (!localParticipant) return;

    const handleTrackMuted = (publication: any) => {
      if (publication.source === Track.Source.Microphone) {
        onAudioChange(false);
      } else if (publication.source === Track.Source.Camera) {
        onVideoChange(false);
      } else if (publication.source === Track.Source.ScreenShare) {
        onScreenShareChange(false);
      }
    };

    const handleTrackUnmuted = (publication: any) => {
      if (publication.source === Track.Source.Microphone) {
        onAudioChange(true);
      } else if (publication.source === Track.Source.Camera) {
        onVideoChange(true);
      } else if (publication.source === Track.Source.ScreenShare) {
        onScreenShareChange(true);
      }
    };

    // Handle track unpublished - this fires when browser's "Stop sharing" button is clicked
    const handleTrackUnpublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        onScreenShareChange(false);
      }
    };

    localParticipant.on('trackMuted', handleTrackMuted);
    localParticipant.on('trackUnmuted', handleTrackUnmuted);
    localParticipant.on('localTrackUnpublished', handleTrackUnpublished);

    return () => {
      localParticipant.off('trackMuted', handleTrackMuted);
      localParticipant.off('trackUnmuted', handleTrackUnmuted);
      localParticipant.off('localTrackUnpublished', handleTrackUnpublished);
    };
  }, [localParticipant, onAudioChange, onVideoChange, onScreenShareChange]);

  return null; // This is a controller component, no UI
}

export default LiveKitMediaController;
