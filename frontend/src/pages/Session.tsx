import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
  type LocalUserChoices,
} from '@livekit/components-react';
import { Loader2, ChevronLeft, Circle, Square } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { livekitClient } from '@/clients/livekit.client';
import { useAuth } from '@/contexts/AuthContext';
import { useMeetingRecording } from '@/hooks/useMeetingRecording';

/**
 * /session/:bookingId
 *
 * PreJoin → fetch token → LiveKitRoom with the standard VideoConference UI.
 * Coach sees an extra Record / Stop button (top-right) and a "REC ●"
 * indicator while recording is active. Recording flow:
 *   1. POST /livekit/hls/start              (auto, when coach hits Record)
 *   2. POST /livekit/recordings/start       (marks current segment index)
 *   3. POST /livekit/recordings/stop        (concat → MP4 → R2)
 *   4. POST /livekit/hls/stop
 */
export default function Session() {
  const { bookingId = '' } = useParams();
  const { user } = useAuth();

  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recording = useMeetingRecording(bookingId, user?.id ?? null);

  const displayName = useMemo(() => {
    const metaName = user?.user_metadata?.full_name as string | undefined;
    return metaName ?? user?.email ?? 'Guest';
  }, [user]);

  useEffect(() => {
    if (!choices || token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await livekitClient.tokenForBooking({
          bookingId,
          userId: user?.id ?? null,
          displayName: choices.username || displayName,
        });
        if (cancelled) return;
        setToken(res.token);
        setServerUrl(res.serverUrl);
        setIsHost(res.isHost);
      } catch (error_) {
        if (!cancelled) setError((error_ as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [choices, bookingId, user?.id, displayName, token]);

  return (
    <main className="min-h-screen bg-[#0E0E12] text-white flex flex-col">
      <SEO title="Sesja" canonical={`/session/${bookingId}`} noindex />

      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link
          to="/moje-sesje"
          className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          <ChevronLeft size={14} /> Moje sesje
        </Link>
        <p
          className="text-sm font-semibold"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Spirala &middot; Sesja
        </p>
        <div className="flex items-center gap-3">
          {recording.isRecording && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C62828]/15 text-[#FF6B6B] text-xs font-semibold"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <Circle size={8} fill="currentColor" className="animate-pulse" />
              REC
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center relative">
        {error && (
          <div
            className="max-w-md text-center p-8"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <p className="text-lg mb-2">Nie mozna dolaczyc do sesji</p>
            <p className="text-sm text-white/70">{error}</p>
            <Link
              to="/moje-sesje"
              className="inline-block mt-4 px-4 py-2 rounded-lg border border-white/30 text-sm hover:bg-white/10"
            >
              Wroc do moich sesji
            </Link>
          </div>
        )}

        {!error && !choices && (
          <div className="w-full max-w-2xl p-6">
            <PreJoin
              defaults={{
                username: displayName,
                videoEnabled: true,
                audioEnabled: true,
              }}
              onSubmit={(values) => setChoices(values)}
            />
          </div>
        )}

        {!error && choices && !token && (
          <div
            className="flex items-center gap-2 text-white/70"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <Loader2 size={18} className="animate-spin" />
            Laczenie z sesja…
          </div>
        )}

        {!error && choices && token && serverUrl && (
          <div className="w-full h-[calc(100vh-65px)] relative">
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              audio={choices.audioEnabled}
              video={choices.videoEnabled}
              connect
              data-lk-theme="default"
              style={{ height: '100%' }}
            >
              <VideoConference />
            </LiveKitRoom>

            {/* Coach-only recording controls (overlay, top-right). */}
            {isHost && (
              <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
                {recording.isRecording ? (
                  <button
                    type="button"
                    onClick={recording.stop}
                    disabled={recording.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    <Square size={14} fill="currentColor" />
                    {recording.isLoading
                      ? 'Zatrzymywanie…'
                      : 'Zakoncz nagranie'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={recording.start}
                    disabled={recording.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C62828] text-white text-sm font-semibold hover:bg-[#B11F1F] disabled:opacity-50"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    <Circle size={10} fill="currentColor" />
                    {recording.isLoading ? 'Inicjowanie HLS…' : 'Nagrywaj'}
                  </button>
                )}

                {recording.error && (
                  <p
                    className="px-3 py-1 rounded bg-[#C62828]/30 text-xs text-white max-w-xs"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    {recording.error}
                  </p>
                )}

                {recording.recordingUrl && (
                  <a
                    href={recording.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded bg-[#4CAF50]/20 text-xs text-[#A5D6A7] hover:bg-[#4CAF50]/30"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Pobierz nagranie ↗
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
