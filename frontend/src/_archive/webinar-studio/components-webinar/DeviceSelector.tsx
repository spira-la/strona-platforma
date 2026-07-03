/**
 * Device Selector Components
 *
 * Dialogs for selecting camera and microphone devices for webinar streaming
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Mic, RefreshCw, VideoOff, Volume2, Settings2, AlertTriangle, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export interface DeviceSelectorProps {
  /** Currently selected video device ID */
  selectedVideoDeviceId?: string;
  /** Currently selected audio device ID */
  selectedAudioDeviceId?: string;
  /** Currently selected audio output (speaker) device ID */
  selectedAudioOutputDeviceId?: string;
  /** Called when video device is changed */
  onVideoDeviceChange?: (deviceId: string) => void;
  /** Called when audio device is changed */
  onAudioDeviceChange?: (deviceId: string) => void;
  /** Called when audio output (speaker) device is changed */
  onAudioOutputDeviceChange?: (deviceId: string) => void;
  /** Called when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (defaults to settings button) */
  trigger?: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Check if we're in a secure context (HTTPS or localhost)
 */
function isSecureContext(): boolean {
  // Check for secure context (HTTPS, localhost, or file://)
  if (typeof window !== 'undefined') {
    return window.isSecureContext ||
           window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }
  return false;
}

/**
 * Check if mediaDevices API is available
 */
function isMediaDevicesAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
         navigator.mediaDevices !== undefined &&
         typeof navigator.mediaDevices.getUserMedia === 'function';
}

// Storage key for device preferences
const DEVICE_STORAGE_KEY = 'bwm-webinar-devices';

interface StoredDevicePreferences {
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputDeviceId?: string;
  timestamp: number;
}

/**
 * Check if browser supports audio output device selection (setSinkId)
 */
const supportsAudioOutput = typeof HTMLMediaElement !== 'undefined'
  && 'setSinkId' in HTMLMediaElement.prototype;

/**
 * Hook to persist device selections to localStorage
 */
export function useDevicePersistence() {
  const saveDevicePreferences = useCallback((videoDeviceId: string, audioDeviceId: string, audioOutputDeviceId?: string) => {
    try {
      const data: StoredDevicePreferences = {
        videoDeviceId,
        audioDeviceId,
        audioOutputDeviceId,
        timestamp: Date.now(),
      };
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(data));
      console.log('[DevicePersistence] Saved device preferences:', data);
    } catch (err) {
      console.error('[DevicePersistence] Failed to save preferences:', err);
    }
  }, []);

  const loadDevicePreferences = useCallback((): Partial<StoredDevicePreferences> | null => {
    try {
      const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as StoredDevicePreferences;
        console.log('[DevicePersistence] Loaded device preferences:', data);
        return data;
      }
    } catch (err) {
      console.error('[DevicePersistence] Failed to load preferences:', err);
    }
    return null;
  }, []);

  const clearDevicePreferences = useCallback(() => {
    try {
      localStorage.removeItem(DEVICE_STORAGE_KEY);
      console.log('[DevicePersistence] Cleared device preferences');
    } catch (err) {
      console.error('[DevicePersistence] Failed to clear preferences:', err);
    }
  }, []);

  return {
    saveDevicePreferences,
    loadDevicePreferences,
    clearDevicePreferences,
  };
}

/**
 * Hook to enumerate and manage media devices
 */
