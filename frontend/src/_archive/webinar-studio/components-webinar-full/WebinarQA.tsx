import { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, Check, Trash2, Eye, EyeOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { WebinarQuestion } from '@/domain/products/models/webinar.model';
import { formatTime } from './utils';
import { useTheme } from '@/contexts/ThemeContext';

// Memoized Question Card component - prevents re-render on answer text change
interface QuestionCardProps {
  question: WebinarQuestion;
  isHost: boolean;
  currentUserId?: string;
  isAnswering: boolean;
  isOwnQuestion: boolean;
  /** Custom display names for users (userId -> displayName) */
  speakerDisplayNames?: Record<string, string>;
  onStartAnswering: () => void;
  onUpvote: () => void;
  onDelete?: () => void;
}

const QuestionCard = memo(function QuestionCard({
  question,
  isHost,
  currentUserId,
  isAnswering,
  isOwnQuestion,
  speakerDisplayNames = {},
  onStartAnswering,
  onUpvote,
  onDelete,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const hasUpvoted = currentUserId && question.upvotedBy?.includes(currentUserId);

  // Helper to get display name (custom name if available, otherwise original)
  const getDisplayName = (userId: string, originalName: string) => {
    return speakerDisplayNames[userId] || originalName;
  };

  return (
    <div className={cn(isOwnQuestion && 'border-l-2 border-l-[#5eb8a8]')}>
      {/* Question Header */}
      <div className="p-1.5 space-y-1">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex-1 min-w-0">
            {/* Author */}
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              {isOwnQuestion && (
                <Badge className="bg-[#5eb8a8]/20 text-[#5eb8a8]/80 border-[#5eb8a8]/30 text-[9px] px-1 py-0 leading-tight">
                  {t('common.you', 'You')}
                </Badge>
              )}
              {question.isAnonymous ? (
                <span className={cn("text-[9px] flex items-center gap-0.5", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
                  <EyeOff className="w-2 h-2" />
                  {t('webinars.qa.anonymous', 'Anonymous')}
                </span>
              ) : (
                <span className={cn(
                  'text-[9px] font-medium truncate',
                  isOwnQuestion ? 'text-[#5eb8a8]/80' : isDark ? 'text-[#e8f5f0]' : 'text-slate-700'
                )}>{getDisplayName(question.userId, question.userName)}</span>
              )}
              <span className={cn("text-[9px]", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                {formatTime(question.timestamp)}
              </span>
            </div>

            {/* Question text */}
            <p className={cn("text-[11px] break-words leading-snug", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{question.question}</p>
          </div>

          {/* Status badge */}
          <Badge className={cn(
            'flex-shrink-0 text-[9px] h-4 px-1 leading-tight',
            question.status === 'answered'
              ? 'bg-green-600/30 text-green-400 border-green-600/50'
              : isDark ? 'bg-[#243f39]/50 text-[#e8f5f0]/70 border-[#5eb8a8]/30' : 'bg-slate-100 text-slate-500 border-slate-200'
          )}>
            {question.status === 'answered' ? (
              <><Check className="w-2 h-2 mr-0.5" />{t('webinars.qa.answered', 'Ans')}</>
            ) : (
              t('webinars.qa.pending', 'Pending')
            )}
          </Badge>
        </div>

        {/* Answer (if answered) */}
        {question.status === 'answered' && question.answer && (
          <div className={cn("pl-1.5 border-l-2 mt-1", isDark ? "border-[#5eb8a8]" : "border-[#285f59]")}>
            <p className={cn("text-[11px] break-words leading-snug", isDark ? "text-[#e8f5f0]/80" : "text-slate-600")}>
              <span className={cn("font-medium", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")}>Host: </span>
              {question.answer}
            </p>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className={cn("flex items-center justify-between px-1.5 py-1 border-t", isDark ? "border-[#5eb8a8]/20 bg-[#0d1f1c]/30" : "border-slate-100 bg-slate-50")}>
        {/* Upvote */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUpvote}
          className={cn(
            'h-5 px-1',
            isDark ? 'text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/20' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
            hasUpvoted && (isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')
          )}
        >
          <ThumbsUp className={cn('w-2 h-2 mr-0.5', hasUpvoted && 'fill-current')} />
          <span className="text-[9px]">{question.upvotes || 0}</span>
        </Button>

        {/* Host actions - Only show buttons when not in answer mode */}
        {isHost && question.status === 'pending' && !isAnswering && (
          <div className="flex gap-0.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onStartAnswering}
              className={cn("h-5 px-1.5 text-[9px]", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "bg-white border-[#285f59]/30 text-[#285f59] hover:bg-[#285f59]/10")}
            >
              {t('webinars.qa.answer', 'Answer')}
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-600/20"
                onClick={onDelete}
              >
                <Trash2 className="w-2 h-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Answer Input component - separate to avoid re-rendering question cards
interface AnswerInputProps {
  questionId: string;
  answerText: string;
  onAnswerTextChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const AnswerInput = memo(function AnswerInput({
  answerText,
  onAnswerTextChange,
  onSubmit,
  onCancel,
}: AnswerInputProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div className={cn("p-1.5 border-t space-y-1", isDark ? "border-[#5eb8a8]/50 bg-[#0d1f1c]/50" : "border-[#285f59]/20 bg-slate-50")}>
      <p className={cn("text-[9px] font-medium", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")}>
        {t('webinars.qa.yourAnswer', 'Your answer:')}
      </p>
      <Textarea
        value={answerText}
        onChange={(e) => onAnswerTextChange(e.target.value)}
        placeholder={t('webinars.qa.answerPlaceholder', 'Type your answer...')}
        rows={2}
        className={cn("w-full text-[11px] resize-none py-1", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/30 text-[#e8f5f0] placeholder:text-[#e8f5f0]/40 focus:border-[#5eb8a8]" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#285f59]")}
        autoFocus
      />
      <div className="flex justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className={cn("h-5 px-1.5 text-[9px]", isDark ? "text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!answerText.trim()}
          className="h-5 px-1.5 text-[9px] bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/80 text-white disabled:opacity-50"
        >
          <Send className="w-2 h-2 mr-0.5" />
          {t('webinars.qa.sendAnswer', 'Send')}
        </Button>
      </div>
    </div>
  );
});

export interface WebinarQAProps {
  questions: WebinarQuestion[];
  isDisabled?: boolean;
  isHost?: boolean;
  currentUserId?: string;
  /** Custom display names for users (userId -> displayName) */
  speakerDisplayNames?: Record<string, string>;
  onSubmitQuestion: (question: string, anonymous: boolean) => void;
  onUpvoteQuestion: (questionId: string) => void;
  onAnswerQuestion?: (questionId: string, answer: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  className?: string;
}

export function WebinarQA({
  questions,
  isDisabled = false,
  isHost = false,
  currentUserId,
  speakerDisplayNames = {},
  onSubmitQuestion,
  onUpvoteQuestion,
  onAnswerQuestion,
  onDeleteQuestion,
  className,
}: WebinarQAProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new questions arrive
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);

  // Memoize filtered and sorted questions to prevent unnecessary re-renders
  const pendingQuestions = useMemo(
    () => [...questions.filter(q => q.status === 'pending')].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)),
    [questions]
  );
  const answeredQuestions = useMemo(
    () => questions.filter(q => q.status === 'answered'),
    [questions]
  );

  // My questions - filter by current user (for attendees to track their questions)
  const myQuestions = useMemo(
    () => questions.filter(q => q.userId === currentUserId),
    [questions, currentUserId]
  );

  // Check if question belongs to current user
  const isOwnQuestion = useCallback(
    (question: WebinarQuestion) => question.userId === currentUserId,
    [currentUserId]
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim() && !isDisabled) {
      onSubmitQuestion(newQuestion.trim(), isAnonymous);
      setNewQuestion('');
    }
  }, [newQuestion, isAnonymous, isDisabled, onSubmitQuestion]);

  const handleAnswer = useCallback(() => {
    if (answerText.trim() && onAnswerQuestion && answeringId) {
      onAnswerQuestion(answeringId, answerText.trim());
      setAnsweringId(null);
      setAnswerText('');
    }
  }, [answerText, onAnswerQuestion, answeringId]);

  const handleCancelAnswer = useCallback(() => {
    setAnsweringId(null);
    setAnswerText('');
  }, []);

  const handleAnswerTextChange = useCallback((text: string) => {
    setAnswerText(text);
  }, []);

  return (
    <div className={cn('flex flex-col h-full max-h-full', className)}>
      {/* Questions list with tabs */}
      <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
        <TabsList className={cn("mx-2 mt-1 mb-0 h-7 shrink-0 p-0.5", isDark ? "bg-[#1a352f]/50" : "bg-slate-100")}>
          <TabsTrigger
            value="pending"
            className={cn("text-[10px] px-1.5 h-6", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-[#285f59]")}
          >
            {t('webinars.qa.all', 'All')} ({pendingQuestions.length})
          </TabsTrigger>
          {/* My Questions tab - only show if user has questions or is not host */}
          {!isHost && (
            <TabsTrigger
              value="mine"
              className="data-[state=active]:bg-[#5eb8a8]/15 data-[state=active]:text-[#5eb8a8] text-[10px] px-1.5 h-6"
            >
              {t('webinars.qa.mine', 'Mine')} ({myQuestions.length})
            </TabsTrigger>
          )}
          <TabsTrigger
            value="answered"
            className={cn("text-[10px] px-1.5 h-6", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-[#285f59]")}
          >
            {t('webinars.qa.answered', 'Answered')} ({answeredQuestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="flex-1 mt-0 mb-0 overflow-hidden min-h-0">
          <div 
            className="h-full px-2 py-1 overflow-y-auto overflow-x-hidden" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              position: 'relative'
            }}
          >
            {pendingQuestions.length === 0 ? (
              <div className={cn("flex items-center justify-center h-32", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                <p className="text-xs">{t('webinars.qa.noQuestions', 'No questions yet')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      isDark ? 'border-[#5eb8a8]/20 bg-[#1a352f]/30' : 'border-slate-200 bg-white',
                      answeringId === question.id && (isDark ? 'border-[#5eb8a8]/50' : 'border-[#285f59]/50')
                    )}
                  >
                    <QuestionCard
                      question={question}
                      isHost={isHost}
                      currentUserId={currentUserId}
                      isAnswering={answeringId === question.id}
                      isOwnQuestion={isOwnQuestion(question)}
                      speakerDisplayNames={speakerDisplayNames}
                      onStartAnswering={() => setAnsweringId(question.id)}
                      onUpvote={() => onUpvoteQuestion(question.id)}
                      onDelete={onDeleteQuestion ? () => onDeleteQuestion(question.id) : undefined}
                    />
                    {/* Answer input shown BELOW the question card - part of the same container */}
                    {answeringId === question.id && (
                      <AnswerInput
                        questionId={question.id}
                        answerText={answerText}
                        onAnswerTextChange={handleAnswerTextChange}
                        onSubmit={handleAnswer}
                        onCancel={handleCancelAnswer}
                      />
                    )}
                  </div>
                ))}
                {/* Scroll anchor */}
                <div ref={scrollEndRef} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* My Questions Tab - shows only current user's questions */}
        <TabsContent value="mine" className="flex-1 mt-0 mb-0 overflow-hidden min-h-0">
          <div 
            className="h-full px-2 py-1 overflow-y-auto overflow-x-hidden" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              position: 'relative'
            }}
          >
            {myQuestions.length === 0 ? (
              <div className={cn("flex items-center justify-center h-32", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                <p className="text-xs">{t('webinars.qa.noMyQuestions', 'You haven\'t asked any questions yet')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      isDark ? 'border-[#5eb8a8]/20 bg-[#1a352f]/30' : 'border-[#285f59]/20 bg-white',
                      question.status === 'answered' && 'border-green-500/30'
                    )}
                  >
                    <QuestionCard
                      question={question}
                      isHost={isHost}
                      currentUserId={currentUserId}
                      isAnswering={false}
                      isOwnQuestion={true}
                      speakerDisplayNames={speakerDisplayNames}
                      onStartAnswering={() => {}}
                      onUpvote={() => onUpvoteQuestion(question.id)}
                      onDelete={onDeleteQuestion ? () => onDeleteQuestion(question.id) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="answered" className="flex-1 mt-0 mb-0 overflow-hidden min-h-0">
          <div 
            className="h-full px-2 py-1 overflow-y-auto overflow-x-hidden" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              position: 'relative'
            }}
          >
            {answeredQuestions.length === 0 ? (
              <div className={cn("flex items-center justify-center h-32", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                <p className="text-xs">{t('webinars.qa.noAnswered', 'No answered questions yet')}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {answeredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      isDark ? 'border-[#5eb8a8]/20 bg-[#1a352f]/30' : 'border-slate-200 bg-white',
                      isOwnQuestion(question) && 'border-[#5eb8a8]/20'
                    )}
                  >
                    <QuestionCard
                      question={question}
                      isHost={isHost}
                      currentUserId={currentUserId}
                      isAnswering={false}
                      isOwnQuestion={isOwnQuestion(question)}
                      speakerDisplayNames={speakerDisplayNames}
                      onStartAnswering={() => {}}
                      onUpvote={() => onUpvoteQuestion(question.id)}
                      onDelete={onDeleteQuestion ? () => onDeleteQuestion(question.id) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit form - Ultra compacted, single row */}
      {isDisabled ? (
        <div className={cn("px-2 py-1.5 border-t text-center text-xs shrink-0", isDark ? "border-[#5eb8a8]/20 text-[#e8f5f0]/50" : "border-slate-200 text-slate-400")}>
          {t('webinars.qa.disabled', 'Q&A is currently disabled')}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cn("px-2 py-1.5 border-t shrink-0", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}>
          <div className="flex items-center gap-1.5 mb-1">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t('webinars.qa.placeholder', 'Ask a question...')}
              maxLength={500}
              rows={1}
              className={cn("flex-1 text-xs resize-none min-h-[28px] py-1 px-2", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/30 text-[#e8f5f0] placeholder:text-[#e8f5f0]/40 focus:border-[#5eb8a8]" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#285f59]")}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newQuestion.trim()}
              className="bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/80 text-white disabled:opacity-50 h-7 px-2.5 text-[10px] shrink-0"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              className={cn("scale-[0.65]", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
            />
            <Label htmlFor="anonymous" className={cn("text-[9px] flex items-center gap-0.5 cursor-pointer", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {isAnonymous ? <EyeOff className="w-2 h-2" /> : <Eye className="w-2 h-2" />}
              {t('webinars.qa.anonymous', 'Anonymous')}
            </Label>
          </div>
        </form>
      )}
    </div>
  );
}

export default WebinarQA;
