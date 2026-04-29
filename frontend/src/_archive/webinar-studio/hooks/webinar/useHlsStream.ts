/**
 * useHlsStream Hook
 *
 * Manages HLS playback lifecycle for webinar viewers.
 * Uses hls.js for cross-browser HLS support, with native fallback for Safari.
 *
 * Features:
 * - Automatic hls.js initialization and cleanup
 * - Safari native HLS support detection
 * - Error handling with retry logic
 * - Loading and playing state tracking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

interface UseHlsStreamOptions {
  /** HLS playlist URL (.m3u8) */
  hlsUrl: string | null;
  /** Reference to the video element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether to auto-play when ready (default: true) */
  autoPlay?: boolean;
}

interface UseHlsStreamReturn {
  /** Whether the stream is currently loading/buffering */
  isLoading: boolean;
  /** Whether the stream is actively playing */
  isPlaying: boolean;
  /** Error message if playback failed */
  error: string | null;
  /** Whether HLS is supported (hls.js or native) */
  isSupported: boolean;
  /** Whether the browser forced muted playback (autoplay policy) */
  startedMuted: boolean;
  /** Retry playback after an error */
  retry: () => void;
}

export function useHlsStream({
  hlsUrl,
  videoRef,
  autoPlay = true,
}: UseHlsStreamOptions): UseHlsStreamReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedMuted, setStartedMuted] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetries = 6;
  const maxReconnects = 5;

  const isSupported = Hls.isSupported() || isNativeHlsSupported();

  const destroyHls = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initializeHls = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Reset state
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    // Clean up previous instance
    destroyHls();

    // Safari supports HLS natively via <video src>
    if (!Hls.isSupported() && isNativeHlsSupported()) {
      video.src = hlsUrl;
      if (autoPlay) {
        // Try unmuted first, fallback to muted for autoplay policy compliance
        video.play().catch(() => {
          video.muted = true;
          setStartedMuted(true);
          video.play().catch(() => {
            setIsLoading(false);
          });
        });
      }
      return;
    }

    if (!Hls.isSupported()) {
      setError('HLS playback is not supported in this browser');
      setIsLoading(false);
      return;
    }

    const hls = new Hls({
      // === Live edge tuning ===
      // Start 3 segments behind live edge (safe margin for server CPU spikes)
      // With 1s segments = ~3s behind live; with 2s segments = ~6s behind live
      liveSyncDurationCount: 3,
      // Force re-sync if latency exceeds 6 segments
      liveMaxLatencyDurationCount: 6,
      // Catch-up: speed up to 1.05x when behind live edge (imperceptible)
      maxLiveSyncPlaybackRate: 1.05,

      // === Buffer management — resilient for live ===
      maxBufferLength: 15,
      maxMaxBufferLength: 30,
      // Free memory for played content (keep 8s for minor rewind)
      backBufferLength: 8,

      // === Low-latency mode ===
      lowLatencyMode: true,
      // Pre-fetch next segment while current one plays
      startFragPrefetch: true,
      // Use Web Worker for transmuxing (better performance)
      enableWorker: true,

      // === Tolerant timeouts — handle server CPU spikes & mobile networks ===
      fragLoadingTimeOut: 20000,
      manifestLoadingTimeOut: 15000,
      // Retry more times before giving up (default 3)
      fragLoadingMaxRetry: 6,
      manifestLoadingMaxRetry: 4,
      levelLoadingMaxRetry: 4,
      // Exponential backoff on retries
      fragLoadingRetryDelay: 1000,
      manifestLoadingRetryDelay: 1000,
      levelLoadingRetryDelay: 1000,
      // Max retry delay cap
      fragLoadingMaxRetryTimeout: 8000,
      manifestLoadingMaxRetryTimeout: 8000,
      levelLoadingMaxRetryTimeout: 8000,
    });

    hlsRef.current = hls;

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsLoading(false);
      retryCountRef.current = 0;
      reconnectCountRef.current = 0;
      if (autoPlay) {
        // Try unmuted first, fallback to muted for autoplay policy compliance (mobile)
        video.play().catch(() => {
          video.muted = true;
          setStartedMuted(true);
          video.play().catch(() => {
            // Even muted play failed — very rare, user must interact manually
          });
        });
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;

      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // Try inline recovery first (hls.js restarts loading)
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            hls.startLoad();
          } else {
            // Inline retries exhausted — try full reconnect
            scheduleReconnect();
          }
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          // Try to recover from media errors (codec/decode issues)
          hls.recoverMediaError();
          break;
        default:
          // Unknown fatal error — try full reconnect
          scheduleReconnect();
          break;
      }
    });

    // Auto-reconnect: destroy current instance and re-initialize from scratch.
    // Uses exponential backoff: 2s, 4s, 8s, 16s, 32s
    function scheduleReconnect() {
      if (reconnectCountRef.current >= maxReconnects) {
        setError('Network error — unable to load the stream');
        setIsLoading(false);
        return;
      }
      const delay = Math.min(2000 * Math.pow(2, reconnectCountRef.current), 32000);
      reconnectCountRef.current++;
      setIsLoading(true);
      setError(null);
      reconnectTimerRef.current = setTimeout(() => {
        destroyHls();
        retryCountRef.current = 0;
        initializeHls();
      }, delay);
    }

    // Latency watchdog: every 10s, check if player drifted too far behind live edge
    // If latency > 10s, jump to live edge. hls.js catch-up handles small drifts,
    // but large jumps (e.g. after tab was backgrounded) need a hard seek.
    let lastPlaybackTime = 0;
    let stallCount = 0;
    const watchdogInterval = setInterval(() => {
      try {
        if (!hls.media || hls.media.paused) return;

        // Jump to live edge if drifted too far
        const latency = hls.latency;
        if (typeof latency === 'number' && latency > 10 && hls.liveSyncPosition) {
          hls.media.currentTime = hls.liveSyncPosition;
        }

        // Stall detection: if currentTime hasn't changed in 10s while not paused,
        // the player is stuck. Try recoverMediaError first, then full reconnect.
        const currentTime = hls.media.currentTime;
        if (currentTime === lastPlaybackTime && currentTime > 0) {
          stallCount++;
          if (stallCount >= 2) {
            // Stuck for 20s+ — try media error recovery
            hls.recoverMediaError();
            stallCount = 0;
          }
        } else {
          stallCount = 0;
          // Reset reconnect counter on healthy playback
          reconnectCountRef.current = 0;
        }
        lastPlaybackTime = currentTime;
      } catch {
        // hls.js may throw if instance is being destroyed
      }
    }, 10000);

    // Track playing state via video element events
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      clearInterval(watchdogInterval);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [hlsUrl, videoRef, autoPlay, destroyHls]);

  // Initialize HLS when URL changes
  useEffect(() => {
    if (!hlsUrl) {
      setIsLoading(false);
      setIsPlaying(false);
      destroyHls();
      return;
    }

    const cleanup = initializeHls();

    return () => {
      cleanup?.();
      destroyHls();
    };
  }, [hlsUrl, initializeHls, destroyHls]);

  // Manual retry function (user clicks "Retry" button)
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    reconnectCountRef.current = 0;
    initializeHls();
  }, [initializeHls]);

  return {
    isLoading,
    isPlaying,
    error,
    isSupported,
    startedMuted,
    retry,
  };
}

/**
 * Check if the browser supports HLS natively (Safari, iOS)
 */
function isNativeHlsSupported(): boolean {
  const video = document.createElement('video');
  return !!video.canPlayType('application/vnd.apple.mpegurl');
}
