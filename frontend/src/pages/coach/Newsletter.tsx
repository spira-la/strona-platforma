import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function CoachNewsletter() {
  const { t } = useTranslation();

  return (
    <div>
      <AdminPageHeader
        title={t('coach.newsletter.title')}
        description={t('coach.newsletter.description')}
      />
      <div className="mt-8 rounded-xl bg-white border border-line p-8 text-center">
        <p className="font-['Inter'] text-[15px] text-ink-muted">
          {t('coach.common.inPreparation')}
        </p>
      </div>
    </div>
  );
}
