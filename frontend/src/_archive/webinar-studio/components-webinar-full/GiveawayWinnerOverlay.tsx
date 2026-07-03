import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import type { GiveawayWinner } from '@/hooks/webinar/types/webinar-socket.types';

const MEDAL_CONFIG = {
  1: {
    emoji: '\u{1F947}',
    labelKey: 'webinars.giveaway.place1',
    gradient: 'from-yellow-400 to-amber-600',
    glowColor: 'shadow-yellow-500/50',
    confettiColors: ['#FFD700', '#FFA500', '#FFE066'],
  },
  2: {
    emoji: '\u{1F948}',
    labelKey: 'webinars.giveaway.place2',
    gradient: 'from-gray-300 to-gray-500',
    glowColor: 'shadow-gray-400/50',
    confettiColors: ['#C0C0C0', '#A8A8A8', '#E8E8E8'],
  },
  3: {
    emoji: '\u{1F949}',
    labelKey: 'webinars.giveaway.place3',
    gradient: 'from-amber-600 to-amber-800',
    glowColor: 'shadow-amber-600/50',
    confettiColors: ['#CD7F32', '#B87333', '#DA9255'],
  },
} as const;

interface GiveawayWinnerOverlayProps {
  winner: GiveawayWinner;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function GiveawayWinnerOverlay({
  winner,
  onDismiss,
  autoDismissMs = 10000,
}: GiveawayWinnerOverlayProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { mode: performanceMode, gpuTier } = usePerformanceMode();
  const [ConfettiComponent, setConfettiComponent] = useState<React.ComponentType<any> | null>(null);
  const [progress, setProgress] = useState(100);

  const medal = MEDAL_CONFIG[winner.place];

  // Skip confetti entirely on minimal performance or low GPU tier
  const showConfetti = performanceMode !== 'minimal' && gpuTier >= 1;

  // Lazy-load tsparticles only when confetti is enabled
  useEffect(() => {
    if (!showConfetti) return;

    let cancelled = false;

    (async () => {
      try {
        const [{ default: Particles }, { initParticlesEngine }, { loadSlim }] = await Promise.all([
          import('@tsparticles/react'),
          import('@tsparticles/react'),
          import('@tsparticles/slim'),
        ]);
        await initParticlesEngine(async (engine) => {
          await loadSlim(engine);
        });
        if (!cancelled) {
          setConfettiComponent(() => Particles);
        }
      } catch {
        // Confetti is non-critical, silently fail
      }
    })();

    return () => { cancelled = true; };
  }, [showConfetti]);

  // Auto-dismiss timer with progress bar
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Adjust particle count based on performance
  const particleCount = performanceMode === 'full' ? 60 : 25;

  const confettiOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: performanceMode === 'full' ? 60 : 30,
      particles: {
        number: { value: particleCount },
        color: { value: medal.confettiColors as unknown as string[] },
        shape: {
          type: ['circle', 'square'],
        },
        opacity: {
          value: { min: 0.5, max: 1 },
          animation: { enable: true, speed: 0.8, startValue: 'max' as const, destroy: 'min' as const },
        },
        size: {
          value: { min: 3, max: 7 },
        },
        move: {
          enable: true,
          speed: { min: 3, max: 10 },
          direction: 'bottom' as const,
          outModes: { default: 'out' as const },
          gravity: { enable: true, acceleration: 5 },
        },
        rotate: {
          value: { min: 0, max: 360 },
          animation: { enable: true, speed: 15 },
          direction: 'random' as const,
        },
        life: {
          duration: { value: { min: 3, max: 6 } },
          count: 1,
        },
      },
    }),
    [medal.confettiColors, particleCount, performanceMode]
  );

  return (
    <AnimatePresence>
      <motion.div
        key="giveaway-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
        onClick={handleDismiss}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Confetti - only on capable devices */}
        {ConfettiComponent && (
          <ConfettiComponent
            id="giveaway-confetti"
            options={confettiOptions}
            className="absolute inset-0 pointer-events-none"
          />
        )}

        {/* Card — responsive: compact on small containers, spacious on large */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative z-10 border rounded-xl sm:rounded-2xl',
            'p-4 sm:p-6 lg:p-8',
            'max-w-[90%] sm:max-w-xs lg:max-w-sm w-full',
            'max-h-[90%] overflow-y-auto',
            'text-center shadow-2xl',
            isDark ? 'bg-[#0d1f1c]/95 border-slate-700/50' : 'bg-white/95 border-slate-200',
            medal.glowColor
          )}
        >
          {/* Medal emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-7xl mb-2 sm:mb-4"
          >
            {medal.emoji}
          </motion.div>

          {/* Place label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <span
              className={`inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r ${medal.gradient} text-white`}
            >
              {t(medal.labelKey)}
            </span>
          </motion.div>

          {/* Congratulations */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={cn(
              'text-lg sm:text-xl lg:text-2xl font-bold mt-2 sm:mt-4',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            {t('webinars.giveaway.congratulations')}
          </motion.h2>

          {/* You won */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className={cn(
              'text-sm sm:text-base lg:text-lg mt-0.5 sm:mt-1',
              isDark ? 'text-[#e8f5f0]/90' : 'text-slate-700'
            )}
          >
            {t('webinars.giveaway.youWon')}
          </motion.p>

          {/* Host will contact */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className={cn(
              'text-xs sm:text-sm mt-2 sm:mt-4',
              isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'
            )}
          >
            {t('webinars.giveaway.hostWillContact')}
          </motion.p>

          {/* Progress bar (auto-dismiss timer) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="mt-3 sm:mt-6 mb-2 sm:mb-4"
          >
            <div className={cn(
              'w-full h-1 sm:h-1.5 rounded-full overflow-hidden',
              isDark ? 'bg-[#243f39]/50' : 'bg-slate-200'
            )}>
              <div
                className={`h-full bg-gradient-to-r ${medal.gradient} rounded-full transition-[width] duration-100 ease-linear`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>

          {/* Dismiss button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className={cn(
                'text-xs sm:text-sm',
                isDark
                  ? 'bg-[#1a352f]/50 border-slate-600/50 text-[#e8f5f0] hover:bg-[#243f39]/50 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              {t('webinars.giveaway.dismiss')}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
