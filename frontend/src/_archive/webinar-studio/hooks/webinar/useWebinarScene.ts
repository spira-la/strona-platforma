import { useCallback, useState } from 'react';
import type {
  UseWebinarSceneOptions,
  UseWebinarSceneReturn,
  CameraSlotStyle,
  CornerImage,
  TextBanner,
  SpeakerNameStyle,
  SceneState,
  SceneParticipant,
} from './types/webinar-socket.types';

export function useWebinarScene(options: UseWebinarSceneOptions): UseWebinarSceneReturn {
  const { socketRef, sessionId, initialParticipants = [], initialOnSceneIds = [] } = options;

  // Template state
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);

  // Scene participant state
  const [sceneParticipants, setSceneParticipants] = useState<SceneParticipant[]>(initialParticipants);
  const [onSceneIds, setOnSceneIds] = useState<string[]>(initialOnSceneIds);

  // Template actions
  const changeSceneTemplate = useCallback(
    (templateId: string, overlayVisibility?: Record<string, boolean>) => {
      if (socketRef.current?.connected) {
        console.log('[WebinarScene] Emitting change_scene_template:', { sessionId, templateId });
        socketRef.current.emit('change_scene_template', {
          sessionId,
          templateId,
          overlayVisibility,
        });
        // Update local state immediately for responsive UI
        setCurrentTemplateId(templateId);
      } else {
        console.warn('[WebinarScene] Cannot emit change_scene_template: socket not connected');
      }
    },
    [socketRef, sessionId]
  );

  const changeOverlayVisibility = useCallback(
    (overlayId: string, isVisible: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('change_overlay_visibility', {
          sessionId,
          overlayId,
          isVisible,
        });
      }
    },
    [socketRef, sessionId]
  );

  // Broadcast actions
  const broadcastBackground = useCallback(
    (background: { type: string; value: string }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('change_background', { sessionId, background });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastCameraScale = useCallback(
    (cameraScale: number) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('change_camera_scale', { sessionId, cameraScale });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastCameraSlotStyles = useCallback(
    (cameraSlotStyles: CameraSlotStyle[]) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_camera_slot_styles', { sessionId, cameraSlotStyles });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastCornerImages = useCallback(
    (cornerImages: CornerImage[]) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_corner_images', { sessionId, cornerImages });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastTextBanner = useCallback(
    (banner: TextBanner | null) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('show_text_banner', { sessionId, banner });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastSpeakerDisplayNames = useCallback(
    (speakerDisplayNames: Record<string, string>) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_speaker_display_names', { sessionId, speakerDisplayNames });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastSpeakerNameStyle = useCallback(
    (speakerNameStyle: SpeakerNameStyle) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_speaker_name_style', { sessionId, speakerNameStyle });
      }
    },
    [socketRef, sessionId]
  );

  const broadcastFullSceneState = useCallback(
    (sceneState: SceneState) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_scene_state', { sessionId, sceneState });
      }
    },
    [socketRef, sessionId]
  );

  const sendSceneStateToClient = useCallback(
    (targetClientId: string, sceneState: SceneState) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_scene_state_to_client', { targetClientId, sceneState });
      }
    },
    [socketRef]
  );

  const requestSceneState = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request_scene_state', { sessionId });
    }
  }, [socketRef, sessionId]);

  // Participant management actions
  const addToScene = useCallback(
    (userId: string) => {
      console.log('[WebinarScene] addToScene called:', {
        sessionId,
        userId,
        connected: socketRef.current?.connected,
      });
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'add_to_scene',
          { sessionId, userId },
          (response: { success: boolean; error?: string }) => {
            console.log('[WebinarScene] addToScene response:', response);
            if (!response.success) {
              console.warn('[WebinarScene] Failed to add to scene:', response.error);
            }
          }
        );
      } else {
        console.warn('[WebinarScene] Cannot add to scene - socket not connected');
      }
    },
    [socketRef, sessionId]
  );

  const removeFromScene = useCallback(
    (userId: string) => {
      console.log('[WebinarScene] removeFromScene called:', {
        sessionId,
        userId,
        connected: socketRef.current?.connected,
      });
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'remove_from_scene',
          { sessionId, userId },
          (response: { success: boolean; error?: string }) => {
            console.log('[WebinarScene] removeFromScene response:', response);
            if (!response.success) {
              console.warn('[WebinarScene] Failed to remove from scene:', response.error);
            }
          }
        );
      } else {
        console.warn('[WebinarScene] Cannot remove from scene - socket not connected');
      }
    },
    [socketRef, sessionId]
  );

  const getSceneParticipants = useCallback((): Promise<{
    participants: SceneParticipant[];
    onSceneIds: string[];
  } | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        console.warn('[WebinarScene] Cannot get scene participants - socket not connected');
        resolve(null);
        return;
      }

      socketRef.current.emit(
        'get_scene_participants',
        { sessionId },
        (response: {
          success: boolean;
          participants?: SceneParticipant[];
          onSceneIds?: string[];
          error?: string;
        }) => {
          if (response.success && response.participants && response.onSceneIds) {
            setSceneParticipants(response.participants);
            setOnSceneIds(response.onSceneIds);
            resolve({
              participants: response.participants,
              onSceneIds: response.onSceneIds,
            });
          } else {
            console.warn('[WebinarScene] Failed to get scene participants:', response.error);
            resolve(null);
          }
        }
      );
    });
  }, [socketRef, sessionId]);

  return {
    // Template
    changeSceneTemplate,
    changeOverlayVisibility,
    currentTemplateId,
    setCurrentTemplateId,

    // Broadcast
    broadcastBackground,
    broadcastCameraScale,
    broadcastCameraSlotStyles,
    broadcastCornerImages,
    broadcastTextBanner,
    broadcastSpeakerDisplayNames,
    broadcastSpeakerNameStyle,
    broadcastFullSceneState,
    sendSceneStateToClient,
    requestSceneState,

    // Participants
    sceneParticipants,
    onSceneIds,
    setSceneParticipants,
    setOnSceneIds,
    addToScene,
    removeFromScene,
    getSceneParticipants,
  };
}

export default useWebinarScene;
