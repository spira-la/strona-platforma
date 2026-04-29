/**
 * WebinarAttendeeList Component
 *
 * Displays a list of connected attendees for the host/shadow.
 * Used for giveaway/raffle functionality during webinars.
 *
 * Features:
 * - Shows all connected viewers with their display names
 * - Random pick button for selecting up to 3 winners per round
 * - Animation when selecting a winner
 * - Multiple rounds support with history
 * - Sync winners across all hosts via WebSocket
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shuffle, Trophy, User, RotateCcw, ChevronDown, ChevronUp, History, FlaskConical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { WebinarAttendee } from '@/hooks/webinar/types/webinar-socket.types';

export interface GiveawayWinner {
  odantzId: string;
  odantzIdFirebase?: string; // Firebase user ID for lookup
  name: string;
  email?: string; // Email for contacting winners later
  avatar?: string;
  place: 1 | 2 | 3;
}

export interface GiveawayRound {
  id: string;
  roundNumber: number;
  winners: GiveawayWinner[];
  createdAt: Date;
  webinarId?: string; // Link to webinar
  sessionId?: string; // Link to session
}

const PLACE_MEDALS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
} as const;

const PLACE_COLORS = {
  1: 'from-yellow-600/30 to-orange-600/30 border-yellow-500/30',
  2: 'from-slate-400/30 to-slate-500/30 border-slate-400/30',
  3: 'from-amber-700/30 to-orange-800/30 border-amber-600/30',
} as const;

export interface WebinarAttendeeListProps {
  attendees: WebinarAttendee[];
  /** Current round winners (synced from WebSocket) */
  currentWinners?: GiveawayWinner[];
  /** Past rounds history */
  rounds?: GiveawayRound[];
  /** Called when a winner is selected - broadcasts to all hosts */
  onWinnerSelected?: (winner: GiveawayWinner, isTestPick?: boolean) => void;
  /** Called when round is reset/new round started */
  onNewRound?: () => void;
  /** Called when a round is deleted */
  onDeleteRound?: (roundId: string) => void;
  /** Whether another studio is currently running the pick animation */
  isRemoteSelecting?: boolean;
  /** Called when local pick animation starts - broadcasts to other studios */
  onSelectionStarted?: () => void;
  className?: string;
}

