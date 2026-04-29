/**
 * Webinar Domain Models
 * Following patterns from ebook.model.ts and audio.model.ts
 */

// ============================================
// Shadow Host (Production Director)
// ============================================
export interface ShadowHost {
  id: string;           // UID of the coach
  email: string;        // Email for search/assignment
  name: string;         // Display name
  avatar?: string;      // Avatar URL
}

// ============================================
// Scene Participant (For Live Scene Management)
// ============================================
export type ParticipantRole = 'host' | 'speaker' | 'shadow';

export interface SceneParticipant {
  id: string;               // Participant UID
  name: string;             // Display name
  role: ParticipantRole;    // Role in the webinar
  avatar?: string;          // Avatar URL
  isOnScene: boolean;       // Currently visible in the broadcast
  isConnected: boolean;     // Currently online/connected
}

export interface SceneState {
  participants: SceneParticipant[];
  onSceneIds: string[];     // IDs of participants currently on scene
}

// ============================================
// Webinar Product (Main Product Definition)
// ============================================
export interface WebinarProduct {
  id: string;
  slug?: string;
  name: string;
  description: string;
  highlightDescription?: string;
  language: 'en' | 'es' | 'pl';

  // Pricing (PLN only, following other products pattern)
  basePrices: {
    pln: number;
  };

  // Category and tags
  category: string;
  tags: string[];

  // Host/Presenter information
  host: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  };

  // Guest speakers (optional additional coaches)
  guestSpeakers?: Array<{
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    isAdmin?: boolean; // Admin speakers can edit visuals, templates, and control features like host
  }>;

  // Shadow host (production director - has all host permissions but not on scene by default)
  shadowHost?: ShadowHost;

  // Webinar type: single session or multi-day workshop
  webinarType: 'single' | 'workshop';
  workshopDays?: number; // Number of days for workshop (2-5 typically)

  // Webinar-specific
  capacity: number; // Max 100 attendees
  duration: number; // Expected duration in minutes per session

  // Cover images (responsive)
  coverUrl?: string;
  coverUrls?: {
    thumbnail: string;  // 200px
    small: string;      // 400px
    medium: string;     // 800px
    large: string;      // 1280px
    xlarge?: string;    // 1920px
    original: string;   // Original/4K
  };
  coverPath?: string;

  // Metrics
  rating: number;
  totalReviews: number;

  // Status
  isActive: boolean;
  environment: 'test' | 'prod';
  archived: boolean;
  archivedAt?: string | Date;
  archivedBy?: string;
  archiveReason?: string;

  // Timestamps
  createdAt: string | Date;
  updatedAt?: string | Date;

  // Stripe integration
  stripe?: {
    productId?: string;
    priceIds?: {
      pln?: string;
    };
    lastSynced?: string;
  };

  // FAQs for SEO
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

// ============================================
// Webinar Session (Scheduled Instance)
// ============================================
export type WebinarSessionStatus = 'scheduled' | 'planning' | 'live' | 'stopped' | 'ended' | 'cancelled';
export type RecordingStatus = 'none' | 'recording' | 'processing' | 'available' | 'failed';
export type RecordingSegmentStatus = 'recording' | 'processing' | 'available' | 'failed';

/** Recording segment - represents a single recording clip */
export interface RecordingSegment {
  id: string;
  egressId: string;
  segmentNumber: number;
  startedAt: string | Date;
  endedAt?: string | Date;
  status: RecordingSegmentStatus;
  url?: string;
  path?: string;
  duration?: number; // seconds
  startSegmentIndex?: number; // HLS segment index when recording started
}

export interface WebinarSession {
  id: string;
  webinarId: string;
  scheduledAt: string | Date;
  endAt?: string | Date;
  status: WebinarSessionStatus;

  // Attendance
  registeredCount: number;
  attendedCount: number;
  peakAttendees?: number;

  // LiveKit room info
  livekitRoomName?: string;
  livekitRoomSid?: string; // Server-generated room ID

  // Recording - legacy single recording (for backwards compatibility)
  recordingStatus: RecordingStatus;
  recordingUrl?: string;
  recordingPath?: string;
  recordingDuration?: number; // seconds
  egressId?: string; // LiveKit egress ID (current active recording)

  // Recording segments - multiple recordings support
  recordingSegments?: RecordingSegment[];
  isRecording?: boolean; // true if currently recording

  // Environment
  environment: 'test' | 'prod';

  // Giveaway winners (persisted for reconnection)
  giveawayWinners?: Array<{
    odantzIdFirebase: string;
    name: string;
    place: 1 | 2 | 3;
    roundNumber: number;
    wonAt: string;
  }>;

  // Timestamps
  createdAt: string | Date;
  updatedAt?: string | Date;
  startedAt?: string | Date;
  endedAt?: string | Date;
}

