import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track, LocalVideoTrack } from 'livekit-client';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

/** How long annotations remain visible (ms) */
export const ANNOTATION_FADE_MS = 3000;
/** Annotations start fading after this time (ms) */
const ANNOTATION_FADE_START_MS = 2000;

export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  createdAt: number;
}

export interface PanOffset {
  x: number;
  y: number;
}

function renderCanvas(
  ctx: CanvasRenderingContext2D,
  slide: ImageBitmap,
  zoomLevel: number,
  panOffset: PanOffset,
  annotations: Stroke[],
  now: number,
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const slideAspect = slide.width / slide.height;
  const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

  let dw: number, dh: number, ox: number, oy: number;
  if (slideAspect > canvasAspect) {
    dw = CANVAS_WIDTH;
    dh = CANVAS_WIDTH / slideAspect;
    ox = 0;
    oy = (CANVAS_HEIGHT - dh) / 2;
  } else {
    dh = CANVAS_HEIGHT;
    dw = CANVAS_HEIGHT * slideAspect;
    ox = (CANVAS_WIDTH - dw) / 2;
    oy = 0;
  }

  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;

  // Apply zoom + pan — slide and annotations share the same coordinate space
  ctx.save();
  ctx.translate(cx + panOffset.x, cy + panOffset.y);
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(-cx, -cy);

  ctx.drawImage(slide, ox, oy, dw, dh);

  // Draw annotations inside the zoom transform so they track the content
  for (const stroke of annotations) {
    const age = now - stroke.createdAt;
    if (age >= ANNOTATION_FADE_MS || stroke.points.length < 2) continue;

    let opacity = 1;
    if (age > ANNOTATION_FADE_START_MS) {
      opacity =
        1 -
        (age - ANNOTATION_FADE_START_MS) /
          (ANNOTATION_FADE_MS - ANNOTATION_FADE_START_MS);
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width / zoomLevel; // constant visual thickness
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Convert overlay pointer coordinates to canvas (pre-zoom/pan) coordinates.
 * Uses direct linear mapping — the overlay div covers the same area as the
 * video element, so no aspect-ratio compensation is needed.
 */
export function mapOverlayToCanvas(
  clientX: number,
  clientY: number,
  overlayRect: DOMRect,
  zoomLevel: number,
  panOffset: PanOffset,
): { x: number; y: number } {
  // Direct linear mapping: overlay position → canvas position
  const displayX =
    ((clientX - overlayRect.left) / overlayRect.width) * CANVAS_WIDTH;
  const displayY =
    ((clientY - overlayRect.top) / overlayRect.height) * CANVAS_HEIGHT;

  // Inverse zoom + pan to get canvas-space coordinates
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const canvasX = (displayX - cx - panOffset.x) / zoomLevel + cx;
  const canvasY = (displayY - cy - panOffset.y) / zoomLevel + cy;

  return { x: canvasX, y: canvasY };
}

/**
 * Clamp a pan offset so the zoomed content doesn't leave the viewport.
 */
export function clampPan(pan: PanOffset, zoomLevel: number): PanOffset {
  const maxPanX = (CANVAS_WIDTH * (zoomLevel - 1)) / 2;
  const maxPanY = (CANVAS_HEIGHT * (zoomLevel - 1)) / 2;
  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
  };
}

export interface UsePresentationTrackReturn {
  startSharing: () => Promise<void>;
  stopSharing: () => Promise<void>;
  isPublishing: boolean;
  requestRedraw: () => void;
}

export function usePresentationTrack(
  currentSlide: ImageBitmap | null,
  zoomLevel: number,
  panOffsetRef: React.RefObject<PanOffset>,
  annotationsRef: React.RefObject<Stroke[]>,
): UsePresentationTrackReturn {
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const trackRef = useRef<LocalVideoTrack | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize canvas lazily
  if (!canvasRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext('2d');
  }

  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !currentSlide) return;

    renderCanvas(
      ctx,
      currentSlide,
      zoomLevel,
      panOffsetRef.current ?? { x: 0, y: 0 },
      annotationsRef.current ?? [],
      Date.now(),
    );

    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack && 'requestFrame' in videoTrack) {
      (videoTrack as any).requestFrame();
    }
  }, [currentSlide, zoomLevel, panOffsetRef, annotationsRef]);

  // Redraw when slide or zoom changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const requestRedraw = useCallback(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const startSharing = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !localParticipant || !currentSlide) return;

    try {
      renderCanvas(
        ctx,
        currentSlide,
        zoomLevel,
        panOffsetRef.current ?? { x: 0, y: 0 },
        [],
        Date.now(),
      );

      const stream = canvas.captureStream(0);
      const mediaTrack = stream.getVideoTracks()[0];
      if (!mediaTrack) {
        console.error('[usePresentationTrack] No video track from canvas capture');
        return;
      }

      if ('requestFrame' in mediaTrack) {
        (mediaTrack as any).requestFrame();
      }

      streamRef.current = stream;

      const localTrack = new LocalVideoTrack(mediaTrack);
      trackRef.current = localTrack;

      await localParticipant.publishTrack(localTrack, {
        source: Track.Source.ScreenShare,
        name: 'presentation',
      });

      setIsPublishing(true);
      console.log('[usePresentationTrack] Published presentation track');

      // Force multiple redraws to ensure the first slide is properly displayed
      // This fixes an issue where the first frame might not be captured/displayed
      setTimeout(() => {
        if (currentSlide && ctx) {
          renderCanvas(ctx, currentSlide, zoomLevel, panOffsetRef.current ?? { x: 0, y: 0 }, [], Date.now());
          if ('requestFrame' in mediaTrack) {
            (mediaTrack as any).requestFrame();
          }
        }
      }, 100);
      setTimeout(() => {
        if (currentSlide && ctx) {
          renderCanvas(ctx, currentSlide, zoomLevel, panOffsetRef.current ?? { x: 0, y: 0 }, [], Date.now());
          if ('requestFrame' in mediaTrack) {
            (mediaTrack as any).requestFrame();
          }
        }
      }, 300);
    } catch (err) {
      console.error('[usePresentationTrack] Failed to publish track:', err);
      setIsPublishing(false);
    }
  }, [localParticipant, currentSlide, zoomLevel, panOffsetRef]);

  const stopSharing = useCallback(async () => {
    if (trackRef.current && localParticipant) {
      try {
        await localParticipant.unpublishTrack(trackRef.current);
      } catch (err) {
        console.error('[usePresentationTrack] Failed to unpublish track:', err);
      }
      trackRef.current.stop();
      trackRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsPublishing(false);
    console.log('[usePresentationTrack] Stopped presentation track');
  }, [localParticipant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    startSharing,
    stopSharing,
    isPublishing,
    requestRedraw,
  };
}
