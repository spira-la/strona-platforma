import { useState, useCallback } from 'react';

export interface UsePresentationSlidesOptions {
  onPptxNote?: () => void;
}

export interface UsePresentationSlidesReturn {
  slides: ImageBitmap[];
  currentIndex: number;
  totalSlides: number;
  fileName: string;
  isLoading: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  clear: () => void;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.pptx', '.png', '.jpg', '.jpeg', '.webp'];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

async function parsePdf(arrayBuffer: ArrayBuffer): Promise<ImageBitmap[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const slides: ImageBitmap[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const bitmap = await createImageBitmap(canvas);
    slides.push(bitmap);
  }

  return slides;
}

async function parseImage(file: File): Promise<ImageBitmap[]> {
  const bitmap = await createImageBitmap(file);
  return [bitmap];
}

async function parsePptx(arrayBuffer: ArrayBuffer): Promise<ImageBitmap[]> {
  const { pptxToHtml } = await import('@jvmr/pptx-to-html');
  const html2canvas = (await import('html2canvas')).default;

  // Convert PPTX to array of HTML strings (one per slide)
  const slidesHtml = await pptxToHtml(arrayBuffer, {
    width: 1920,
    height: 1080,
    scaleToFit: true,
  });

  if (slidesHtml.length === 0) {
    throw new Error('No slides found in PPTX file');
  }

  const slides: ImageBitmap[] = [];

  // Create offscreen container for rendering
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1920px;height:1080px;overflow:hidden;';
  document.body.appendChild(container);

  try {
    for (const html of slidesHtml) {
      container.innerHTML = html;

      // Wait for any embedded images to load
      const images = container.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
        ),
      );

      // Capture rendered HTML to canvas
      const canvas = await html2canvas(container, {
        width: 1920,
        height: 1080,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const bitmap = await createImageBitmap(canvas);
      slides.push(bitmap);
    }
  } finally {
    document.body.removeChild(container);
  }

  return slides;
}

export function usePresentationSlides(
  options: UsePresentationSlidesOptions = {},
): UsePresentationSlidesReturn {
  const { onPptxNote } = options;
  const [slides, setSlides] = useState<ImageBitmap[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setSlides((prev) => {
      prev.forEach((s) => s.close());
      return [];
    });
    setCurrentIndex(0);
    setFileName('');
    setError(null);
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFile(file)) {
        setError('unsupported');
        return;
      }

      setSlides((prev) => {
        prev.forEach((s) => s.close());
        return [];
      });
      setCurrentIndex(0);
      setError(null);
      setIsLoading(true);
      setFileName(file.name);

      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        let newSlides: ImageBitmap[];

        if (file.type === 'application/pdf' || ext === 'pdf') {
          const buffer = await file.arrayBuffer();
          newSlides = await parsePdf(buffer);
        } else if (
          file.type ===
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
          ext === 'pptx'
        ) {
          const buffer = await file.arrayBuffer();
          newSlides = await parsePptx(buffer);
          onPptxNote?.();
        } else {
          newSlides = await parseImage(file);
        }

        setSlides(newSlides);
        setCurrentIndex(0);
      } catch (err) {
        console.error('[usePresentationSlides] Failed to load file:', err);
        setError('loadError');
        setFileName('');
      } finally {
        setIsLoading(false);
      }
    },
    [onPptxNote],
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, slides.length - 1)));
    },
    [slides.length],
  );

  return {
    slides,
    currentIndex,
    totalSlides: slides.length,
    fileName,
    isLoading,
    error,
    loadFile,
    nextSlide,
    prevSlide,
    goToSlide,
    clear,
  };
}

/** Accepted file extensions for the file input */
export const PRESENTATION_ACCEPT = ACCEPTED_EXTENSIONS.join(',');
