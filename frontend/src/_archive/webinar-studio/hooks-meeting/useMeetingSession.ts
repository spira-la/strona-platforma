import { useState, useEffect, useCallback, useRef } from 'react';
import { addMinutes, isBefore, isAfter } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsClient, type Booking } from '@/clients/BookingsClient';
import { meetingClient, type MeetingTokenResponse } from '@/clients/MeetingClient';
import { coachesClient } from '@/clients/CoachesClient';
import { parseFirestoreDate } from '@/utils/dateFormat';

// Time window: can join 30 min before and 30 min after scheduled end
const JOIN_WINDOW_BEFORE_MINUTES = 30;
const JOIN_WINDOW_AFTER_END_MINUTES = 30;
// Polling interval when waiting for coach (5 seconds)
const ROOM_CHECK_INTERVAL_MS = 5000;

export interface UseMeetingSessionReturn {
  booking: Booking | null;
  token: string | null;
  serverUrl: string | null;
  isCoach: boolean;
  participantName: string;
  isLoading: boolean;
  error: string | null;
  isRecording: boolean;
  /** Whether recording is starting (HLS init + waiting for active) */
  isRecordingLoading: boolean;
  egressId: string | null;
  /** Counter that increments when client can now join (for re-triggering effects) */
  canJoinTrigger: number;
  joinMeeting: (displayName: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  /** Re-check if room is now active (for clients waiting) */
  recheckRoomStatus: () => Promise<void>;
  /** Re-run the full initialization (re-fetch booking + recheck time/room) */
  retryInit: () => void;
  /** Reset session state (called when leaving meeting) */
  resetSession: () => void;
}

export function useMeetingSession(bookingId: string | undefined): UseMeetingSessionReturn {
  const { user: currentUser } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [startSegmentIndex, setStartSegmentIndex] = useState<number | null>(null);
  const [canJoinTrigger, setCanJoinTrigger] = useState(0);
  const [initTrigger, setInitTrigger] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!bookingId || !currentUser) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch booking
        const bookingData = await bookingsClient.getBookingById(bookingId);
        if (cancelled) return;

        if (!bookingData) {
          setError('Booking not found');
          setIsLoading(false);
          return;
        }

        // Check if the booking uses livekit
        if (bookingData.communicationMethod !== 'livekit') {
          setError('This booking does not use BeWonderMe Meeting');
          setIsLoading(false);
          return;
        }

        // Verify status
        if (bookingData.status !== 'confirmed') {
          setError('This session is not confirmed');
          setIsLoading(false);
          return;
        }

        setBooking(bookingData);

        // Determine if current user is the coach (check FIRST, before time validation)
        let userIsCoach = false;
        try {
          const coachProfile = await coachesClient.getMyCoachProfile();
          if (coachProfile && coachProfile.id === bookingData.coachId) {
            userIsCoach = true;
          }
        } catch {
          // Not a coach
        }

        // Also check if user is the booking's client
        const isClient = bookingData.userId === currentUser!.id;

        if (!userIsCoach && !isClient) {
          setError('You do not have access to this meeting');
          setIsLoading(false);
          return;
        }

        if (cancelled) return;
        setIsCoach(userIsCoach);

        // Time validation - only for clients, coach can always join
        if (!userIsCoach) {
          const scheduledAt = parseFirestoreDate(bookingData.scheduledAt);
          const duration = bookingData.duration || 60;
          const scheduledEnd = addMinutes(scheduledAt, duration);
          const now = new Date();

          const canJoinFrom = addMinutes(scheduledAt, -JOIN_WINDOW_BEFORE_MINUTES);
          const canJoinUntil = addMinutes(scheduledEnd, JOIN_WINDOW_AFTER_END_MINUTES);

          // Check if within the actual scheduled session time (client can join freely)
          const isWithinSessionTime = !isBefore(now, scheduledAt) && !isAfter(now, scheduledEnd);

          // Check if completely outside the extended window
          if (isBefore(now, canJoinFrom)) {
            // Way too early - check if coach has already started
            let roomActive = false;
            try {
              roomActive = await meetingClient.checkRoomActive(bookingId);
            } catch {
              // If check fails, assume room is not active
            }

            if (!roomActive) {
              setError('TOO_EARLY');
              setIsLoading(false);
              return;
            }
            // Room is active (coach started early), allow client to join
          } else if (isAfter(now, canJoinUntil)) {
            // Way too late - session ended
            setError('SESSION_ENDED');
            setIsLoading(false);
            return;
          } else if (!isWithinSessionTime) {
            // Within extended window but outside actual session time
            // Client can only join if coach is already there
            let roomActive = false;
            try {
              roomActive = await meetingClient.checkRoomActive(bookingId);
            } catch {
              // If check fails, assume room is not active
            }

            if (!roomActive) {
              setError('TOO_EARLY');
              setIsLoading(false);
              return;
            }
            // Room is active (coach is there), allow client to join
          }
          // If within session time, client can join freely (no room check needed)
        }

