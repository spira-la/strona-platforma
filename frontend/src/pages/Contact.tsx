import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Phone,
  Mail,
  Globe,
  Code,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Imie i nazwisko musi miec co najmniej 2 znaki')
    .max(100, 'Imie i nazwisko jest za dlugie'),
  email: z.string().email('Podaj poprawny adres e-mail'),
  phone: z
    .string()
    .max(20, 'Numer telefonu jest za dlugi')
    .optional()
    .or(z.literal('')),
  subject: z.enum(['coaching', 'terapia', 'strona', 'wspolpraca', 'inne'], { message: 'Wybierz temat wiadomosci' }),
  message: z
    .string()
    .min(10, 'Wiadomosc musi miec co najmniej 10 znakow')
    .max(2000, 'Wiadomosc jest za dluga'),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block font-['Lato'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#B8944A] bg-[#B8944A]/[0.1] rounded-full px-4 py-1.5">
      {label}
    </span>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  number: string;
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function StepCard({
  icon,
  number,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 rounded-xl bg-white border border-[#E8E4DF] shadow-sm relative">
      <span className="absolute -top-3 left-6 font-['Lato'] text-[11px] font-bold text-[#B8944A] bg-white border border-[#E8E4DF] rounded-full px-2.5 py-0.5">
        {number}
      </span>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A] mb-5">
        {icon}
      </div>
      <EditableText
        section="contact"
        fieldPath={titleField}
        as="h3"
        className="font-['Playfair_Display'] text-[17px] font-bold text-[#2D2D2D] mb-3"
        placeholder={titlePlaceholder}
      />
      <EditableText
        section="contact"
        fieldPath={descField}
        as="p"
        className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed"
        placeholder={descPlaceholder}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function PricingBannerSection() {
  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      aria-label="Oferta strony internetowej"
      style={{
        background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 60%, #B8944A 100%)',
      }}
    >
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Text */}
        <ScrollReveal animation="fade" delay={200} className="flex-1 flex flex-col gap-5 text-center md:text-left">
          <span className="inline-block self-center md:self-start font-['Lato'] text-[11px] font-bold tracking-[0.1em] uppercase text-[#B8944A] bg-white rounded-full px-4 py-1.5">
            Oferta specjalna
          </span>
          <EditableText
            section="contact"
            fieldPath="pricing.title"
            as="h2"
            className="font-['Playfair_Display'] text-[28px] md:text-[36px] font-bold text-white leading-snug"
            placeholder="Chcesz taka strone dla siebie?"
          />
          <EditableText
            section="contact"
            fieldPath="pricing.description"
            as="p"
            className="font-['Lato'] text-[15px] text-white/85 leading-[1.7] max-w-[520px]"
            placeholder="Tworze profesjonalne strony internetowe dla coachow, terapeutow i specjalistow. Elegancki design, CMS do edycji tresci i szybkie wdrozenie."
          />
          <div className="flex items-baseline gap-3">
            <EditableText
              section="contact"
              fieldPath="pricing.price"
              as="span"
              className="font-['Playfair_Display'] text-[48px] font-bold text-white"
              placeholder="2 000 zl"
            />
            <EditableText
              section="contact"
              fieldPath="pricing.priceNote"
              as="span"
              className="font-['Lato'] text-[15px] text-white/70"
              placeholder="jednorazowo"
            />
          </div>
          <a
            href="#kontakt-formularz"
            className="inline-block self-center md:self-start font-['Lato'] text-[14px] font-semibold text-[#B8944A] bg-white hover:bg-[#FAF8F5] rounded-lg px-6 py-3 transition-colors"
          >
            Zapytaj o szczegoly
          </a>
        </ScrollReveal>

        {/* Mockup placeholder */}
        <div className="md:w-[380px] flex-shrink-0">
          <div className="w-full aspect-[4/3] rounded-lg bg-white/20 border border-white/30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white/60">
              <Globe size={40} aria-hidden="true" />
              <span className="font-['Lato'] text-[13px]"><EditableText section="contact" fieldPath="previewLabel" as="span" placeholder="Podgląd strony" /></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="bg-[#FAF8F5] py-14 md:py-20" aria-label="Proces tworzenia strony">
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <SectionBadge label="Proces" />
            <EditableText
              section="contact"
              fieldPath="process.title"
              as="h2"
              className="font-['Playfair_Display'] text-[26px] md:text-[34px] font-bold text-[#2D2D2D]"
              placeholder="Jak wyglada tworzenie Twojej strony?"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <StepCard
              icon={<Phone size={24} aria-hidden="true" />}
              number="01"
              titleField="process.step1.title"
              titlePlaceholder="Pierwsza rozmowa"
              descField="process.step1.desc"
              descPlaceholder="Bezplatna konsultacja — poznajesz moje podejscie, opowiadasz o swoich potrzebach i razem ustalamy zakres projektu."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <StepCard
              icon={<Code size={24} aria-hidden="true" />}
              number="02"
              titleField="process.step2.title"
              titlePlaceholder="Projekt i wdrozenie"
              descField="process.step2.desc"
              descPlaceholder="Tworze projekt graficzny i wdrazzam strone. Przez caly czas bedziemy w kontakcie, a Ty zatwierdzasz kazdy etap."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(2)}>
            <StepCard
              icon={<Globe size={24} aria-hidden="true" />}
              number="03"
              titleField="process.step3.title"
              titlePlaceholder="Twoja gotowa strona"
              descField="process.step3.desc"
              descPlaceholder="Przekazuje strone z panelem CMS, szkoleniem i pelnym wsparciem technicznym. Jestes gotowa/y dzialac."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function ContactInfoColumn() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <EditableText
          section="contact"
          fieldPath="info.greeting"
          as="h3"
          className="font-['Playfair_Display'] text-[22px] font-bold text-[#2D2D2D] mb-2"
          placeholder="Porozmawiajmy"
        />
        <EditableText
          section="contact"
          fieldPath="info.description"
          as="p"
          className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
          placeholder="Jestem tu dla Ciebie. Napisz, zadzwon lub wyslij wiadomosc przez formularz — odpowiem w ciagu 24 godzin."
        />
      </div>

      <div className="flex flex-col gap-4">
        <a
          href="mailto:kontakt@spirala.pl"
          className="flex items-center gap-3 group"
          aria-label="Napisz e-mail"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A] flex-shrink-0">
            <Mail size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="font-['Lato'] text-[12px] text-[#8A8A8A] uppercase tracking-wide"><EditableText section="contact" fieldPath="infoEmailLabel" as="span" placeholder="E-mail" /></p>
            <EditableText
              section="contact"
              fieldPath="info.email"
              as="span"
              className="font-['Lato'] text-[15px] text-[#2D2D2D] group-hover:text-[#B8944A] transition-colors"
              placeholder="kontakt@spirala.pl"
            />
          </div>
        </a>

        <a
          href="tel:+48000000000"
          className="flex items-center gap-3 group"
          aria-label="Zadzwon"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A] flex-shrink-0">
            <Phone size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="font-['Lato'] text-[12px] text-[#8A8A8A] uppercase tracking-wide"><EditableText section="contact" fieldPath="infoPhoneLabel" as="span" placeholder="Telefon" /></p>
            <EditableText
              section="contact"
              fieldPath="info.phone"
              as="span"
              className="font-['Lato'] text-[15px] text-[#2D2D2D] group-hover:text-[#B8944A] transition-colors"
              placeholder="+48 000 000 000"
            />
          </div>
        </a>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A] flex-shrink-0">
            <Clock size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="font-['Lato'] text-[12px] text-[#8A8A8A] uppercase tracking-wide"><EditableText section="contact" fieldPath="infoHoursLabel" as="span" placeholder="Godziny" /></p>
            <EditableText
              section="contact"
              fieldPath="info.hours"
              as="span"
              className="font-['Lato'] text-[15px] text-[#2D2D2D]"
              placeholder="Pn–Pt: 9:00–18:00"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-['Lato'] text-[12px] text-[#8A8A8A] uppercase tracking-wide">
          <EditableText section="contact" fieldPath="infoSocialLabel" as="span" placeholder="Social media" />
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#E8E4DF] text-[#6B6B6B] hover:text-[#B8944A] hover:border-[#B8944A] transition-colors"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-[#E8E4DF] text-[#6B6B6B] hover:text-[#B8944A] hover:border-[#B8944A] transition-colors"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function ContactFormColumn() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(_data: ContactFormData) {
    try {
      // API call placeholder — will be wired to backend in future iteration
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setSubmitStatus('success');
      reset();
    } catch {
      setSubmitStatus('error');
    }
  }

  const inputClass =
    "w-full font-['Lato'] text-[14px] text-[#2D2D2D] placeholder:text-[#8A8A8A] bg-white border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 transition";
  const errorClass = "font-['Lato'] text-[12px] text-red-500 mt-1";

  return (
    <div
      id="kontakt-formularz"
      className="bg-white rounded-lg border border-[#E8E4DF] shadow-sm p-7 md:p-9"
    >
      <EditableText
        section="contact"
        fieldPath="form.title"
        as="h3"
        className="font-['Playfair_Display'] text-[22px] font-bold text-[#2D2D2D] mb-6"
        placeholder="Wyslij wiadomosc"
      />

      {submitStatus === 'success' && (
        <div className="flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-4 mb-6">
          <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="font-['Lato'] text-[14px] text-emerald-700">
            <EditableText section="contact" fieldPath="formSuccessMsg" as="span" placeholder="Wiadomość została wysłana! Odpowiem w ciągu 24 godzin." />
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-5 py-4 mb-6">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="font-['Lato'] text-[14px] text-red-600">
            <EditableText section="contact" fieldPath="formErrorMsg" as="span" placeholder="Coś poszło nie tak. Spróbuj ponownie lub napisz bezpośrednio na e-mail." />
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Full name */}
        <div>
          <label
            htmlFor="contact-name"
            className="block font-['Lato'] text-[13px] font-semibold text-[#2D2D2D] mb-1.5"
          >
            <EditableText section="contact" fieldPath="formNameLabel" as="span" placeholder="Imię i nazwisko" />
            <span className="text-[#B8944A] ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Jan Kowalski"
            autoComplete="name"
            {...register('fullName')}
            className={inputClass}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'error-name' : undefined}
          />
          {errors.fullName && (
            <p id="error-name" className={errorClass} role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="contact-email"
            className="block font-['Lato'] text-[13px] font-semibold text-[#2D2D2D] mb-1.5"
          >
            <EditableText section="contact" fieldPath="formEmailLabel" as="span" placeholder="E-mail" />
            <span className="text-[#B8944A] ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="jan@przykald.pl"
            autoComplete="email"
            {...register('email')}
            className={inputClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'error-email' : undefined}
          />
          {errors.email && (
            <p id="error-email" className={errorClass} role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <label
            htmlFor="contact-phone"
            className="block font-['Lato'] text-[13px] font-semibold text-[#2D2D2D] mb-1.5"
          >
            <EditableText section="contact" fieldPath="formPhoneLabel" as="span" placeholder="Telefon" />
            <span className="font-['Lato'] text-[12px] font-normal text-[#8A8A8A] ml-1.5"><EditableText section="contact" fieldPath="formPhoneOptional" as="span" placeholder="(opcjonalnie)" /></span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            placeholder="+48 000 000 000"
            autoComplete="tel"
            {...register('phone')}
            className={inputClass}
          />
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="contact-subject"
            className="block font-['Lato'] text-[13px] font-semibold text-[#2D2D2D] mb-1.5"
          >
            <EditableText section="contact" fieldPath="formSubjectLabel" as="span" placeholder="Temat" />
            <span className="text-[#B8944A] ml-0.5" aria-hidden="true">*</span>
          </label>
          <select
            id="contact-subject"
            {...register('subject')}
            className={`${inputClass} cursor-pointer`}
            defaultValue=""
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'error-subject' : undefined}
          >
            <option value="" disabled>Wybierz temat...</option>
            <option value="coaching">Coaching</option>
            <option value="terapia">Terapia</option>
            <option value="strona">Strona internetowa</option>
            <option value="wspolpraca">Wspolpraca</option>
            <option value="inne">Inne</option>
          </select>
          {errors.subject && (
            <p id="error-subject" className={errorClass} role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="block font-['Lato'] text-[13px] font-semibold text-[#2D2D2D] mb-1.5"
          >
            <EditableText section="contact" fieldPath="formMessageLabel" as="span" placeholder="Wiadomość" />
            <span className="text-[#B8944A] ml-0.5" aria-hidden="true">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            placeholder="Napisz, w czym moge Ci pomoc..."
            {...register('message')}
            className={`${inputClass} resize-none`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'error-message' : undefined}
          />
          {errors.message && (
            <p id="error-message" className={errorClass} role="alert">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#D4B97A] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-6 py-3.5 transition-colors"
        >
          {isSubmitting ? 'Wysyłanie...' : <EditableText section="contact" fieldPath="formSubmitButton" as="span" placeholder="Wyślij wiadomość" />}
        </button>
      </form>
    </div>
  );
}

function ContactSection() {
  return (
    <section className="bg-white py-14 md:py-20" aria-label="Formularz kontaktowy">
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <SectionBadge label="Kontakt" />
            <EditableText
              section="contact"
              fieldPath="section.title"
              as="h2"
              className="font-['Playfair_Display'] text-[26px] md:text-[34px] font-bold text-[#2D2D2D]"
              placeholder="Porozmawiajmy"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <ScrollReveal animation="fade-right">
            <ContactInfoColumn />
          </ScrollReveal>
          <ScrollReveal animation="fade-left">
            <ContactFormColumn />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Contact() {
  return (
    <main>
      <PricingBannerSection />
      <ProcessSection />
      <ContactSection />
    </main>
  );
}
