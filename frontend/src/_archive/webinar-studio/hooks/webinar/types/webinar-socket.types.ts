import type { Socket } from 'socket.io-client';
import type {
  WebinarChatMessage,
  WebinarQuestion,
  WebinarPoll,
  SceneParticipant,
} from '@/domain/products/models/webinar.model';

// ============================================
// Connection Types
// ============================================
export type WebinarConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// ============================================
// Reaction Types
// ============================================
export type ReactionType = 'heart' | 'fire' | 'clap' | 'laugh' | 'wow' | 'thumbsup';

// ============================================
// Attendee Types (for giveaway/raffle feature)
// ============================================
export interface WebinarAttendee {
  odantzId: string; // Unique ID for the attendee
  odantzIdFirebase?: string; // Firebase user ID (if logged in)
  name: string;
  email?: string; // Email for contacting winners
  avatar?: string;
  joinedAt: number;
}

// ============================================
// Giveaway Types
// ============================================
export interface GiveawayWinner {
  odantzId: string;
  odantzIdFirebase?: string;
  name: string;
  email?: string;
  avatar?: string;
  place: 1 | 2 | 3;
  isTestPick?: boolean;
}

export interface GiveawayRound {
  id: string;
  roundNumber: number;
  winners: GiveawayWinner[];
  createdAt: Date;
  webinarId?: string;
  sessionId?: string;
}

// ============================================
// Event Types (matching backend events)
// ============================================
export interface ChatMessageReceivedEvent {
  type: 'chat_message_received';
  message: WebinarChatMessage;
}

export interface ChatMessagePinnedEvent {
  type: 'chat_message_pinned';
  messageId: string;
  pinned: boolean;
}

export interface ChatMessageDeletedEvent {
  type: 'chat_message_deleted';
  messageId: string;
}

export interface QuestionReceivedEvent {
  type: 'question_received';
  question: WebinarQuestion;
}

export interface QuestionAnsweredEvent {
  type: 'question_answered';
  question: WebinarQuestion;
}

export interface QuestionUpvotedEvent {
  type: 'question_upvoted';
  questionId: string;
  upvotes: number;
  upvotedBy: string[];
}

export interface QuestionDeletedEvent {
  type: 'question_deleted';
  questionId: string;
}

export interface PollCreatedEvent {
  type: 'poll_created';
  poll: WebinarPoll;
}

export interface PollVoteUpdateEvent {
  type: 'poll_vote_update';
  pollId: string;
  votes: number[];
}

export interface PollClosedEvent {
  type: 'poll_closed';
  pollId: string;
}

export interface QAStatusChangedEvent {
  type: 'qa_status_changed';
  enabled: boolean;
}

export interface ChatStatusChangedEvent {
  type: 'chat_status_changed';
  enabled: boolean;
}

export interface AttendeeCountUpdatedEvent {
  type: 'attendee_count_updated';
  count: number;
}

export interface AttendeeListUpdatedEvent {
  type: 'attendee_list_updated';
  attendees: WebinarAttendee[];
}

export interface SessionStateEvent {
  type: 'session_state';
  qaEnabled?: boolean;
  chatEnabled?: boolean;
  reactionsEnabled?: boolean;
  isPaused?: boolean;
  attendeeCount?: number;
  isHost?: boolean;
  isShadow?: boolean;
  sceneParticipants?: SceneParticipant[];
  onSceneIds?: string[];
}

export interface SessionPausedEvent {
  type: 'session_paused';
  isPaused: boolean;
}

export interface ReactionReceivedEvent {
  type: 'reaction_received';
  reactionType: ReactionType;
  userId: string;
  userName?: string;
}

export interface ReactionsStatusChangedEvent {
  type: 'reactions_status_changed';
  enabled: boolean;
}

export interface SceneTemplateChangedEvent {
  type: 'scene_template_changed';
  templateId: string;
  overlayVisibility?: Record<string, boolean>;
}

export interface OverlayVisibilityChangedEvent {
  type: 'overlay_visibility_changed';
  overlayId: string;
  isVisible: boolean;
}

export interface BackgroundChangedEvent {
  type: 'background_changed';
  background: { type: string; value: string };
}

export interface CameraScaleChangedEvent {
  type: 'camera_scale_changed';
  cameraScale: number;
}

