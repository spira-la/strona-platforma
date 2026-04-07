import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminBlogEditor() {
  return (
    <div>
      <AdminPageHeader
        title="Edytor artykułu"
        description="Tworzenie i edycja artykułów"
      />
      <div className="mt-8 rounded-xl bg-white border border-[#E8E4DF] p-8 text-center">
        <p className="font-['Lato'] text-[15px] text-[#8A8A8A]">
          Ta sekcja jest w przygotowaniu.
        </p>
      </div>
    </div>
  );
}
