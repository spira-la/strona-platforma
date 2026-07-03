/**
 * useStudioSessionControls Hook
 *
 * Manages session lifecycle controls for WebinarStudio.
 * Handles:
 * - Start planning mode (green room)
 * - Cancel planning
 * - Start session (go live)
 * - Stop broadcast
 * - End session
 * - Restart to planning/live
 * - Recording controls (multi-segment support)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { webinarLiveClient } from '@/clients/WebinarLiveClient';
import type { RecordingSegment } from '@/domain/products/models/webinar.model';
import type {
  UseStudioSessionControlsOptions,
  UseStudioSessionControlsReturn,
} from './types/studio.types';

export function useStudioSessionControls(options: UseStudioSessionControlsOptions): UseStudioSessionControlsReturn {
  const {
    sessionId,
    session,
    setSession,
    clearToken,
    navigate,
    t,
    setError,
  } = options;

  // Recording state - multi-segment support
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingSegments, setRecordingSegments] = useState<RecordingSegment[]>([]);
  const [currentSegmentNumber, setCurrentSegmentNumber] = useState(0);
  const [startSegmentIndex, setStartSegmentIndex] = useState<number | null>(null);

  // Local stream ref for cleanup (used in leave handler)
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize recording state from session data
  useEffect(() => {
    if (session) {
      setRecordingSegments(session.recordingSegments || []);
      setCurrentSegmentNumber(session.recordingSegments?.length || 0);
      setIsRecording(session.isRecording || false);
      setEgressId(session.egressId || null);
    }
  }, [session?.id]); // Only re-run when session ID changes

  // Start planning mode (green room for speakers)
  const handleStartPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error starting planning:', err);
      setError(t('webinars.error.planningFailed', 'Failed to start planning mode'));
    }
  }, [sessionId, setSession, setError, t]);

  // Cancel planning and go back to scheduled
  const handleCancelPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Disconnect from LiveKit
      await webinarLiveClient.disconnectSession(sessionId);
      clearToken();

      // Update status to scheduled
      await webinarSessionsClient.updateSessionStatus(sessionId, 'scheduled');
      setSession((prev) => (prev ? { ...prev, status: 'scheduled' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error canceling planning:', err);
      setError(t('webinars.error.cancelPlanningFailed', 'Failed to cancel planning'));
    }
  }, [sessionId, clearToken, setSession, setError, t]);

  // Start session (go live)
  const handleStartSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'live');
      setSession((prev) => (prev ? { ...prev, status: 'live' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error starting session:', err);
      setError(t('webinars.error.startFailed', 'Failed to start session'));
    }
  }, [sessionId, setSession, setError, t]);

  // Stop broadcast (go to planning state, can restart)
  const handleStopBroadcast = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Stop recording if active
      if (isRecording && egressId && startSegmentIndex !== null) {
        await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);
        setIsRecording(false);
        setEgressId(null);
        setStartSegmentIndex(null);
      }

      // Change status to planning (green room) - keeps LiveKit connected for hosts
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error stopping broadcast:', err);
      setError(t('webinars.error.stopBroadcastFailed', 'Failed to stop broadcast'));
    }
  }, [sessionId, isRecording, egressId, startSegmentIndex, setSession, setError, t]);

  // Restart from stopped to planning
  const handleRestartToPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error restarting to planning:', err);
      setError(t('webinars.error.restartFailed', 'Failed to restart session'));
    }
  }, [sessionId, setSession, setError, t]);

  // Restart from stopped to live
  const handleRestartToLive = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'live');
      setSession((prev) => (prev ? { ...prev, status: 'live' } : null));
    } catch (err) {
      console.error('[useStudioSessionControls] Error restarting to live:', err);
      setError(t('webinars.error.restartFailed', 'Failed to restart session'));
    }
  }, [sessionId, setSession, setError, t]);

  // Complete/End session (permanent)
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Stop recording if active
      if (isRecording && egressId && startSegmentIndex !== null) {
        await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);
      }

      await webinarSessionsClient.updateSessionStatus(sessionId, 'ended');
      navigate('/coach/webinars');
    } catch (err) {
      console.error('[useStudioSessionControls] Error ending session:', err);
      setError(t('webinars.error.endFailed', 'Failed to end session'));
    }
  }, [sessionId, isRecording, egressId, startSegmentIndex, navigate, setError, t]);

  // Recording controls - multi-segment support (HLS-based)
  const handleStartRecording = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await webinarLiveClient.startRecording(sessionId);
      const newEgressId = response.egressId;
      const segmentNumber = currentSegmentNumber + 1;
      const segmentId = `seg-${Date.now()}-${segmentNumber}`;

      // Store the HLS segment index for later concatenation
      setStartSegmentIndex(response.startSegmentIndex);

      // Create new segment
      const newSegment: RecordingSegment = {
        id: segmentId,
        egressId: newEgressId,
        segmentNumber,
        startedAt: new Date().toISOString(),
        status: 'recording',
        startSegmentIndex: response.startSegmentIndex,
      };

      // Update local state
      const updatedSegments = [...recordingSegments, newSegment];
      setRecordingSegments(updatedSegments);
      setCurrentSegmentNumber(segmentNumber);
      setEgressId(newEgressId);
      setIsRecording(true);

      // Persist to Firestore
      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: updatedSegments,
        isRecording: true,
        egressId: newEgressId,
        recordingStatus: 'recording',
      });

      // Update session state
      setSession((prev) => prev ? {
        ...prev,
        recordingSegments: updatedSegments,
        isRecording: true,
        egressId: newEgressId,
        recordingStatus: 'recording',
      } : null);
    } catch (err) {
      console.error('[useStudioSessionControls] Error starting recording:', err);
      setError(t('webinars.error.recordingFailed', 'Failed to start recording'));
    }
  }, [sessionId, currentSegmentNumber, recordingSegments, setSession, setError, t]);

  const handleStopRecording = useCallback(async () => {
    if (!sessionId || !egressId || startSegmentIndex === null) return;
    try {
      // Stop recording — backend concatenates HLS segments and uploads to GCS
      const response = await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);

      // Update segment directly to 'available' (no 'processing' step needed with HLS concat)
      const updatedSegments = recordingSegments.map(seg =>
        seg.egressId === egressId
          ? {
              ...seg,
              status: 'available' as const,
              endedAt: new Date().toISOString(),
              url: response.url,
              path: response.path,
              duration: response.duration,
            }
          : seg
      );

      // Update local state
      setRecordingSegments(updatedSegments);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);

      // Persist to Firestore
      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'available',
      });

      // Update session state
      setSession((prev) => prev ? {
        ...prev,
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'available',
      } : null);
    } catch (err) {
      console.error('[useStudioSessionControls] Error stopping recording:', err);

      // Mark segment as failed on error
      const failedSegments = recordingSegments.map(seg =>
        seg.egressId === egressId
          ? { ...seg, status: 'failed' as const, endedAt: new Date().toISOString() }
          : seg
      );
      setRecordingSegments(failedSegments);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);

      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: failedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'failed',
      });

      setError(t('webinars.error.recordingStopFailed', 'Failed to stop recording'));
    }
  }, [sessionId, egressId, startSegmentIndex, recordingSegments, setSession, setError, t]);

  // Leave studio without ending session
  const handleLeaveWithoutEnding = useCallback(() => {
    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/coach/webinars');
  }, [navigate]);

  return {
    handleStartPlanning,
    handleCancelPlanning,
    handleStartSession,
    handleStopBroadcast,
    handleEndSession,
    handleRestartToPlanning,
    handleRestartToLive,
    handleStartRecording,
    handleStopRecording,
    handleLeaveWithoutEnding,
    isRecording,
    egressId,
    recordingSegments,
    currentSegmentNumber,
    startSegmentIndex,
  };
}

export default useStudioSessionControls;