export interface CameraSlotStyle {
  slotId: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface CameraSlotStylesUpdatedEvent {
  type: 'camera_slot_styles_updated';
  cameraSlotStyles: CameraSlotStyle[];
}

export interface CornerImage {
  id: string;
  name: string;
  url: string;
  corner: string;
  isVisible: boolean;
  width: number;
  height: number;
}

export interface CornerImagesUpdatedEvent {
  type: 'corner_images_updated';
  cornerImages: CornerImage[];
}

export interface TextBanner {
  id: string;
  text: string;
  position: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: string;
  animationIn: string;
  animationOut: string;
  duration: number;
  isVisible: boolean;
  padding: number;
  borderRadius: number;
}

export interface TextBannerShownEvent {
  type: 'text_banner_shown';
  banner: TextBanner | null;
}

export interface SpeakerDisplayNamesUpdatedEvent {
  type: 'speaker_display_names_updated';
  speakerDisplayNames: Record<string, string>;
}

export interface SpeakerNameStyle {
  showNames: boolean;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: string;
  padding: number;
  borderRadius: number;
}

export interface SpeakerNameStyleUpdatedEvent {
  type: 'speaker_name_style_updated';
  speakerNameStyle: SpeakerNameStyle;
}

export interface SceneState {
  templateId?: string;
  background?: { type: string; value: string };
  cameraScale?: number;
  cameraSlotStyles?: CameraSlotStyle[];
  overlayVisibility?: Record<string, boolean>;
  cornerImages?: CornerImage[];
  activeTextBanner?: TextBanner | null;
  speakerDisplayNames?: Record<string, string>;
  speakerNameStyle?: SpeakerNameStyle;
}

export interface SceneStateUpdatedEvent {
  type: 'scene_state_updated';
  sceneState: SceneState;
}

export interface SceneParticipantsUpdatedEvent {
  type: 'scene_participants_updated';
  participants: SceneParticipant[];
  onSceneIds: string[];
}

export interface SessionStatusChangedEvent {
  type: 'session_status_changed';
  status: string;
  previousStatus: string;
}

// ============================================
// Giveaway Events
// ============================================
export interface GiveawayWinnerSelectedEvent {
  type: 'giveaway_winner_selected';
  winner: GiveawayWinner;
  currentWinners: GiveawayWinner[];
}

export interface GiveawayNewRoundEvent {
  type: 'giveaway_new_round';
  rounds: GiveawayRound[];
  currentWinners: GiveawayWinner[];
}

export interface GiveawayRoundDeletedEvent {
  type: 'giveaway_round_deleted';
  deletedRoundId: string;
  rounds: GiveawayRound[];
  allTimeWinnerIds: string[];
}

export interface GiveawaySelectionStartedEvent {
  type: 'giveaway_selection_started';
}

// Union type of all events
export type WebinarEvent =
  | ChatMessageReceivedEvent
  | ChatMessagePinnedEvent
  | ChatMessageDeletedEvent
  | QuestionReceivedEvent
  | QuestionAnsweredEvent
  | QuestionUpvotedEvent
  | QuestionDeletedEvent
  | PollCreatedEvent
  | PollVoteUpdateEvent
  | PollClosedEvent
  | QAStatusChangedEvent
  | ChatStatusChangedEvent
  | AttendeeCountUpdatedEvent
  | AttendeeListUpdatedEvent
  | SessionStateEvent
  | SessionPausedEvent
  | ReactionReceivedEvent
  | ReactionsStatusChangedEvent
  | SceneTemplateChangedEvent
  | OverlayVisibilityChangedEvent
  | BackgroundChangedEvent
  | CameraScaleChangedEvent
  | CameraSlotStylesUpdatedEvent
  | CornerImagesUpdatedEvent
  | TextBannerShownEvent
  | SpeakerDisplayNamesUpdatedEvent
  | SpeakerNameStyleUpdatedEvent
  | SceneStateUpdatedEvent
  | SceneParticipantsUpdatedEvent
  | SessionStatusChangedEvent
  | GiveawayWinnerSelectedEvent
  | GiveawayNewRoundEvent
  | GiveawayRoundDeletedEvent
  | GiveawaySelectionStartedEvent;

// ============================================
// Event Handlers Interface (consolidated callbacks)
// ============================================
export interface WebinarEventHandlers {
  // Chat callbacks
  onChatMessage?: (message: WebinarChatMessage) => void;
  onChatMessagePinned?: (messageId: string, pinned: boolean) => void;
  onChatMessageDeleted?: (messageId: string) => void;
  // Q&A callbacks
  onQuestionReceived?: (question: WebinarQuestion) => void;
  onQuestionAnswered?: (question: WebinarQuestion) => void;
  onQuestionUpvoted?: (questionId: string, upvotes: number, upvotedBy: string[]) => void;
  onQuestionDeleted?: (questionId: string) => void;
  // Poll callbacks
  onPollCreated?: (poll: WebinarPoll) => void;
  onPollVoteUpdate?: (pollId: string, votes: number[]) => void;
  onPollClosed?: (pollId: string) => void;
  // Control callbacks
  onQAStatusChanged?: (enabled: boolean) => void;
  onChatStatusChanged?: (enabled: boolean) => void;
  onAttendeeCountUpdated?: (count: number) => void;
  onAttendeeListUpdated?: (attendees: WebinarAttendee[]) => void;
  onSessionPaused?: (isPaused: boolean) => void;
  onSessionStatusChanged?: (status: string, previousStatus: string) => void;
  // Reaction callbacks
  onReactionReceived?: (reactionType: ReactionType, userId: string, userName?: string) => void;
  onReactionsStatusChanged?: (enabled: boolean) => void;
  // Scene template callbacks
  onSceneTemplateChanged?: (templateId: string, overlayVisibility?: Record<string, boolean>) => void;
  onOverlayVisibilityChanged?: (overlayId: string, isVisible: boolean) => void;
  // Scene state callbacks
  onBackgroundChanged?: (background: { type: string; value: string }) => void;
  onCameraScaleChanged?: (cameraScale: number) => void;
  onCameraSlotStylesUpdated?: (styles: CameraSlotStyle[]) => void;
  onCornerImagesUpdated?: (cornerImages: CornerImage[]) => void;
  onTextBannerShown?: (banner: TextBanner | null) => void;
  onSpeakerDisplayNamesUpdated?: (speakerDisplayNames: Record<string, string>) => void;
  onSpeakerNameStyleUpdated?: (speakerNameStyle: SpeakerNameStyle) => void;
  onSceneStateUpdated?: (sceneState: SceneState) => void;
  onSceneSyncRequested?: (requesterId: string) => void;
  // Scene participants callbacks
  onSceneParticipantsUpdated?: (participants: SceneParticipant[], onSceneIds: string[]) => void;
  // Session state callback (for internal state updates)
  onSessionState?: (event: SessionStateEvent) => void;
  // Connection callbacks
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  // Session kicked callback (real-time notification when kicked by another device)
  onSessionKicked?: (reason: string, newDeviceInfo?: string) => void;
  // Giveaway callbacks
  onGiveawayWinnerSelected?: (winner: GiveawayWinner, currentWinners: GiveawayWinner[]) => void;
  onGiveawayNewRound?: (rounds: GiveawayRound[], currentWinners: GiveawayWinner[]) => void;
  onGiveawayRoundDeleted?: (deletedRoundId: string, rounds: GiveawayRound[]) => void;
  onGiveawaySelectionStarted?: () => void;
  // Generic event callback
  onAnyEvent?: (event: WebinarEvent) => void;
  onMissedEvents?: (events: WebinarEvent[]) => void;
}

// ============================================
// Hook Options Interface
// ============================================
export interface WebinarSocketOptions extends WebinarEventHandlers {
  sessionId: string;
  enabled?: boolean;
  isHost?: boolean;
  isShadow?: boolean;
  isSpeaker?: boolean;
  isAdminSpeaker?: boolean;
  /** Optional custom socket URL (for internal recording context) */
  socketUrl?: string;
  /** Optional user ID override (for recording bot without Firebase auth) */
  overrideUserId?: string;
  /** Optional user name override (for recording bot without Firebase auth) */
  overrideUserName?: string;
  /** Client type to distinguish connections from same user on different interfaces */
  clientType?: 'studio' | 'control-panel' | 'viewer' | 'recording';
}

// ============================================
// Hook Return Interface
// ============================================
export interface WebinarSocketReturn {
  // State
  isConnected: boolean;
  connectionStatus: WebinarConnectionStatus;
  error: Error | null;
  attendeeCount: number;
  qaEnabled: boolean;
  chatEnabled: boolean;
  isPaused: boolean;
  reconnectAttempts: number;
  lastEvent: WebinarEvent | null;

