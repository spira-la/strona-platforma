/**
 * Overlay Manager
 *
 * Component for controlling overlay visibility during a webinar stream
 * Allows host to show/hide banners, logos, GIFs dynamically
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Layers,
  Image,
  Type,
  Eye,
  EyeOff,
  ChevronDown,
  FileImage,
} from 'lucide-react';
import type { SceneOverlay, OverlayType } from '@/domain/products/models/scene-template.model';

export interface OverlayManagerProps {
  /** List of overlays from the scene template */
  overlays: SceneOverlay[];
  /** Current visibility state for each overlay */
  visibility: Record<string, boolean>;
  /** Callback when an overlay's visibility is toggled */
  onToggle: (overlayId: string, isVisible: boolean) => void;
  /** Whether the manager is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function OverlayManager({
  overlays,
  visibility,
  onToggle,
  disabled = false,
  className,
}: OverlayManagerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  // Get overlay type icon
  const getOverlayIcon = (type: OverlayType) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'gif':
        return <FileImage className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  // Count visible overlays
  const visibleCount = Object.values(visibility).filter(Boolean).length;

  // Toggle all overlays
  const toggleAll = (visible: boolean) => {
    overlays.forEach((overlay) => {
      onToggle(overlay.id, visible);
    });
  };

  if (overlays.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'relative',
            isDark
              ? 'bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15 hover:text-[#e8f5f0]'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
            className
          )}
        >
          <Layers className="h-4 w-4 mr-2" />
          <span>{t('webinar.overlays', 'Overlays')}</span>
          {visibleCount > 0 && (
            <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded-full', isDark ? 'bg-[#5eb8a8] text-white' : 'bg-[#285f59] text-white')}>
              {visibleCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[280px] p-0', isDark ? 'bg-[#0d1f1c] border-[#5eb8a8]/20' : 'bg-white border-slate-200')} align="end">
        <div className={cn('p-3 border-b', isDark ? 'border-[#5eb8a8]/20' : 'border-slate-200')}>
          <div className="flex items-center justify-between">
            <span className={cn('font-medium text-sm', isDark ? 'text-[#e8f5f0]' : 'text-slate-900')}>
              {t('webinar.manageOverlays', 'Manage Overlays')}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleAll(true)}
                className="h-7 px-2 text-xs"
              >
                {t('webinar.showAll', 'Show All')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleAll(false)}
                className="h-7 px-2 text-xs"
              >
                {t('webinar.hideAll', 'Hide All')}
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {overlays.map((overlay) => {
              const isVisible = visibility[overlay.id] ?? overlay.isVisible;

              return (
                <div
                  key={overlay.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md transition-colors',
                    isDark ? 'hover:bg-[#1a352f]' : 'hover:bg-gray-50',
                    isVisible && (isDark ? 'bg-[#5eb8a8]/10' : 'bg-[#285f59]/10')
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Overlay preview */}
                    <div className={cn('w-10 h-10 rounded flex items-center justify-center overflow-hidden', isDark ? 'bg-[#1a352f]' : 'bg-gray-100')}>
                      {overlay.type === 'text' ? (
                        <Type className={cn('h-5 w-5', isDark ? 'text-[#e8f5f0]/60' : 'text-gray-400')} />
                      ) : overlay.url ? (
                        <img
                          src={overlay.url}
                          alt={overlay.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getOverlayIcon(overlay.type)
                      )}
                    </div>

                    {/* Overlay info */}
                    <div>
                      <div className={cn('font-medium text-sm', isDark ? 'text-[#e8f5f0]' : 'text-slate-900')}>{overlay.name}</div>
                      <div className={cn('text-xs flex items-center gap-1', isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500')}>
                        {getOverlayIcon(overlay.type)}
                        <span className="capitalize">{overlay.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <Eye className={cn('h-4 w-4', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
                    ) : (
                      <EyeOff className={cn('h-4 w-4', isDark ? 'text-[#e8f5f0]/40' : 'text-gray-400')} />
                    )}
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => onToggle(overlay.id, checked)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact overlay toggle bar
 * Shows overlay buttons inline for quick access
 */
export interface OverlayToggleBarProps {
  /** List of overlays from the scene template */
  overlays: SceneOverlay[];
  /** Current visibility state for each overlay */
  visibility: Record<string, boolean>;
  /** Callback when an overlay's visibility is toggled */
  onToggle: (overlayId: string, isVisible: boolean) => void;
  /** Whether the bar is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Maximum number of overlays to show before collapsing */
  maxVisible?: number;
}

export function OverlayToggleBar({
  overlays,
  visibility,
  onToggle,
  disabled = false,
  className,
  maxVisible = 5,
}: OverlayToggleBarProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (overlays.length === 0) {
    return null;
  }

  const visibleOverlays = overlays.slice(0, maxVisible);
  const hiddenCount = overlays.length - maxVisible;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className={cn('text-xs mr-2', isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500')}>
        {t('webinar.overlays', 'Overlays')}:
      </span>

      {visibleOverlays.map((overlay) => {
        const isVisible = visibility[overlay.id] ?? overlay.isVisible;

        return (
          <Button
            key={overlay.id}
            variant={isVisible ? 'default' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => onToggle(overlay.id, !isVisible)}
            className="h-7 px-2 text-xs"
            title={overlay.name}
          >
            {overlay.type === 'text' ? (
              <Type className="h-3 w-3 mr-1" />
            ) : overlay.type === 'gif' ? (
              <FileImage className="h-3 w-3 mr-1" />
            ) : (
              <Image className="h-3 w-3 mr-1" />
            )}
            <span className="max-w-[60px] truncate">{overlay.name}</span>
          </Button>
        );
      })}

      {hiddenCount > 0 && (
        <OverlayManager
          overlays={overlays}
          visibility={visibility}
          onToggle={onToggle}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default OverlayManager;
