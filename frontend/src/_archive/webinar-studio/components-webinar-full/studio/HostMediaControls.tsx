import { useTranslation } from 'react-i18next';
import { Video, VideoOff, Mic, MicOff, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HostMediaControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShareEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
}

/**
 * HostMediaControls - Audio/Video/Screen share toggle buttons
 */
export function HostMediaControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenShareEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
}: HostMediaControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={isAudioEnabled ? 'default' : 'secondary'}
        size="sm"
        onClick={onToggleAudio}
        title={isAudioEnabled ? t('webinars.muteMic', 'Mute microphone') : t('webinars.unmuteMic', 'Unmute microphone')}
      >
        {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </Button>
      <Button
        variant={isVideoEnabled ? 'default' : 'secondary'}
        size="sm"
        onClick={onToggleVideo}
        title={isVideoEnabled ? t('webinars.camOff', 'Turn off camera') : t('webinars.camOn', 'Turn on camera')}
      >
        {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
      </Button>
      <Button
        variant={isScreenShareEnabled ? 'destructive' : 'outline'}
        size="sm"
        onClick={onToggleScreenShare}
        title={isScreenShareEnabled ? t('webinars.stopShare', 'Stop sharing') : t('webinars.shareScreen', 'Share screen')}
      >
        <Monitor className="w-4 h-4 mr-1" />
        {isScreenShareEnabled ? t('webinars.stopShare', 'Stop') : t('webinars.shareScreen', 'Share')}
      </Button>
    </div>
  );
}

export default HostMediaControls;
