/**
 * MeetingRecordingTemplate Page
 *
 * Minimal page used by LiveKit Egress for recording coaching meetings.
 * Renders the meeting scene (MeetingGrid) with scene state synced from
 * the coach via LiveKit data channel (useMeetingSceneChannel).
 *
 * URL: /webinar-recording-template/meeting-{bookingId}
 * (Loaded by egress Chrome when the sessionId starts with "meeting-")
 *
 * IMPORTANT: No UI controls, no header, no footer — fullscreen scene only.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext, useTracks } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import EgressHelper from '@livekit/egress-sdk';
import { MeetingGrid } from '@/components/meeting/MeetingGrid';
import { useMeetingSceneSync, type MeetingSceneState } from '@/hooks/meeting/useMeetingSceneSync';
import { useMeetingSceneChannel } from '@/hooks/meeting/useMeetingSceneChannel';
import { cn } from '@/lib/utils';

// Send START_RECORDING immediately when module loads (egress monitors console)
console.warn('[MeetingRecordingTemplate] Module loaded - sending immediate START_RECORDING');
console.warn('START_RECORDING');

/**
 * Egress integration - registers room and signals when ready
 */
function MeetingEgressIntegration({ hasSceneState }: { hasSceneState: boolean }) {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const hasRegistered = useRef(false);
  const hasStartedRecording = useRef(false);

  // Register room with EgressHelper
  useEffect(() => {
    if (!room || hasRegistered.current) return;
    console.warn('[MeetingEgressIntegration] Registering room with EgressHelper');
    EgressHelper.setRoom(room);
    hasRegistered.current = true;

    const handleLayoutChange = () => {
      EgressHelper.onLayoutChanged();
    };

    room.on(RoomEvent.TrackSubscribed, handleLayoutChange);
    room.on(RoomEvent.TrackUnsubscribed, handleLayoutChange);
    room.on(RoomEvent.ParticipantConnected, handleLayoutChange);
    room.on(RoomEvent.ParticipantDisconnected, handleLayoutChange);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleLayoutChange);
      room.off(RoomEvent.TrackUnsubscribed, handleLayoutChange);
      room.off(RoomEvent.ParticipantConnected, handleLayoutChange);
      room.off(RoomEvent.ParticipantDisconnected, handleLayoutChange);
    };
  }, [room]);

  // Signal recording ready when we have scene state or video tracks
  useEffect(() => {
    if (hasStartedRecording.current) return;

    const videoTracks = tracks.filter(
      (t) => t.source === Track.Source.Camera,
    );

    if (hasSceneState || videoTracks.length > 0) {
      console.warn('[MeetingEgressIntegration] Ready - starting recording');
      hasStartedRecording.current = true;
      setTimeout(() => {
        EgressHelper.startRecording();
        console.warn('START_RECORDING');
      }, 500);
    }
  }, [tracks, hasSceneState]);

  // Fallback: start after 8s regardless
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasStartedRecording.current) return;
      console.warn('[MeetingEgressIntegration] Fallback 8s - starting recording');
      hasStartedRecording.current = true;
      EgressHelper.startRecording();
      console.warn('START_RECORDING');
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}

/**
 * Inner component (must be inside LiveKitRoom)
 * Receives scene state from coach via data channel and renders MeetingGrid
 */
