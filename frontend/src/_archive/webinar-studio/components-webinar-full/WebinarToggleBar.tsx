/**
 * WebinarToggleBar - Reusable toggle bar component
 * 
 * Vertical bar on the right edge that toggles the chat panel open/closed.
 * Design and functionality is shared across all platforms.
 */

import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WebinarToggleBarProps {
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  className?: string;
}

export function WebinarToggleBar({
  isPanelOpen,
  onTogglePanel,
  className,
}: WebinarToggleBarProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onTogglePanel}
      className={cn(
        "fixed top-0 h-full w-6 cursor-pointer group flex flex-col items-center justify-center gap-2 transition-all duration-300 z-[10000]",
        isPanelOpen ? "right-80" : "right-0",
        className
      )}
      title={isPanelOpen ? t('webinars.hideChat', 'Hide Chat') : t('webinars.showChat', 'Show Chat')}
    >
      <div className="h-20 w-1.5 bg-gradient-to-b from-[#285f59] to-[#5eb8a8] rounded-full group-hover:from-[#2a7a6f] group-hover:to-[#5eb8a8]/90 group-hover:w-2 transition-all shadow-lg" />
      {isPanelOpen ? (
        <ChevronRight className="w-4 h-4 text-[#5eb8a8] group-hover:text-[#5eb8a8] transition-colors" />
      ) : (
        <ChevronLeft className="w-4 h-4 text-[#5eb8a8] group-hover:text-[#5eb8a8] transition-colors" />
      )}
      <div className="h-20 w-1.5 bg-gradient-to-b from-[#285f59] to-[#5eb8a8] rounded-full group-hover:from-[#2a7a6f] group-hover:to-[#5eb8a8]/90 group-hover:w-2 transition-all shadow-lg" />
    </div>
  );
}

export default WebinarToggleBar;
