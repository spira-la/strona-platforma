import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';

/**
 * Discreet ribbon shown before the footer on every public page.
 * Points visitors to the dedicated web-design offer at /tworzenie-stron
 * without competing with the main navigation.
 */
export function WebDesignRibbon() {
  return (
    <aside
      aria-label="Oferta tworzenia stron internetowych"
      className="border-t border-b border-[#E8E4DF] bg-[#FAF8F5]"
    >
      <div className="max-w-[1100px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#B8944A]/[0.12] text-[#B8944A]"
            aria-hidden="true"
          >
            <Sparkles size={15} />
          </span>
          <EditableText
            section="webDesign"
            fieldPath="ribbon.text"
            as="p"
            className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-snug"
            placeholder="Podoba Ci się ta strona? Mogę zrobić taką dla Ciebie."
          />
        </div>

        <Link
          to="/tworzenie-stron"
          className="inline-flex items-center gap-1.5 font-['Lato'] text-[13px] font-semibold text-[#B8944A] hover:text-[#8A6F2E] transition-colors whitespace-nowrap"
        >
          <EditableText
            section="webDesign"
            fieldPath="ribbon.cta"
            as="span"
            placeholder="Zobacz ofertę"
          />
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

export default WebDesignRibbon;
