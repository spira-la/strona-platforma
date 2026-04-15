import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';

/**
 * Pre-footer section promoting the web-design offer. Sits at the bottom
 * of every public page except /tworzenie-stron itself, acting as a soft
 * sales hook for visitors who just browsed Aneta's site.
 */
export function WebDesignRibbon() {
  return (
    <section
      aria-label="Oferta tworzenia stron internetowych"
      className="bg-[#F6EFE3] border-t border-[#E8DEC7]"
    >
      <div className="max-w-[1100px] mx-auto px-6 py-14 md:py-20 flex flex-col items-center gap-6 text-center">
        <span
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#B8944A]/[0.15] text-[#B8944A]"
          aria-hidden="true"
        >
          <Sparkles size={22} />
        </span>

        <EditableText
          section="webDesign"
          fieldPath="ribbon.title"
          as="h2"
          className="font-['Cormorant_Garamond'] text-[28px] md:text-[36px] font-bold text-[#2D2D2D] leading-tight"
          placeholder="Podoba Ci się ta strona?"
        />

        <EditableText
          section="webDesign"
          fieldPath="ribbon.description"
          as="p"
          className="font-['Lato'] text-[15px] md:text-[17px] text-[#6B6B6B] leading-[1.7] max-w-[600px]"
          placeholder="Projektuję i wdrażam takie strony dla coachów, terapeutów i specjalistów — z panelem CMS, wielojęzycznością i pełnym wsparciem technicznym."
        />

        <Link
          to="/tworzenie-stron"
          className="inline-flex items-center gap-2 mt-2 px-7 py-3 rounded-lg font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors shadow-sm"
        >
          <EditableText
            section="webDesign"
            fieldPath="ribbon.cta"
            as="span"
            placeholder="Zobacz ofertę"
          />
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default WebDesignRibbon;
