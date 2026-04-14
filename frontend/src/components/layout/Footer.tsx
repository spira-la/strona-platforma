import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EditableText } from '@/components/cms/EditableText';
import spiralaIcon from '@/assets/spirala-icon.png';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface FooterColumn {
  titleField: string;
  titleDefault: string;
  links: Array<{
    href: string;
    fieldPath: string;
    labelDefault: string;
    isEmail?: boolean;
  }>;
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    titleField: 'col1Title',
    titleDefault: 'Nawigacja',
    links: [
      { href: '/o-mnie', fieldPath: 'col1Link1', labelDefault: 'O Mnie' },
      {
        href: '/jak-pracuje',
        fieldPath: 'col1Link2',
        labelDefault: 'Jak Pracuję',
      },
      { href: '/uslugi', fieldPath: 'col1Link3', labelDefault: 'Usługi' },
    ],
  },
  {
    titleField: 'col2Title',
    titleDefault: 'Oferta',
    links: [
      { href: '/uslugi', fieldPath: 'col2Link1', labelDefault: 'Sesja 1 na 1' },
      {
        href: '/uslugi#pakiety',
        fieldPath: 'col2Link2',
        labelDefault: 'Pakiety sesji',
      },
      { href: '/blog', fieldPath: 'col2Link3', labelDefault: 'Blog' },
    ],
  },
  {
    titleField: 'col3Title',
    titleDefault: 'Kontakt',
    links: [
      {
        href: '/kontakt',
        fieldPath: 'col3Link1',
        labelDefault: 'Formularz kontaktowy',
      },
      {
        href: 'mailto:kontakt@spira-la.com',
        fieldPath: 'col3Link2',
        labelDefault: 'kontakt@spira-la.com',
        isEmail: true,
      },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    Icon: InstagramIcon,
  },
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    Icon: FacebookIcon,
  },
  {
    href: 'https://linkedin.com',
    label: 'LinkedIn',
    Icon: LinkedInIcon,
  },
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      className="bg-[#FAF8F5]"
      role="contentinfo"
      aria-label="Stopka strony"
    >
      {/* Top section */}
      <div className="mx-auto px-6 md:px-[120px] pt-12 pb-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-20">
          {/* Left: logo + description + social */}
          <div className="flex flex-col gap-4 lg:max-w-[280px]">
            <Link
              to="/"
              className="flex items-center gap-2 self-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
              aria-label="Spirala — strona główna"
            >
              <img
                src={spiralaIcon}
                alt=""
                className="h-8 w-auto"
                aria-hidden="true"
              />
              <span className="font-['Cormorant_Garamond'] text-[20px] font-bold tracking-[-0.5px] text-[#B8944A] hover:text-[#8A6F2E]">
                Spirala
              </span>
            </Link>

            <p className="font-['Lato'] text-[14px] leading-relaxed text-[#6B6B6B]">
              <EditableText section="footer" fieldPath="description">
                Coaching i terapia wspierające Twój osobisty rozwój i dobrostan.
              </EditableText>
            </p>

            {/* Social icons */}
            <div
              className="flex items-center gap-4 mt-1"
              aria-label="Media społecznościowe"
            >
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-[#8A8A8A] hover:text-[#B8944A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Right: navigation columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-20">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.titleField} className="flex flex-col gap-3">
                <h3 className="font-['Lato'] text-[14px] font-bold text-[#2D2D2D] uppercase tracking-wide">
                  <EditableText section="footer" fieldPath={col.titleField}>
                    {col.titleDefault}
                  </EditableText>
                </h3>
                <ul className="flex flex-col gap-2.5" role="list">
                  {col.links.map((link) => (
                    <li key={link.fieldPath}>
                      {link.isEmail ? (
                        <a
                          href={link.href}
                          className="font-['Lato'] text-[14px] text-[#6B6B6B] hover:text-[#B8944A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
                        >
                          <EditableText
                            section="footer"
                            fieldPath={link.fieldPath}
                          >
                            {link.labelDefault}
                          </EditableText>
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="font-['Lato'] text-[14px] text-[#6B6B6B] hover:text-[#B8944A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
                        >
                          <EditableText
                            section="footer"
                            fieldPath={link.fieldPath}
                          >
                            {link.labelDefault}
                          </EditableText>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mx-6 md:mx-[120px] h-px bg-[#D4B97A]/50"
        aria-hidden="true"
      />

      {/* Bottom bar */}
      <div className="mx-auto px-6 md:px-[120px] py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-['Lato'] text-[13px] text-[#8A8A8A]">
          <EditableText section="footer" fieldPath="copyright">
            {t('footer.copyright')}
          </EditableText>
        </p>

        <nav aria-label="Linki prawne" className="flex items-center gap-6">
          <Link
            to="/polityka-prywatnosci"
            className="font-['Lato'] text-[13px] text-[#8A8A8A] hover:text-[#B8944A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
          >
            <EditableText section="footer" fieldPath="privacy">
              {t('footer.privacy')}
            </EditableText>
          </Link>
          <Link
            to="/regulamin"
            className="font-['Lato'] text-[13px] text-[#8A8A8A] hover:text-[#B8944A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
          >
            <EditableText section="footer" fieldPath="terms">
              {t('footer.terms')}
            </EditableText>
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
