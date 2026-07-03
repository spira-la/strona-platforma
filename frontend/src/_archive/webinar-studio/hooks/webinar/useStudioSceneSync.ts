/**
 * useStudioSceneSync Hook
 *
 * Encapsulates all scene state for the WebinarStudio.
 * The studio OWNS this state: it receives remote changes (from other hosts/speakers),
 * exposes setters for local editing, and provides a snapshot for sync callbacks.
 *
 * This replaces ~120 lines of refs + monolithic useEffect + inline handlers
 * in WebinarStudio.tsx with a single hook call.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  CameraSlotStyle,
  CornerImage,
  TextBanner,
  SpeakerNameStyle,
  FullSceneSyncState,
  UseStudioSceneSyncOptions,
  StudioSceneSyncState,
  StudioSceneSyncSetters,
  StudioSceneSyncHandlers,
  UseStudioSceneSyncReturn,
} from './types/webinar-socket.types';
import { DEFAULT_SPEAKER_NAME_STYLE } from '@/clients/StudioAssetsClient';

export function useStudioSceneSync(
  options: UseStudioSceneSyncOptions
): UseStudioSceneSyncReturn {
  const {
    onTemplateChange,
    onOverlayVisibilityChange,
    initialSpeakerDisplayNames,
    initialBackground,
    initialCameraScale,
    initialSpeakerNameStyle,
  } = options;

  // Keep callbacks in refs to avoid stale closures in handlers
  const onTemplateChangeRef = useRef(onTemplateChange);
  const onOverlayVisibilityChangeRef = useRef(onOverlayVisibilityChange);
  useEffect(() => {
    onTemplateChangeRef.current = onTemplateChange;
    onOverlayVisibilityChangeRef.current = onOverlayVisibilityChange;
  }, [onTemplateChange, onOverlayVisibilityChange]);

  // ── State ──────────────────────────────────────────────────
  const [background, setBackground] = useState<{ type: 'color' | 'image'; value: string }>(
    initialBackground ?? { type: 'color', value: '#1e293b' }
  );
  const [cameraScale, setCameraScale] = useState(initialCameraScale ?? 1);
  const [cameraSlotStyles, setCameraSlotStyles] = useState<CameraSlotStyle[]>([]);
  const [cornerImages, setCornerImages] = useState<CornerImage[]>([]);
  const [activeTextBanner, setActiveTextBanner] = useState<TextBanner | null>(null);
  const [speakerDisplayNames, setSpeakerDisplayNames] = useState<Record<string, string>>(
    initialSpeakerDisplayNames ?? {}
  );
  const [speakerNameStyle, setSpeakerNameStyle] = useState<SpeakerNameStyle>(
    initialSpeakerNameStyle ?? DEFAULT_SPEAKER_NAME_STYLE
  );
  const [textBanners, setTextBanners] = useState<TextBanner[]>([]);

  // ── Snapshot ref (always fresh, never stale) ───────────────
  // External values (templateId, overlayVisibility, currentConfigId) are
  // updated via updateSnapshotExtras() called from WebinarStudio
  const snapshotRef = useRef<FullSceneSyncState>({
    background,
    cameraScale,
    cameraSlotStyles,
    cornerImages,
    activeTextBanner,
    overlayVisibility: {},
    speakerDisplayNames,
    speakerNameStyle,
  });

  // Keep snapshot in sync with internal state
  useEffect(() => {
    snapshotRef.current = {
      ...snapshotRef.current,
      background,
      cameraScale,
      cameraSlotStyles,
      cornerImages,
      activeTextBanner,
      speakerDisplayNames,
      speakerNameStyle,
      textBanners,
    };
  }, [background, cameraScale, cameraSlotStyles, cornerImages, activeTextBanner, speakerDisplayNames, speakerNameStyle, textBanners]);

  // ── Handlers for individual remote events ──────────────────
  const handleBackgroundChanged = useCallback((bg: { type: string; value: string }) => {
    setBackground(bg as { type: 'color' | 'image'; value: string });
  }, []);

  const handleCameraScaleChanged = useCallback((scale: number) => {
    setCameraScale(scale);
  }, []);

  const handleCameraSlotStylesUpdated = useCallback((styles: CameraSlotStyle[]) => {
    setCameraSlotStyles(styles);
  }, []);

  const handleCornerImagesUpdated = useCallback((images: CornerImage[]) => {
    setCornerImages(images);
  }, []);

  const handleTextBannerShown = useCallback((banner: TextBanner | null) => {
    setActiveTextBanner(banner);
  }, []);

  const handleSpeakerDisplayNamesUpdated = useCallback((names: Record<string, string>) => {
    setSpeakerDisplayNames(names);
  }, []);

  const handleSpeakerNameStyleUpdated = useCallback((style: SpeakerNameStyle) => {
    setSpeakerNameStyle(style);
  }, []);

  const handleOverlayVisibilityChanged = useCallback((overlayId: string, isVisible: boolean) => {
    onOverlayVisibilityChangeRef.current(overlayId, isVisible);
  }, []);

  const handleSceneTemplateChanged = useCallback((templateId: string, overlayVisibility?: Record<string, boolean>) => {
    onTemplateChangeRef.current(templateId);
    if (overlayVisibility) {
      Object.entries(overlayVisibility).forEach(([overlayId, isVisible]) => {
        onOverlayVisibilityChangeRef.current(overlayId, isVisible);
      });
    }
  }, []);

  // Ref for onFullSceneSyncExtras callback (set by WebinarStudio)
  const onFullSceneSyncExtrasRef = useRef<((sceneState: FullSceneSyncState) => void) | null>(null);

  // ── Full scene sync handler (replaces monolithic useEffect) ──
  const handleFullSceneSync = useCallback((sceneState: FullSceneSyncState) => {
    if (sceneState.templateId) {
      onTemplateChangeRef.current(sceneState.templateId);
    }
    if (sceneState.background) {
      setBackground(sceneState.background as { type: 'color' | 'image'; value: string });
    }
    if (sceneState.cameraScale !== undefined) {
      setCameraScale(sceneState.cameraScale);
    }
    if (sceneState.cameraSlotStyles) {
      setCameraSlotStyles(sceneState.cameraSlotStyles);
    }
    if (sceneState.overlayVisibility) {
      Object.entries(sceneState.overlayVisibility).forEach(([overlayId, isVisible]) => {
        onOverlayVisibilityChangeRef.current(overlayId, isVisible);
      });
    }
    if (sceneState.cornerImages) {
      setCornerImages(sceneState.cornerImages);
    }
    if (sceneState.activeTextBanner !== undefined) {
      setActiveTextBanner(sceneState.activeTextBanner);
    }
    if (sceneState.textBanners) {
      setTextBanners(sceneState.textBanners);
    }
    if (sceneState.speakerNameStyle) {
      setSpeakerNameStyle(sceneState.speakerNameStyle);
    }
    if (sceneState.speakerDisplayNames) {
      setSpeakerDisplayNames(sceneState.speakerDisplayNames);
    }
    // Delegate config-related extras to WebinarStudio's callback
    onFullSceneSyncExtrasRef.current?.(sceneState);
  }, []);

  // ── Snapshot methods ───────────────────────────────────────

  /** Update snapshot with external values not owned by this hook */
  const updateSnapshotExtras = useCallback((extras: {
    templateId?: string;
    overlayVisibility?: Record<string, boolean>;
    currentConfigId?: string | null;
  }) => {
    snapshotRef.current = {
      ...snapshotRef.current,
      ...extras,
    };
  }, []);

  const getSceneStateSnapshot = useCallback(() => {
    return snapshotRef.current;
  }, []);

  // ── Assemble return value ──────────────────────────────────
  const state: StudioSceneSyncState = {
    background,
    cameraScale,
    cameraSlotStyles,
    cornerImages,
    activeTextBanner,
    speakerDisplayNames,
    speakerNameStyle,
    textBanners,
  };

  const setters: StudioSceneSyncSetters = {
    setBackground,
    setCameraScale,
    setCameraSlotStyles,
    setCornerImages,
    setActiveTextBanner,
    setSpeakerDisplayNames,
    setSpeakerNameStyle,
    setTextBanners,
  };

  const handlers: StudioSceneSyncHandlers = {
    handleBackgroundChanged,
    handleCameraScaleChanged,
    handleCameraSlotStylesUpdated,
    handleCornerImagesUpdated,
    handleTextBannerShown,
    handleSpeakerDisplayNamesUpdated,
    handleSpeakerNameStyleUpdated,
    handleOverlayVisibilityChanged,
    handleSceneTemplateChanged,
    handleFullSceneSync,
    getSceneStateSnapshot,
    updateSnapshotExtras,
    onFullSceneSyncExtrasRef,
  };

  return [state, setters, handlers];
}
