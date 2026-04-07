export const ADMIN_INPUT_CLASS =
  "w-full border border-[#E8E4DF] rounded-lg px-3 py-2 font-['Inter'] text-[14px] text-[#2D2D2D] placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-[#B8963E] focus:border-transparent transition-shadow";

interface AdminFormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

export function AdminFormField({ label, htmlFor, error, children }: AdminFormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block font-['Inter'] text-[13px] font-medium text-[#444444] mb-1"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 font-['Inter'] text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default AdminFormField;
