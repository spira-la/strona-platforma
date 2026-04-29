/**
 * Video Quality Selector Component
 *
 * Allows users to select video quality for streaming:
 * - Host: Transmission quality (what quality to send)
 * - Client: Receiving quality (what quality to receive)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings, Monitor, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type VideoQualityPreset = 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p';

export interface VideoQualityConfig {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  label: string;
}

export const VIDEO_QUALITY_PRESETS: Record<VideoQualityPreset, VideoQualityConfig> = {
  auto: { width: 1920, height: 1080, frameRate: 30, bitrate: 3000000, label: 'Auto' },
  '4k': { width: 3840, height: 2160, frameRate: 30, bitrate: 10000000, label: '4K (Ultra HD)' },
  '1080p': { width: 1920, height: 1080, frameRate: 30, bitrate: 3000000, label: '1080p (Full HD)' },
  '720p': { width: 1280, height: 720, frameRate: 30, bitrate: 1500000, label: '720p (HD)' },
  '480p': { width: 854, height: 480, frameRate: 30, bitrate: 800000, label: '480p (SD)' },
  '360p': { width: 640, height: 360, frameRate: 24, bitrate: 400000, label: '360p (Low)' },
};

export interface VideoQualitySelectorProps {
  /** Current quality preset */
  quality: VideoQualityPreset;
  /** Called when quality changes */
  onQualityChange: (quality: VideoQualityPreset) => void;
  /** Whether this is for transmission (host) or receiving (client) */
  mode: 'transmit' | 'receive';
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Compact mode - just an icon button */
  compact?: boolean;
}

export function VideoQualitySelector({
  quality,
  onQualityChange,
  mode,
  disabled = false,
  className,
  compact = false,
}: VideoQualitySelectorProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const currentConfig = VIDEO_QUALITY_PRESETS[quality];
  const Icon = mode === 'transmit' ? Wifi : Monitor;

  const title = mode === 'transmit'
    ? t('webinars.quality.transmitTitle', 'Transmission Quality')
    : t('webinars.quality.receiveTitle', 'Video Quality');

  const description = mode === 'transmit'
    ? t('webinars.quality.transmitDescription', 'Quality of video you send to viewers')
    : t('webinars.quality.receiveDescription', 'Quality of video you receive');

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              'w-10 h-10 p-0 rounded-full',
              isDark ? 'text-[#e8f5f0] hover:bg-[#5eb8a8]/15' : 'text-slate-700 hover:bg-[#285f59]/10',
              className
            )}
            title={title}
          >
            <Icon className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'gap-2',
              isDark
                ? 'bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15 hover:text-[#e8f5f0]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
              className
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs">{currentConfig.label}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn('w-56', isDark ? 'bg-[#0d1f1c] border-[#5eb8a8]/20' : 'bg-white border-slate-200')}
      >
        <DropdownMenuLabel className={isDark ? 'text-[#e8f5f0]' : 'text-slate-900'}>
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
            {title}
          </div>
          <p className={cn('text-xs font-normal mt-1', isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500')}>
            {description}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={isDark ? 'bg-[#5eb8a8]/20' : 'bg-slate-200'} />
        <DropdownMenuRadioGroup
          value={quality}
          onValueChange={(value) => {
            onQualityChange(value as VideoQualityPreset);
            setOpen(false);
          }}
        >
          {mode === 'receive' && (
            <DropdownMenuRadioItem
              value="auto"
              className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
            >
              <div className="flex flex-col">
                <span>Auto</span>
                <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>
                  {t('webinars.quality.autoDescription', 'Adjusts based on your connection')}
                </span>
              </div>
            </DropdownMenuRadioItem>
          )}
          {mode === 'transmit' && (
            <DropdownMenuRadioItem
              value="4k"
              className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
            >
              <div className="flex flex-col">
                <span>4K (Ultra HD)</span>
                <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>3840x2160 @ 30fps</span>
              </div>
            </DropdownMenuRadioItem>
          )}
          <DropdownMenuRadioItem
            value="1080p"
            className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
          >
            <div className="flex flex-col">
              <span>1080p (Full HD)</span>
              <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>1920x1080 @ 30fps</span>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="720p"
            className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
          >
            <div className="flex flex-col">
              <span>720p (HD)</span>
              <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>1280x720 @ 30fps</span>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="480p"
            className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
          >
            <div className="flex flex-col">
              <span>480p (SD)</span>
              <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>854x480 @ 30fps</span>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="360p"
            className={isDark ? 'text-[#e8f5f0] focus:bg-[#5eb8a8]/15 focus:text-[#e8f5f0]' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900'}
          >
            <div className="flex flex-col">
              <span>360p (Low)</span>
              <span className={cn('text-xs', isDark ? 'text-[#e8f5f0]/50' : 'text-slate-500')}>640x360 @ 24fps</span>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default VideoQualitySelector;