        // Set default participant name
        const fullName = currentUser.user_metadata?.full_name as
          | string
          | undefined;
        const name = fullName || currentUser.email || 'Participant';
        setParticipantName(name);

        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load meeting');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, currentUser, initTrigger]);

  const joinMeeting = useCallback(async (displayName: string) => {
    if (!bookingId || !currentUser) return;

    try {
      const tokenResponse: MeetingTokenResponse = await meetingClient.getMeetingToken(
        bookingId,
        displayName,
        isCoach
      );

      setToken(tokenResponse.token);
      setServerUrl(tokenResponse.serverUrl);
      setParticipantName(displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get meeting token');
    }
  }, [bookingId, currentUser, isCoach]);

  const startRecording = useCallback(async () => {
    if (!bookingId || !isCoach) return;
    setIsRecordingLoading(true);
    try {
      const response = await meetingClient.startRecording(bookingId);
      setEgressId(response.egressId);
      setStartSegmentIndex(response.startSegmentIndex);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    } finally {
      setIsRecordingLoading(false);
    }
  }, [bookingId, isCoach]);

  const stopRecording = useCallback(async () => {
    if (!egressId || !bookingId || startSegmentIndex === null) return;
    try {
      await meetingClient.stopRecording(egressId, bookingId, startSegmentIndex);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }, [egressId, bookingId, startSegmentIndex]);

  // Re-check if room is now active (for clients waiting)
  const recheckRoomStatus = useCallback(async () => {
    if (!bookingId || isCoach || error !== 'TOO_EARLY') return;

    try {
      console.log('[MeetingSession] Polling room status for booking:', bookingId);
      const roomActive = await meetingClient.checkRoomActive(bookingId);
      if (roomActive) {
        console.log('[MeetingSession] Room is active! Transitioning to pre-join screen.');
        // Room is now active, clear error so client can proceed
        setError(null);
        setIsLoading(false);
        // Increment trigger to signal UI that client can now join
        setCanJoinTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.warn('[MeetingSession] Polling error:', err);
    }
  }, [bookingId, isCoach, error]);

  // Re-run full initialization (re-fetch booking, recheck time/room)
  const retryInit = useCallback(() => {
    console.log('[MeetingSession] Manual retry triggered');
    setInitTrigger(prev => prev + 1);
  }, []);

  // Reset session state (called when leaving meeting)
  const resetSession = useCallback(() => {
    setToken(null);
    setServerUrl(null);
    setIsRecording(false);
    setEgressId(null);
    setError('SESSION_LEFT');
  }, []);

  // Auto-poll when client is waiting (TOO_EARLY)
  useEffect(() => {
    // Only poll if error is TOO_EARLY and we're not a coach
    if (error !== 'TOO_EARLY' || isCoach || !bookingId) {
      // Clear any existing polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Start polling
    console.log('[MeetingSession] Starting room polling every', ROOM_CHECK_INTERVAL_MS, 'ms');
    pollingRef.current = setInterval(() => {
      recheckRoomStatus();
    }, ROOM_CHECK_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [error, isCoach, bookingId, recheckRoomStatus]);

  return {
    booking,
    token,
    serverUrl,
    isCoach,
    participantName,
    isLoading,
    error,
    isRecording,
    isRecordingLoading,
    egressId,
    canJoinTrigger,
    joinMeeting,
    startRecording,
    stopRecording,
    recheckRoomStatus,
    retryInit,
    resetSession,
  };
}
