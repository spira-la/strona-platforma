/**
 * DTO for stopping a recording.
 *
 * The HLS-based recording flow needs the segment index that was captured
 * when the coach pressed "Record". The endpoint reads the current segment
 * index, then ffmpeg-concat segments [start..end] into a single MP4.
 */
export interface StopRecordingDto {
  /** Egress id returned at start (informational; the segment range is what matters) */
  egressId?: string;

  /** 1-on-1 booking id — derives roomName as `meeting-{bookingId}` */
  bookingId?: string;

  /** Webinar session id — derives roomName as `webinar-{sessionId}` */
  sessionId?: string;

  /** Direct room name override */
  roomName?: string;

  /** HLS segment index that was current when recording started */
  startSegmentIndex: number;
}
