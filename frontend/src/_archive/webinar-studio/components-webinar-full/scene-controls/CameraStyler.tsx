/**
 * Camera Styler
 *
 * Controls for camera styling including:
 * - Camera scale/size adjustment
 * - Camera border color customization per slot
 */

import { useTranslation } from 'react-i18next';
import {
  Maximize2,
  Minimize2,
  Square,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import type { CameraSlotStyle } from './types';
import { BORDER_COLORS } from './types';

export interface CameraStylerProps {
  selectedTemplate: SceneTemplate | null;
  cameraScale: number;
  onCameraScaleChange?: (scale: number) => void;
  cameraSlotStyles: CameraSlotStyle[];
  onCameraSlotStyleChange?: (slotId: string, style: Partial<CameraSlotStyle>) => void;
  // Collapsible states
  cameraSizeOpen: boolean;
  onCameraSizeOpenChange: (open: boolean) => void;
  bordersOpen: boolean;
  onBordersOpenChange: (open: boolean) => void;
}

export function CameraStyler({
  selectedTemplate,
  cameraScale,
  onCameraScaleChange,
  cameraSlotStyles,
  onCameraSlotStyleChange,
  cameraSizeOpen,
  onCameraSizeOpenChange,
  bordersOpen,
  onBordersOpenChange,
}: CameraStylerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Get border color for a slot
  const getSlotBorderColor = (slotId: string) => {
    return cameraSlotStyles.find(s => s.slotId === slotId)?.borderColor || '#22d3ee';
  };

  return (
    <>
      {/* Camera Size */}
      {onCameraScaleChange && (
        <Collapsible open={cameraSizeOpen} onOpenChange={onCameraSizeOpenChange}>
          <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
            <div className="flex items-center gap-2 w-full">
              {cameraScale >= 1 ? (
                <Maximize2 className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              ) : (
                <Minimize2 className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              )}
              <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                {t('webinars.scenes.cameraSize', 'Camera Size')}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", cameraSizeOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCameraScaleChange(Math.max(0.5, cameraScale - 0.1))}
                  disabled={cameraScale <= 0.5}
                  className={cn("w-8 h-8 p-0", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100")}
                >
                  -
                </Button>
                <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isDark ? "bg-[#1a352f]/50" : "bg-slate-100")}>
                  <div
                    className="h-full bg-gradient-to-r from-[#5eb8a8] to-[#285f59] transition-all"
                    style={{ width: `${((cameraScale - 0.5) / 1) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCameraScaleChange(Math.min(1.5, cameraScale + 0.1))}
                  disabled={cameraScale >= 1.5}
                  className={cn("w-8 h-8 p-0", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100")}
                >
                  +
                </Button>
                <span className={cn("text-xs w-10 text-right", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {Math.round(cameraScale * 100)}%
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Camera Borders */}
      {selectedTemplate && selectedTemplate.cameraSlots.length > 0 && onCameraSlotStyleChange && (
        <Collapsible open={bordersOpen} onOpenChange={onBordersOpenChange}>
          <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
            <div className="flex items-center gap-2 w-full">
              <Square className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                {t('webinars.scenes.cameraBorders', 'Camera Borders')}
              </span>
              <span className={cn("text-xs mr-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{selectedTemplate.cameraSlots.length}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", bordersOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2 space-y-3">
              {selectedTemplate.cameraSlots.map((slot, index) => (
                <div key={slot.id} className="space-y-1.5">
                  <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                    {slot.label || t('webinars.scenes.camera', 'Camera') + ` ${index + 1}`}
                  </Label>
                  <div className="flex gap-1 flex-wrap">
                    {BORDER_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => onCameraSlotStyleChange(slot.id, { borderColor: color })}
                        className={cn(
                          'w-6 h-6 rounded border-2 transition-all',
                          getSlotBorderColor(slot.id) === color
                            ? 'border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
}

export default CameraStyler;
