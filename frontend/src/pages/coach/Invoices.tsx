import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function CoachInvoices() {
  const { t } = useTranslation();

  return (
    <div>
      <AdminPageHeader
        title={t('coach.invoices.title')}
        description={t('coach.invoices.description')}
      />
      <div className="mt-8 rounded-xl bg-white border border-line p-8 text-center">
        <p className="font-['Inter'] text-[15px] text-ink-muted">
          {t('coach.common.inPreparation')}
        </p>
      </div>
    </div>
  );
}
