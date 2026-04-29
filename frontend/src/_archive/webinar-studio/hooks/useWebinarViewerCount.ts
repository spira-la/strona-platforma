/**
 * useWebinarViewerCount Hook
 *
 * Counts the number of viewers connected to a webinar session
 * based on LiveKit participant metadata.
 *
 * Uses the 'role' field in participant metadata to identify viewers:
 * - 'host' = main host (not counted)
 * - 'speaker' = guest speaker (not counted)
 * - 'viewer' = audience member (counted)
 *
 * Must be used inside a LiveKitRoom component.
 */

import { useMemo } from 'react';
import { useParticipants } from '@livekit/components-react';

export interface ParticipantRole {
  role: 'host' | 'speaker' | 'viewer';
}

/**
 * Parse participant metadata to get role
 */
function parseParticipantMetadata(metadata: string | undefined): ParticipantRole | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata);
    if (parsed.role && ['host', 'speaker', 'viewer'].includes(parsed.role)) {
      return { role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get participant role from metadata
 */
export function getParticipantRole(metadata: string | undefined): 'host' | 'speaker' | 'viewer' | null {
  const parsed = parseParticipantMetadata(metadata);
  return parsed?.role || null;
}

export interface WebinarViewerCountResult {
  /** Number of viewers (role === 'viewer') */
  viewerCount: number;
  /** Number of speakers (role === 'host' || role === 'speaker') */
  speakerCount: number;
  /** Total participants in the room */
  totalCount: number;
  /** List of viewer identities */
  viewerIdentities: string[];
  /** List of speaker identities */
  speakerIdentities: string[];
}

/**
 * Hook to count viewers in a webinar based on LiveKit metadata
 *
 * @example
 * ```tsx
 * function WebinarStats() {
 *   const { viewerCount, speakerCount } = useWebinarViewerCount();
 *   return <div>Viewers: {viewerCount}, Speakers: {speakerCount}</div>;
 * }
 * ```
 */
export function useWebinarViewerCount(): WebinarViewerCountResult {
  const participants = useParticipants();

  return useMemo(() => {
    const viewers: string[] = [];
    const speakers: string[] = [];

    participants.forEach((participant) => {
      const role = getParticipantRole(participant.metadata);

      if (role === 'viewer') {
        viewers.push(participant.identity);
      } else if (role === 'host' || role === 'speaker') {
        speakers.push(participant.identity);
      } else {
        // Fallback: check permissions if no metadata
        // If can't publish, assume viewer
        if (participant.permissions?.canPublish === false) {
          viewers.push(participant.identity);
        } else if (participant.permissions?.canPublish === true) {
          speakers.push(participant.identity);
        }
        // If permissions undefined, don't count (might be connecting)
      }
    });

    return {
      viewerCount: viewers.length,
      speakerCount: speakers.length,
      totalCount: participants.length,
      viewerIdentities: viewers,
      speakerIdentities: speakers,
    };
  }, [participants]);
}

export default useWebinarViewerCount;