export function WebinarAttendeeList({
  attendees,
  currentWinners = [],
  rounds = [],
  onWinnerSelected,
  onNewRound,
  onDeleteRound,
  isRemoteSelecting = false,
  onSelectionStarted,
  className,
}: WebinarAttendeeListProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [localWinners, setLocalWinners] = useState<GiveawayWinner[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<GiveawayRound | null>(null);
  const [showNewRoundConfirm, setShowNewRoundConfirm] = useState(false);

  // Debug logging
  console.log('[WebinarAttendeeList] Props:', {
    attendeesCount: attendees.length,
    currentWinners,
    rounds,
    localWinners,
  });

  // Use synced winners if provided, otherwise use local state
  const winners = currentWinners.length > 0 ? currentWinners : localWinners;

  // Sync local state with external winners (including clearing on new round)
  useEffect(() => {
    setLocalWinners(currentWinners);
  }, [currentWinners]);

  // Remote selection animation - cycle highlights when another studio is picking
  useEffect(() => {
    if (!isRemoteSelecting || isSelecting || attendees.length === 0) return;

    const interval = setInterval(() => {
      setHighlightedIndex(Math.floor(Math.random() * attendees.length));
    }, 100);

    return () => {
      clearInterval(interval);
      setHighlightedIndex(null);
    };
  }, [isRemoteSelecting, isSelecting, attendees.length]);

  // Get all winner IDs from all rounds (to exclude from future picks)
  const allTimeWinnerIds = new Set<string>([
    ...winners.map(w => w.odantzId),
    ...rounds.flatMap(r => r.winners.map(w => w.odantzId)),
  ]);

  // Get attendees that haven't won in ANY round
  const eligibleAttendees = attendees.filter(
    (a) => !allTimeWinnerIds.has(a.odantzId)
  );

  // Check if attendee won in a previous round (not current)
  const isPreviousRoundWinner = (odantzId: string): boolean => {
    return rounds.some(r => r.winners.some(w => w.odantzId === odantzId));
  };

  // Check if we can pick more winners
  const canPickMore = winners.length < 3 && eligibleAttendees.length > 0 && !isRemoteSelecting;

  // Random pick animation
  const pickRandomWinner = useCallback(() => {
    if (eligibleAttendees.length === 0 || isSelecting || isRemoteSelecting || winners.length >= 3) return;

    setIsSelecting(true);
    onSelectionStarted?.();

    // Animation: rapidly cycle through eligible attendees
    let iterations = 0;
    const maxIterations = 20 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * attendees.length);
      setHighlightedIndex(randomIndex);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        // Final selection from eligible attendees
        const winnerIndex = Math.floor(Math.random() * eligibleAttendees.length);
        const selectedAttendee = eligibleAttendees[winnerIndex];

        // Find the index in the full list for highlighting
        const fullIndex = attendees.findIndex(a => a.odantzId === selectedAttendee.odantzId);
        setHighlightedIndex(fullIndex);

        const newWinner: GiveawayWinner = {
          odantzId: selectedAttendee.odantzId,
          odantzIdFirebase: selectedAttendee.odantzIdFirebase,
          name: selectedAttendee.name,
          email: selectedAttendee.email,
          avatar: selectedAttendee.avatar,
          place: (winners.length + 1) as 1 | 2 | 3,
        };

        // Update local state
        setLocalWinners((prev) => [...prev, newWinner]);

        // Broadcast to other hosts
        onWinnerSelected?.(newWinner);

        setIsSelecting(false);
      }
    }, 100);
  }, [attendees, eligibleAttendees, isSelecting, isRemoteSelecting, winners.length, onWinnerSelected, onSelectionStarted]);

  // Reset raffle for new round (called after confirmation)
  const handleNewRoundConfirmed = useCallback(() => {
    setLocalWinners([]);
    setHighlightedIndex(null);
    setShowNewRoundConfirm(false);
    onNewRound?.();
  }, [onNewRound]);

  // Test pick - picks from real attendees, ignoring previous winner restrictions
  const pickTestWinner = useCallback(() => {
    if (winners.length >= 3 || attendees.length === 0) return;

    // Get attendees not in current round (but allow previous round winners for testing)
    const currentWinnerIds = new Set(winners.map(w => w.odantzId));
    const availableForTest = attendees.filter(a => !currentWinnerIds.has(a.odantzId));

    if (availableForTest.length === 0) return;

    // Pick random from available
    const randomIndex = Math.floor(Math.random() * availableForTest.length);
    const selectedAttendee = availableForTest[randomIndex];

    const testWinner: GiveawayWinner = {
      odantzId: selectedAttendee.odantzId,
      odantzIdFirebase: selectedAttendee.odantzIdFirebase,
      name: selectedAttendee.name,
      email: selectedAttendee.email,
      avatar: selectedAttendee.avatar,
      place: (winners.length + 1) as 1 | 2 | 3,
    };

    console.log('[WebinarAttendeeList] Test pick (ignores previous winners):', testWinner);

    // Update local state
    setLocalWinners((prev) => [...prev, testWinner]);

    // Broadcast to other hosts (with test flag to skip previous winner check)
    onWinnerSelected?.(testWinner, true);
  }, [attendees, winners, onWinnerSelected]);

  // Check if an attendee is a winner and get their place
  const getWinnerPlace = (odantzId: string): 1 | 2 | 3 | null => {
    const winner = winners.find((w) => w.odantzId === odantzId);
    return winner?.place ?? null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Attendee count - compact */}
      <div className={cn("flex items-center justify-between px-3 py-2 border-b", isDark ? "border-[#5eb8a8]/15" : "border-slate-200")}>
        <div className="flex items-center gap-2">
          <Users className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
          <Badge variant="secondary" className={cn("text-xs", isDark ? "bg-[#5eb8a8]/20 text-[#e8f5f0]" : "bg-[#285f59]/10 text-[#285f59]")}>
            {attendees.length} {t('webinars.attendeeList.online', 'online')}
          </Badge>
        </div>
        {rounds.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={cn("h-7 px-2", isDark ? "text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/15" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}
              >
                <History className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">{rounds.length}</span>
                {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('webinars.attendeeList.roundHistory', 'Round History')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Past rounds history */}
      <AnimatePresence>
        {showHistory && rounds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("border-b overflow-hidden", isDark ? "border-[#5eb8a8]/15" : "border-slate-200")}
          >
            <ScrollArea className="max-h-32">
              <div className="p-2 space-y-2">
                {rounds.map((round) => (
                  <div key={round.id} className={cn("p-2 rounded-lg border group", isDark ? "bg-[#1a352f]/50 border-[#285f59]/20" : "bg-slate-50 border-slate-200")}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                        {t('webinars.attendeeList.round', 'Round')} {round.roundNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
                          {new Date(round.createdAt).toLocaleTimeString()}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[WebinarAttendeeList] Delete button clicked, round:', round);
                                setRoundToDelete(round);
                              }}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {t('webinars.attendeeList.deleteRound', 'Delete Round')}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {round.winners.map((w) => (
                        <div key={w.odantzId} className="flex items-center gap-1">
                          <span className="text-sm">{PLACE_MEDALS[w.place]}</span>
                          <span className={cn("text-[10px] truncate max-w-[60px]", isDark ? "text-[#e8f5f0]/70" : "text-slate-600")}>{w.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current winners announcement */}
      <AnimatePresence>
        {winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("border-b", isDark ? "border-[#5eb8a8]/15" : "border-slate-200")}
          >
            <div className="p-2 space-y-1">
              {winners.map((winner) => (
                <motion.div
                  key={winner.odantzId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r border',
                    PLACE_COLORS[winner.place]
                  )}
                >
                  <span className="text-xl">{PLACE_MEDALS[winner.place]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/60">
                      {t(`webinars.attendeeList.place${winner.place}`, `${winner.place}${winner.place === 1 ? 'st' : winner.place === 2 ? 'nd' : 'rd'} Place`)}
                    </p>
                    <p className="font-bold text-sm text-white truncate">{winner.name}</p>
                  </div>
                  <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Giveaway controls */}
      <div className={cn("p-2 border-b space-y-2", isDark ? "border-[#5eb8a8]/15" : "border-slate-200")}>
        <div className="flex gap-2">
          <Button
            onClick={pickRandomWinner}
            disabled={!canPickMore || isSelecting || isRemoteSelecting}
            className="flex-1 h-9 bg-gradient-to-r from-[#285f59] to-[#5eb8a8] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/90 text-white text-sm"
          >
            <Shuffle className={cn('w-4 h-4 mr-2', (isSelecting || isRemoteSelecting) && 'animate-spin')} />
            {isSelecting || isRemoteSelecting
              ? t('webinars.attendeeList.selecting', 'Selecting...')
              : winners.length === 0
                ? t('webinars.attendeeList.pickRandom', 'Pick 1st Winner')
                : winners.length === 1
                  ? t('webinars.attendeeList.pick2nd', 'Pick 2nd Winner')
                  : winners.length === 2
                    ? t('webinars.attendeeList.pick3rd', 'Pick 3rd Winner')
                    : t('webinars.attendeeList.allSelected', 'All Winners Selected')
            }
          </Button>
          {/* Test Pick Button - ignores previous winner restrictions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={pickTestWinner}
                disabled={winners.length >= 3 || attendees.length === 0}
                variant="outline"
                size="sm"
                className="h-9 px-3 bg-amber-600/20 border-amber-500/30 text-amber-200 hover:bg-amber-600/30 hover:text-amber-100"
              >
                <FlaskConical className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('webinars.attendeeList.testPick', 'Test Pick (ignores previous winners)')}
            </TooltipContent>
          </Tooltip>
        </div>
        {winners.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setShowNewRoundConfirm(true)}
                variant="outline"
                size="sm"
                className={cn("w-full h-8 text-xs", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/15" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100")}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                {t('webinars.attendeeList.newRound', 'New Round')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('webinars.attendeeList.newRoundTooltip', 'Save current winners and start a new round')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Attendee list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {attendees.length === 0 ? (
            <div className={cn("flex flex-col items-center justify-center py-8", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
              <User className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">{t('webinars.attendeeList.noAttendees', 'No attendees yet')}</p>
            </div>
          ) : (
            attendees.map((attendee, index) => {
              const winnerPlace = getWinnerPlace(attendee.odantzId);
              const wasPreviousWinner = isPreviousRoundWinner(attendee.odantzId);
              const isExcluded = wasPreviousWinner && !winnerPlace;

              return (
                <motion.div
                  key={attendee.odantzId}
                  animate={{
                    backgroundColor:
                      highlightedIndex === index
                        ? 'rgba(94, 184, 168, 0.2)'
                        : winnerPlace
                          ? 'rgba(234, 179, 8, 0.15)'
                          : isExcluded
                            ? 'rgba(100, 100, 100, 0.1)'
                            : 'transparent',
                    scale: highlightedIndex === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.1 }}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg',
                    winnerPlace && 'ring-1 ring-yellow-400/50',
                    isExcluded && 'opacity-50'
                  )}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={attendee.avatar} />
                    <AvatarFallback className={cn(
                      'text-[10px]',
                      isExcluded ? 'bg-slate-600/30 text-slate-400' : isDark ? 'bg-[#5eb8a8]/30 text-[#e8f5f0]' : 'bg-[#285f59]/10 text-[#285f59]'
                    )}>
                      {getInitials(attendee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium truncate',
                      isExcluded ? 'text-slate-400' : isDark ? 'text-white' : 'text-slate-700'
                    )}>
                      {attendee.name}
                    </p>
                    {isExcluded && (
                      <p className="text-[9px] text-slate-500">
                        {t('webinars.attendeeList.previousWinner', 'Previous winner')}
                      </p>
                    )}
                  </div>
                  {winnerPlace && (
                    <span className="text-base flex-shrink-0">{PLACE_MEDALS[winnerPlace]}</span>
                  )}
                  {isExcluded && (
                    <Trophy className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Delete round confirmation dialog */}
      {console.log('[WebinarAttendeeList] AlertDialog state:', { roundToDelete, isOpen: !!roundToDelete })}
      <AlertDialog open={!!roundToDelete} onOpenChange={(open) => !open && setRoundToDelete(null)}>
        <AlertDialogContent className={cn(isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDark ? "text-white" : "text-slate-900")}>
              {t('webinars.attendeeList.deleteRoundTitle', 'Delete Round?')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.attendeeList.deleteRoundDescription', 'This will permanently delete Round {{number}} and its {{count}} winner(s). The winners will be eligible for future rounds again.', {
                number: roundToDelete?.roundNumber,
                count: roundToDelete?.winners.length || 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(isDark ? "bg-[#1a352f] border-[#285f59] text-white hover:bg-[#243f39]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100")}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roundToDelete) {
                  onDeleteRound?.(roundToDelete.id);
                  setRoundToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New round confirmation dialog */}
      <AlertDialog open={showNewRoundConfirm} onOpenChange={(open) => !open && setShowNewRoundConfirm(false)}>
        <AlertDialogContent className={cn(isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDark ? "text-white" : "text-slate-900")}>
              {t('webinars.attendeeList.newRoundTitle', 'Start New Round?')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.attendeeList.newRoundDescription', 'The current winners will be saved to history and a new round will begin. Current winners will not be eligible in the next round.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(isDark ? "bg-[#1a352f] border-[#285f59] text-white hover:bg-[#243f39]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100")}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNewRoundConfirmed}
              className="bg-[#285f59] hover:bg-[#2a7a6f] text-white"
            >
              {t('webinars.attendeeList.newRoundConfirm', 'Start New Round')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default WebinarAttendeeList;
