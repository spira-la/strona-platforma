/**
 * Speaker Name Styler
 *
 * Controls for styling speaker name display including:
 * - Show/hide names toggle
 * - Font size adjustment
 * - Text and background colors
 * - Position selection
 * - Padding and border radius
 * - Live preview
 */

import { useTranslation } from 'react-i18next';
import { User, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { SpeakerNameStyle } from '@/clients/StudioAssetsClient';
import { TEXT_COLORS, BANNER_BG_COLORS } from './types';

export interface SpeakerNameStylerProps {
  speakerNameStyle: SpeakerNameStyle;
  onSpeakerNameStyleChange?: (style: Partial<SpeakerNameStyle>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Name position options
const NAME_POSITIONS: { value: SpeakerNameStyle['position']; label: string }[] = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
];

export function SpeakerNameStyler({
  speakerNameStyle,
  onSpeakerNameStyleChange,
  isOpen,
  onOpenChange,
}: SpeakerNameStylerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (!onSpeakerNameStyleChange) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
        <div className="flex items-center gap-2 w-full">
          <User className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
          <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
            {t('webinars.scenes.speakerNames', 'Speaker Names')}
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 space-y-3">
          {/* Show/Hide Toggle */}
          <div className="flex items-center justify-between">
            <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.scenes.showNames', 'Show Names')}
            </Label>
            <Switch
              checked={speakerNameStyle.showNames}
              onCheckedChange={(checked) => onSpeakerNameStyleChange({ showNames: checked })}
              className="data-[state=checked]:bg-[#5eb8a8]"
            />
          </div>

          {speakerNameStyle.showNames && (
            <>
              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                    {t('webinars.scenes.fontSize', 'Font Size')}
                  </Label>
                  <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{speakerNameStyle.fontSize}px</span>
                </div>
                <Slider
                  value={[speakerNameStyle.fontSize]}
                  onValueChange={([v]) => onSpeakerNameStyleChange({ fontSize: v })}
                  min={10}
                  max={24}
                  step={1}
                  className="flex-1"
                />
              </div>

              {/* Text Color */}
              <div className="space-y-1">
                <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.scenes.textColor', 'Text Color')}
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onSpeakerNameStyleChange({ fontColor: color })}
                      className={cn(
                        'w-6 h-6 rounded border-2 transition-all',
                        speakerNameStyle.fontColor === color
                          ? 'border-[#5eb8a8] scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1">
                <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.scenes.backgroundColor', 'Background')}
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {BANNER_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onSpeakerNameStyleChange({ backgroundColor: color })}
                      className={cn(
                        'w-6 h-6 rounded border-2 transition-all',
                        speakerNameStyle.backgroundColor === color
                          ? 'border-[#5eb8a8] scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1">
                <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.scenes.namePosition', 'Position')}
                </Label>
                <div className="grid grid-cols-3 gap-1">
                  {NAME_POSITIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onSpeakerNameStyleChange({ position: value })}
                      className={cn(
                        'h-6 rounded border text-[10px] transition-all',
                        speakerNameStyle.position === value
                          ? isDark ? 'border-[#5eb8a8] bg-[#5eb8a8]/30 text-[#e8f5f0]' : 'border-[#5eb8a8] bg-[#5eb8a8]/20 text-slate-700'
                          : isDark ? 'border-[#5eb8a8]/20 bg-[#1a352f]/50 text-[#e8f5f0]/50 hover:border-[#5eb8a8]/40' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                      )}
                    >
                      {label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Padding */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                    {t('webinars.scenes.padding', 'Padding')}
                  </Label>
                  <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{speakerNameStyle.padding}px</span>
                </div>
                <Slider
                  value={[speakerNameStyle.padding]}
                  onValueChange={([v]) => onSpeakerNameStyleChange({ padding: v })}
                  min={2}
                  max={12}
                  step={1}
                  className="flex-1"
                />
              </div>

              {/* Border Radius */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                    {t('webinars.scenes.borderRadius', 'Roundness')}
                  </Label>
                  <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{speakerNameStyle.borderRadius}px</span>
                </div>
                <Slider
                  value={[speakerNameStyle.borderRadius]}
                  onValueChange={([v]) => onSpeakerNameStyleChange({ borderRadius: v })}
                  min={0}
                  max={12}
                  step={1}
                  className="flex-1"
                />
              </div>

              {/* Preview */}
              <div className={cn("p-2 rounded-lg border", isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
                <p className={cn("text-[10px] mb-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                  {t('webinars.scenes.preview', 'Preview')}
                </p>
                <div className={cn("relative w-full h-12 rounded overflow-hidden", isDark ? "bg-[#1a352f]" : "bg-slate-100")}>
                  <div
                    className={cn(
                      'absolute px-2 py-1',
                      speakerNameStyle.position.includes('top') ? 'top-1' : 'bottom-1',
                      speakerNameStyle.position.includes('left') && 'left-1',
                      speakerNameStyle.position.includes('center') && 'left-1/2 -translate-x-1/2',
                      speakerNameStyle.position.includes('right') && 'right-1'
                    )}
                    style={{
                      fontSize: `${Math.min(speakerNameStyle.fontSize, 12)}px`,
                      color: speakerNameStyle.fontColor,
                      backgroundColor: speakerNameStyle.backgroundColor,
                      padding: `${Math.min(speakerNameStyle.padding, 4)}px ${Math.min(speakerNameStyle.padding * 2, 8)}px`,
                      borderRadius: `${speakerNameStyle.borderRadius}px`,
                    }}
                  >
                    Speaker Name
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default SpeakerNameStyler;