  // Chat actions
  sendChatMessage: (message: string, displayName?: string) => void;
  pinMessage: (messageId: string, pinned: boolean) => void;
  deleteChatMessage: (messageId: string) => void;

  // Q&A actions
  submitQuestion: (question: string, anonymous: boolean, displayName?: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  upvoteQuestion: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;

  // Poll actions
  createPoll: (question: string, options: string[]) => void;
  submitVote: (pollId: string, optionIndex: number) => void;
  closePoll: (pollId: string) => void;

  // Draft poll actions
  createDraftPoll: (question: string, options: string[]) => Promise<WebinarPoll | null>;
  getDraftPolls: () => Promise<WebinarPoll[]>;
  launchPoll: (pollId: string) => void;
  deleteDraftPoll: (pollId: string) => Promise<boolean>;

  // Host controls
  toggleQA: (enabled: boolean) => void;
  toggleChat: (enabled: boolean) => void;
  togglePause: (isPaused: boolean) => void;
  toggleReactions: (enabled: boolean) => void;

  // Attendee list (for giveaway/raffle)
  attendeeList: WebinarAttendee[];
  getAttendeeList: () => Promise<WebinarAttendee[]>;
  updateDisplayName: (displayName: string) => void;

  // Giveaway state and methods
  currentGiveawayWinners: GiveawayWinner[];
  giveawayRounds: GiveawayRound[];
  selectGiveawayWinner: (winner: {
    odantzId: string;
    odantzIdFirebase?: string;
    name: string;
    email?: string;
    avatar?: string;
    place: 1 | 2 | 3;
  }) => Promise<{ success: boolean; currentWinners?: GiveawayWinner[]; error?: string } | null>;
  startNewGiveawayRound: (webinarId: string) => Promise<{ success: boolean; rounds?: GiveawayRound[]; currentWinners?: GiveawayWinner[]; error?: string } | null>;
  getGiveawayState: () => Promise<{ success: boolean; currentWinners?: GiveawayWinner[]; rounds?: GiveawayRound[]; allTimeWinnerIds?: string[]; error?: string } | null>;
  getEligibleAttendees: () => Promise<{ success: boolean; attendees?: WebinarAttendee[]; totalAttendees?: number; excludedCount?: number; error?: string } | null>;
  deleteGiveawayRound: (roundId: string) => Promise<{ success: boolean; rounds?: GiveawayRound[]; error?: string } | null>;

  // Reaction actions
  sendReaction: (reactionType: ReactionType) => void;
  reactionsEnabled: boolean;

  // Scene template actions
  changeSceneTemplate: (templateId: string, overlayVisibility?: Record<string, boolean>) => void;
  changeOverlayVisibility: (overlayId: string, isVisible: boolean) => void;
  currentTemplateId: string | null;

  // Scene state sync actions
  broadcastBackground: (background: { type: string; value: string }) => void;
  broadcastCameraScale: (cameraScale: number) => void;
  broadcastCameraSlotStyles: (styles: CameraSlotStyle[]) => void;
  broadcastCornerImages: (cornerImages: CornerImage[]) => void;
  broadcastTextBanner: (banner: TextBanner | null) => void;
  broadcastSpeakerDisplayNames: (names: Record<string, string>) => void;
  broadcastSpeakerNameStyle: (style: SpeakerNameStyle) => void;
  broadcastFullSceneState: (sceneState: SceneState) => void;
  sendSceneStateToClient: (targetClientId: string, sceneState: SceneState) => void;
  requestSceneState: () => void;

  // Scene participant management
  sceneParticipants: SceneParticipant[];
  // undefined = show ALL participants (feature not active), array = only show listed participants
  onSceneIds: string[] | undefined;
  addToScene: (userId: string) => void;
  removeFromScene: (userId: string) => void;
  getSceneParticipants: () => Promise<{ participants: SceneParticipant[]; onSceneIds: string[] } | null>;

  // Connection management
  connect: () => void;
  disconnect: () => void;
  forceReconnect: () => void;
  requestMissedEvents: (sinceTimestamp?: number) => void;
  ping: () => Promise<number | null>;

  // Socket reference
  socket: Socket | null;
}

// ============================================
// Sub-hook Types
// ============================================

// Connection hook types
export interface UseWebinarConnectionOptions {
  sessionId: string;
  enabled: boolean;
  isHost: boolean;
  isShadow: boolean;
  isSpeaker: boolean;
  isAdminSpeaker: boolean;
  eventHandlers: React.MutableRefObject<WebinarEventHandlers>;
  /** Optional custom socket URL (for internal recording context) */
  socketUrl?: string;
  /** Optional user ID override (for recording bot without Firebase auth) */
  overrideUserId?: string;
  /** Optional user name override (for recording bot without Firebase auth) */
  overrideUserName?: string;
  /** Client type to distinguish connections from same user on different interfaces */
  clientType?: 'studio' | 'control-panel' | 'viewer' | 'recording';
}

export interface UseWebinarConnectionReturn {
  socketRef: React.MutableRefObject<Socket | null>;
  connectionStatus: WebinarConnectionStatus;
  isConnected: boolean;
  error: Error | null;
  reconnectAttempts: number;
  lastEvent: WebinarEvent | null;
  connect: () => void;
  disconnect: () => void;
  forceReconnect: () => void;
  requestMissedEvents: (sinceTimestamp?: number) => void;
  ping: () => Promise<number | null>;
}

// Chat hook types
export interface UseWebinarChatOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
}

export interface UseWebinarChatReturn {
  sendChatMessage: (message: string, displayName?: string) => void;
  pinMessage: (messageId: string, pinned: boolean) => void;
  deleteChatMessage: (messageId: string) => void;
}

// Q&A hook types
export interface UseWebinarQAOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
}

