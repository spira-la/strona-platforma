/**
 * BWM-compat re-export. The ported meeting kit imports `meetingClient` from
 * this path. Spirala's implementation lives in `livekit.client.ts`.
 */

export {
  livekitClient as meetingClient,
  type MeetingTokenResponse,
  type MeetingRecordingResponse,
} from './livekit.client';
