import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Check, Plus, X, Vote, Play, Trash2, FileText, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { WebinarPoll } from '@/domain/products/models/webinar.model';
import { POLL_OPTION_COLORS } from './utils';

export interface WebinarPollProps {
  poll?: WebinarPoll | null;
  draftPolls?: WebinarPoll[];
  pollHistory?: WebinarPoll[];
  isHost?: boolean;
  currentUserId?: string;
  onVote: (pollId: string, optionIndex: number) => void;
  onCreatePoll?: (question: string, options: string[], saveAsDraft?: boolean) => void;
  onActivatePoll?: (pollId: string) => void;
  onClosePoll?: (pollId: string) => void;
  onDeletePoll?: (pollId: string) => void;
  className?: string;
  /** Auto-open the create poll form when true */
  autoOpenCreate?: boolean;
}

export function WebinarPollComponent({
  poll,
  draftPolls = [],
  pollHistory = [],
  isHost = false,
  currentUserId,
  onVote,
  onCreatePoll,
  onActivatePoll,
  onClosePoll,
  onDeletePoll,
  className,
  autoOpenCreate = false,
}: WebinarPollProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [showCreate, setShowCreate] = useState(autoOpenCreate);
  const [activeTab, setActiveTab] = useState<'drafts' | 'history'>('drafts');
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  // Handle autoOpenCreate prop changes
  useEffect(() => {
    if (autoOpenCreate) {
      setShowCreate(true);
    }
  }, [autoOpenCreate]);

  const hasVoted = poll && currentUserId && poll.votedBy?.includes(currentUserId);
  const userVoteIndex = hasVoted ? poll.options.findIndex(() => {
    // This would need to be tracked separately in a real implementation
    return false; // Placeholder
  }) : -1;

  const totalVotes = poll?.totalVotes || 0;

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleCreatePoll = useCallback((saveAsDraft: boolean = false) => {
    const validOptions = newOptions.filter(o => o.trim());
    if (newQuestion.trim() && validOptions.length >= 2 && onCreatePoll) {
      onCreatePoll(newQuestion.trim(), validOptions, saveAsDraft);
      setNewQuestion('');
      setNewOptions(['', '']);
      setShowCreate(false);
    }
  }, [newQuestion, newOptions, onCreatePoll]);

  const addOption = useCallback(() => {
    if (newOptions.length < 10) {
      setNewOptions(prev => [...prev, '']);
    }
  }, [newOptions.length]);

  const removeOption = useCallback((index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(prev => prev.filter((_, i) => i !== index));
    }
  }, [newOptions.length]);

  const updateOption = useCallback((index: number, value: string) => {
    setNewOptions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  // No poll and not host - show nothing
  if (!poll && !isHost) {
    return null;
  }

  // Derived values for active poll
  const isClosed = poll?.status === 'closed';
  // Host always sees live results in studio, attendees see results after voting or when poll is closed
  const showResults = isHost || isClosed || hasVoted || poll?.showResults;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Active Poll Section - Always visible at top */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        {poll ? (
          // Active poll display - inlined
          <div className={cn("space-y-3 p-3 rounded-lg border", isDark ? "bg-gradient-to-br from-[#0d1f1c]/50 to-[#243f39]/30 border-[#5eb8a8]/20" : "bg-slate-50 border-slate-200")}>
            {/* Header with question */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Vote className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
                <p className={cn("font-medium text-sm line-clamp-2", isDark ? "text-white" : "text-slate-900")}>{poll.question}</p>
              </div>
              <Badge className={cn(
                'flex-shrink-0 text-xs',
                isClosed
                  ? isDark ? 'bg-[#243f39]/50 text-[#e8f5f0]/70 border-[#285f59]/30' : 'bg-slate-200 text-slate-600 border-slate-300'
                  : 'bg-red-600 text-white animate-pulse'
              )}>
                {isClosed ? t('webinars.polls.closed') : t('webinars.live')}
              </Badge>
            </div>

            {/* Options in grid layout */}
            <div className="grid grid-cols-2 gap-2">
              {poll.options.map((option, index) => {
                const percentage = getPercentage(option.votes);
                const isSelected = userVoteIndex === index;

                return showResults ? (
                  <div key={index} className={cn("relative overflow-hidden rounded-md border", isDark ? "border-[#285f59]/30 bg-[#1a352f]/30" : "border-slate-200 bg-white")}>
                    <div
                      className={cn('absolute inset-0 opacity-30 transition-all duration-300', POLL_OPTION_COLORS[index])}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative px-2 py-1.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {isSelected && <Check className={cn("w-3 h-3 flex-shrink-0", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />}
                        <span className={cn('text-xs truncate', isSelected && 'font-medium', isDark ? 'text-[#e8f5f0]' : 'text-slate-700')}>{option.text}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/60" : "text-slate-400")}>{option.votes}</span>
                        <span className={cn("text-xs font-bold", isDark ? "text-white" : "text-slate-900")}>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-auto py-1.5 px-2 justify-start text-xs",
                      isDark
                        ? "bg-[#1a352f]/50 border-[#285f59]/30 text-[#e8f5f0] hover:bg-[#5eb8a8]/20 hover:border-[#5eb8a8]/50"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-[#285f59]/10 hover:border-[#285f59]/50"
                    )}
                    onClick={() => onVote(poll.id, index)}
                    disabled={isClosed}
                  >
                    <div className={cn('w-2 h-2 rounded-full mr-1.5 flex-shrink-0', POLL_OPTION_COLORS[index])} />
                    <span className="truncate">{option.text}</span>
                  </Button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
                {t('webinars.polls.votes', { count: totalVotes })}
              </span>
              <div className="flex-1" />
              {isHost && !isClosed && onClosePoll && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onClosePoll(poll.id)}
                  className="h-7 text-xs bg-red-600 hover:bg-red-500 text-white"
                >
                  {t('coach.studio.closePoll')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <BarChart3 className={cn("w-4 h-4", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")} />
              <span className={cn("text-sm", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>{t('webinars.polls.noPoll', 'No active poll')}</span>
            </div>
            {isHost && onCreatePoll && !showCreate && (
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="h-7 text-xs bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/80 text-white"
              >
                <Plus className="w-3 h-3 mr-1" />
                {t('coach.studio.createPoll')}
              </Button>
            )}
          </div>
        )}

        {/* Create poll form - inlined */}
        {isHost && showCreate && (
          <div className={cn("space-y-3 p-3 rounded-lg border", isDark ? "border-[#5eb8a8]/30 bg-[#1a352f]/30" : "border-slate-200 bg-slate-50")}>
            <div className="flex items-center gap-2">
              <BarChart3 className={cn("w-4 h-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              <span className={cn("text-sm font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{t('coach.studio.createPoll')}</span>
            </div>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t('webinars.polls.questionPlaceholder', 'Poll question...')}
              maxLength={200}
              className={cn("h-9", isDark ? "bg-[#1a352f]/50 border-[#285f59]/30 text-[#e8f5f0] placeholder:text-[#e8f5f0]/40" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400")}
            />

            <div className="grid grid-cols-2 gap-2">
              {newOptions.map((option, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <div className={cn('w-1 h-6 rounded-full flex-shrink-0', POLL_OPTION_COLORS[index])} />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`${t('webinars.polls.optionPlaceholder', 'Option')} ${index + 1}`}
                    maxLength={100}
                    className={cn("h-8 text-sm", isDark ? "bg-[#1a352f]/50 border-[#285f59]/30 text-[#e8f5f0] placeholder:text-[#e8f5f0]/40" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400")}
                  />
                  {newOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-600/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {newOptions.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className={cn(
                    "h-8 text-xs",
                    isDark
                      ? "bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('webinars.polls.addOption', 'Add')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreate(false)}
                className={cn(
                  "h-8 text-xs",
                  isDark
                    ? "bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreatePoll(true)}
                disabled={!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2}
                className={cn(
                  "h-8 text-xs",
                  isDark
                    ? "bg-[#1a352f]/50 border-yellow-600/50 text-yellow-100 hover:bg-yellow-600/20"
                    : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                )}
              >
                <FileText className="w-3 h-3 mr-1" />
                {t('webinars.polls.saveDraft', 'Save Draft')}
              </Button>
              <Button
                size="sm"
                onClick={() => handleCreatePoll(false)}
                disabled={!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2}
                className="h-8 text-xs bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/80 text-white disabled:opacity-50"
              >
                <Play className="w-3 h-3 mr-1" />
                {t('webinars.polls.launch', 'Launch')}
              </Button>
            </div>
          </div>
        )}

        {/* New poll button when poll is closed */}
        {poll && poll.status === 'closed' && isHost && onCreatePoll && !showCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
            className={cn(
              "w-full h-8 text-xs",
              isDark
                ? "bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            )}
          >
            <Plus className="w-3 h-3 mr-1" />
            {t('webinars.polls.createNew', 'New Poll')}
          </Button>
        )}
      </div>

      {/* Tabs Section - Drafts & History */}
      {isHost && (
        <div className={cn("flex-1 min-h-0 border-t pt-3", isDark ? "border-[#5eb8a8]/15" : "border-slate-200")}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'drafts' | 'history')} className="h-full flex flex-col">
            <TabsList className={cn("grid w-full grid-cols-2 h-8 mb-2", isDark ? "bg-[#1a352f]/50" : "bg-slate-100")}>
              <TabsTrigger
                value="drafts"
                className={cn("text-xs", isDark ? "data-[state=active]:bg-yellow-600/30 data-[state=active]:text-yellow-100" : "data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800")}
              >
                <FileText className="w-3 h-3 mr-1" />
                {t('webinars.polls.drafts', 'Drafts')}
                {draftPolls.length > 0 && (
                  <Badge variant="secondary" className={cn("ml-1 h-4 px-1 text-[10px]", isDark ? "bg-yellow-600/50 text-yellow-100" : "bg-yellow-200 text-yellow-800")}>
                    {draftPolls.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className={cn("text-xs", isDark ? "data-[state=active]:bg-[#5eb8a8]/30 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800")}
              >
                <History className="w-3 h-3 mr-1" />
                {t('webinars.polls.history', 'History')}
                {pollHistory.length > 0 && (
                  <Badge variant="secondary" className={cn("ml-1 h-4 px-1 text-[10px]", isDark ? "bg-[#5eb8a8]/50 text-[#e8f5f0]" : "bg-slate-200 text-slate-700")}>
                    {pollHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Drafts Tab Content - inlined */}
            <TabsContent value="drafts" className="flex-1 mt-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              {draftPolls.length === 0 ? (
                <div className={cn("text-center py-8", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('webinars.polls.noDrafts', 'No draft polls yet')}</p>
                  <p className="text-xs mt-1">{t('webinars.polls.createDraftHint', 'Create a poll and save as draft')}</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-2">
                      {draftPolls.map((draft) => (
                        <div
                          key={draft.id}
                          className={cn(
                            "group p-3 rounded-xl border transition-colors",
                            isDark
                              ? "border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-slate-800/50 hover:border-yellow-500/40"
                              : "border-yellow-200 bg-yellow-50/50 hover:border-yellow-300"
                          )}
                        >
                          {/* Question */}
                          <div className="flex items-start gap-2 mb-2">
                            <BarChart3 className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isDark ? "text-yellow-400" : "text-yellow-600")} />
                            <p className={cn("text-sm font-medium line-clamp-2 leading-tight", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{draft.question}</p>
                          </div>

                          {/* Options as vertical list */}
                          <div className="space-y-1 mb-3">
                            {draft.options.map((opt, i) => (
                              <div
                                key={i}
                                className={cn("flex items-center gap-2 px-2 py-1 rounded-md text-[11px]", isDark ? "bg-[#1a352f]/50" : "bg-white")}
                              >
                                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', POLL_OPTION_COLORS[i % POLL_OPTION_COLORS.length])} />
                                <span className={cn("truncate", isDark ? "text-[#e8f5f0]/80" : "text-slate-600")}>{opt.text}</span>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {onActivatePoll && (
                              <Button
                                size="sm"
                                onClick={() => onActivatePoll(draft.id)}
                                className="h-7 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-sm"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                {t('webinars.polls.launch', 'Launch')}
                              </Button>
                            )}
                            <div className="flex-1" />
                            {onDeletePoll && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeletePoll(draft.id)}
                                className="h-7 w-7 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
            </TabsContent>

            {/* History Tab Content - inlined */}
            <TabsContent value="history" className="flex-1 mt-0 min-h-0 overflow-hidden data-[state=inactive]:hidden">
              {pollHistory.length === 0 ? (
                <div className={cn("text-center py-8", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('webinars.polls.noHistory', 'No poll history yet')}</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-2">
                      {pollHistory.map((historyPoll) => {
                        const historyTotalVotes = historyPoll.totalVotes || 0;
                        const getHistoryPercentage = (votes: number) => {
                          if (historyTotalVotes === 0) return 0;
                          return Math.round((votes / historyTotalVotes) * 100);
                        };

                        return (
                          <div
                            key={historyPoll.id}
                            className={cn("p-2 rounded-lg border space-y-2", isDark ? "border-[#285f59]/30 bg-[#1a352f]/50" : "border-slate-200 bg-slate-50")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-sm font-medium line-clamp-1", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{historyPoll.question}</p>
                              <Badge className={cn("flex-shrink-0 text-[10px]", isDark ? "bg-[#243f39]/50 text-[#e8f5f0]/70 border-[#285f59]/30" : "bg-slate-200 text-slate-600 border-slate-300")}>
                                {historyTotalVotes} {t('webinars.polls.votesLabel', 'votes')}
                              </Badge>
                            </div>

                            {/* Compact results */}
                            <div className="space-y-1">
                              {historyPoll.options.slice(0, 3).map((option, index) => {
                                const percentage = getHistoryPercentage(option.votes);
                                return (
                                  <div key={index} className={cn("relative overflow-hidden rounded h-5", isDark ? "bg-[#0d1f1c]/50" : "bg-white")}>
                                    <div
                                      className={cn('absolute inset-0 opacity-30', POLL_OPTION_COLORS[index % POLL_OPTION_COLORS.length])}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <div className="relative px-2 flex items-center justify-between h-full">
                                      <span className={cn("text-[10px] truncate", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{option.text}</span>
                                      <span className={cn("text-[10px] font-medium flex-shrink-0", isDark ? "text-white" : "text-slate-900")}>{percentage}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                              {historyPoll.options.length > 3 && (
                                <p className={cn("text-[10px] text-center", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
                                  +{historyPoll.options.length - 3} {t('webinars.polls.moreOptions', 'more options')}
                                </p>
                              )}
                            </div>

                            {/* Timestamp */}
                            {historyPoll.closedAt && (
                              <p className={cn("text-[10px]", isDark ? "text-[#e8f5f0]/40" : "text-slate-400")}>
                                {new Date(historyPoll.closedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default WebinarPollComponent;
