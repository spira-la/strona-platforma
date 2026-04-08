import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Per-variant confirm button styles ───────────────────────────────────────

const CONFIRM_VARIANTS: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
  warning:
    'bg-amber-500 hover:bg-amber-600 text-white focus-visible:ring-amber-400',
  default:
    'bg-[#B8963E] hover:bg-[#8A6F2E] text-white focus-visible:ring-[#B8963E]',
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    },
    [isLoading, onCancel],
  );

  // Body scroll lock + Escape listener
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const confirmButtonClass = CONFIRM_VARIANTS[variant];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      aria-hidden="false"
      onClick={(e) => {
        // Close on backdrop click (not on card click)
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className={[
          'bg-white rounded-xl shadow-2xl',
          'w-full max-w-[400px] mx-4 p-6',
          'flex flex-col gap-0',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="font-['Cormorant_Garamond',serif] font-bold text-[18px] text-[#2D2D2D] leading-snug mb-3"
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          className="font-['Inter',sans-serif] text-[14px] text-[#6B6B6B] leading-relaxed mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {/* Cancel */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className={[
              'px-4 py-2 rounded-lg border border-[#E8E4DF]',
              "font-['Inter',sans-serif] text-[14px] font-medium text-[#444444]",
              'hover:bg-[#F9F6F0] transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#E8E4DF]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {resolvedCancelLabel}
          </button>

          {/* Confirm */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              "font-['Inter',sans-serif] text-[14px] font-medium",
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'disabled:opacity-70 disabled:cursor-not-allowed',
              confirmButtonClass,
            ].join(' ')}
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
