import { Search, Plus } from 'lucide-react';

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  onAction?: () => void;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  onAction,
}: AdminSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full pl-9 pr-4 py-2.5 border border-[#E8E4DF] rounded-lg font-['Inter'] text-[14px] text-[#2D2D2D] placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-[#B8963E] focus:border-transparent transition-shadow bg-white"
        />
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B8963E] hover:bg-[#8A6F2E] text-white font-['Inter'] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          <ActionIcon size={16} aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default AdminSearchBar;
