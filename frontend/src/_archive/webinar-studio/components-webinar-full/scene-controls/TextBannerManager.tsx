/**
 * Text Banner Manager
 *
 * Controls for creating and managing animated text banners including:
 * - Create new text banners
 * - Configure position, animation, duration
 * - Style text (font size, colors)
 * - Show/hide banners
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Type,
  Plus,
  Trash2,
  Clock,
  Play,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { TextBanner, BannerAnimation } from '@/clients/StudioAssetsClient';
import { ANIMATION_OPTIONS, BANNER_BG_COLORS, BANNER_POSITIONS } from './types';

export interface TextBannerManagerProps {
  textBanners: TextBanner[];
  onAddTextBanner?: (banner: Omit<TextBanner, 'id'>) => void;
  onUpdateTextBanner?: (id: string, updates: Partial<TextBanner>) => void;
  onRemoveTextBanner?: (id: string) => void;
  onShowTextBanner?: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TextBannerManager({
  textBanners,
  onAddTextBanner,
  onUpdateTextBanner,
  onRemoveTextBanner,
  onShowTextBanner,
  isOpen,
  onOpenChange,
}: TextBannerManagerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [newBannerText, setNewBannerText] = useState('');

  const handleAddTextBanner = useCallback(() => {
    if (!newBannerText.trim() || !onAddTextBanner) return;

    onAddTextBanner({
      text: newBannerText,
      position: 'bottom-center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
      animationIn: 'slide-up',
      animationOut: 'fade-out',
      duration: 5,
      isVisible: false,
      padding: 16,
      borderRadius: 8,
    });
    setNewBannerText('');
  }, [newBannerText, onAddTextBanner]);

  if (!onAddTextBanner) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
        <div className="flex items-center gap-2 w-full">
          <Type className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
          <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
            {t('webinars.scenes.textBanners', 'Text Banners')}
          </span>
          <span className={cn("text-xs mr-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{textBanners.length}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 space-y-2">
          {/* Add New Banner */}
          <div className="flex gap-2">
            <Input
              value={newBannerText}
              onChange={(e) => setNewBannerText(e.target.value)}
              placeholder={t('webinars.scenes.enterBannerText', 'Enter banner text...')}
              className={cn("flex-1 h-8 text-xs", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0]" : "bg-white border-slate-200 text-slate-900")}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTextBanner()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTextBanner}
              disabled={!newBannerText.trim()}
              className={cn("h-8 px-2", isDark ? "bg-[#5eb8a8]/20 border-[#5eb8a8]/30 text-[#e8f5f0] hover:bg-[#5eb8a8]/30" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Banner List */}
          {textBanners.length === 0 ? (
            <p className={cn("text-xs text-center py-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
              {t('webinars.scenes.noTextBanners', 'No text banners')}
            </p>
          ) : (
            textBanners.map((banner) => (
              <div
                key={banner.id}
                className={cn(
                  'p-2 rounded-lg border transition-all space-y-2',
                  banner.isVisible
                    ? 'border-[#5eb8a8]/50 bg-[#5eb8a8]/10'
                    : isDark ? 'border-[#5eb8a8]/15 bg-[#1a352f]/30' : 'border-slate-200 bg-slate-50'
                )}
              >
                {/* Banner Preview */}
                <div
                  className="px-2 py-1 rounded text-center"
                  style={{
                    backgroundColor: banner.backgroundColor,
                    color: banner.textColor,
                    fontSize: `${Math.min(banner.fontSize, 14)}px`,
                    fontWeight: banner.fontWeight,
                    borderRadius: `${banner.borderRadius}px`,
                  }}
                >
                  {banner.text}
                </div>

                {/* Position Grid */}
                <div className="space-y-1">
                  <span className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                    {t('webinars.scenes.bannerPosition', 'Position')}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {BANNER_POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => onUpdateTextBanner?.(banner.id, { position: pos })}
                        className={cn(
                          'h-5 rounded border transition-all flex items-center justify-center',
                          banner.position === pos
                            ? 'border-[#5eb8a8] bg-[#5eb8a8]/30'
                            : isDark ? 'border-[#5eb8a8]/20 bg-[#1a352f]/50 hover:border-[#5eb8a8]/40' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        )}
                      >
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-sm',
                            banner.position === pos ? 'bg-[#5eb8a8]' : 'bg-[#5eb8a8]/50'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Selector */}
                <Select
                  value={banner.animationIn}
                  onValueChange={(v: BannerAnimation) => onUpdateTextBanner?.(banner.id, { animationIn: v })}
                >
                  <SelectTrigger className={cn("h-7 text-xs", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0]" : "bg-white border-slate-200 text-slate-900")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isDark ? "bg-[#1a352f] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
                    {ANIMATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className={cn("text-xs", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Duration Slider */}
                <div className="flex items-center gap-2">
                  <Clock className={cn("w-3 h-3", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
                  <span className={cn("text-xs w-8", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{banner.duration}s</span>
                  <Slider
                    value={[banner.duration]}
                    onValueChange={([v]) => onUpdateTextBanner?.(banner.id, { duration: v })}
                    min={0}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                </div>

                {/* Font Size Slider */}
                <div className="flex items-center gap-2">
                  <Type className={cn("w-3 h-3", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
                  <span className={cn("text-xs w-8", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{banner.fontSize}px</span>
                  <Slider
                    value={[banner.fontSize]}
                    onValueChange={([v]) => onUpdateTextBanner?.(banner.id, { fontSize: v })}
                    min={12}
                    max={48}
                    step={1}
                    className="flex-1"
                  />
                </div>

                {/* Background Color Picker */}
                <div className="flex gap-1 flex-wrap">
                  {BANNER_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdateTextBanner?.(banner.id, { backgroundColor: color })}
                      className={cn(
                        'w-5 h-5 rounded border transition-all',
                        banner.backgroundColor === color ? 'border-white scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowTextBanner?.(banner.id)}
                    className={cn("flex-1 h-7 text-xs", isDark ? "bg-[#5eb8a8]/20 border-[#5eb8a8]/30 text-[#e8f5f0] hover:bg-[#5eb8a8]/30" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {t('webinars.scenes.showBanner', 'Show')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTextBanner?.(banner.id)}
                    className="w-7 h-7 p-0 text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default TextBannerManager;
