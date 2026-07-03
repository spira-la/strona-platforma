import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWebinarViewerCount } from '@/hooks/useWebinarViewerCount';
import { useTheme } from '@/contexts/ThemeContext';

export interface LiveViewerCountProps {
  variant?: 'badge' | 'text';
  showIcon?: boolean;
  className?: string;
}

/**
 * LiveViewerCount - Shows viewer count based on LiveKit participant metadata
 * Must be rendered inside LiveKitRoom
 */
export function LiveViewerCount({ variant = 'badge', showIcon = true, className }: LiveViewerCountProps) {
  const { viewerCount } = useWebinarViewerCount();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  if (variant === 'text') {
    return (
      <span className={cn("text-xs flex items-center gap-1", isDark ? "text-[#e8f5f0]/60" : "text-slate-500", className)}>
        {showIcon && <Users className="w-3 h-3" />}
        {viewerCount} {t('coach.studio.watching', 'watching')}
      </span>
    );
  }

  return (
    <Badge className={cn("flex items-center gap-1 border text-xs", isDark ? "bg-[#1a352f]/80 text-[#e8f5f0] border-[#5eb8a8]/30" : "bg-white/80 text-slate-700 border-slate-300", className)}>
      {showIcon && <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
      {viewerCount}
    </Badge>
  );
}

export default LiveViewerCount;
