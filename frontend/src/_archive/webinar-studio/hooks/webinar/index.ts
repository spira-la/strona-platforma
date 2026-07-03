// Main hook (backward compatible)
export { useWebinarSocket, default } from './useWebinarSocket';

// Sub-hooks (for advanced usage or standalone use)
export { useWebinarConnection } from './useWebinarConnection';
export { useWebinarChat } from './useWebinarChat';
export { useWebinarQA } from './useWebinarQA';
export { useWebinarPolls } from './useWebinarPolls';
export { useWebinarHostControls } from './useWebinarHostControls';
export { useWebinarScene } from './useWebinarScene';
export { useWebinarReactions } from './useWebinarReactions';
export { useStudioSceneSync } from './useStudioSceneSync';

// Types - re-export all types for convenience
export type {
  // Connection types
  WebinarConnectionStatus,
  ReactionType,
  // Event types
  WebinarEvent,
  ChatMessageReceivedEvent,
  ChatMessagePinnedEvent,
  ChatMessageDeletedEvent,
  QuestionReceivedEvent,
  QuestionAnsweredEvent,
  QuestionUpvotedEvent,
  QuestionDeletedEvent,
  PollCreatedEvent,
  PollVoteUpdateEvent,
  PollClosedEvent,
  QAStatusChangedEvent,
  ChatStatusChangedEvent,
  AttendeeCountUpdatedEvent,
  SessionStateEvent,
  SessionPausedEvent,
  ReactionReceivedEvent,
  ReactionsStatusChangedEvent,
  SceneTemplateChangedEvent,
  OverlayVisibilityChangedEvent,
  BackgroundChangedEvent,
  CameraScaleChangedEvent,
  CameraSlotStylesUpdatedEvent,
  CornerImagesUpdatedEvent,
  TextBannerShownEvent,
  SpeakerDisplayNamesUpdatedEvent,
  SpeakerNameStyleUpdatedEvent,
  SceneStateUpdatedEvent,
  SceneParticipantsUpdatedEvent,
  // Data types
  CameraSlotStyle,
  CornerImage,
  TextBanner,
  SpeakerNameStyle,
  SceneState,
  // Giveaway types
  GiveawayWinner,
  GiveawayRound,
  GiveawayWinnerSelectedEvent,
  GiveawayNewRoundEvent,
  WebinarAttendee,
  // Event handlers
  WebinarEventHandlers,
  // Main hook types
  WebinarSocketOptions,
  WebinarSocketReturn,
  // Sub-hook types
  UseWebinarConnectionOptions,
  UseWebinarConnectionReturn,
  UseWebinarChatOptions,
  UseWebinarChatReturn,
  UseWebinarQAOptions,
  UseWebinarQAReturn,
  UseWebinarPollsOptions,
  UseWebinarPollsReturn,
  UseWebinarHostControlsOptions,
  UseWebinarHostControlsReturn,
  UseWebinarSceneOptions,
  UseWebinarSceneReturn,
  UseWebinarReactionsOptions,
  UseWebinarReactionsReturn,
  // Studio scene sync types
  UseStudioSceneSyncOptions,
  UseStudioSceneSyncReturn,
  StudioSceneSyncState,
  StudioSceneSyncSetters,
  StudioSceneSyncHandlers,
  FullSceneSyncState,
  // Domain types
  WebinarChatMessage,
  WebinarQuestion,
  WebinarPoll,
  SceneParticipant,
} from './types/webinar-socket.types';