export interface UseWebinarQAReturn {
  submitQuestion: (question: string, anonymous: boolean, displayName?: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  upvoteQuestion: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;
}

// Polls hook types
export interface UseWebinarPollsOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
}

export interface UseWebinarPollsReturn {
  createPoll: (question: string, options: string[]) => void;
  submitVote: (pollId: string, optionIndex: number) => void;
  closePoll: (pollId: string) => void;
  createDraftPoll: (question: string, options: string[]) => Promise<WebinarPoll | null>;
  getDraftPolls: () => Promise<WebinarPoll[]>;
  launchPoll: (pollId: string) => void;
  deleteDraftPoll: (pollId: string) => Promise<boolean>;
}

// Host controls hook types
export interface UseWebinarHostControlsOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
}

export interface UseWebinarHostControlsReturn {
  toggleQA: (enabled: boolean) => void;
  toggleChat: (enabled: boolean) => void;
  togglePause: (isPaused: boolean) => void;
  toggleReactions: (enabled: boolean) => void;
}

// Scene hook types
export interface UseWebinarSceneOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
  initialParticipants?: SceneParticipant[];
  initialOnSceneIds?: string[];
}

export interface UseWebinarSceneReturn {
  // Template
  changeSceneTemplate: (templateId: string, overlayVisibility?: Record<string, boolean>) => void;
  changeOverlayVisibility: (overlayId: string, isVisible: boolean) => void;
  currentTemplateId: string | null;
  setCurrentTemplateId: (id: string | null) => void;

