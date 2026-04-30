/**
 * Corner Image Manager
 *
 * Controls for managing corner overlay images including:
 * - Upload corner images
 * - Select and place images in 4 corners
 * - Toggle visibility
 * - Delete corner images
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CornerUpLeft,
  Check,
  Upload,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  studioAssetsClient,
  type SavedCornerImage,
  type CornerImage,
  type CornerPosition,
} from '@/clients/StudioAssetsClient';
import { CORNER_ICONS, CORNER_POSITIONS } from './types';

export interface CornerImageManagerProps {
  webinarId?: string;
  cornerImages: CornerImage[];
  onSetCornerImage?: (corner: CornerPosition, savedImage: SavedCornerImage) => void;
  onRemoveCornerImage?: (corner: CornerPosition) => void;
  onToggleCornerImage?: (corner: CornerPosition) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CornerImageManager({
  webinarId,
  cornerImages,
  onSetCornerImage,
  onRemoveCornerImage,
  onToggleCornerImage,
  isOpen,
  onOpenChange,
}: CornerImageManagerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Local state
  const [savedCornerImages, setSavedCornerImages] = useState<SavedCornerImage[]>([]);
  const [isLoadingCornerImages, setIsLoadingCornerImages] = useState(false);
  const [isUploadingCornerImage, setIsUploadingCornerImage] = useState(false);
  const [selectedImageForCorner, setSelectedImageForCorner] = useState<SavedCornerImage | null>(null);
  const [cornerImageToDelete, setCornerImageToDelete] = useState<SavedCornerImage | null>(null);

  // Load saved corner images for this webinar
  useEffect(() => {
    if (!webinarId) return;

    const loadCornerImages = async () => {
      setIsLoadingCornerImages(true);
      try {
        const imgs = await studioAssetsClient.getSavedCornerImages(webinarId);
        setSavedCornerImages(imgs);
      } catch (error) {
        console.error('Failed to load saved corner images:', error);
      } finally {
        setIsLoadingCornerImages(false);
      }
    };
    loadCornerImages();
  }, [webinarId]);

  const handleCornerImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !webinarId) return;

    setIsUploadingCornerImage(true);
    try {
      const saved = await studioAssetsClient.uploadCornerImage(file, webinarId);
      setSavedCornerImages(prev => [saved, ...prev]);
    } catch (error) {
      console.error('Failed to upload corner image:', error);
    } finally {
      setIsUploadingCornerImage(false);
    }
    e.target.value = '';
  }, [webinarId]);

  const handleDeleteCornerImage = useCallback(async (img: SavedCornerImage) => {
    try {
      await studioAssetsClient.deleteCornerImage(img.id, img.storagePath);
      setSavedCornerImages(prev => prev.filter(i => i.id !== img.id));
    } catch (error) {
      console.error('Failed to delete corner image:', error);
    } finally {
      setCornerImageToDelete(null);
    }
  }, []);

  const handleSelectCornerPosition = useCallback((corner: CornerPosition) => {
    if (selectedImageForCorner && onSetCornerImage) {
      onSetCornerImage(corner, selectedImageForCorner);
      setSelectedImageForCorner(null);
    }
  }, [selectedImageForCorner, onSetCornerImage]);

  const getCornerImage = useCallback((corner: CornerImage['corner']) => {
    return cornerImages.find(c => c.corner === corner);
  }, [cornerImages]);

  if (!onSetCornerImage) return null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className={cn("w-full p-2 rounded-lg border transition-colors", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 hover:bg-[#1a352f]" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}>
          <div className="flex items-center gap-2 w-full">
            <CornerUpLeft className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
            <span className={cn("font-medium text-sm flex-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              {t('webinars.scenes.cornerImages', 'Corner Images')}
            </span>
            <span className={cn("text-xs mr-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{cornerImages.filter(c => c.url).length}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isDark ? "text-[#e8f5f0]/50" : "text-slate-400", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-2 space-y-3">
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                accept="image/*,image/gif"
                onChange={handleCornerImageUpload}
                disabled={isUploadingCornerImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("w-full h-8 border-dashed text-xs", isDark ? "bg-[#1a352f]/30 border-[#5eb8a8]/30 text-[#e8f5f0]/70 hover:bg-[#5eb8a8]/20" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")}
                disabled={isUploadingCornerImage}
              >
                {isUploadingCornerImage ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    {t('webinars.scenes.uploadCornerImage', 'Upload Image')}
                  </>
                )}
              </Button>
            </div>

            {/* Loading State */}
            {isLoadingCornerImages ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#5eb8a8]" />
              </div>
            ) : savedCornerImages.length === 0 ? (
              <p className={cn("text-xs text-center py-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                {t('webinars.scenes.noSavedCornerImages', 'No saved images')}
              </p>
            ) : (
              <div className="space-y-2">
                <p className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.scenes.selectImageToPlace', 'Select an image to place:')}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {savedCornerImages.map((img) => (
                    <div
                      key={img.id}
                      className={cn(
                        'relative group aspect-square rounded overflow-hidden border cursor-pointer transition-all',
                        selectedImageForCorner?.id === img.id
                          ? 'border-[#5eb8a8] ring-2 ring-[#5eb8a8]/50'
                          : isDark ? 'border-[#5eb8a8]/20 hover:border-[#5eb8a8]/50' : 'border-slate-200 hover:border-slate-300'
                      )}
                      onClick={() => setSelectedImageForCorner(selectedImageForCorner?.id === img.id ? null : img)}
                    >
                      <img src={img.url} alt={img.name} className={cn("w-full h-full object-contain", isDark ? "bg-[#0d1f1c]" : "bg-white")} />
                      {selectedImageForCorner?.id === img.id && (
                        <div className="absolute inset-0 bg-[#5eb8a8]/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCornerImageToDelete(img);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Corner Position Selector */}
            {selectedImageForCorner && (
              <div className={cn("p-2 rounded-lg border", isDark ? "border-[#5eb8a8]/30 bg-[#5eb8a8]/10" : "border-slate-200 bg-slate-50")}>
                <p className={cn("text-xs mb-2", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                  {t('webinars.scenes.selectCornerPosition', 'Select position:')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CORNER_POSITIONS.map((corner) => {
                    const CornerIcon = CORNER_ICONS[corner];
                    const isActive = cornerImages.find(c => c.corner === corner);
                    return (
                      <button
                        key={corner}
                        onClick={() => handleSelectCornerPosition(corner)}
                        className={cn(
                          'p-2 rounded-lg border flex flex-col items-center gap-1 transition-all hover:border-[#5eb8a8]',
                          isActive
                            ? isDark ? 'border-[#5eb8a8]/30 bg-[#5eb8a8]/15' : 'border-[#5eb8a8]/30 bg-[#5eb8a8]/10'
                            : isDark ? 'border-[#5eb8a8]/15 bg-[#1a352f]/30' : 'border-slate-200 bg-slate-50'
                        )}
                      >
                        <div className={cn("w-8 h-6 rounded border relative", isDark ? "border-[#5eb8a8]/20 bg-[#0d1f1c]" : "border-slate-200 bg-white")}>
                          <div
                            className={cn(
                              'absolute w-2.5 h-2.5 rounded-sm overflow-hidden',
                              corner === 'top-left' && 'top-0.5 left-0.5',
                              corner === 'top-right' && 'top-0.5 right-0.5',
                              corner === 'bottom-left' && 'bottom-0.5 left-0.5',
                              corner === 'bottom-right' && 'bottom-0.5 right-0.5'
                            )}
                          >
                            <img src={selectedImageForCorner.url} alt="" className="w-full h-full object-contain" />
                          </div>
                        </div>
                        <span className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                          {t(`webinars.scenes.corners.${corner}`, corner.replace('-', ' '))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Corner Images */}
            {cornerImages.filter(c => c.url).length > 0 && (
              <div className="space-y-2">
                <p className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.scenes.activeCornerImages', 'Active images:')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CORNER_POSITIONS.map((corner) => {
                    const existing = getCornerImage(corner);
                    if (!existing?.url) return null;
                    const CornerIcon = CORNER_ICONS[corner];
                    return (
                      <div key={corner} className={cn("p-2 rounded-lg border", isDark ? "border-[#5eb8a8]/50 bg-[#5eb8a8]/10" : "border-[#5eb8a8]/30 bg-[#5eb8a8]/5")}>
                        <div className="flex items-center gap-2 mb-1">
                          <CornerIcon className="w-3 h-3 text-[#5eb8a8]" />
                          <span className={cn("text-[10px]", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                            {t(`webinars.scenes.corners.${corner}`, corner.replace('-', ' '))}
                          </span>
                        </div>
                        <div className={cn("w-full h-10 rounded border overflow-hidden mb-1", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}>
                          <img src={existing.url} alt="" className={cn("w-full h-full object-contain", isDark ? "bg-[#0d1f1c]" : "bg-white")} />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleCornerImage?.(corner)}
                            className={cn('flex-1 h-5 text-[10px]', existing.isVisible ? 'text-[#5eb8a8]' : 'text-[#e8f5f0]/40')}
                          >
                            {existing.isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveCornerImage?.(corner)}
                            className="w-5 h-5 p-0 text-red-400/60 hover:text-red-400"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Corner Image Confirmation Dialog */}
      <AlertDialog open={!!cornerImageToDelete} onOpenChange={(open) => !open && setCornerImageToDelete(null)}>
        <AlertDialogContent className={cn(isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDark ? "text-[#e8f5f0]" : "text-slate-900")}>
              {t('webinars.scenes.deleteCornerImage', 'Delete Corner Image')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.scenes.deleteCornerImageConfirm', 'Are you sure you want to delete this corner image? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(isDark ? "bg-[#1a352f] border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#243f39]" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cornerImageToDelete && handleDeleteCornerImage(cornerImageToDelete)}
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

export default CornerImageManager;