export function useMediaDevices() {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  const loadDevices = useCallback(async () => {
    // Check if we're in a secure context
    if (!isSecureContext()) {
      setError('HTTPS required for camera/microphone access');
      setIsSecure(false);
      return;
    }

    // Check if mediaDevices is available
    if (!isMediaDevicesAvailable()) {
      setError('Media devices API not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Stop all tracks after getting permission
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch(() => {
          // Permission denied, but we can still enumerate devices (without labels)
        });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const video: MediaDevice[] = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          kind: 'videoinput' as const,
        }));

      const audio: MediaDevice[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
          kind: 'audioinput' as const,
        }));

      const audioOutput: MediaDevice[] = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${index + 1}`,
          kind: 'audiooutput' as const,
        }));

      setVideoDevices(video);
      setAudioDevices(audio);
      setAudioOutputDevices(audioOutput);
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Listen for device changes
  useEffect(() => {
    // Only add listener if mediaDevices is available
    if (!isMediaDevicesAvailable()) {
      return;
    }

    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [loadDevices]);

  return {
    videoDevices,
    audioDevices,
    audioOutputDevices,
    isLoading,
    error,
    isSecure,
    refreshDevices: loadDevices,
  };
}

/**
 * Device Selector Dialog Component
 */
export function DeviceSelector({
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  selectedAudioOutputDeviceId,
  onVideoDeviceChange,
  onAudioDeviceChange,
  onAudioOutputDeviceChange,
  onOpenChange,
  trigger,
  className,
}: DeviceSelectorProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { saveDevicePreferences } = useDevicePersistence();
  const [open, setOpen] = useState(false);

  // Handle open state change
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  }, [onOpenChange]);
  const [localVideoDeviceId, setLocalVideoDeviceId] = useState(selectedVideoDeviceId || '');
  const [localAudioDeviceId, setLocalAudioDeviceId] = useState(selectedAudioDeviceId || '');
  const [localAudioOutputDeviceId, setLocalAudioOutputDeviceId] = useState(selectedAudioOutputDeviceId || '');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const audioLevelRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Callback ref for video element
  const videoPreviewRef = useCallback((node: HTMLVideoElement | null) => {
    setVideoElement(node);
  }, []);

  const { videoDevices, audioDevices, audioOutputDevices, isLoading, error: deviceError, isSecure, refreshDevices } = useMediaDevices();

  // Set default devices when loaded
  useEffect(() => {
    if (videoDevices.length > 0 && !localVideoDeviceId) {
      setLocalVideoDeviceId(videoDevices[0].deviceId);
    }
    if (audioDevices.length > 0 && !localAudioDeviceId) {
      setLocalAudioDeviceId(audioDevices[0].deviceId);
    }
    if (audioOutputDevices.length > 0 && !localAudioOutputDeviceId) {
      setLocalAudioOutputDeviceId(audioOutputDevices[0].deviceId);
    }
  }, [videoDevices, audioDevices, audioOutputDevices, localVideoDeviceId, localAudioDeviceId, localAudioOutputDeviceId]);

  // Connect video stream to video element when both are ready
  useEffect(() => {
    if (videoElement && videoStream && videoStream.getVideoTracks().length > 0) {
      console.log('[DeviceSelector] Connecting video stream to video element');
      videoElement.srcObject = videoStream;
      videoElement.play().then(() => {
        console.log('[DeviceSelector] Video playing');
      }).catch((err) => {
        console.error('[DeviceSelector] Failed to play video:', err);
      });
    }
  }, [videoElement, videoStream]);

  // Cleanup all streams and audio context when dialog closes
  useEffect(() => {
    if (!open) {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
        setVideoStream(null);
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Start video preview when dialog opens or video device changes
  useEffect(() => {
    if (!open || !isSecure || !isMediaDevicesAvailable() || !localVideoDeviceId) return;

    let cancelled = false;

    const startVideoPreview = async () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const strategies: MediaStreamConstraints[] = [
        { video: { deviceId: isMobileDevice ? { ideal: localVideoDeviceId } : { exact: localVideoDeviceId } }, audio: false },
      ];
      if (isMobileDevice) {
        strategies.push({ video: { facingMode: 'user' }, audio: false });
      }
      strategies.push({ video: true, audio: false });

      let stream: MediaStream | null = null;
      for (const constraints of strategies) {
        try {
          console.log('[DeviceSelector] Trying video constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('[DeviceSelector] Video access successful');
          break;
        } catch (err) {
          console.warn('[DeviceSelector] Video constraint failed:', constraints, err);
        }
      }

      if (cancelled) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      if (stream) {
        setVideoStream((prev) => {
          prev?.getTracks().forEach((track) => track.stop());
          return stream;
        });
      }
    };

    startVideoPreview();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, localVideoDeviceId, isSecure]);

  // Start audio preview when dialog opens or audio device changes
  useEffect(() => {
    if (!open || !isSecure || !isMediaDevicesAvailable() || !localAudioDeviceId) return;

    let cancelled = false;

    const startAudioPreview = async () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const strategies: MediaStreamConstraints[] = [
        { video: false, audio: { deviceId: isMobileDevice ? { ideal: localAudioDeviceId } : { exact: localAudioDeviceId } } },
      ];
      strategies.push({ video: false, audio: true });

      let stream: MediaStream | null = null;
      for (const constraints of strategies) {
        try {
          console.log('[DeviceSelector] Trying audio constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('[DeviceSelector] Audio access successful');
          break;
        } catch (err) {
          console.warn('[DeviceSelector] Audio constraint failed:', constraints, err);
        }
      }

      if (cancelled) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      if (stream) {
        setAudioStream((prev) => {
          prev?.getTracks().forEach((track) => track.stop());
          return stream;
        });
        setupAudioMeter(stream);
      }
    };

    startAudioPreview();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, localAudioDeviceId, isSecure]);

  // Audio level visualization
  const setupAudioMeter = useCallback((stream: MediaStream) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      if (!analyserRef.current || !audioLevelRef.current) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(100, (average / 128) * 100);

      audioLevelRef.current.style.width = `${level}%`;

      animationFrameRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (localVideoDeviceId && onVideoDeviceChange) {
      onVideoDeviceChange(localVideoDeviceId);
    }
    if (localAudioDeviceId && onAudioDeviceChange) {
      onAudioDeviceChange(localAudioDeviceId);
    }
    if (localAudioOutputDeviceId && onAudioOutputDeviceChange) {
      onAudioOutputDeviceChange(localAudioOutputDeviceId);
    }
    // Save to localStorage for persistence across sessions
    saveDevicePreferences(localVideoDeviceId, localAudioDeviceId, localAudioOutputDeviceId);
    handleOpenChange(false);
  }, [localVideoDeviceId, localAudioDeviceId, localAudioOutputDeviceId, onVideoDeviceChange, onAudioDeviceChange, onAudioOutputDeviceChange, handleOpenChange, saveDevicePreferences]);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'gap-2',
        isDark
          ? 'bg-[#0d1f1c]/80 border-[#5eb8a8]/30 text-[#e8f5f0] hover:bg-[#2a7a6f]/20'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100',
        className
      )}
    >
      <Settings2 className="w-4 h-4" />
      {t('webinars.deviceSettings', 'Device Settings')}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        "w-[calc(100vw-2rem)] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6",
        isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/30" : "bg-white border-slate-200"
      )}>
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className={cn("flex items-center gap-2 text-base sm:text-lg", isDark ? "text-white" : "text-slate-900")}>
            <Settings2 className={cn("w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
            {t('webinars.deviceSettings', 'Device Settings')}
          </DialogTitle>
          <DialogDescription className={cn("text-xs sm:text-sm", isDark ? "text-[#e8f5f0]/70" : "text-slate-600")}>
            {t('webinars.deviceSettingsDescription', 'Select your camera and microphone for the webinar')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 py-3 sm:py-4">
          {/* HTTPS Warning */}
          {!isSecure && (
            <Alert className="bg-yellow-900/30 border-yellow-500/50 p-3 sm:p-4">
              <Lock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <AlertTitle className="text-yellow-400 text-sm sm:text-base">
                {t('webinars.httpsRequired', 'HTTPS Required')}
              </AlertTitle>
              <AlertDescription className="text-yellow-200/80 text-xs sm:text-sm">
                {t('webinars.httpsRequiredDescription', 'Camera and microphone access requires a secure connection (HTTPS). Please access this page via HTTPS or localhost.')}
              </AlertDescription>
            </Alert>
          )}

          {/* Device Error */}
          {deviceError && isSecure && (
            <Alert className="bg-red-900/30 border-red-500/50 p-3 sm:p-4">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <AlertDescription className="text-red-200/80 text-xs sm:text-sm">
                {deviceError}
              </AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          <div className="space-y-2 sm:space-y-3">
            <Label className={cn("flex items-center gap-2 text-sm sm:text-base", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              <Camera className="w-4 h-4 flex-shrink-0" />
              {t('webinars.camera', 'Camera')}
            </Label>
            {/* Responsive video preview - smaller on mobile */}
            <div className="aspect-video max-h-[30vh] sm:max-h-[40vh] bg-black rounded-lg overflow-hidden relative">
              {videoStream ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className={cn("flex items-center justify-center h-full", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                  {!isSecure ? (
                    <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                  ) : (
                    <VideoOff className="w-6 h-6 sm:w-8 sm:h-8" />
                  )}
                </div>
              )}
            </div>
            <Select
              value={localVideoDeviceId}
              onValueChange={setLocalVideoDeviceId}
              disabled={isLoading || videoDevices.length === 0 || !isSecure}
            >
              <SelectTrigger className={cn("h-9 sm:h-10 text-sm", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30 text-[#e8f5f0]" : "bg-slate-50 border-slate-200 text-slate-700")}>
                <SelectValue placeholder={t('webinars.selectCamera', 'Select camera')} />
              </SelectTrigger>
              <SelectContent className={cn("max-h-[200px]", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30" : "bg-white border-slate-200")}>
                {videoDevices.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className={cn("text-sm", isDark ? "text-[#e8f5f0] focus:bg-[#2a7a6f]/20 focus:text-[#e8f5f0]" : "text-slate-700 focus:bg-slate-100")}
                  >
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audio Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className={cn("flex items-center gap-2 text-sm sm:text-base", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              <Mic className="w-4 h-4 flex-shrink-0" />
              {t('webinars.microphone', 'Microphone')}
            </Label>
            {/* Audio level meter */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Volume2 className={cn("w-4 h-4 flex-shrink-0", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
              <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isDark ? "bg-[#1a352f]" : "bg-slate-100")}>
                <div
                  ref={audioLevelRef}
                  className={cn("h-full transition-all duration-75", isDark ? "bg-gradient-to-r from-[#5eb8a8] to-[#2a7a6f]" : "bg-gradient-to-r from-[#285f59] to-[#2a7a6f]")}
                  style={{ width: '0%' }}
                />
              </div>
            </div>
            <Select
              value={localAudioDeviceId}
              onValueChange={setLocalAudioDeviceId}
              disabled={isLoading || audioDevices.length === 0 || !isSecure}
            >
              <SelectTrigger className={cn("h-9 sm:h-10 text-sm", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30 text-[#e8f5f0]" : "bg-slate-50 border-slate-200 text-slate-700")}>
                <SelectValue placeholder={t('webinars.selectMicrophone', 'Select microphone')} />
              </SelectTrigger>
              <SelectContent className={cn("max-h-[200px]", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30" : "bg-white border-slate-200")}>
                {audioDevices.map((device) => (
                  <SelectItem
                    key={device.deviceId}
                    value={device.deviceId}
                    className={cn("text-sm", isDark ? "text-[#e8f5f0] focus:bg-[#2a7a6f]/20 focus:text-[#e8f5f0]" : "text-slate-700 focus:bg-slate-100")}
                  >
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker (Audio Output) Selection */}
          {supportsAudioOutput && audioOutputDevices.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <Label className={cn("flex items-center gap-2 text-sm sm:text-base", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                <Volume2 className="w-4 h-4 flex-shrink-0" />
                {t('webinars.speaker', 'Speaker')}
              </Label>
              <Select
                value={localAudioOutputDeviceId}
                onValueChange={setLocalAudioOutputDeviceId}
                disabled={isLoading || audioOutputDevices.length === 0 || !isSecure}
              >
                <SelectTrigger className={cn("h-9 sm:h-10 text-sm", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30 text-[#e8f5f0]" : "bg-slate-50 border-slate-200 text-slate-700")}>
                  <SelectValue placeholder={t('webinars.selectSpeaker', 'Select speaker')} />
                </SelectTrigger>
                <SelectContent className={cn("max-h-[200px]", isDark ? "bg-[#1a352f] border-[#5eb8a8]/30" : "bg-white border-slate-200")}>
                  {audioOutputDevices.map((device) => (
                    <SelectItem
                      key={device.deviceId}
                      value={device.deviceId}
                      className={cn("text-sm", isDark ? "text-[#e8f5f0] focus:bg-[#2a7a6f]/20 focus:text-[#e8f5f0]" : "text-slate-700 focus:bg-slate-100")}
                    >
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDevices}
            disabled={isLoading || !isSecure}
            className={cn(
              "w-full sm:w-fit h-9 text-sm",
              isDark
                ? "bg-[#0d1f1c]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            )}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            {t('webinars.refreshDevices', 'Refresh Devices')}
          </Button>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className={cn(
              "w-full sm:w-auto h-9 sm:h-10 text-sm",
              isDark
                ? "bg-[#0d1f1c]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            )}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className={cn(
              "w-full sm:w-auto text-white h-9 sm:h-10 text-sm",
              isDark
                ? "bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#1d5c54]"
                : "bg-gradient-to-r from-[#285f59] to-[#1d4a45] hover:from-[#1d4a45] hover:to-[#285f59]"
            )}
          >
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeviceSelector;
