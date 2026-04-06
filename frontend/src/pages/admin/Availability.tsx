import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminAvailability() {
  return (
    <div>
      <AdminPageHeader
        title="Dostępność"
        description="Konfiguracja godzin pracy"
      />
      <div className="mt-8 rounded-xl bg-white border border-[#E8E4DF] p-8 text-center">
        <p className="font-['Lato'] text-[15px] text-[#8A8A8A]">
          Ta sekcja jest w przygotowaniu.
        </p>
      </div>
    </div>
  );
}