  // Broadcast
  broadcastBackground: (background: { type: string; value: string }) => void;
  broadcastCameraScale: (cameraScale: number) => void;
  broadcastCameraSlotStyles: (styles: CameraSlotStyle[]) => void;
  broadcastCornerImages: (cornerImages: CornerImage[]) => void;
  broadcastTextBanner: (banner: TextBanner | null) => void;
  broadcastSpeakerDisplayNames: (names: Record<string, string>) => void;
  broadcastSpeakerNameStyle: (style: SpeakerNameStyle) => void;
  broadcastFullSceneState: (sceneState: SceneState) => void;
  sendSceneStateToClient: (targetClientId: string, sceneState: SceneState) => void;
  requestSceneState: () => void;

  // Participants
  sceneParticipants: SceneParticipant[];
  onSceneIds: string[];
  setSceneParticipants: (participants: SceneParticipant[]) => void;
  setOnSceneIds: (ids: string[]) => void;
  addToScene: (userId: string) => void;
  removeFromScene: (userId: string) => void;
  getSceneParticipants: () => Promise<{ participants: SceneParticipant[]; onSceneIds: string[] } | null>;
}

// Reactions hook types
export interface UseWebinarReactionsOptions {
  socketRef: React.MutableRefObject<Socket | null>;
  sessionId: string;
  reactionsEnabled: boolean;
}

