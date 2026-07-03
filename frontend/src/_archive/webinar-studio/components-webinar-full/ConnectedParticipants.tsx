/**
 * Connected Participants Bar
 *
 * Shows all connected participants (host, speakers, shadow) with scene controls.
 * Host and Shadow can add/remove participants from the scene.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import type { SceneParticipant, ParticipantRole } from '@/domain/products/models/webinar.model';
import { useTheme } from '@/contexts/ThemeContext';
import { getInitials } from './utils';

export interface ConnectedParticipantsProps {
  /** List of all connected participants */
  participants: SceneParticipant[];
  /** IDs of participants currently on scene (undefined = all on scene) */
  onSceneIds: string[] | undefined;
  /** Whether the current user can manage the scene (host/shadow) */
  canManageScene: boolean;
  /** Callback to add a participant to the scene */
  onAddToScene: (userId: string) => void;
  /** Callback to remove a participant from the scene */
  onRemoveFromScene: (userId: string) => void;
  /** Current user ID (to highlight self) */
  currentUserId?: string;
  /** Custom class name */
  className?: string;
}

export function ConnectedParticipants({
  participants,
  onSceneIds,
  canManageScene,
  onAddToScene,
  onRemoveFromScene,
  currentUserId,
  className,
}: ConnectedParticipantsProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Filter to only show connected participants
  const connectedParticipants = useMemo(() => {
    return participants.filter((p) => p.isConnected);
  }, [participants]);

  // Get role indicator dot color and label for tooltip
  const getRoleIndicator = (role: ParticipantRole) => {
    switch (role) {
      case 'host':
        return { dotColor: 'bg-[#5eb8a8]', label: 'Host' };
      case 'shadow':
        return { dotColor: 'bg-[#5eb8a8]', label: t('webinar.director', 'Director') };
      case 'speaker':
        return { dotColor: 'bg-green-500', label: 'Speaker' };
      default:
        return { dotColor: 'bg-slate-500', label: role };
    }
  };

  if (connectedParticipants.length === 0) {
    return (
      <div className={cn('p-3 rounded-lg', isDark ? 'bg-[#1a352f]/50' : 'bg-slate-50', className)}>
        <p className={cn("text-sm text-center", isDark ? "text-slate-400" : "text-slate-500")}>
          {t('webinar.noParticipantsConnected', 'No participants connected')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('p-1.5 rounded-lg', isDark ? 'bg-[#1a352f]/50' : 'bg-slate-50', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className={cn("text-xs font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
          {t('webinar.connectedParticipants', 'Connected Participants')}
        </h4>
        <Badge variant="outline" className={cn("text-[10px] h-5", isDark ? "text-[#e8f5f0] border-[#285f59]" : "text-slate-600 border-slate-300")}>
          {connectedParticipants.length}
        </Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 max-h-[140px] overflow-y-auto">
        {connectedParticipants.map((participant, index) => {
          const isOnScene = !onSceneIds || onSceneIds.includes(participant.id);
          const isCurrentUser = participant.id === currentUserId;
          const role = getRoleIndicator(participant.role);

          return (
            <div
              key={participant.id || `participant-${index}`}
              className={cn(
                'flex flex-col items-center gap-1 p-1.5 rounded-md transition-all relative',
                isOnScene
                  ? 'bg-green-900/20'
                  : isDark ? 'bg-[#0d1f1c]/30' : 'bg-white',
                isCurrentUser && 'ring-1 ring-[#5eb8a8]/50'
              )}
            >
              {/* Avatar with scene ring + role dot */}
              <div className="relative">
                <Avatar className={cn(
                  'h-10 w-10 ring-2',
                  isOnScene ? 'ring-green-500' : isDark ? 'ring-slate-600' : 'ring-slate-300'
                )}>
                  <AvatarImage src={participant.avatar} alt={participant.name || 'Participant'} />
                  <AvatarFallback className={cn("text-xs", isDark ? "bg-[#243f39] text-[#e8f5f0]" : "bg-slate-100 text-slate-600")}>
                    {getInitials(participant.name)}
                  </AvatarFallback>
                </Avatar>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2', isDark ? 'border-slate-800' : 'border-white',
                      role.dotColor
                    )} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{role.label}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Name */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("text-[10px] font-medium truncate w-full text-center leading-tight", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                    {participant.name || t('webinar.unknownParticipant', 'Unknown')}
                    {isCurrentUser && ' (You)'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{participant.name || t('webinar.unknownParticipant', 'Unknown')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Add/Remove button with label */}
              {canManageScene && (
                <Button
                  variant="ghost"
                  className={cn(
                    'h-5 w-full px-1 text-[10px] gap-0.5',
                    isOnScene
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                      : 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
                  )}
                  onClick={() =>
                    isOnScene
                      ? onRemoveFromScene(participant.id)
                      : onAddToScene(participant.id)
                  }
                >
                  {isOnScene ? (
                    <>
                      <Minus className="h-3 w-3 flex-shrink-0" />
                      {t('webinar.removeFromScene', 'Remove')}
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 flex-shrink-0" />
                      {t('webinar.addToScene', 'Add')}
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConnectedParticipants;
