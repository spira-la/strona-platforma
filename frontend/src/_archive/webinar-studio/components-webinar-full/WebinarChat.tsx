import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Pin, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { WebinarChatMessage } from '@/domain/products/models/webinar.model';
import { formatTime, getInitials } from './utils';

export interface WebinarChatProps {
  messages: WebinarChatMessage[];
  pinnedMessageId?: string | null;
  isDisabled?: boolean;
  isHost?: boolean;
  currentUserId?: string;
  /** Custom display names for speakers/hosts (userId -> displayName) */
  speakerDisplayNames?: Record<string, string>;
  onSendMessage: (message: string) => void;
  onPinMessage?: (messageId: string, pinned: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
  className?: string;
}

export function WebinarChat({
  messages,
  pinnedMessageId,
  isDisabled = false,
  isHost = false,
  currentUserId,
  speakerDisplayNames = {},
  onSendMessage,
  onPinMessage,
  onDeleteMessage,
  className,
}: WebinarChatProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to get display name (custom name if available, otherwise original)
  const getDisplayName = (userId: string, originalName: string) => {
    return speakerDisplayNames[userId] || originalName;
  };

  // Auto-scroll to bottom when new messages arrive - only scroll the chat container, not the page
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Use scrollTop instead of scrollIntoView to avoid scrolling the entire page
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isDisabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  }, [newMessage, isDisabled, onSendMessage]);

  const pinnedMessage = pinnedMessageId
    ? messages.find(m => m.id === pinnedMessageId)
    : null;

  return (
    <div className={cn('flex flex-col h-full min-h-0 max-h-full', className)}>
      {/* Pinned message */}
      {pinnedMessage && (
        <div className={cn("px-4 py-2 border-b flex items-start gap-2 shrink-0", isDark ? "bg-yellow-900/30 border-yellow-600/30" : "bg-yellow-50 border-yellow-200")}>
          <Pin className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className={cn("font-medium text-sm", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{getDisplayName(pinnedMessage.userId, pinnedMessage.userName)}: </span>
            <span className={cn("text-sm", isDark ? "text-[#e8f5f0]/80" : "text-slate-600")}>{pinnedMessage.message}</span>
          </div>
          {isHost && onPinMessage && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", isDark ? "text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}
              onClick={() => onPinMessage(pinnedMessage.id, false)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Messages - using native scroll for better iOS compatibility */}
      <div
        ref={messagesContainerRef}
        className="flex-1 px-4 py-2 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          position: 'relative'
        }}
      >
        {messages.length === 0 ? (
          <div className={cn("flex items-center justify-center h-full", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
            <p>{t('webinars.chat.noMessages', 'No messages yet. Be the first to say hi!')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'group flex items-start gap-2',
                  msg.userId === currentUserId && 'flex-row-reverse'
                )}
              >
                <Avatar className={cn("w-7 h-7 border", isDark ? "border-[#5eb8a8]/30" : "border-slate-200")}>
                  <AvatarImage src={msg.userAvatar} />
                  <AvatarFallback className={cn("text-xs", isDark ? "bg-[#1a352f] text-[#e8f5f0]" : "bg-slate-100 text-slate-600")}>
                    {getInitials(getDisplayName(msg.userId, msg.userName))}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  'flex-1 min-w-0',
                  msg.userId === currentUserId && 'text-right'
                )}>
                  <div className={cn(
                    'flex items-center gap-2 mb-0.5',
                    msg.userId === currentUserId && 'flex-row-reverse'
                  )}>
                    <span className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-[#e8f5f0]' : 'text-slate-700',
                      msg.isHost && (isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')
                    )}>
                      {getDisplayName(msg.userId, msg.userName)}
                      {msg.isHost && (
                        <Badge className={cn("ml-1 text-xs py-0", isDark ? "bg-[#5eb8a8]/20 text-[#e8f5f0] border-[#5eb8a8]/50" : "bg-[#285f59]/10 text-[#285f59] border-[#285f59]/30")}>
                          Host
                        </Badge>
                      )}
                    </span>
                    <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <p className={cn(
                    'text-sm break-words inline-block px-3 py-1.5 rounded-lg max-w-[85%]',
                    msg.userId === currentUserId
                      ? 'bg-gradient-to-r from-[#285f59] to-[#47695b] text-white'
                      : isDark ? 'bg-[#1a352f]/80 text-[#e8f5f0]' : 'bg-slate-100 text-slate-700'
                  )}>
                    {msg.message}
                  </p>
                </div>

                {/* Host actions */}
                {isHost && msg.userId !== currentUserId && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {onPinMessage && !msg.isPinned && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", isDark ? "text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}
                        onClick={() => onPinMessage(msg.id, true)}
                        title={t('webinars.chat.pin', 'Pin message')}
                      >
                        <Pin className="w-3 h-3" />
                      </Button>
                    )}
                    {onDeleteMessage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-600/20"
                        onClick={() => onDeleteMessage(msg.id)}
                        title={t('webinars.chat.delete', 'Delete message')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {isDisabled ? (
        <div className={cn("px-4 py-3 border-t text-center text-sm shrink-0", isDark ? "border-[#5eb8a8]/20 text-[#e8f5f0]/50" : "border-slate-200 text-slate-400")}>
          {t('webinars.chat.disabled')}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cn("px-4 py-3 border-t flex gap-2 shrink-0", isDark ? "border-[#5eb8a8]/20" : "border-slate-200")}>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('webinars.chat.placeholder')}
            maxLength={500}
            className={cn("flex-1", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/30 text-[#e8f5f0] placeholder:text-[#e8f5f0]/40 focus:border-[#5eb8a8]" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#285f59]")}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2a7a6f] hover:to-[#5eb8a8]/80 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

export default WebinarChat;
