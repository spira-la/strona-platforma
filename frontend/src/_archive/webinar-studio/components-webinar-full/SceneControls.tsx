/**
 * Scene Controls Component
 *
 * Controls for managing scene layouts, backgrounds, and overlays during live streaming.
 * Features:
 * - Layout selection with camera slot previews
 * - Background color/image controls with saved backgrounds
 * - Camera size adjustment
 * - Camera border color customization
 * - Corner images (4 corners)
 * - Animated text banners with lifetime
 * - Collapsible sections for better space management
 *
 * This component orchestrates multiple sub-components for a modular architecture.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layout,
  ImageIcon,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import {
  DEFAULT_SPEAKER_NAME_STYLE,
  type SavedBackground,
  type SavedCornerImage,
  type CornerImage,
  type CornerPosition,
  type TextBanner,
  type BannerAnimation,
  type BannerPosition,
  type SavedSceneConfig,
  type SpeakerNameStyle,
} from '@/clients/StudioAssetsClient';

// Import sub-components
import { LayoutController } from './scene-controls/LayoutController';
import { BackgroundManager } from './scene-controls/BackgroundManager';
import { CameraStyler } from './scene-controls/CameraStyler';
import { CornerImageManager } from './scene-controls/CornerImageManager';
import { TextBannerManager } from './scene-controls/TextBannerManager';
import { SpeakerNameStyler } from './scene-controls/SpeakerNameStyler';
import { ScenePresetsManager } from './scene-controls/ScenePresetsManager';
import type { CameraSlotStyle, OverlayPosition, CustomOverlay, SpeakerDisplayNames } from './scene-controls/types';

// Re-export types for external use (backward compatibility)
export type {
  SavedBackground,
  SavedCornerImage,
  CornerImage,
  CornerPosition,
  TextBanner,
  BannerAnimation,
  BannerPosition,
  SavedSceneConfig,
  SpeakerNameStyle,
  CameraSlotStyle,
  OverlayPosition,
  CustomOverlay,
  SpeakerDisplayNames,
};
export { DEFAULT_SPEAKER_NAME_STYLE };

export interface SceneControlsProps {
  // Webinar ID - required for per-webinar assets (backgrounds, corner images)
  webinarId?: string;
  templates: SceneTemplate[];
  selectedTemplate: SceneTemplate | null;
  onTemplateSelect: (template: SceneTemplate) => void;
  overlayVisibility: Record<string, boolean>;
  onOverlayToggle: (overlayId: string) => void;
  isLive?: boolean;
  onBackgroundColorChange?: (color: string) => void;
  onBackgroundImageChange?: (url: string) => void;
  isUploadingBackground?: boolean;
  currentBackground?: { type: 'color' | 'image'; value: string };
  cameraScale?: number;
  onCameraScaleChange?: (scale: number) => void;
  cameraSlotStyles?: CameraSlotStyle[];
  onCameraSlotStyleChange?: (slotId: string, style: Partial<CameraSlotStyle>) => void;
  // Corner images
  cornerImages?: CornerImage[];
  onSetCornerImage?: (corner: CornerPosition, savedImage: SavedCornerImage) => void;
  onRemoveCornerImage?: (corner: CornerPosition) => void;
  onToggleCornerImage?: (corner: CornerPosition) => void;
  // Text banners
  textBanners?: TextBanner[];
  onAddTextBanner?: (banner: Omit<TextBanner, 'id'>) => void;
  onUpdateTextBanner?: (id: string, updates: Partial<TextBanner>) => void;
  onRemoveTextBanner?: (id: string) => void;
  onShowTextBanner?: (id: string) => void;
  // Scene configurations
  savedSceneConfigs?: SavedSceneConfig[];
  currentConfigId?: string | null;
  isLoadingConfig?: boolean;
  isSavingConfig?: boolean;
  onSaveSceneConfig?: (name: string, setAsDefault: boolean) => Promise<void>;
  onLoadSceneConfig?: (config: SavedSceneConfig) => void;
  onDeleteSceneConfig?: (configId: string) => Promise<void>;
  onSetDefaultConfig?: (configId: string) => Promise<void>;
  // Speaker name styling
  speakerNameStyle?: SpeakerNameStyle;
  onSpeakerNameStyleChange?: (style: Partial<SpeakerNameStyle>) => void;
  className?: string;
}

export function SceneControls({
  webinarId,
  templates,
  selectedTemplate,
  onTemplateSelect,
  overlayVisibility,
  onOverlayToggle,
  isLive = false,
  onBackgroundColorChange,
  onBackgroundImageChange,
  isUploadingBackground = false,
  currentBackground,
  cameraScale = 1,
  onCameraScaleChange,
  cameraSlotStyles = [],
  onCameraSlotStyleChange,
  cornerImages = [],
  onSetCornerImage,
  onRemoveCornerImage,
  onToggleCornerImage,
  textBanners = [],
  onAddTextBanner,
  onUpdateTextBanner,
  onRemoveTextBanner,
  onShowTextBanner,
  savedSceneConfigs = [],
  currentConfigId,
  isLoadingConfig = false,
  isSavingConfig = false,
  onSaveSceneConfig,
  onLoadSceneConfig,
  onDeleteSceneConfig,
  onSetDefaultConfig,
  speakerNameStyle = DEFAULT_SPEAKER_NAME_STYLE,
  onSpeakerNameStyleChange,
  className,
}: SceneControlsProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Active tab for scene controls
  const [activeTab, setActiveTab] = useState<'layout' | 'background' | 'overlays' | 'configs'>('layout');

  // Collapsible states - most closed by default to reduce scroll
  const [layoutsOpen, setLayoutsOpen] = useState(true); // Layouts open by default
  const [cameraSizeOpen, setCameraSizeOpen] = useState(false);
  const [bordersOpen, setBordersOpen] = useState(false);
  const [speakerNamesOpen, setSpeakerNamesOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [savedBgOpen, setSavedBgOpen] = useState(false);
  const [cornersOpen, setCornersOpen] = useState(false);
  const [textBannersOpen, setTextBannersOpen] = useState(false);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
        <TabsList className={cn(
          'grid grid-cols-4 border-b rounded-none h-9 p-0',
          isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/20' : 'bg-slate-100 border-slate-200'
        )}>
          <TabsTrigger value="layout" className={cn(
            'text-xs rounded-none h-full',
            isDark
              ? 'data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0] text-[#e8f5f0]/60'
              : 'data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900 text-slate-500'
          )}>
            <Layout className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">{t('webinars.scenes.tabs.layout', 'Layout')}</span>
          </TabsTrigger>
          <TabsTrigger value="background" className={cn(
            'text-xs rounded-none h-full',
            isDark
              ? 'data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0] text-[#e8f5f0]/60'
              : 'data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900 text-slate-500'
          )}>
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">{t('webinars.scenes.tabs.background', 'BG')}</span>
          </TabsTrigger>
          <TabsTrigger value="overlays" className={cn(
            'text-xs rounded-none h-full',
            isDark
              ? 'data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0] text-[#e8f5f0]/60'
              : 'data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900 text-slate-500'
          )}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">{t('webinars.scenes.tabs.overlays', 'Overlays')}</span>
          </TabsTrigger>
          <TabsTrigger value="configs" className={cn(
            'text-xs rounded-none h-full',
            isDark
              ? 'data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0] text-[#e8f5f0]/60'
              : 'data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900 text-slate-500'
          )}>
            <Settings2 className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">{t('webinars.scenes.tabs.configs', 'Saved')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout" className="flex-1 overflow-y-auto mt-0 p-2 space-y-2">
          {/* Layout Selection */}
          <LayoutController
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={onTemplateSelect}
            currentBackground={currentBackground}
            cameraSlotStyles={cameraSlotStyles}
            isOpen={layoutsOpen}
            onOpenChange={setLayoutsOpen}
          />

          {/* Camera Size and Borders */}
          <CameraStyler
            selectedTemplate={selectedTemplate}
            cameraScale={cameraScale}
            onCameraScaleChange={onCameraScaleChange}
            cameraSlotStyles={cameraSlotStyles}
            onCameraSlotStyleChange={onCameraSlotStyleChange}
            cameraSizeOpen={cameraSizeOpen}
            onCameraSizeOpenChange={setCameraSizeOpen}
            bordersOpen={bordersOpen}
            onBordersOpenChange={setBordersOpen}
          />

          {/* Speaker Names Style */}
          <SpeakerNameStyler
            speakerNameStyle={speakerNameStyle}
            onSpeakerNameStyleChange={onSpeakerNameStyleChange}
            isOpen={speakerNamesOpen}
            onOpenChange={setSpeakerNamesOpen}
          />
        </TabsContent>

        {/* Background Tab */}
        <TabsContent value="background" className="flex-1 overflow-y-auto mt-0 p-2 space-y-2">
          <BackgroundManager
            webinarId={webinarId}
            currentBackground={currentBackground}
            onBackgroundColorChange={onBackgroundColorChange}
            onBackgroundImageChange={onBackgroundImageChange}
            backgroundColorOpen={backgroundOpen}
            onBackgroundColorOpenChange={setBackgroundOpen}
            savedBgOpen={savedBgOpen}
            onSavedBgOpenChange={setSavedBgOpen}
          />
        </TabsContent>

        {/* Overlays Tab */}
        <TabsContent value="overlays" className="flex-1 overflow-y-auto mt-0 p-2 space-y-2">
          {/* Corner Images */}
          <CornerImageManager
            webinarId={webinarId}
            cornerImages={cornerImages}
            onSetCornerImage={onSetCornerImage}
            onRemoveCornerImage={onRemoveCornerImage}
            onToggleCornerImage={onToggleCornerImage}
            isOpen={cornersOpen}
            onOpenChange={setCornersOpen}
          />

          {/* Text Banners */}
          <TextBannerManager
            textBanners={textBanners}
            onAddTextBanner={onAddTextBanner}
            onUpdateTextBanner={onUpdateTextBanner}
            onRemoveTextBanner={onRemoveTextBanner}
            onShowTextBanner={onShowTextBanner}
            isOpen={textBannersOpen}
            onOpenChange={setTextBannersOpen}
          />
        </TabsContent>

        {/* Configs Tab */}
        <TabsContent value="configs" className="flex-1 overflow-y-auto mt-0 p-2 space-y-2">
          <ScenePresetsManager
            savedSceneConfigs={savedSceneConfigs}
            currentConfigId={currentConfigId}
            isLoadingConfig={isLoadingConfig}
            isSavingConfig={isSavingConfig}
            onSaveSceneConfig={onSaveSceneConfig}
            onLoadSceneConfig={onLoadSceneConfig}
            onDeleteSceneConfig={onDeleteSceneConfig}
            onSetDefaultConfig={onSetDefaultConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SceneControls;
