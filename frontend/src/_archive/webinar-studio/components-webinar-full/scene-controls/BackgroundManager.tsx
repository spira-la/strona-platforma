/**
 * Background Manager
 *
 * Controls for managing scene backgrounds including:
 * - Color picker with presets
 * - Custom color input
 * - Saved background images
 * - Background upload functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Palette,
  Image,
  Check,
  Upload,
  Loader2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { studioAssetsClient, type SavedBackground } from '@/clients/StudioAssetsClient';
import { PRESET_COLORS } from './types';

export interface BackgroundManagerProps {
  webinarId?: string;
  currentBackground?: { type: 'color' | 'image'; value: string };
  onBackgroundColorChange?: (color: string) => void;
  onBackgroundImageChange?: (url: string) => void;
  // Collapsible states
  backgroundColorOpen: boolean;
  onBackgroundColorOpenChange: (open: boolean) => void;
  savedBgOpen: boolean;
  onSavedBgOpenChange: (open: boolean) => void;
}

export function BackgroundManager({
  webinarId,
  currentBackground,
  onBackgroundColorChange,
  onBackgroundImageChange,
  backgroundColorOpen,
  onBackgroundColorOpenChange,
  savedBgOpen,
  onSavedBgOpenChange,
}: BackgroundManagerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Local state
  const [customColor, setCustomColor] = useState(
    currentBackground?.type === 'color' ? currentBackground.value : '#1e293b'
  );
  const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBackground[]>([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);
  const [isUploadingSavedBg, setIsUploadingSavedBg] = useState(false);
  const [backgroundToDelete, setBackgroundToDelete] = useState<SavedBackground | null>(null);

  // Load saved backgrounds for this webinar
  useEffect(() => {
    if (!webinarId) return;

    const loadBackgrounds = async () => {
      setIsLoadingBackgrounds(true);
      try {
        const bgs = await studioAssetsClient.getSavedBackgrounds(webinarId);
        setSavedBackgrounds(bgs);
      } catch (error) {
        console.error('Failed to load saved backgrounds:', error);
      } finally {
        setIsLoadingBackgrounds(false);
      }
    };
    loadBackgrounds();
  }, [webinarId]);

  const handleColorChange = useCallback((color: string) => {
    setCustomColor(color);
    onBackgroundColorChange?.(color);
  }, [onBackgroundColorChange]);

  const handleSavedBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !webinarId) return;

    setIsUploadingSavedBg(true);
    try {
      const saved = await studioAssetsClient.uploadBackground(file, webinarId);
      setSavedBackgrounds(prev => [saved, ...prev]);
      onBackgroundImageChange?.(saved.url);
    } catch (error) {
      console.error('Failed to upload background:', error);
    } finally {
      setIsUploadingSavedBg(false);
    }
    e.target.value = '';
  }, [webinarId, onBackgroundImageChange]);

  const handleDeleteSavedBg = useCallback(async (bg: SavedBackground) => {
    try {
      await studioAssetsClient.deleteBackground(bg.id, bg.storagePath);
      setSavedBackgrounds(prev => prev.filter(b => b.id !== bg.id));
    } catch (error) {
      console.error('Failed to delete background:', error);
    } finally {
      setBackgroundToDelete(null);
    }
  }, []);

  return (
    <>
      {/* Background Colors */}
      <Collapsible open={backgroundColorOpen} onOpenChange={onBackgroundColorOpenChange}>
        <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
          <div className="flex items-center gap-2 w-full">
            <Palette className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
            <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              {t('webinars.scenes.background', 'Background')}
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", backgroundColorOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-2 space-y-3">
            {/* Preset Colors Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={cn(
                    'w-full aspect-square rounded-md border-2 transition-all',
                    currentBackground?.value === color
                      ? 'border-[#5eb8a8] scale-105'
                      : isDark ? 'border-[#5eb8a8]/20 hover:border-[#5eb8a8]/40' : 'border-slate-200 hover:border-slate-300'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className={cn("w-8 h-8 rounded border cursor-pointer bg-transparent", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#000000"
                className={cn("flex-1 h-8 font-mono text-xs", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0]" : "bg-white border-slate-200 text-slate-900")}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Saved Backgrounds */}
      <Collapsible open={savedBgOpen} onOpenChange={onSavedBgOpenChange}>
        <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
          <div className="flex items-center gap-2 w-full">
            <Image className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
            <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              {t('webinars.scenes.savedBackgrounds', 'Saved Backgrounds')}
            </span>
            <span className={cn("text-xs mr-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{savedBackgrounds.length}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", savedBgOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-2 space-y-2">
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleSavedBgUpload}
                disabled={isUploadingSavedBg}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("w-full h-8 border-dashed text-xs", isDark ? "bg-[#1a352f]/30 border-[#5eb8a8]/30 text-[#e8f5f0]/70 hover:bg-[#5eb8a8]/20" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")}
                disabled={isUploadingSavedBg}
              >
                {isUploadingSavedBg ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    {t('webinars.scenes.uploadAndSave', 'Upload & Save')}
                  </>
                )}
              </Button>
            </div>

            {/* Loading State */}
            {isLoadingBackgrounds ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#5eb8a8]" />
              </div>
            ) : savedBackgrounds.length === 0 ? (
              <p className={cn("text-xs text-center py-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                {t('webinars.scenes.noSavedBackgrounds', 'No saved backgrounds')}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {savedBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={cn("relative group aspect-video rounded overflow-hidden border cursor-pointer", isDark ? "border-[#5eb8a8]/20 hover:border-[#5eb8a8]/50" : "border-slate-200 hover:border-slate-300")}
                    onClick={() => onBackgroundImageChange?.(bg.url)}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                    {currentBackground?.value === bg.url && (
                      <div className="absolute inset-0 bg-[#5eb8a8]/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBackgroundToDelete(bg);
                      }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Background Confirmation Dialog */}
      <AlertDialog open={!!backgroundToDelete} onOpenChange={(open) => !open && setBackgroundToDelete(null)}>
        <AlertDialogContent className={cn(isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDark ? "text-[#e8f5f0]" : "text-slate-900")}>
              {t('webinars.scenes.deleteBackground', 'Delete Background')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.scenes.deleteBackgroundConfirm', 'Are you sure you want to delete this background? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(isDark ? "bg-[#1a352f] border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#243f39]" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => backgroundToDelete && handleDeleteSavedBg(backgroundToDelete)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BackgroundManager;
