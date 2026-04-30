import { useTranslation } from 'react-i18next';
import { Clock, Circle, Users } from 'lucide-react';
import { useParticipants } from '@livekit/components-react';
import type { Booking } from '@/clients/BookingsClient';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/header/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

interface MeetingHeaderProps {
  booking: Booking;
  isRecording: boolean;
}

export function MeetingHeader({ booking, isRecording }: MeetingHeaderProps) {
  const { t } = useTranslation();
  const participants = useParticipants();
  const { isDark } = useTheme();

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 bg-bwm-card/95 backdrop-blur border-b border-bwm-card shrink-0">
      {/* Left: session info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-medium text-bwm-primary truncate max-w-[120px] sm:max-w-none">
            {booking.serviceName || t('meeting.session', 'Coaching Session')}
          </h2>
          <p className="text-[10px] sm:text-xs text-bwm-secondary truncate">
            {booking.coachName}
          </p>
        </div>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Duration */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-bwm-secondary">
          <Clock className="h-3.5 w-3.5" />
          <span>{booking.duration} {t('common.minutes', 'min')}</span>
        </div>

        {/* Participant count */}
        <div className="flex items-center gap-1 text-xs text-bwm-secondary">
          <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{participants.length}</span>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-1 text-xs text-red-400 animate-pulse">
            <Circle className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-red-500 text-red-500" />
            <span className="hidden sm:inline font-medium">{t('meeting.recording', 'REC')}</span>
          </div>
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Language switcher */}
        <LanguageSwitcher variant={isDark ? 'default' : 'light'} textColor={isDark ? 'white' : 'black'} />
      </div>
    </div>
  );
}
