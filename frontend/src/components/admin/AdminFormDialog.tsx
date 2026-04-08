import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';

interface AdminFormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  /** When provided, the cancel button calls this instead of onClose */
  onCancel?: () => void;
  children: React.ReactNode;
}

export function AdminFormDialog({
  open,
  title,
  onClose,
  onSubmit,
  isLoading = false,
  submitLabel,
  cancelLabel,
  onCancel,
  children,
}: AdminFormDialogProps) {
  const { t } = useTranslation();
  const backdropRef = useRef<HTMLDivElement>(null);
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const handleCancelClick = onCancel ?? onClose;

  // Escape key
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[500px] mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F0EDE8] shrink-0">
          <h2 className="font-['Cormorant_Garamond'] font-bold text-[20px] text-[#2D2D2D]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            aria-label={resolvedCancelLabel}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={onSubmit}
          className="overflow-y-auto px-6 py-5 flex flex-col gap-5"
          noValidate
        >
          {children}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-[#E8E4DF] font-['Inter'] text-[14px] font-medium text-[#6B6B6B] hover:bg-[#F9F6F0] hover:text-[#2D2D2D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] disabled:opacity-50"
            >
              {resolvedCancelLabel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8963E] hover:bg-[#8A6F2E] text-white font-['Inter'] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {isLoading && (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              )}
              {submitLabel}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default AdminFormDialog;
