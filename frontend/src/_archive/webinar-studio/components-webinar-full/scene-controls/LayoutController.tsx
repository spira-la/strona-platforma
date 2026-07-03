/**
 * Layout Controller
 *
 * Controls for selecting and previewing scene layout templates.
 * Displays available templates with camera slot previews.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Check, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import { getTranslatedTemplateName } from '../templateUtils';
import type { CameraSlotStyle } from './types';

export interface LayoutControllerProps {
  templates: SceneTemplate[];
  selectedTemplate: SceneTemplate | null;
  onTemplateSelect: (template: SceneTemplate) => void;
  currentBackground?: { type: 'color' | 'image'; value: string };
  cameraSlotStyles?: CameraSlotStyle[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayoutController({
  templates,
  selectedTemplate,
  onTemplateSelect,
  currentBackground,
  cameraSlotStyles = [],
  isOpen,
  onOpenChange,
}: LayoutControllerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Sort templates by camera slot count
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.cameraSlots.length - b.cameraSlots.length);
  }, [templates]);

  // Get border color for a slot
  const getSlotBorderColor = (slotId: string) => {
    return cameraSlotStyles.find(s => s.slotId === slotId)?.borderColor || '#22d3ee';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
        <div className="flex items-center gap-2 w-full">
          <Layout className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
          <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
            {t('webinars.scenes.layouts', 'Layouts')}
          </span>
          <span className={cn("text-xs mr-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{sortedTemplates.length}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 space-y-1">
          {sortedTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            return (
              <button
                key={template.id}
                onClick={() => onTemplateSelect(template)}
                className={cn(
                  'w-full p-2 rounded-lg border text-left transition-all flex items-center gap-2',
                  isSelected
                    ? 'border-[#5eb8a8] bg-[#5eb8a8]/20'
                    : isDark ? 'border-transparent bg-[#1a352f]/30 hover:bg-[#1a352f]/50' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                )}
              >
                {/* Template Preview */}
                <div
                  className={cn("w-12 h-8 rounded border flex-shrink-0 overflow-hidden relative", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}
                  style={{
                    backgroundColor: currentBackground?.type === 'color'
                      ? currentBackground.value
                      : '#1e293b'
                  }}
                >
                  {template.cameraSlots.slice(0, 6).map((slot) => (
                    <div
                      key={slot.id}
                      className="absolute rounded-sm"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        width: `${slot.width}%`,
                        height: `${slot.height}%`,
                        backgroundColor: getSlotBorderColor(slot.id) + '60',
                        border: `1px solid ${getSlotBorderColor(slot.id)}`,
                      }}
                    />
                  ))}
                </div>

                {/* Template Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs truncate", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                    {getTranslatedTemplateName(template.name, t)}
                  </p>
                  <p className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                    {t('webinars.scenes.camerasCount', '{{count}} cameras', { count: template.cameraSlots.length })}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && <Check className="w-4 h-4 text-[#5eb8a8] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default LayoutController;
