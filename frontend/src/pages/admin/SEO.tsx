import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminSEO() {
  const { t } = useTranslation();

  return (
    <div>
      <AdminPageHeader
        title={t('admin.seo.title')}
        description={t('admin.seo.description')}
      />
      <div className="mt-8 rounded-xl bg-white border border-line p-8 text-center">
        <p className="font-['Inter'] text-[15px] text-ink-muted">
          {t('admin.common.inPreparation')}
        </p>
      </div>
    </div>
  );
}
