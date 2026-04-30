/**
 * Studio Side Panel Component
 *
 * A collapsible side panel with icon menu for the WebinarStudio.
 * Features:
 * - Icon menu bar on the left
 * - Expandable panel that shows content based on selected icon
 * - Smooth animations
 */

import { useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  HelpCircle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Save,
  Loader2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export type PanelTab = 'chat' | 'qa' | 'poll' | 'scenes' | 'attendees' | 'settings';

export interface StudioSidePanelProps {
  /** Chat component */
  chatContent: ReactNode;
  /** Q&A component */
  qaContent: ReactNode;
  /** Poll component */
  pollContent: ReactNode;
  /** Scenes component (templates, backgrounds, overlays) */
  scenesContent?: ReactNode;
  /** Attendees component (for giveaway/raffle) */
  attendeesContent?: ReactNode;
  /** Settings component */
  settingsContent?: ReactNode;
  /** Badge counts - unread messages */
  chatCount?: number;
  /** Badge counts - pending questions */
  qaCount?: number;
  /** Badge counts - attendee count */
  attendeeCount?: number;
  /** Whether there's an active poll */
  hasPoll?: boolean;
  /** Whether a scene template is active */
  hasActiveScene?: boolean;
  /** Whether chat is enabled */
  chatEnabled?: boolean;
  /** Whether Q&A is enabled */
  qaEnabled?: boolean;
  /** Callback when active tab changes */
  onTabChange?: (tab: PanelTab) => void;
  /** Currently active tab (controlled mode) */
  activeTabProp?: PanelTab;
  /** Whether the current user is the session host (full control) */
  isHost?: boolean;
  /** Whether there are unsaved scene changes */
  hasUnsavedSceneChanges?: boolean;
  /** Callback for quick save scene */
  onQuickSaveScene?: () => Promise<void>;
  /** Whether scene is currently being saved */
  isSavingScene?: boolean;
  /** Class name */
  className?: string;
}

export function StudioSidePanel({
  chatContent,
  qaContent,
  pollContent,
  scenesContent,
  attendeesContent,
  settingsContent,
  chatCount = 0,
  qaCount = 0,
  attendeeCount = 0,
  hasPoll = false,
  hasActiveScene = false,
  chatEnabled = true,
  qaEnabled = true,
  onTabChange,
  activeTabProp,
  isHost = true, // Default to host for backwards compatibility
  hasUnsavedSceneChanges = false,
  onQuickSaveScene,
  isSavingScene = false,
  className,
}: StudioSidePanelProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [activeTabInternal, setActiveTabInternal] = useState<PanelTab>('chat');
  const [isExpanded, setIsExpanded] = useState(true);

  // Use controlled mode if activeTabProp is provided
  const activeTab = activeTabProp ?? activeTabInternal;

  const togglePanel = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const selectTab = useCallback((tab: PanelTab) => {
    if (activeTab === tab && isExpanded) {
      // Clicking same tab collapses panel
      setIsExpanded(false);
    } else {
      if (!activeTabProp) {
        setActiveTabInternal(tab);
      }
      onTabChange?.(tab);
      setIsExpanded(true);
    }
  }, [activeTab, isExpanded, activeTabProp, onTabChange]);

  // Define all tabs with hostOnly flag and group
  const allTabs = [
    {
      id: 'chat' as PanelTab,
      icon: MessageSquare,
      label: t('webinars.chat.title', 'Chat'),
      count: chatCount,
      enabled: chatEnabled,
      hostOnly: false,
      group: 'interaction' as const,
    },
    {
      id: 'qa' as PanelTab,
      icon: HelpCircle,
      label: t('webinars.qa.title', 'Q&A'),
      count: qaCount,
      enabled: qaEnabled,
      hostOnly: false,
      group: 'interaction' as const,
    },
    {
      id: 'poll' as PanelTab,
      icon: BarChart3,
      label: t('webinars.polls.title', 'Poll'),
      count: 0,
      hasBadge: hasPoll,
      hostOnly: false,
      group: 'interaction' as const,
    },
    {
      id: 'attendees' as PanelTab,
      icon: Users,
      label: t('webinars.attendeeList.title', 'Attendees'),
      count: attendeeCount,
      hostOnly: true,
      group: 'interaction' as const,
    },
    {
      id: 'scenes' as PanelTab,
      icon: Layers,
      label: t('webinars.scenes.title', 'Scenes'),
      count: 0,
      hasBadge: hasActiveScene,
      hostOnly: true,
      group: 'production' as const,
    },
    {
      id: 'settings' as PanelTab,
      icon: Settings,
      label: t('common.settings', 'Settings'),
      count: 0,
      hostOnly: false,
      group: 'production' as const,
    },
  ];

  // Filter tabs based on host status
  const tabs = isHost ? allTabs : allTabs.filter(tab => !tab.hostOnly);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return chatContent;
      case 'qa':
        return qaContent;
      case 'poll':
        return pollContent;
      case 'scenes':
        return scenesContent || (
          <div className={cn("p-4 text-center text-sm", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
            {t('webinars.scenes.noScenes', 'No scene controls available')}
          </div>
        );
      case 'attendees':
        return attendeesContent || (
          <div className={cn("p-4 text-center text-sm", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
            {t('webinars.attendeeList.noAttendees', 'No attendees yet')}
          </div>
        );
      case 'settings':
        return settingsContent || (
          <div className={cn("p-4 text-center text-sm", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
            {t('common.noSettings', 'No settings available')}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex h-full flex-shrink-0', className)}>
      {/* Icon Menu Bar */}
      <div className={cn("w-14 flex-shrink-0 border-l flex flex-col items-center py-2 gap-1", isDark ? "bg-[#0d1f1c]/80 border-[#5eb8a8]/20" : "bg-slate-50 border-slate-200")}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && isExpanded;
          const prevTab = index > 0 ? tabs[index - 1] : null;
          const showSeparator = prevTab && prevTab.group !== tab.group;

          return (
            <div key={tab.id} className="flex flex-col items-center">
              {showSeparator && (
                <div className={cn("w-8 border-t my-1.5", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")} />
              )}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectTab(tab.id)}
                    className={cn(
                      'w-10 h-10 p-0 rounded-lg relative transition-colors',
                      isActive
                        ? isDark ? 'bg-[#5eb8a8]/20 text-[#e8f5f0]' : 'bg-[#285f59]/10 text-[#285f59]'
                        : isDark ? 'text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/15' : 'text-slate-500 hover:text-[#285f59] hover:bg-[#285f59]/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {/* Count badge */}
                    {tab.count > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn("absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] text-white border-0", isDark ? "bg-[#5eb8a8]" : "bg-[#285f59]")}
                      >
                        {tab.count > 99 ? '99+' : tab.count}
                      </Badge>
                    )}
                    {/* Active indicator for poll */}
                    {tab.hasBadge && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                    {/* Enabled/Disabled status indicator */}
                    {'enabled' in tab && (
                      <span className={cn(
                        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#0d1f1c]",
                        tab.enabled ? "bg-green-500" : "bg-red-500"
                      )} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className={cn(isDark ? "bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/20" : "bg-white text-slate-700 border-slate-200 shadow-md")}>
                  <p>{tab.label}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Collapse toggle */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePanel}
              className={cn("w-10 h-10 p-0 rounded-lg", isDark ? "text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/15" : "text-slate-500 hover:text-[#285f59] hover:bg-[#285f59]/10")}
            >
              {isExpanded ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className={cn(isDark ? "bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/20" : "bg-white text-slate-700 border-slate-200 shadow-md")}>
            <p>{isExpanded ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Expandable Content Panel - responsive width */}
      <div
        className={cn(
          'border-l transition-all duration-300 ease-in-out h-full flex flex-col flex-shrink-0',
          isDark ? 'bg-[#0d1f1c]/60 border-[#5eb8a8]/20' : 'bg-white border-slate-200',
          isExpanded ? 'w-64 lg:w-72 xl:w-80' : 'w-0 overflow-hidden'
        )}
      >
        <div className={cn(
          'w-64 lg:w-72 xl:w-80 h-full flex flex-col min-h-0',
          !isExpanded && 'invisible'
        )}>
          {/* Panel Header */}
          <div className={cn("flex items-center justify-between px-3 py-2 border-b flex-shrink-0", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}>
            <h3 className={cn("text-sm font-medium flex items-center gap-2", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
              {tabs.find((t) => t.id === activeTab)?.icon &&
                (() => {
                  const Icon = tabs.find((t) => t.id === activeTab)!.icon;
                  return <Icon className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />;
                })()}
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>

            {/* Quick Save button for scenes tab */}
            {activeTab === 'scenes' && hasUnsavedSceneChanges && onQuickSaveScene && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onQuickSaveScene}
                    disabled={isSavingScene}
                    className={cn("h-7 px-2", isDark ? "text-[#e8f5f0] hover:text-white hover:bg-[#5eb8a8]/20" : "text-slate-600 hover:text-[#285f59] hover:bg-[#285f59]/10")}
                  >
                    {isSavingScene ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className={cn(isDark ? "bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/20" : "bg-white text-slate-700 border-slate-200 shadow-md")}>
                  <p>{t('common.saveChanges', 'Save Changes')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Panel Content - scrollable container */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudioSidePanel;
