import { useCallback, useState } from 'react';
import { livekitClient } from '@/clients/livekit.client';

export interface UseMeetingRecordingResult {
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;
  /** Public URL of the resulting MP4 once stopped */
  recordingUrl: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Coach-side recording control. Uses BeWonderMe's HLS-segment-range pattern:
 * `start` ensures HLS is running and captures the current segment index;
 * `stop` reads the segment range, ffmpeg-concats segments into MP4, and
 * uploads to R2. Both calls are coach-only on the backend.
 */
export function useMeetingRecording(
  bookingId: string,
  userId: string | null,
): UseMeetingRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [startSegmentIndex, setStartSegmentIndex] = useState<number | null>(
    null,
  );
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (!bookingId) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await livekitClient.startRecording(bookingId, userId);
      setEgressId(res.egressId);
      setStartSegmentIndex(res.startSegmentIndex);
      setIsRecording(true);
    } catch (error_) {
      setError((error_ as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, userId]);

  const stop = useCallback(async () => {
    if (!egressId || startSegmentIndex === null) return;
    setIsLoading(true);
    try {
      const res = await livekitClient.stopRecording(
        egressId,
        bookingId,
        startSegmentIndex,
        userId,
      );
      setRecordingUrl(res.url);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);
    } catch (error_) {
      setError((error_ as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, egressId, startSegmentIndex, userId]);

  return { isRecording, isLoading, error, recordingUrl, start, stop };
}
