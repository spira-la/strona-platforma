import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toast.store';
import type { Toast, ToastType } from '@/stores/toast.store';

// ─── Per-type visual config ───────────────────────────────────────────────────

interface ToastVisuals {
  barColor: string;
  bgColor: string;
  Icon: React.ElementType;
  iconColor: string;
}

const TOAST_VISUALS: Record<ToastType, ToastVisuals> = {
  success: {
    barColor: 'bg-green-600',
    bgColor: 'bg-green-50',
    Icon: CheckCircle2,
    iconColor: 'text-green-600',
  },
  error: {
    barColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    Icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    barColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    Icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  info: {
    barColor: 'bg-[#B8963E]',
    bgColor: 'bg-[#F9F6F0]',
    Icon: Info,
    iconColor: 'text-[#B8963E]',
  },
};

// ─── Single Toast item ────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const visuals = TOAST_VISUALS[toast.type];
  const { barColor, bgColor, Icon, iconColor } = visuals;

  // Trigger slide-in animation on mount
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start off-screen, animate to position
    el.style.transform = 'translateX(120%)';
    el.style.opacity = '0';
    // Defer so the browser paints the initial state before transitioning
    const raf = requestAnimationFrame(() => {
      el.style.transition =
        'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease';
      el.style.transform = 'translateX(0)';
      el.style.opacity = '1';
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        'flex items-start overflow-hidden',
        'rounded-xl shadow-lg border border-[#E8E4DF]',
        'min-w-[300px] max-w-[400px] w-full',
        bgColor,
      ].join(' ')}
    >
      {/* Left color bar */}
      <div
        className={[
          'w-1 flex-shrink-0 self-stretch rounded-l-xl',
          barColor,
        ].join(' ')}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className="flex-shrink-0 p-3 pl-3">
        <Icon className={['h-5 w-5', iconColor].join(' ')} aria-hidden="true" />
      </div>

      {/* Message */}
      <p className="flex-1 py-3 pr-2 text-sm leading-snug text-[#2D2D2D] font-['Inter',sans-serif] break-words">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        aria-label="Zamknij powiadomienie"
        onClick={() => onRemove(toast.id)}
        className={[
          'flex-shrink-0 p-3 text-[#AAAAAA]',
          'hover:text-[#2D2D2D] transition-colors duration-150',
        ].join(' ')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Powiadomienia"
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
