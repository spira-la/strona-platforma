import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoTrack, AudioTrack, useTracks, useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoOff, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CameraSlotStyle, SpeakerNameStyle } from '@/components/webinar/SceneControls';
import type { MeetingSceneState } from '@/hooks/meeting/useMeetingSceneSync';

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

interface MeetingGridProps {
  className?: string;
  layout?: MeetingSceneState['layout'];
  cameraScale?: number;
  cameraSlotStyles?: CameraSlotStyle[];
  speakerNameStyle?: SpeakerNameStyle;
}

export function MeetingGrid({
  className,
  layout = 'side-by-side',
  cameraScale = 1,
  cameraSlotStyles = [],
  speakerNameStyle,
}: MeetingGridProps) {
  const { t } = useTranslation();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMobile = useIsMobile();

  const cameraTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  // Get unique participant tracks (one per participant for camera)
  const participantCameraTracks = useMemo(() => {
    const seen = new Set<string>();
    return cameraTracks.filter((track) => {
      if (track.source !== Track.Source.Camera) return false;
      const id = track.participant.identity;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [cameraTracks]);

  const hasScreenShare = screenShareTracks.length > 0;
  const participantCount = participantCameraTracks.length;

  // Identify local (coach) and remote (client) tracks
  const { localTrack, remoteTracks } = useMemo(() => {
    const local = participantCameraTracks.find(t => t.participant.sid === localParticipant?.sid);
    const remote = participantCameraTracks.filter(t => t.participant.sid !== localParticipant?.sid);
    return { localTrack: local, remoteTracks: remote };
  }, [participantCameraTracks, localParticipant]);

  // Get border color for a participant
  const getBorderStyle = useCallback((isLocal: boolean) => {
    const slotId = isLocal ? 'coach' : 'client';
    const style = cameraSlotStyles.find(s => s.slotId === slotId);
    if (!style?.borderColor || style.borderColor === 'transparent') {
      return {};
    }
    return {
      border: `3px solid ${style.borderColor}`,
      boxShadow: `0 0 10px ${style.borderColor}40`,
    };
  }, [cameraSlotStyles]);

  // Get initials from participant name
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Extract avatar URL from LiveKit participant metadata (same pattern as SceneCompositor)
  const getParticipantAvatar = useCallback((metadata: string | undefined): string | null => {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.avatarUrl || null;
    } catch {
      return null;
    }
  }, []);

  // Render a single participant tile
  // Scale affects the actual container size, not a CSS transform
  const renderParticipantTile = useCallback((
    trackRef: typeof participantCameraTracks[0],
    isLocal: boolean,
    sizeClass: string = '',
    isPip: boolean = false,
    applyScale: boolean = true
  ) => {
    const participant = trackRef.participant;
    const isVideoOn = trackRef.publication?.isSubscribed && !trackRef.publication?.isMuted;
    const name = participant.name || participant.identity;
    const borderStyle = getBorderStyle(isLocal);
    const avatarUrl = getParticipantAvatar(participant.metadata);

    // Check if mic is muted
    const audioTrack = cameraTracks.find(
      (t) =>
        t.participant.identity === participant.identity &&
        t.source === Track.Source.Microphone
    );
    const isMicMuted = !audioTrack?.publication || audioTrack.publication.isMuted;

    // Calculate scaled dimensions for the container
    const effectiveScale = applyScale ? cameraScale : 1;
    const scaledMaxWidth = isPip ? `${20 * effectiveScale}%` : undefined;
    const scaledMaxHeight = applyScale && !isPip ? `${90 * effectiveScale}%` : undefined;

    return (
      <div
        key={participant.identity}
        className={cn(
          'relative rounded-lg overflow-hidden bg-bwm-section transition-all duration-300',
          sizeClass,
          isPip && 'absolute z-20 shadow-2xl'
        )}
        style={{
          ...borderStyle,
          ...(scaledMaxHeight && { maxHeight: scaledMaxHeight }),
          ...(isPip && {
            bottom: '0.5rem',
            right: '0.5rem',
            width: scaledMaxWidth,
            minWidth: `${120 * effectiveScale}px`,
            maxWidth: `min(${240 * effectiveScale}px, 35vw)`,
          }),
        }}
      >
        {isVideoOn ? (
          <VideoTrack
            trackRef={trackRef}
            className={cn(
              'w-full h-full object-cover',
              isLocal && 'transform scale-x-[-1]'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bwm-card">
            <div className="flex flex-col items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className={cn(
                    'rounded-full object-cover',
                    isPip ? 'w-10 h-10' : 'w-16 h-16'
                  )}
                  onError={(e) => {
                    // Hide broken image, show initials fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={cn(
                  'rounded-full bg-bwm-section items-center justify-center text-bwm-primary font-semibold',
                  isPip ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl',
                  avatarUrl ? 'hidden' : 'flex'
                )}
              >
                {getInitials(name)}
              </div>
              <VideoOff className={cn('text-bwm-muted', isPip ? 'h-3 w-3' : 'h-4 w-4')} />
            </div>
          </div>
        )}

        {/* Audio track (hidden, just for playback) */}
        {audioTrack?.publication && !audioTrack.publication.isMuted && (
          <AudioTrack trackRef={audioTrack} />
        )}

        {/* Participant name overlay */}
        <div className={cn(
          'absolute left-0 right-0 bg-gradient-to-t from-black/60 to-transparent',
          isPip ? 'bottom-0 p-1' : 'bottom-0 p-2',
          speakerNameStyle && !speakerNameStyle.showNames && 'hidden'
        )}>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-medium truncate',
                isPip ? 'text-xs' : 'text-sm'
              )}
              style={{
                color: speakerNameStyle?.fontColor || '#ffffff',
                fontSize: speakerNameStyle?.fontSize ? `${speakerNameStyle.fontSize}px` : undefined,
              }}
            >
              {name}
            </span>
            {isMicMuted && (
              <MicOff className={cn('text-red-400 flex-shrink-0', isPip ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
            )}
          </div>
        </div>
      </div>
    );
  }, [cameraTracks, cameraScale, getBorderStyle, getInitials, getParticipantAvatar, speakerNameStyle]);

  if (participantCount === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-bwm-secondary text-lg">{t('meeting.waitingForOthers', 'Waiting for others to join...')}</p>
      </div>
    );
  }

  // Screen share mode: responsive layout
  // Desktop: screen share on left, cameras stacked on right
  // Mobile: screen share on top, cameras at bottom
  if (hasScreenShare) {
    if (isMobile) {
      // Mobile: vertical layout - screen share on top, cameras at bottom
      return (
        <div className={cn('flex flex-col h-full w-full p-1.5 gap-1.5 overflow-hidden', className)}>
          {/* Screen share - main content (top) */}
          <div
            className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black relative"
            style={{
              border: '2px solid #6366f1',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            {screenShareTracks.map((track) => (
              <div key={track.participant.identity + '-screen'} className="w-full h-full relative">
                <VideoTrack
                  trackRef={track}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span>{track.participant.name || track.participant.identity}</span>
                  <span className="text-gray-300">({t('meeting.screenShare', 'Screen')})</span>
                </div>
              </div>
            ))}
          </div>

          {/* Participant tiles - row at bottom */}
          <div className="flex gap-1.5 h-[20%] max-h-[100px] shrink-0">
            {participantCameraTracks.map((track) => {
              const isLocal = track.participant.sid === localParticipant?.sid;
              return (
                <div key={track.participant.identity} className="flex-1 min-w-0">
                  {renderParticipantTile(track, isLocal, 'w-full h-full', false, false)}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Desktop: horizontal layout - screen share on left, cameras on right
    return (
      <div className={cn('relative h-full w-full p-2 overflow-hidden', className)}>
        {/* Screen share - main content (left side, takes most space) */}
        <div
          className="absolute rounded-lg overflow-hidden bg-black"
          style={{
            left: '2%',
            top: '2%',
            width: '82%',
            height: '96%',
            border: '3px solid #6366f1',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          {screenShareTracks.map((track) => (
            <div key={track.participant.identity + '-screen'} className="w-full h-full relative">
              <VideoTrack
                trackRef={track}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span>{track.participant.name || track.participant.identity}</span>
                <span className="text-gray-300">({t('meeting.screenShare', 'Screen')})</span>
              </div>
            </div>
          ))}
        </div>

        {/* Participant tiles - stacked on the right side */}
        <div className="absolute right-2 top-2 bottom-2 w-[14%] flex flex-col gap-2 overflow-hidden">
          {participantCameraTracks.map((track) => {
            const isLocal = track.participant.sid === localParticipant?.sid;
            return renderParticipantTile(track, isLocal, 'w-full aspect-video');
          })}
        </div>
      </div>
    );
  }

  // Layout-based rendering
  const firstRemote = remoteTracks[0];

  // PiP layouts
  if (layout === 'pip-coach' && localTrack && firstRemote) {
    return (
      <div className={cn('relative h-full w-full p-1.5 sm:p-2 overflow-hidden', className)}>
        {/* Client full screen */}
        {renderParticipantTile(firstRemote, false, 'w-full h-full', false, false)}
        {/* Coach PiP */}
        {renderParticipantTile(localTrack, true, 'aspect-video', true, true)}
      </div>
    );
  }

  if (layout === 'pip-client' && localTrack && firstRemote) {
    return (
      <div className={cn('relative h-full w-full p-1.5 sm:p-2 overflow-hidden', className)}>
        {/* Coach full screen */}
        {renderParticipantTile(localTrack, true, 'w-full h-full', false, false)}
        {/* Client PiP */}
        {renderParticipantTile(firstRemote, false, 'aspect-video', true, true)}
      </div>
    );
  }

  // Stacked layout (vertical - ideal for mobile)
  if (layout === 'stacked') {
    const scaledHeight = `${45 * cameraScale}%`;
    const scaledMaxHeight = participantCount === 1 ? `${70 * cameraScale}%` : `${45 * cameraScale}%`;

    return (
      <div className={cn('flex flex-col h-full w-full items-center justify-center gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden', className)}>
        {localTrack && (
          <div
            className="aspect-video relative w-full max-w-[95%] sm:max-w-[90%] min-h-0"
            style={{
              height: scaledHeight,
              maxHeight: scaledMaxHeight,
            }}
          >
            {renderParticipantTile(localTrack, true, 'w-full h-full', false, false)}
          </div>
        )}
        {remoteTracks.map((track) => (
          <div
            key={track.participant.identity}
            className="aspect-video relative w-full max-w-[95%] sm:max-w-[90%] min-h-0"
            style={{
              height: scaledHeight,
              maxHeight: scaledMaxHeight,
            }}
          >
            {renderParticipantTile(track, false, 'w-full h-full', false, false)}
          </div>
        ))}
      </div>
    );
  }

  // Default: side-by-side layout
  // On mobile portrait, switch to vertical stacking automatically
  const scaledWidth = `${45 * cameraScale}%`;
  const scaledMaxWidth = participantCount === 1 ? `${70 * cameraScale}%` : `${45 * cameraScale}%`;

  // Mobile: vertical layout for side-by-side when portrait
  if (isMobile && participantCount > 1) {
    const mobileHeight = `${45 * cameraScale}%`;
    const mobileMaxHeight = `${45 * cameraScale}%`;
    return (
      <div className={cn('flex flex-col h-full w-full items-center justify-center gap-2 p-2 overflow-hidden', className)}>
        {localTrack && (
          <div
            className="aspect-video relative w-full max-w-[95%] min-h-0"
            style={{
              height: mobileHeight,
              maxHeight: mobileMaxHeight,
            }}
          >
            {renderParticipantTile(localTrack, true, 'w-full h-full', false, false)}
          </div>
        )}
        {remoteTracks.map((track) => (
          <div
            key={track.participant.identity}
            className="aspect-video relative w-full max-w-[95%] min-h-0"
            style={{
              height: mobileHeight,
              maxHeight: mobileMaxHeight,
            }}
          >
            {renderParticipantTile(track, false, 'w-full h-full', false, false)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex h-full w-full items-center justify-center gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden', className)}>
      {localTrack && (
        <div
          className="aspect-video relative min-w-0"
          style={{
            width: scaledWidth,
            maxWidth: scaledMaxWidth,
            maxHeight: `${85 * cameraScale}%`,
          }}
        >
          {renderParticipantTile(localTrack, true, 'w-full h-full', false, false)}
        </div>
      )}
      {remoteTracks.map((track) => (
        <div
          key={track.participant.identity}
          className="aspect-video relative min-w-0"
          style={{
            width: scaledWidth,
            maxWidth: scaledMaxWidth,
            maxHeight: `${85 * cameraScale}%`,
          }}
        >
          {renderParticipantTile(track, false, 'w-full h-full', false, false)}
        </div>
      ))}
    </div>
  );
}
