/**
 * Output formats supported by LiveKit egress.
 * Mirrors BeWonderMe's RecordingFormat type for compatibility.
 */
export type RecordingFormat = 'mp4' | 'ogg' | 'webm';
export type AudioCodec = 'opus' | 'aac';
export type VideoCodec = 'h264' | 'vp8' | 'vp9';

/**
 * DTO for starting a room recording.
 * Used by coaches to initiate recording of a 1-on-1 session.
 * Accepts either bookingId (1-on-1) or sessionId (webinar) or roomName.
 */
export interface StartRecordingDto {
  /** 1-on-1 booking id — derives roomName as `meeting-{bookingId}` */
  bookingId?: string;

  /** Webinar session id — derives roomName as `webinar-{sessionId}` */
  sessionId?: string;

  /** Direct room name override */
  roomName?: string;

  /** Output path relative to configured storage */
  outputPath?: string;

  /** Output format (default mp4) */
  format?: RecordingFormat;

  /** Audio codec (default aac) */
  audioCodec?: AudioCodec;

  /** Video codec (default h264) */
  videoCodec?: VideoCodec;

  /** Optional LiveKit encoding preset */
  preset?: string;
}
