export const ADMIN_INPUT_CLASS =
  "block w-full min-w-0 border border-line rounded-lg px-3 py-2.5 font-['Inter'] text-[14px] text-ink placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow";

interface AdminFormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

export function AdminFormField({
  label,
  htmlFor,
  error,
  children,
}: AdminFormFieldProps) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="block font-['Inter'] text-[13px] font-medium text-ink mb-1"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          className="mt-1 font-['Inter'] text-[12px] text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default AdminFormField;
