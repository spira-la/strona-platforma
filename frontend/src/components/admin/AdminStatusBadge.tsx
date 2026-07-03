type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

interface AdminStatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-100',
  warning: 'bg-orange-50 text-orange-600 border-orange-100',
  error: 'bg-red-50 text-red-600 border-red-100',
  neutral: 'bg-[#F9F6F0] text-[#8A8A8A] border-[#E8E4DF]',
};

export function AdminStatusBadge({ label, variant }: AdminStatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        VARIANT_CLASSES[variant],
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export default AdminStatusBadge;
