interface FilterTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface AdminFilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (value: T) => void;
  isLoading?: boolean;
}

export function AdminFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  isLoading = false,
}: AdminFilterTabsProps<T>) {
  return (
    <div
      className="flex gap-1 bg-white border border-[#E8E4DF] rounded-lg p-1 w-fit"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={[
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md font-['Inter'] text-[13px] font-medium transition-colors duration-150",
              isActive
                ? 'bg-[#B8963E]/10 text-[#B8963E]'
                : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F9F6F0]',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={[
                  'text-[11px] px-1.5 py-0.5 rounded-full',
                  isActive
                    ? 'bg-[#B8963E]/20 text-[#B8963E]'
                    : 'bg-[#E8E4DF] text-[#8A8A8A]',
                ].join(' ')}
              >
                {isLoading ? '—' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AdminFilterTabs;