export interface UseWebinarReactionsReturn {
  sendReaction: (reactionType: ReactionType) => void;
}

// ============================================
// Studio Scene Sync Types (useStudioSceneSync)
// ============================================

/** Options for the useStudioSceneSync hook */
export interface UseStudioSceneSyncOptions {
  /** Called when a remote scene sync includes a templateId change */
  onTemplateChange: (templateId: string) => void;
  /** Called when a remote scene sync includes overlay visibility changes */
  onOverlayVisibilityChange: (overlayId: string, isVisible: boolean) => void;
  /** Initial speaker display names (e.g. from localStorage) */
  initialSpeakerDisplayNames?: Record<string, string>;
  /** Initial background */
  initialBackground?: { type: 'color' | 'image'; value: string };
  /** Initial camera scale */
  initialCameraScale?: number;
  /** Initial speaker name style */
  initialSpeakerNameStyle?: SpeakerNameStyle;
}

/** The scene state owned by the studio */
export interface StudioSceneSyncState {
  background: { type: 'color' | 'image'; value: string };
  cameraScale: number;
  cameraSlotStyles: CameraSlotStyle[];
  cornerImages: CornerImage[];
  activeTextBanner: TextBanner | null;
  speakerDisplayNames: Record<string, string>;
  speakerNameStyle: SpeakerNameStyle;
  textBanners: TextBanner[];
}

/** Setters exposed by the hook for local editing */
export interface StudioSceneSyncSetters {
  setBackground: (bg: { type: 'color' | 'image'; value: string }) => void;
  setCameraScale: (scale: number) => void;
  setCameraSlotStyles: React.Dispatch<React.SetStateAction<CameraSlotStyle[]>>;
  setCornerImages: React.Dispatch<React.SetStateAction<CornerImage[]>>;
  setActiveTextBanner: (banner: TextBanner | null) => void;
  setSpeakerDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSpeakerNameStyle: React.Dispatch<React.SetStateAction<SpeakerNameStyle>>;
  setTextBanners: React.Dispatch<React.SetStateAction<TextBanner[]>>;
}

/** Extended scene state used for full sync (includes config tracking fields) */
export type FullSceneSyncState = SceneState & {
  currentConfigId?: string | null;
  textBanners?: TextBanner[];
};

/** Handlers for remote events (pass to useWebinarSocket callbacks) */
export interface StudioSceneSyncHandlers {
  handleBackgroundChanged: (background: { type: string; value: string }) => void;
  handleCameraScaleChanged: (cameraScale: number) => void;
  handleCameraSlotStylesUpdated: (styles: CameraSlotStyle[]) => void;
  handleCornerImagesUpdated: (cornerImages: CornerImage[]) => void;
  handleTextBannerShown: (banner: TextBanner | null) => void;
  handleSpeakerDisplayNamesUpdated: (names: Record<string, string>) => void;
  handleSpeakerNameStyleUpdated: (style: SpeakerNameStyle) => void;
  handleOverlayVisibilityChanged: (overlayId: string, isVisible: boolean) => void;
  handleSceneTemplateChanged: (templateId: string, overlayVisibility?: Record<string, boolean>) => void;
  handleFullSceneSync: (sceneState: FullSceneSyncState) => void;
  /** Returns current scene state snapshot (uses internal ref, never stale) */
  getSceneStateSnapshot: () => FullSceneSyncState;
  /** Update snapshot with external values not owned by this hook (templateId, overlayVisibility, currentConfigId) */
  updateSnapshotExtras: (extras: {
    templateId?: string;
    overlayVisibility?: Record<string, boolean>;
    currentConfigId?: string | null;
  }) => void;
  /** Ref for WebinarStudio to set a callback for config-related extras during full sync */
  onFullSceneSyncExtrasRef: React.MutableRefObject<((sceneState: FullSceneSyncState) => void) | null>;
}

/** Return type of useStudioSceneSync */
export type UseStudioSceneSyncReturn = [StudioSceneSyncState, StudioSceneSyncSetters, StudioSceneSyncHandlers];

// Re-export domain types for convenience
export type { WebinarChatMessage, WebinarQuestion, WebinarPoll, SceneParticipant };
