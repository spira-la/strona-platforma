import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Square,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  usePresentationSlides,
  PRESENTATION_ACCEPT,
} from '@/hooks/studio/usePresentationSlides';
import {
  usePresentationTrack,
  clampPan,
  type Stroke,
  type PanOffset,
} from '@/hooks/studio/usePresentationTrack';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

// ─────────────────────────────────────────────────
// PresentationManager
//
// Lives inside <LiveKitRoom>. Renders:
// 1. A file picker (triggered by parent)
// 2. An overlay control bar on the video (shown when sharing)
// 3. A pan overlay when zoomed in
// ─────────────────────────────────────────────────

export interface PresentationManagerProps {
  onSharingChange: (isSharing: boolean) => void;
  isNativeScreenShareActive: boolean;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
}

function isInteractiveElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function PresentationManager({
  onSharingChange,
  isNativeScreenShareActive,
  isPopoverOpen,
  onPopoverClose,
}: PresentationManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Zoom + pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const panOffsetRef = useRef<PanOffset>({ x: 0, y: 0 });

  // Pan drag tracking
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Annotations ref (kept for hook signature, unused for now)
  const annotationsRef = useRef<Stroke[]>([]);

  const presentation = usePresentationSlides({
    onPptxNote: () => {
      toast({
        title: t('webinars.presentation.title', 'Presentation'),
        description: t(
          'webinars.presentation.pptxNote',
          'For best results, export as PDF',
        ),
      });
    },
  });

  const currentSlide =
    presentation.slides.length > 0
      ? presentation.slides[presentation.currentIndex]
      : null;

  const track = usePresentationTrack(
    currentSlide,
    zoomLevel,
    panOffsetRef,
    annotationsRef,
  );

  // ── Zoom handlers ──

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
      panOffsetRef.current = clampPan(panOffsetRef.current, next);
      return next;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    panOffsetRef.current = { x: 0, y: 0 };
    track.requestRedraw();
  }, [track]);

  // Reset only pan (not zoom) when changing slides
  useEffect(() => {
    panOffsetRef.current = { x: 0, y: 0 };
  }, [presentation.currentIndex]);

  // Error toast
  useEffect(() => {
    if (presentation.error === 'unsupported') {
      toast({
        title: t('webinars.presentation.title', 'Presentation'),
        description: t(
          'webinars.presentation.unsupported',
          'Unsupported file format',
        ),
        variant: 'destructive',
      });
    }
  }, [presentation.error, toast, t]);

  // Auto-start sharing when slides finish loading
  const prevTotalRef = useRef(0);
  useEffect(() => {
    if (
      presentation.totalSlides > 0 &&
      prevTotalRef.current === 0 &&
      !isNativeScreenShareActive
    ) {
      const autoStart = async () => {
        await track.startSharing();
        onSharingChange(true);
        onPopoverClose();
      };
      autoStart();
    }
    prevTotalRef.current = presentation.totalSlides;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation.totalSlides]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Always close popover when file dialog resolves (pick or cancel)
      onPopoverClose();
      if (file) {
        if (track.isPublishing) {
          track.stopSharing().then(() => {
            prevTotalRef.current = 0;
            presentation.loadFile(file);
          });
        } else {
          prevTotalRef.current = 0;
          presentation.loadFile(file);
        }
      }
      e.target.value = '';
    },
    [presentation, track, onPopoverClose],
  );

  const handleStop = useCallback(async () => {
    await track.stopSharing();
    presentation.clear();
    prevTotalRef.current = 0;
    setZoomLevel(1);
    panOffsetRef.current = { x: 0, y: 0 };
    onSharingChange(false);
  }, [track, presentation, onSharingChange]);

  // Open file dialog when popover opens (only if no slides loaded yet)
  useEffect(() => {
    if (isPopoverOpen && !presentation.isLoading && presentation.totalSlides === 0) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPopoverOpen, presentation.isLoading, presentation.totalSlides]);

  // Global keyboard navigation
  useEffect(() => {
    if (!track.isPublishing || presentation.totalSlides === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveElement(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          presentation.prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          presentation.nextSlide();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleZoomReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    track.isPublishing,
    presentation.totalSlides,
    presentation.prevSlide,
    presentation.nextSlide,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  ]);

  // ── Pan pointer handlers ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoomLevel <= 1) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffsetRef.current.x,
        panY: panOffsetRef.current.y,
      };
    },
    [zoomLevel],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanningRef.current) return;

      const overlay = overlayRef.current;
      if (!overlay) return;

      const rect = overlay.getBoundingClientRect();
      const dx = (e.clientX - panStartRef.current.x) * (CANVAS_WIDTH / rect.width);
      const dy = (e.clientY - panStartRef.current.y) * (CANVAS_HEIGHT / rect.height);

      panOffsetRef.current = clampPan(
        { x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy },
        zoomLevel,
      );
      track.requestRedraw();
    },
    [zoomLevel, track],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    isPanningRef.current = false;
  }, []);

  // Draw slide preview thumbnail
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !currentSlide) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pw = canvas.width;
    const ph = canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, pw, ph);

    const slideAspect = currentSlide.width / currentSlide.height;
    const canvasAspect = pw / ph;

    let dw: number, dh: number, ox: number, oy: number;

    if (slideAspect > canvasAspect) {
      dw = pw;
      dh = pw / slideAspect;
      ox = 0;
      oy = (ph - dh) / 2;
    } else {
      dh = ph;
      dw = ph * slideAspect;
      ox = (pw - dw) / 2;
      oy = 0;
    }

    ctx.drawImage(currentSlide, ox, oy, dw, dh);
  }, [currentSlide]);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={PRESENTATION_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Pan overlay — only when zoomed in */}
      {track.isPublishing && zoomLevel > 1 && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}

      {/* Overlay controls on the video */}
      {track.isPublishing && presentation.totalSlides > 0 && (
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 backdrop-blur-sm rounded-t-lg px-2 sm:px-3 py-1.5 border border-b-0 shadow-lg focus:outline-none max-w-[calc(100vw-0.5rem)]",
            isDark
              ? "bg-[#0d1f1c]/95 border-[#5eb8a8]/20"
              : "bg-white/95 border-slate-300"
          )}
        >
          {/* Slide preview thumbnail - hidden on mobile */}
          <canvas
            ref={previewCanvasRef}
            width={160}
            height={90}
            className="hidden sm:block w-16 h-9 rounded bg-black shrink-0"
          />

          {/* File name + slide counter */}
          <div className="flex flex-col min-w-0">
            <span className={cn("text-[10px] truncate max-w-[80px] sm:max-w-[120px] hidden sm:block", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
              {presentation.fileName}
            </span>
            <span className={cn("text-[10px] sm:text-xs whitespace-nowrap", isDark ? "text-gray-400" : "text-slate-500")}>
              {presentation.currentIndex + 1} / {presentation.totalSlides}
            </span>
          </div>

          {/* Prev */}
          <Button
            variant="ghost"
            size="sm"
            onClick={presentation.prevSlide}
            disabled={presentation.currentIndex === 0}
            className={cn("w-7 h-7 p-0 disabled:opacity-30", isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            title={`${t('webinars.presentation.prev', 'Previous')} (←)`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Next */}
          <Button
            variant="ghost"
            size="sm"
            onClick={presentation.nextSlide}
            disabled={presentation.currentIndex === presentation.totalSlides - 1}
            className={cn("w-7 h-7 p-0 disabled:opacity-30", isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            title={`${t('webinars.presentation.next', 'Next')} (→)`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Divider - hidden on mobile */}
          <div className={cn("hidden sm:block w-px h-5 mx-0.5", isDark ? "bg-[#5eb8a8]/20" : "bg-slate-300")} />

          {/* Zoom out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= ZOOM_MIN}
            className={cn("w-7 h-7 p-0 disabled:opacity-30", isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            title={`${t('webinars.presentation.zoomOut', 'Zoom out')} (-)`}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          {/* Zoom level - hidden on mobile */}
          <span className={cn("hidden sm:inline text-[10px] min-w-[32px] text-center select-none", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom in */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= ZOOM_MAX}
            className={cn("w-7 h-7 p-0 disabled:opacity-30", isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            title={`${t('webinars.presentation.zoomIn', 'Zoom in')} (+)`}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Reset zoom - hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            disabled={zoomLevel === 1}
            className={cn("hidden sm:flex w-7 h-7 p-0 disabled:opacity-30", isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            title={`${t('webinars.presentation.zoomReset', 'Reset zoom')} (0)`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Divider - hidden on mobile */}
          <div className={cn("hidden sm:block w-px h-5 mx-0.5", isDark ? "bg-[#5eb8a8]/20" : "bg-slate-300")} />

          {/* Stop */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="h-7 px-2 gap-1 text-xs"
          >
            <Square className="w-3 h-3" />
            <span className="hidden sm:inline">{t('webinars.presentation.stop', 'Stop Sharing')}</span>
            <span className="sm:hidden">{t('common.stop', 'Stop')}</span>
          </Button>
        </div>
      )}
    </>
  );
}
