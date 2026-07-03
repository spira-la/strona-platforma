/**
 * Layout Selector
 *
 * Component for selecting scene templates and layout presets
 * Used in WebinarStudio to switch between different layouts during a webinar
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout, Grid, Monitor, Layers, Check, ChevronDown } from 'lucide-react';
import type { SceneTemplate, LayoutPreset } from '@/domain/products/models/scene-template.model';
import { LAYOUT_PRESETS } from '@/domain/products/models/scene-template.model';
import { getTranslatedTemplateName, getTranslatedCameraCount } from './templateUtils';

export interface LayoutSelectorProps {
  /** Available scene templates */
  templates: SceneTemplate[];
  /** Currently selected template */
  selectedTemplate: SceneTemplate | null;
  /** Callback when a template is selected */
  onTemplateSelect: (template: SceneTemplate) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function LayoutSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  disabled = false,
  className,
}: LayoutSelectorProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  // Get layout icon
  const getLayoutIcon = (preset: LayoutPreset) => {
    switch (preset) {
      case 'grid':
        return <Grid className="h-4 w-4" />;
      case 'speaker':
        return <Monitor className="h-4 w-4" />;
      case 'sidebar':
        return <Layers className="h-4 w-4" />;
      case 'custom':
        return <Layout className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  // Render template preview
  const renderTemplatePreview = (template: SceneTemplate) => {
    const { cameraSlots, background } = template;
    const scale = 0.2; // Scale factor for preview

    return (
      <div
        className="relative w-24 h-14 rounded overflow-hidden border"
        style={{
          backgroundColor: background.type === 'color' ? background.value : '#1a1a2e',
        }}
      >
        {/* Render miniature camera slots */}
        {cameraSlots.map((slot) => (
          <div
            key={slot.id}
            className="absolute bg-gray-600 rounded-sm"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-[200px] justify-between',
            isDark
              ? 'bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15 hover:text-[#e8f5f0]'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900',
            className
          )}
        >
          <div className="flex items-center gap-2">
            {selectedTemplate ? (
              <>
                {getLayoutIcon(selectedTemplate.layoutPreset)}
                <span className="truncate">{getTranslatedTemplateName(selectedTemplate.name, t)}</span>
              </>
            ) : (
              <>
                <Layout className="h-4 w-4" />
                <span>{t('webinar.selectLayout', 'Select Layout')}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1 mb-2">
              {t('webinar.sceneTemplates', 'Scene Templates')}
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                {t('webinar.noTemplates', 'No templates available')}
              </div>
            ) : (
              <div className="space-y-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onTemplateSelect(template);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md transition-colors',
                      isDark ? 'hover:bg-[#1a352f]/50' : 'hover:bg-gray-100',
                      selectedTemplate?.id === template.id && (isDark ? 'bg-[#5eb8a8]/10 hover:bg-[#5eb8a8]/15' : 'bg-[#285f59]/10 hover:bg-[#285f59]/15')
                    )}
                  >
                    {/* Template preview */}
                    {renderTemplatePreview(template)}

                    {/* Template info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{getTranslatedTemplateName(template.name, t)}</span>
                        {selectedTemplate?.id === template.id && (
                          <Check className={cn('h-4 w-4', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {getLayoutIcon(template.layoutPreset)}
                        <span>{LAYOUT_PRESETS[template.layoutPreset]?.name}</span>
                        <span>•</span>
                        <span>{t('webinars.templates.camerasCount', '{{count}} cameras', { count: template.cameraSlots.length })}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Quick layout preset selector (without templates)
 */
export interface QuickLayoutSelectorProps {
  /** Currently selected preset */
  selectedPreset: LayoutPreset;
  /** Callback when a preset is selected */
  onPresetSelect: (preset: LayoutPreset) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function QuickLayoutSelector({
  selectedPreset,
  onPresetSelect,
  disabled = false,
  className,
}: QuickLayoutSelectorProps) {
  const { t } = useTranslation();

  const presets: { key: LayoutPreset; icon: React.ReactNode; label: string }[] = [
    { key: 'grid', icon: <Grid className="h-4 w-4" />, label: t('webinar.layouts.grid', 'Grid') },
    { key: 'speaker', icon: <Monitor className="h-4 w-4" />, label: t('webinar.layouts.speaker', 'Speaker') },
    { key: 'sidebar', icon: <Layers className="h-4 w-4" />, label: t('webinar.layouts.sidebar', 'Sidebar') },
    { key: 'custom', icon: <Layout className="h-4 w-4" />, label: t('webinar.layouts.custom', 'Custom') },
  ];

  return (
    <div className={cn('flex gap-1', className)}>
      {presets.map(({ key, icon, label }) => (
        <Button
          key={key}
          variant={selectedPreset === key ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => onPresetSelect(key)}
          className="flex items-center gap-1"
          title={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}

export default LayoutSelector;
