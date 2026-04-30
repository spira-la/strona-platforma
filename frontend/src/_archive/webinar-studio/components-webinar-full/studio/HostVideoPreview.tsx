import { VideoTrack, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoOff } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * HostVideoPreview - Shows the host's own camera feed
 * Must be rendered inside LiveKitRoom
 */
export function HostVideoPreview() {
  const { isDark } = useTheme();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);

  // Find local camera track
  const localVideoTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  if (!localVideoTrack) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground", isDark ? "bg-[#1a352f]" : "bg-slate-100")}>
        <VideoOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover" />
  );
}

export default HostVideoPreview;
