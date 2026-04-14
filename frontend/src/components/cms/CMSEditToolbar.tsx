import { PencilIcon, XIcon } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CMSEditToolbar — floating admin toolbar (bottom-right corner).
 *
 * Visible only to users with admin role. Provides a single toggle to switch
 * between view mode and CMS inline-edit mode.
 */
export function CMSEditToolbar() {
  const { user } = useAuth();
  const { isEditMode, setEditMode } = useCMS();

  const isAdmin =
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin';

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => setEditMode(!isEditMode)}
        className={`
          flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]/60
          ${
            isEditMode
              ? 'bg-[#B8963E] text-white hover:bg-[#8A6F2E]'
              : 'bg-white text-[#B8963E] border border-[#B8963E] hover:bg-[#F9F6F0]'
          }
        `}
        aria-pressed={isEditMode}
        title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
      >
        {isEditMode ? (
          <>
            <XIcon className="h-4 w-4" aria-hidden="true" />
            <span>Exit Edit Mode</span>
          </>
        ) : (
          <>
            <PencilIcon className="h-4 w-4" aria-hidden="true" />
            <span>Edit Content</span>
          </>
        )}
      </button>
    </div>
  );
}

export default CMSEditToolbar;
