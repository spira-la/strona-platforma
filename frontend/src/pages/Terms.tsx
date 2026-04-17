import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Phone, MapPin } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';

const SECTIONS = [
  'generalProvisions',
  'productsAndServices',
  'orders',
  'payments',
  'delivery',
  'withdrawal',
  'complaints',
  'copyright',
  'storeUsage',
  'liability',
  'personalData',
  'jurisdiction',
  'changes',
] as const;

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <SEO
        title="Regulamin"
        description="Regulamin sklepu internetowego Spirala."
        canonical="/regulamin"
        noindex
      />

      <div className="max-w-[960px] mx-auto px-5 sm:px-6 md:px-8 py-12 md:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors mb-10"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Wróć do strony głównej
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A] mb-6">
            <FileText className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <EditableText
            section="terms"
            fieldPath="title"
            as="h1"
            placeholder="Regulamin"
            className="font-['Playfair_Display'] text-[32px] md:text-[44px] font-normal text-[#2D2D2D] leading-[1.15] tracking-[-0.015em] mb-3"
          />
          <p className="font-['Lato'] text-[13px] text-[#8A8A8A]">
            <EditableText
              section="terms"
              fieldPath="effectiveDate"
              as="span"
              placeholder="Obowiązuje od"
            />
            : 2026
          </p>
        </div>

        {/* Language notice */}
        <div className="bg-[#F5F3EF] rounded-lg p-5 md:p-6 mb-10 border-l-4 border-[#B8944A]">
          <EditableText
            section="terms"
            fieldPath="languageNotice"
            as="p"
            multiline
            placeholder="Regulamin jest dostępny w trzech wersjach językowych: polskiej, angielskiej i hiszpańskiej. W przypadku rozbieżności wersja nadrzędna jest wersja polska."
            className="font-['Lato'] text-[14px] text-[#4A4A4A] leading-[1.7] italic"
          />
        </div>

        {/* Company card */}
        <div className="bg-[#F5F3EF] rounded-lg p-6 md:p-8 mb-10">
          <EditableText
            section="terms"
            fieldPath="company.name"
            as="h2"
            placeholder="Spirala — Aneta"
            className="font-['Playfair_Display'] text-[22px] font-normal text-[#2D2D2D] mb-4"
          />
          <div className="space-y-2.5 font-['Lato'] text-[14px] text-[#4A4A4A]">
            <div className="flex items-center gap-2.5">
              <MapPin
                size={14}
                className="text-[#B8944A] shrink-0"
                aria-hidden="true"
              />
              <EditableText
                section="terms"
                fieldPath="company.address"
                as="span"
                placeholder="Polska"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-[#B8944A]">NIP:</span>
              <EditableText
                section="terms"
                fieldPath="company.nip"
                as="span"
                placeholder="—"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Mail
                size={14}
                className="text-[#B8944A] shrink-0"
                aria-hidden="true"
              />
              <EditableText
                section="terms"
                fieldPath="company.email"
                as="span"
                placeholder="kontakt@spira-la.com"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Phone
                size={14}
                className="text-[#B8944A] shrink-0"
                aria-hidden="true"
              />
              <EditableText
                section="terms"
                fieldPath="company.phone"
                as="span"
                placeholder="+48 000 000 000"
              />
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <EditableText
            section="terms"
            fieldPath="introduction"
            as="p"
            multiline
            placeholder="Regulamin określa zasady korzystania ze strony internetowej dostępnej pod adresem www.spira-la.com oraz świadczenia usług coachingowych i terapeutycznych."
            className="font-['Lato'] text-[16px] md:text-[17px] text-[#3F3F3F] leading-[1.8]"
          />
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((key, i) => (
            <section
              key={key}
              className="border-b border-[#E8E4DF] pb-10 last:border-0 last:pb-0"
            >
              <h2 className="flex items-center gap-3 font-['Playfair_Display'] text-[22px] md:text-[26px] font-normal text-[#2D2D2D] mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F3EF] text-[#B8944A] border border-[#B8944A]/30 font-['Lato'] text-[13px] font-bold shrink-0">
                  {i + 1}
                </span>
                <EditableText
                  section="terms"
                  fieldPath={`sections.${key}.title`}
                  as="span"
                  placeholder={key}
                />
              </h2>
              <div className="pl-11">
                <EditableText
                  section="terms"
                  fieldPath={`sections.${key}.content`}
                  as="p"
                  multiline
                  placeholder="…"
                  className="font-['Lato'] text-[15px] md:text-[16px] text-[#4A4A4A] leading-[1.8]"
                />
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-[#F5F3EF] rounded-lg p-6 md:p-8">
          <h2 className="flex items-center gap-3 font-['Playfair_Display'] text-[22px] md:text-[26px] font-normal text-[#2D2D2D] mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#B8944A] border border-[#B8944A]/30 font-['Lato'] text-[13px] font-bold shrink-0">
              {SECTIONS.length + 1}
            </span>
            <EditableText
              section="terms"
              fieldPath="sections.contact.title"
              as="span"
              placeholder="Kontakt"
            />
          </h2>
          <div className="pl-11 space-y-2 font-['Lato'] text-[15px] text-[#4A4A4A]">
            <p className="font-semibold text-[#2D2D2D]">
              <EditableText
                section="terms"
                fieldPath="company.name"
                as="span"
                placeholder="Spirala — Aneta"
              />
            </p>
            <p>
              Email:{' '}
              <EditableText
                section="terms"
                fieldPath="company.email"
                as="span"
                placeholder="kontakt@spira-la.com"
                className="text-[#B8944A] font-semibold"
              />
            </p>
            <p>
              Telefon:{' '}
              <EditableText
                section="terms"
                fieldPath="company.phone"
                as="span"
                placeholder="+48 000 000 000"
                className="text-[#B8944A] font-semibold"
              />
            </p>
            <p>
              Adres:{' '}
              <EditableText
                section="terms"
                fieldPath="company.address"
                as="span"
                placeholder="Polska"
              />
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
