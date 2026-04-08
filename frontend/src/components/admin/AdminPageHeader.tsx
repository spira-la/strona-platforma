import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Reusable page header for admin pages.
 * Renders the page title (Cormorant Garamond), an optional description,
 * and an optional action element (e.g. a button) aligned to the right.
 */
export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1
          className={[
            "font-['Cormorant_Garamond',serif] font-bold text-2xl leading-tight",
            'text-[#2D2D2D] truncate',
          ].join(' ')}
        >
          {title}
        </h1>
        {description && (
          <p
            className={[
              "mt-1 font-['Inter',sans-serif] text-sm leading-relaxed",
              'text-[#6B6B6B]',
            ].join(' ')}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}

export default AdminPageHeader;
