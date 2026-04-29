import { useState, useEffect, useCallback, useRef } from 'react';
import NoSleep from 'nosleep.js';

/**
 * useWakeLock - Prevents the screen from turning off
 *
 * Uses NoSleep.js which is the most reliable cross-platform solution.
 * It works by:
 * 1. Using native Wake Lock API when available (Chrome, Safari 16.4+)
 * 2. Falling back to playing an invisible video (older browsers, iOS)
 *
 * @param enabled - Whether to keep the screen awake
 * @returns Object with wakeLock state and manual controls
 */
export function useWakeLock(enabled: boolean = true) {
  const [isActive, setIsActive] = useState(false);
  const noSleepRef = useRef<NoSleep | null>(null);
  const hasUserInteracted = useRef(false);

  // Initialize NoSleep instance
  useEffect(() => {
    noSleepRef.current = new NoSleep();

    return () => {
      if (noSleepRef.current) {
        noSleepRef.current.disable();
        noSleepRef.current = null;
      }
    };
  }, []);

  // Enable wake lock
  const enable = useCallback(async () => {
    if (!noSleepRef.current) return;

    try {
      await noSleepRef.current.enable();
      setIsActive(true);
      console.log('[WakeLock] NoSleep enabled');
    } catch (err) {
      console.warn('[WakeLock] Failed to enable NoSleep:', err);
      setIsActive(false);
    }
  }, []);

  // Disable wake lock
  const disable = useCallback(() => {
    if (!noSleepRef.current) return;

    try {
      noSleepRef.current.disable();
      setIsActive(false);
      console.log('[WakeLock] NoSleep disabled');
    } catch (err) {
      console.warn('[WakeLock] Failed to disable NoSleep:', err);
    }
  }, []);

  // Handle user interaction to enable wake lock
  // NoSleep.js requires user interaction on mobile browsers
  useEffect(() => {
    if (!enabled) return;

    const handleInteraction = async () => {
      if (hasUserInteracted.current) return;
      hasUserInteracted.current = true;

      console.log('[WakeLock] User interaction detected, enabling NoSleep');
      await enable();

      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    // Add interaction listeners
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('touchend', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });

    // Try to enable immediately (works on desktop, may fail on mobile without interaction)
    enable().catch(() => {
      console.log('[WakeLock] Waiting for user interaction to enable');
    });

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [enabled, enable]);

  // Disable when not enabled
  useEffect(() => {
    if (!enabled && isActive) {
      disable();
    }
  }, [enabled, isActive, disable]);

  // Re-enable when page becomes visible again
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && hasUserInteracted.current) {
        console.log('[WakeLock] Page visible, re-enabling NoSleep');
        await enable();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, enable]);

  return {
    isActive,
    enable,
    disable,
    isSupported: true, // NoSleep.js always provides a fallback
  };
}

export default useWakeLock;