// ============================================
// Webinar Registration (User Access)
// ============================================
export type RegistrationStatus = 'registered' | 'attended' | 'missed' | 'cancelled';

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  userName?: string;

  // Access status
  status: RegistrationStatus;
  joinedAt?: string | Date;
  leftAt?: string | Date;
  watchTime?: number; // seconds watched

  // Purchase reference
  orderId?: string;
  purchaseKey: string; // Format: "webinar:{webinarId}:{sessionId}"

  // Environment
  environment: 'test' | 'prod';

  // Timestamps
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// ============================================
// Live Features: Chat
// ============================================
export interface WebinarChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  isHost: boolean;
  isPinned: boolean;
  timestamp: string | Date;
}

// ============================================
// Live Features: Q&A
// ============================================
export type QuestionStatus = 'pending' | 'answered' | 'dismissed' | 'live';

export interface WebinarQuestion {
  id: string;
  sessionId: string;
  userId?: string; // null if anonymous
  userName?: string;
  question: string;
  isAnonymous: boolean;
  status: QuestionStatus;
  answer?: string;
  answeredAt?: string | Date;
  upvotes: number;
  upvotedBy: string[]; // user IDs
  timestamp: string | Date;
}

// ============================================
// Live Features: Polls
// ============================================
export type PollStatus = 'draft' | 'active' | 'closed';

export interface WebinarPollOption {
  text: string;
  votes: number;
}

export interface WebinarPoll {
  id: string;
  sessionId: string;
  question: string;
  options: WebinarPollOption[]; // max 10 options
  totalVotes: number;
  status: PollStatus;
  votedBy: string[]; // user IDs who voted
  showResults: boolean; // whether to show results to attendees
  createdAt: string | Date;
  closedAt?: string | Date;
}

export interface WebinarPollVote {
  id: string;
  pollId: string;
  sessionId: string;
  userId: string;
  optionIndex: number;
  timestamp: string | Date;
}

// ============================================
// Host Controls State
// ============================================
export interface WebinarHostControls {
  sessionId: string;
  isLive: boolean;
  isRecording: boolean;
  qaEnabled: boolean;
  chatEnabled: boolean;
  activePollId?: string;
  pinnedMessageId?: string;
  updatedAt: string | Date;
}

// ============================================
// Attendee State (for tracking)
// ============================================
export interface WebinarAttendee {
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isHost: boolean;
  joinedAt: string | Date;
  isConnected: boolean;
  lastSeen: string | Date;
}

// ============================================
// Active Session Tracking (Single Session per User)
// ============================================
export interface WebinarActiveSession {
  id: string;
  sessionId: string; // Webinar session ID
  userId: string;
  userEmail: string;
  deviceId: string; // Unique device/browser identifier
  deviceInfo: string; // Browser/device description
  ipAddress?: string;
  connectedAt: string | Date;
  lastHeartbeat: string | Date;
  isHost: boolean;
}

export interface SessionConflictResponse {
  hasConflict: boolean;
  existingSession?: {
    deviceInfo: string;
    connectedAt: string | Date;
    ipAddress?: string;
  };
}

export interface TakeoverSessionResponse {
  success: boolean;
  token?: string;
  roomName?: string;
  serverUrl?: string;
}

// ============================================
// Create/Update DTOs (following existing patterns)
// ============================================
export interface CreateWebinarData {
  name: string;
  description: string;
  highlightDescription?: string;
  language: 'en' | 'es' | 'pl';
  basePrices: {
    pln: number;
  };
  category: string;
  tags: string[];
  // Preferred: ID-only format (backend stores only ID)
  hostId?: string;
  // Legacy: full object format (backend extracts ID)
  host?: {
    id: string;
    name?: string;
    bio?: string;
    avatar?: string;
  };
  // Guest speakers: only id and isAdmin are stored
  guestSpeakers?: Array<{
    id: string;
    isAdmin?: boolean;
    // These fields are accepted but NOT stored
    name?: string;
    bio?: string;
    avatar?: string;
  }>;
  // Preferred: ID-only format
  shadowHostId?: string | null;
  // Legacy: full object format
  shadowHost?: ShadowHost | null;
  webinarType: 'single' | 'workshop';
  workshopDays?: number;
  capacity: number;
  duration: number;
  coverUrl?: string;
  coverUrls?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    xlarge?: string;
    original: string;
  };
  coverPath?: string;
  environment?: 'test' | 'prod';
  archived?: boolean;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface UpdateWebinarData extends Partial<CreateWebinarData> {
  isActive?: boolean;
  archived?: boolean;
  archiveReason?: string;
  rating?: number;
  totalReviews?: number;
  coverUrl?: string;
  coverPath?: string;
  shadowHost?: ShadowHost | null; // null to remove shadow host
}

export interface CreateWebinarSessionData {
  webinarId: string;
  scheduledAt: string | Date;
  endAt?: string | Date;
  environment?: 'test' | 'prod';
}

export interface UpdateWebinarSessionData {
  scheduledAt?: string | Date;
  endAt?: string | Date;
  status?: WebinarSessionStatus;
  livekitRoomName?: string;
  livekitRoomSid?: string;
  recordingStatus?: RecordingStatus;
  recordingUrl?: string;
  recordingPath?: string;
  recordingDuration?: number;
  egressId?: string;
  registeredCount?: number;
  attendedCount?: number;
  peakAttendees?: number;
  startedAt?: string | Date;
  endedAt?: string | Date;
}
