import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F9F6F0] px-4 text-center">
      <SEO
        title="404"
        description="Strona nie została znaleziona."
        noindex={true}
      />
      <h1
        className="text-8xl font-bold text-[#B8963E]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        404
      </h1>
      <h2
        className="mt-4 text-2xl font-semibold text-[#1a1a1a]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        <EditableText section="notFound" fieldPath="title">
          {t('notFound.title')}
        </EditableText>
      </h2>
      <p className="mt-2 text-base text-[#555555]">
        <EditableText section="notFound" fieldPath="description">
          {t('notFound.description')}
        </EditableText>
      </p>
      <Link
        to="/"
        className="mt-8 inline-block rounded px-6 py-3 bg-[#B8963E] text-white font-medium hover:bg-[#8A6F2E] transition-colors"
      >
        <EditableText section="notFound" fieldPath="backHome">
          {t('notFound.backHome')}
        </EditableText>
      </Link>
    </main>
  );
}
