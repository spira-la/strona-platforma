/**
 * SessionConflictDialog
 *
 * Dialog shown when a user tries to join a webinar but already has an active session
 * on another device. Allows them to "move" the session to the current device.
 */

import { useTranslation } from 'react-i18next';
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
import { Monitor, Smartphone, Laptop } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface SessionConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSession: {
    deviceInfo: string;
    connectedAt: string | Date;
    ipAddress?: string;
  };
  onTakeover: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SessionConflictDialog({
  open,
  onOpenChange,
  existingSession,
  onTakeover,
  onCancel,
  isLoading = false,
}: SessionConflictDialogProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Determine device icon based on device info
  const getDeviceIcon = (deviceInfo: string) => {
    if (deviceInfo.includes('Mobile') || deviceInfo.includes('Android') || deviceInfo.includes('iPhone')) {
      return <Smartphone className="h-8 w-8 text-muted-foreground" />;
    }
    if (deviceInfo.includes('Mac') || deviceInfo.includes('Windows')) {
      return <Laptop className="h-8 w-8 text-muted-foreground" />;
    }
    return <Monitor className="h-8 w-8 text-muted-foreground" />;
  };

  // Format the connection time
  const formatConnectionTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {t('webinar.session.conflictTitle', 'Session Active on Another Device')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {t('webinar.session.conflictDescription', 'Your account is currently connected to this webinar from another device.')}
              </p>

              {/* Current active session info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {getDeviceIcon(existingSession.deviceInfo)}
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {existingSession.deviceInfo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('webinar.session.connectedAt', 'Connected at')} {formatConnectionTime(existingSession.connectedAt)}
                  </p>
                </div>
              </div>

              <p className="text-sm">
                {t('webinar.session.takeoverWarning', 'If you continue, the other session will be disconnected.')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              isDark
                ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#5eb8a8]/20"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
            )}
          >
            {t('common.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onTakeover}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading
              ? t('webinar.session.switching', 'Switching...')
              : t('webinar.session.switchHere', 'Switch to This Device')
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * SessionKickedDialog
 *
 * Dialog shown when a user gets disconnected because their session
 * was taken over by another device.
 */
interface SessionKickedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function SessionKickedDialog({
  open,
  onOpenChange,
  onClose,
}: SessionKickedDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {t('webinar.session.kickedTitle', 'Session Disconnected')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {t('webinar.session.kickedDescription', 'You have been disconnected because your account connected from another device.')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('webinar.session.kickedNote', 'If this wasn\'t you, please change your password immediately.')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            {t('common.understood', 'Understood')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
