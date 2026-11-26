interface AdminStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

export function AdminStatCard({
  icon: Icon,
  label,
  value,
}: AdminStatCardProps) {
  return (
    <div className="bg-white border border-line rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/10 shrink-0">
          <Icon className="w-5 h-5 text-brand" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-['Inter'] text-[13px] text-ink-soft leading-tight">
            {label}
          </p>
          <p className="font-['Cormorant_Garamond'] font-bold text-[28px] text-ink leading-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminStatCard;
