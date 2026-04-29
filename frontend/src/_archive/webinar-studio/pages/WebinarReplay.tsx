/**
 * WebinarReplay Page
 *
 * Page for watching recorded webinar sessions.
 * Features:
 * - Purchase verification via useWebinarPurchase hook
 * - HTML5 native video player with custom controls
 * - Play/pause, seek, volume, fullscreen controls
 * - Progress display and time formatting
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  AlertCircle,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ListVideo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWebinarPurchase } from '@/hooks/useWebinarPurchase';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { webinarsClient } from '@/clients/WebinarsClient';
import type { WebinarSession, WebinarProduct, RecordingSegment } from '@/domain/products/models/webinar.model';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Detect iOS devices (Safari, Chrome, any browser on iOS uses WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Format seconds into human-readable time string
 * @param seconds - Time in seconds
 * @returns Formatted time string (mm:ss or hh:mm:ss)
 */
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function WebinarReplay() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Data state
  const [session, setSession] = useState<WebinarSession | null>(null);
  const [webinar, setWebinar] = useState<WebinarProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Multi-segment support
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [showSegmentList, setShowSegmentList] = useState(false);

  // Controls hide timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available recording segments (filter for 'available' status)
  const availableSegments = useMemo(() => {
    if (!session?.recordingSegments?.length) return [];
    return session.recordingSegments
      .filter(seg => seg.status === 'available' && seg.url)
      .sort((a, b) => a.segmentNumber - b.segmentNumber);
  }, [session?.recordingSegments]);

  // Current segment URL - prioritize segments over legacy single recording
  const currentVideoUrl = useMemo(() => {
    if (availableSegments.length > 0) {
      return availableSegments[currentSegmentIndex]?.url || null;
    }
    // Fallback to legacy single recording
    return session?.recordingUrl || null;
  }, [availableSegments, currentSegmentIndex, session?.recordingUrl]);

  // Check if we have any available recordings
  const hasAvailableRecordings = useMemo(() => {
    return availableSegments.length > 0 || (session?.recordingStatus === 'available' && session?.recordingUrl);
  }, [availableSegments.length, session?.recordingStatus, session?.recordingUrl]);

  // Check access using the webinar purchase hook
  const { hasAccess, isLoading: checkingAccess } = useWebinarPurchase({
    sessionId: sessionId || '',
  });

  // Fetch session and webinar data
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const sessionData = await webinarSessionsClient.getSessionById(sessionId);
        if (!sessionData) {
          setError(t('common.notFound', 'Not found'));
          return;
        }
        setSession(sessionData);

        // Fetch webinar details
        const webinarData = await webinarsClient.getWebinarById(sessionData.webinarId);
        setWebinar(webinarData);
      } catch (err) {
        console.error('Error fetching webinar replay data:', err);
        setError(t('common.error', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId, t]);

  // Handle fullscreen changes from browser (skip for iOS - we use pseudo-fullscreen)
  useEffect(() => {
    if (isIOS()) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup pseudo-fullscreen on unmount (iOS)
  useEffect(() => {
    return () => {
      if (isIOS()) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Reset timer when playing state changes
  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimer]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current && duration > 0) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume || 1;
      }
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    // On iOS, use pseudo-fullscreen (CSS-based) since requestFullscreen() doesn't work on divs
    if (isIOS()) {
      if (!isFullscreen) {
        setIsFullscreen(true);
        document.body.style.overflow = 'hidden';
      } else {
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
      return;
    }

    // Standard fullscreen API for other browsers
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  }, [duration]);

  // Segment navigation for multi-segment recordings
  const goToPreviousSegment = useCallback(() => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(prev => prev - 1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [currentSegmentIndex]);

  const goToNextSegment = useCallback(() => {
    if (currentSegmentIndex < availableSegments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [currentSegmentIndex, availableSegments.length]);

  const goToSegment = useCallback((index: number) => {
    if (index >= 0 && index < availableSegments.length) {
      setCurrentSegmentIndex(index);
      setCurrentTime(0);
      setIsPlaying(false);
      setShowSegmentList(false);
    }
  }, [availableSegments.length]);

  // Auto-play next segment when current one ends
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next segment if available
      if (availableSegments.length > 1 && currentSegmentIndex < availableSegments.length - 1) {
        goToNextSegment();
        // Small delay before playing next segment
        setTimeout(() => {
          videoRef.current?.play();
        }, 500);
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [currentSegmentIndex, availableSegments.length, goToNextSegment]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, skipBackward, skipForward, toggleMute, toggleFullscreen]);

  // Loading state
  if (isLoading || checkingAccess) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className={cn("w-10 h-10 animate-spin", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              <p className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>{t('global.loading', 'Loading')}</p>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // No access - show purchase required message
  if (!hasAccess) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <div className="text-center max-w-md px-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
                {t('webinars.accessDenied', 'Access Denied')}
              </h2>
              <p className={cn("mb-6", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                {t('webinars.purchaseRequired', 'You need to purchase this webinar to watch the recording.')}
              </p>
              <Button
                onClick={() => navigate('/webinars')}
                className={cn("text-white", isDark ? "bg-gradient-to-r from-[#285f59] to-[#1a352f]" : "bg-[#285f59]")}
              >
                {t('webinars.browseWebinars', 'Browse Webinars')}
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Link to="/my-webinars">
                <Button variant="outline" className={cn(isDark ? "border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "border-slate-300 text-slate-700 hover:bg-[#285f59]/10")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back', 'Back')}
                </Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // No recording available - show session info with message
  if (!hasAvailableRecordings) {
    const sessionDate = new Date(session?.scheduledAt || '');
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          {/* Cover Image */}
          {webinar?.coverUrl && (
            <div className="mb-8 max-w-2xl mx-auto">
              <img
                src={webinar.coverUrls?.large || webinar.coverUrl}
                alt={webinar.name}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>
          )}

          {/* Recording Status */}
          <Card className={cn("max-w-2xl mx-auto mb-6", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
            <CardContent className="p-6 text-center">
              <AlertCircle className={cn("h-12 w-12 mx-auto mb-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              <h2 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
                {t('webinars.replay.notAvailableTitle', 'Recording Not Available')}
              </h2>
              <p className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                {session?.recordingStatus === 'processing'
                  ? t('webinars.replay.processing', 'The recording is being processed. Please check back soon.')
                  : t('webinars.replay.notAvailable', 'Recording is not available yet. Please check back later.')}
              </p>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className={cn("max-w-2xl mx-auto", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
            <CardContent className="p-6">
              <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h2>
              <div
                className={cn("mb-6 [&>p]:mb-2", isDark ? "text-[#e8f5f0]/80" : "text-slate-600")}
                dangerouslySetInnerHTML={{ __html: webinar?.description || '' }}
              />
              <div className={cn("flex flex-wrap items-center gap-4 text-sm pt-4 border-t", isDark ? "text-[#e8f5f0]/60 border-[#285f59]/30" : "text-slate-500 border-slate-200")}>
                <span className="flex items-center gap-2">
                  <span className={cn("font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{t('webinars.host', 'Host')}:</span>
                  {webinar?.host?.name}
                </span>
                <span>•</span>
                <span>{webinar?.duration || 0} min</span>
                <span>•</span>
                <span>
                  {sessionDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950" : "bg-slate-50")}>
      <div className="min-h-screen flex flex-col">
        <Header variant="page" />
        <main className="flex-1 pt-20">
          {/* Webinar Info Bar */}
          <div className={cn("border-b py-3", isDark ? "bg-slate-900/80 border-[#285f59]/30" : "bg-white border-slate-200")}>
            <div className="container mx-auto px-4 flex items-center gap-4">
              <Link to="/my-webinars">
                <Button variant="ghost" size="icon" className={cn(isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-[#285f59]/10")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className={cn("font-semibold line-clamp-1", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h1>
                <p className={cn("text-sm", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
                  {t('webinars.replay.title', 'Replay')} - {webinar?.host?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Video Player Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative bg-black flex items-center justify-center',
          isFullscreen && !isIOS() && 'h-screen',
          isFullscreen && isIOS() && 'fixed inset-0 z-[9999] w-screen h-screen',
          !isFullscreen && 'aspect-video max-h-[calc(100vh-200px)]'
        )}
        onMouseMove={resetControlsTimer}
        onClick={resetControlsTimer}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={currentVideoUrl || ''}
          className="max-w-full max-h-full w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          playsInline
        />

        {/* Segment indicator for multi-segment recordings */}
        {availableSegments.length > 1 && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Badge
              className="bg-black/70 text-white border-0 cursor-pointer hover:bg-black/90"
              onClick={() => setShowSegmentList(!showSegmentList)}
            >
              <ListVideo className="w-3 h-3 mr-1" />
              {t('webinars.replay.segment', 'Part')} {currentSegmentIndex + 1}/{availableSegments.length}
            </Badge>
          </div>
        )}

        {/* Segment list dropdown */}
        {showSegmentList && availableSegments.length > 1 && (
          <div className="absolute top-12 right-4 bg-black/90 rounded-lg p-2 max-h-60 overflow-y-auto z-20">
            {availableSegments.map((segment, index) => (
              <button
                key={segment.id}
                onClick={() => goToSegment(index)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                  index === currentSegmentIndex
                    ? cn(isDark ? 'bg-[#5eb8a8]/50' : 'bg-[#285f59]/50', 'text-white')
                    : 'text-white/80 hover:bg-white/10'
                )}
              >
                {t('webinars.replay.segment', 'Part')} {index + 1}
                {segment.duration && (
                  <span className="text-white/50 ml-2">({formatTime(segment.duration)})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        )}

        {/* Click to play/pause overlay */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={(e) => {
            // Prevent click if clicking on controls
            if ((e.target as HTMLElement).closest('.video-controls')) {
              return;
            }
            togglePlay();
          }}
        />

        {/* Large Play Button (when paused) */}
        {!isPlaying && !isBuffering && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-10 h-10 text-black ml-1" />
            </div>
          </button>
        )}

        {/* Controls overlay */}
        <div
          className={cn(
            'video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Previous Segment (only for multi-segment) */}
              {availableSegments.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousSegment}
                  disabled={currentSegmentIndex === 0}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 disabled:opacity-30"
                  title={t('webinars.replay.previousPart', 'Previous Part')}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              )}

              {/* Skip Back 10s */}
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </Button>

              {/* Skip Forward 10s */}
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Next Segment (only for multi-segment) */}
              {availableSegments.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextSegment}
                  disabled={currentSegmentIndex === availableSegments.length - 1}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10 disabled:opacity-30"
                  title={t('webinars.replay.nextPart', 'Next Part')}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              )}

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Mobile volume button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="sm:hidden text-white hover:bg-white/20 h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

          {/* Info section (hidden in fullscreen) */}
          {!isFullscreen && (
            <div className="container mx-auto px-4 py-6">
              <Card className={cn(isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
                <CardContent className="pt-6">
                  <h2 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h2>
                  <div
                    className={cn("mb-4 [&>p]:mb-2", isDark ? "text-[#e8f5f0]/80" : "text-slate-600")}
                    dangerouslySetInnerHTML={{ __html: webinar?.description || '' }}
                  />
                  <div className={cn("flex flex-wrap items-center gap-4 text-sm pt-4 border-t", isDark ? "text-[#e8f5f0]/60 border-[#285f59]/30" : "text-slate-500 border-slate-200")}>
                    <span>
                      {t('webinars.host', 'Host')}: {webinar?.host?.name}
                    </span>
                    <span>•</span>
                    <span>
                      {session?.recordingDuration
                        ? formatTime(session.recordingDuration)
                        : `${webinar?.duration || 0} min`}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(session?.scheduledAt || '').toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
