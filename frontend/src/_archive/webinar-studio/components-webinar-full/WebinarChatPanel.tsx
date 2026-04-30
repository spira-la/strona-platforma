/**
 * WebinarChatPanel - Reusable chat/Q&A panel component
 * 
 * Side panel that shows chat and Q&A tabs in fullscreen mode.
 * Design and functionality is shared across all platforms.
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export interface WebinarChatPanelProps {
  // Panel state
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  
  // Active tab
  activeTab: 'chat' | 'qa' | 'poll';
  onTabChange: (tab: 'chat' | 'qa' | 'poll') => void;
  
  // Content components
  chatComponent?: ReactNode;
  qaComponent?: ReactNode;
  
  // Styling
  className?: string;
  contentClassName?: string;
}

export function WebinarChatPanel({
  isPanelOpen,
  onTogglePanel,
  activeTab,
  onTabChange,
  chatComponent,
  qaComponent,
  className,
  contentClassName,
}: WebinarChatPanelProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Don't render at all when closed - prevents any visibility issues on iOS Safari
  if (!isPanelOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 right-0 w-80 border-l z-[10000] animate-in slide-in-from-right duration-300',
        isDark ? 'bg-[#0d1f1c] border-[#5eb8a8]/20' : 'bg-white border-slate-200',
        className
      )}
    >
      {/* Panel header - Only Chat and Q&A in fullscreen (Poll is shown as floating overlay) */}
      <div className={cn("flex items-center justify-between p-2 border-b", isDark ? "border-[#5eb8a8]/20 bg-[#0d1f1c]" : "border-slate-200 bg-white")}>
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as typeof activeTab)} className="w-full">
          <TabsList className={cn("w-full h-7", isDark ? "bg-[#1a352f]" : "bg-slate-100")}>
            {chatComponent && (
              <TabsTrigger
                value="chat"
                className={cn("flex-1 text-[10px] h-6", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-[#285f59]")}
              >
                <MessageSquare className="w-3 h-3 mr-0.5" />
                {t('webinars.chat.title', 'Chat')}
              </TabsTrigger>
            )}
            {qaComponent && (
              <TabsTrigger
                value="qa"
                className={cn("flex-1 text-[10px] h-6", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-[#285f59]")}
              >
                {t('webinars.qa.title', 'Q&A')}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePanel}
          className="ml-1 shrink-0 h-7 w-7 bg-gradient-to-r from-[#285f59] to-[#5eb8a8] hover:from-[#1a352f] hover:to-[#285f59] text-white transition-all duration-200"
          title={t('webinars.hideChat', 'Hide Chat')}
        >
          <Minimize className="w-3 h-3" />
        </Button>
      </div>

      {/* Panel content - Only Chat and Q&A */}
      <div 
        className={cn('overflow-y-auto mt-1 mb-1', isDark ? 'bg-[#0d1f1c]' : 'bg-white', contentClassName)}
      >
        {activeTab === 'chat' && chatComponent && (
          <div className={cn("h-full w-full", isDark ? "bg-[#0d1f1c]" : "bg-white")} data-scrollable="true">{chatComponent}</div>
        )}
        {activeTab === 'qa' && qaComponent && (
          <div className={cn("h-full w-full", isDark ? "bg-[#0d1f1c]" : "bg-white")} data-scrollable="true">{qaComponent}</div>
        )}
      </div>
    </div>
  );
}

export default WebinarChatPanel;
