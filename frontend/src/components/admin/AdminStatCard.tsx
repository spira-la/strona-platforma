interface AdminStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

export function AdminStatCard({ icon: Icon, label, value }: AdminStatCardProps) {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B8963E]/10 shrink-0">
          <Icon className="w-5 h-5 text-[#B8963E]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-['Inter'] text-[13px] text-[#6B6B6B] leading-tight">
            {label}
          </p>
          <p className="font-['Cormorant_Garamond'] font-bold text-[28px] text-[#2D2D2D] leading-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminStatCard;
