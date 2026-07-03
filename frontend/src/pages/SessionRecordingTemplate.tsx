import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

/**
 * /recording-template/:bookingId
 *
 * Page that LiveKit Egress's headless Chrome loads to compose the
 * recording. NOT meant to be opened by humans.
 *
 * Query params (set by backend egress.service.buildTemplateUrl):
 *   - recordingKey: validated by /api/livekit/recording-token/<roomName>
 *   - internalApiUrl: Docker-internal API base URL Chrome can reach
 *
 * Behaviour:
 *   1. Compute roomName = `meeting-${bookingId}` (matches BWM convention).
 *   2. Fetch a viewer-only token from /livekit/recording-token (public,
 *      key-protected) using internalApiUrl so DNS resolves inside Docker.
 *   3. Connect to the LiveKit room and render every published track in
 *      a simple grid. The egress captures whatever this page renders.
 */
export default function SessionRecordingTemplate() {
  const { bookingId = '' } = useParams();
  const [params] = useSearchParams();
  const recordingKey = params.get('recordingKey') ?? '';
  const internalApiUrl =
    params.get('internalApiUrl') ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    '';

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomName = `meeting-${bookingId}`;

  useEffect(() => {
    if (!bookingId || !recordingKey) {
      setError('Missing bookingId or recordingKey');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `${internalApiUrl}/api/livekit/recording-token/${encodeURIComponent(
          roomName,
        )}?recordingKey=${encodeURIComponent(recordingKey)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          success: boolean;
          data: { token: string; serverUrl: string };
        };
        if (cancelled) return;
        setToken(json.data.token);
        setServerUrl(json.data.serverUrl);
      } catch (error_) {
        if (!cancelled) setError((error_ as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, recordingKey, internalApiUrl, roomName]);

  if (error) {
    return (
      <div
        style={{
          background: '#000',
          color: '#fff',
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <p>Recording template error: {error}</p>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div style={{ background: '#000', color: '#fff', height: '100vh' }}>
        {/* Empty until connected — egress recorder waits for first frame */}
      </div>
    );
  }

  return (
    <main
      style={{
        background: '#000',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        audio={false}
        video={false}
        connect
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <RecordingGrid />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

function RecordingGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