function MeetingRecordingScene() {
  const [sceneState, sceneSetters] = useMeetingSceneSync({
    initialLayout: 'side-by-side',
  });

  const [hasReceivedScene, setHasReceivedScene] = useState(false);

  // Listen for scene updates via data channel (as client, not coach)
  useMeetingSceneChannel({
    isCoach: false,
    sceneState,
    sceneSetters,
  });

  // Detect when scene state changes from defaults (meaning we received an update)
  const prevBgRef = useRef(sceneState.background.value);
  useEffect(() => {
    if (sceneState.background.value !== '#0d1f1c' || sceneState.cornerImages.length > 0) {
      if (!hasReceivedScene) {
        console.warn('[MeetingRecordingScene] Scene state received from coach');
        setHasReceivedScene(true);
      }
    }
    prevBgRef.current = sceneState.background.value;
  }, [sceneState, hasReceivedScene]);

  return (
    <>
      <MeetingEgressIntegration hasSceneState={hasReceivedScene} />
      <RoomAudioRenderer />

      {/* Full scene with background, corner images, and MeetingGrid */}
      <div
        className="w-full h-full relative"
        style={{
          ...(sceneState.background.type === 'color'
            ? { backgroundColor: sceneState.background.value }
            : {
                backgroundImage: `url(${sceneState.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }),
        }}
      >
        {/* Corner images */}
        {sceneState.cornerImages
          .filter((img) => img.isVisible)
          .map((img) => (
            <div
              key={img.id}
              className={cn(
                'absolute z-10 pointer-events-none',
                img.corner === 'top-left' && 'top-4 left-4',
                img.corner === 'top-right' && 'top-4 right-4',
                img.corner === 'bottom-left' && 'bottom-4 left-4',
                img.corner === 'bottom-right' && 'bottom-4 right-4',
              )}
              style={{
                width: `${img.width}%`,
                maxWidth: '150px',
              }}
            >
              <img src={img.url} alt={img.name} className="w-full h-auto" />
            </div>
          ))}

        <MeetingGrid
          className="h-full"
          layout={sceneState.layout}
          cameraScale={sceneState.cameraScale}
          cameraSlotStyles={sceneState.cameraSlotStyles}
          speakerNameStyle={sceneState.speakerNameStyle}
        />
      </div>
    </>
  );
}

/**
 * Main component — connects to LiveKit and renders the meeting scene
 */
export default function MeetingRecordingTemplate({ sessionId }: { sessionId: string }) {
  const [searchParams] = useSearchParams();

  // Egress provides url + token via query params
  const egressUrl = searchParams.get('url');
  const egressToken = searchParams.get('token');

  const [livekitToken, setLivekitToken] = useState<string | null>(egressToken || null);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(egressUrl || null);
  const [error, setError] = useState<string | null>(null);

  const usingEgressCredentials = !!(egressUrl && egressToken);

  // Aggressive fallback START_RECORDING signals
  useEffect(() => {
    const callStart = (label: string) => {
      try {
        EgressHelper.startRecording();
        console.warn('START_RECORDING');
        console.warn(`[MeetingRecordingTemplate] ${label} - START_RECORDING sent`);
      } catch {
        console.warn('START_RECORDING');
      }
    };

    const t1 = setTimeout(() => callStart('500ms'), 500);
    const t2 = setTimeout(() => callStart('3s'), 3000);
    const t3 = setTimeout(() => callStart('8s'), 8000);
    const t4 = setTimeout(() => callStart('12s'), 12000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Fallback: fetch token from API if egress didn't provide credentials
  useEffect(() => {
    if (livekitToken && livekitServerUrl) return;
    if (usingEgressCredentials) return;
    if (!sessionId) return;

    const fetchToken = async () => {
      try {
        console.warn('[MeetingRecordingTemplate] Fetching token from API for:', sessionId);

        // Determine API URL (same logic as WebinarRecordingTemplate)
        const params = new URLSearchParams(window.location.search);
        const internalApiUrl = params.get('internalApiUrl');
        let apiUrl = internalApiUrl || import.meta.env.VITE_API_URL || '';

        if (!apiUrl) {
          const hostname = window.location.hostname;
          if (hostname === 'dev.be-wonder.me') apiUrl = 'https://apidev.be-wonder.me';
          else if (hostname === 'be-wonder.me') apiUrl = 'https://api.be-wonder.me';
        }

        const response = await fetch(`${apiUrl}/api/livekit/recording-token/${sessionId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        setLivekitToken(data.token);
        setLivekitServerUrl(data.serverUrl);
      } catch (err) {
        console.error('[MeetingRecordingTemplate] Failed to get token:', err);
        setError(`Failed to get recording token: ${err}`);
      }
    };

    fetchToken();
  }, [sessionId, livekitToken, livekitServerUrl, usingEgressCredentials]);

  if (error) {
    return (
      <div className="w-screen h-screen bg-red-900 flex items-center justify-center text-white">
        <p className="text-xl">Recording Error: {error}</p>
      </div>
    );
  }

  if (!livekitToken || !livekitServerUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-white">Connecting to meeting...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <LiveKitRoom
        serverUrl={livekitServerUrl}
        token={livekitToken}
        connect={true}
        className="w-full h-full"
      >
        <MeetingRecordingScene />
      </LiveKitRoom>
    </div>
  );
}
