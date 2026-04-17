import { useRef, useState, useEffect } from 'react';
import Image from '@tiptap/extension-image';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImageAlign = 'left' | 'center' | 'right';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImageAlign: (align: ImageAlign) => ReturnType;
      setImageWidth: (width: string | null) => ReturnType;
    };
  }
}

// ---------------------------------------------------------------------------
// React NodeView — renders <img> with resize handles + align wrapper
// ---------------------------------------------------------------------------

function ResizableImageView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    width?: string | null;
    align?: ImageAlign;
  };

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // -------------------------------------------------------------------------
  // Resize logic — drag the bottom-right handle (or corners) to resize.
  // We store width as a percentage of the editor content width for
  // responsive behavior.
  // -------------------------------------------------------------------------
  const startResize = (e: React.MouseEvent, edge: 'right' | 'left') => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    const container = containerRef.current?.parentElement;
    if (!img || !container) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = img.offsetWidth;
    const containerWidth = container.offsetWidth;

    const onMove = (ev: MouseEvent) => {
      const delta =
        edge === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const newPx = Math.max(80, Math.min(containerWidth, startWidth + delta));
      const pct = Math.round((newPx / containerWidth) * 100);
      updateAttributes({ width: `${pct}%` });
    };

    const onUp = () => {
      setIsResizing(false);
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    };

    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  };

  // Keyboard: arrow keys resize by 5% when selected
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const currentPct = Number.parseInt((width ?? '100').replace('%', ''), 10);
      if (e.key === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        updateAttributes({ width: `${Math.max(20, currentPct - 5)}%` });
      } else if (e.key === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        updateAttributes({ width: `${Math.min(100, currentPct + 5)}%` });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected, width, updateAttributes]);

  const justify =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <NodeViewWrapper
      data-align={align ?? 'center'}
      style={{
        display: 'flex',
        justifyContent: justify,
        margin: '1rem 0',
      }}
    >
      <div
        ref={containerRef}
        className="relative inline-block group"
        style={{
          width: width ?? 'auto',
          maxWidth: '100%',
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ''}
          title={title ?? ''}
          draggable={false}
          className={[
            'block w-full h-auto rounded-lg select-none',
            selected ? 'outline outline-2 outline-[#0D9488]' : '',
            isResizing ? 'pointer-events-none' : '',
          ].join(' ')}
        />

        {/* Resize handles — only visible when selected */}
        {selected && (
          <>
            <span
              role="presentation"
              onMouseDown={(e) => startResize(e, 'right')}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-[#0D9488] rounded cursor-ew-resize shadow-md"
              title="Zmień rozmiar"
            />
            <span
              role="presentation"
              onMouseDown={(e) => startResize(e, 'left')}
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-[#0D9488] rounded cursor-ew-resize shadow-md"
              title="Zmień rozmiar"
            />
            {/* Width label */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#0D9488] text-white text-[11px] font-semibold font-['Inter'] whitespace-nowrap shadow-md">
              {width ?? 'auto'}
            </span>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ---------------------------------------------------------------------------
// Extension — extends the base Image with width + align + NodeView
// ---------------------------------------------------------------------------

export const ResizableImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('width'),
        renderHTML: (attrs: Record<string, unknown>) => {
          const width = attrs.width as string | null;
          return width ? { width } : {};
        },
      },
      align: {
        default: 'center',
        parseHTML: (el: HTMLElement) =>
          (el.dataset.align as ImageAlign) ?? 'center',
        renderHTML: (attrs: Record<string, unknown>) => {
          const align = (attrs.align as ImageAlign | undefined) ?? 'center';
          return { 'data-align': align };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align: ImageAlign) =>
        ({ commands }) =>
          commands.updateAttributes('image', { align }),
      setImageWidth:
        (width: string | null) =>
        ({ commands }) =>
          commands.updateAttributes('image', { width }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
