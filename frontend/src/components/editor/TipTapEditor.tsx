import { useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { ResizableImage } from './ResizableImage';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Youtube from '@tiptap/extension-youtube';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link2,
  ImagePlus,
  Highlighter,
  Undo2,
  Redo2,
  Film as YoutubeIcon,
  Table as TableIcon,
  Minus,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  placeholder?: string;
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'w-8 h-8 flex items-center justify-center rounded transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-[#0D9488]/10 text-[#0D9488]'
          : 'text-[#6B6B6B] hover:bg-[#F0FDFA] hover:text-[#0D9488]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function ToolbarSeparator() {
  return (
    <span className="w-px h-5 bg-[#E8E4DF] mx-1 shrink-0" aria-hidden="true" />
  );
}

// ─── TipTapEditor ─────────────────────────────────────────────────────────────

export function TipTapEditor({
  content,
  onChange,
  onImageUpload,
  placeholder,
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes: bold, italic, strike, heading, paragraph,
        // bulletList, orderedList, blockquote, code, codeBlock, hardBreak, horizontalRule
      }),
      Underline,
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Zacznij pisać artykuł...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      Typography,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'tiptap-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        HTMLAttributes: { class: 'tiptap-youtube' },
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content focus:outline-none',
        'aria-label': placeholder ?? 'Edytor treści',
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        onImageUpload(file)
          .then((url) => {
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: url });
            const transaction = view.state.tr.insert(pos?.pos ?? 0, node);
            view.dispatch(transaction);
          })
          .catch(() => {
            // Upload failed — do nothing silently
          });
        return true;
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate({ editor: ed }) {
      onChange(ed.getHTML());
    },
  });

  // Sync content prop into editor when it arrives after mount (e.g. async fetch)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  // ─── Image upload via button ─────────────────────────────────────────────

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // Upload failed — do nothing silently
      } finally {
        // Reset so same file can be re-selected
        e.target.value = '';
      }
    },
    [editor, onImageUpload],
  );

  // ─── Link insertion ──────────────────────────────────────────────────────

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = globalThis.prompt('Wpisz URL:', previousUrl ?? 'https://');
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const characterCount = editor?.storage.characterCount?.characters?.() ?? 0;

  if (!editor) return null;

  return (
    <>
      {/* Inline styles for ProseMirror content */}
      <style>{`
        .tiptap-editor-content {
          outline: none;
          min-height: 400px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #2D2D2D;
        }
        .tiptap-editor-content h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; font-family: 'Cormorant Garamond', serif; }
        .tiptap-editor-content h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; font-family: 'Cormorant Garamond', serif; }
        .tiptap-editor-content h3 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0; font-family: 'Cormorant Garamond', serif; }
        .tiptap-editor-content p { margin: 0.5em 0; }
        .tiptap-editor-content ul, .tiptap-editor-content ol { padding-left: 1.5em; }
        .tiptap-editor-content li { margin: 0.2em 0; }
        .tiptap-editor-content blockquote {
          border-left: 3px solid #0D9488;
          padding-left: 1em;
          color: #6B6B6B;
          margin: 0.75em 0;
          font-style: italic;
        }
        .tiptap-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
          display: block;
        }
        .tiptap-editor-content a { color: #0D9488; text-decoration: underline; }
        .tiptap-editor-content a:hover { color: #0F766E; }
        .tiptap-editor-content code {
          background: #F0FDFA;
          border: 1px solid #0D9488/20;
          border-radius: 4px;
          padding: 0.1em 0.4em;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }
        .tiptap-editor-content pre {
          background: #1E293B;
          color: #E2E8F0;
          border-radius: 8px;
          padding: 1em;
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .tiptap-editor-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
        }
        .tiptap-editor-content hr {
          border: none;
          border-top: 1px solid #E8E4DF;
          margin: 1.5em 0;
        }
        .tiptap-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #AAAAAA;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>

      <div className="border border-[#E8E4DF] rounded-xl overflow-hidden bg-white">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[#E8E4DF] bg-white"
          role="toolbar"
          aria-label="Pasek narzędzi edytora"
        >
          {/* History */}
          <ToolbarButton
            title="Cofnij"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Ponów"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Headings */}
          <ToolbarButton
            title="Nagłówek 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Nagłówek 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Nagłówek 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Inline marks */}
          <ToolbarButton
            title="Pogrubienie"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Kursywa"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Podkreślenie"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Przekreślenie"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Alignment */}
          <ToolbarButton
            title="Wyrównaj do lewej"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Wyśrodkuj"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Wyrównaj do prawej"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Lists */}
          <ToolbarButton
            title="Lista punktowana"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Lista numerowana"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Block elements */}
          <ToolbarButton
            title="Cytat blokowy"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            active={editor.isActive('link')}
            onClick={handleSetLink}
          >
            <Link2 size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Color + Highlight */}
          <ToolbarButton
            title="Zaznaczenie"
            active={editor.isActive('highlight')}
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: '#FFF3B0' }).run()
            }
          >
            <Highlighter size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Task list */}
          <ToolbarButton
            title="Lista zadań"
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListChecks size={15} />
          </ToolbarButton>

          {/* Horizontal rule */}
          <ToolbarButton
            title="Linia pozioma"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={15} />
          </ToolbarButton>

          {/* Sub/Superscript */}
          <ToolbarButton
            title="Indeks górny (x²)"
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            <SuperscriptIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Indeks dolny (H₂O)"
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            <SubscriptIcon size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Table */}
          <ToolbarButton
            title="Wstaw tabelę (3×3)"
            active={editor.isActive('table')}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon size={15} />
          </ToolbarButton>

          {/* Youtube embed */}
          <ToolbarButton
            title="Wstaw wideo YouTube"
            onClick={() => {
              const url = globalThis.prompt('Wklej URL YouTube:');
              if (url) {
                editor.chain().focus().setYoutubeVideo({ src: url }).run();
              }
            }}
          >
            <YoutubeIcon size={15} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Image upload */}
          <ToolbarButton title="Wstaw obraz" onClick={handleImageButtonClick}>
            <ImagePlus size={15} />
          </ToolbarButton>

          {/* Image-specific controls (visible only when an image is selected) */}
          {editor?.isActive('image') && (
            <>
              <ToolbarSeparator />
              <ToolbarButton
                title="Wyrównaj obraz do lewej"
                active={editor.getAttributes('image').align === 'left'}
                onClick={() =>
                  editor.chain().focus().setImageAlign('left').run()
                }
              >
                <AlignLeft size={15} />
              </ToolbarButton>
              <ToolbarButton
                title="Wyśrodkuj obraz"
                active={editor.getAttributes('image').align === 'center'}
                onClick={() =>
                  editor.chain().focus().setImageAlign('center').run()
                }
              >
                <AlignCenter size={15} />
              </ToolbarButton>
              <ToolbarButton
                title="Wyrównaj obraz do prawej"
                active={editor.getAttributes('image').align === 'right'}
                onClick={() =>
                  editor.chain().focus().setImageAlign('right').run()
                }
              >
                <AlignRight size={15} />
              </ToolbarButton>
              <ToolbarSeparator />
              {/* Width presets */}
              {['25%', '50%', '75%', '100%'].map((w) => (
                <button
                  key={w}
                  type="button"
                  title={`Szerokość ${w}`}
                  onClick={() => editor.chain().focus().setImageWidth(w).run()}
                  className={[
                    "px-2 h-8 flex items-center justify-center rounded font-['Inter'] text-[11px] font-semibold transition-colors",
                    editor.getAttributes('image').width === w
                      ? 'bg-[#0D9488]/10 text-[#0D9488]'
                      : 'text-[#6B6B6B] hover:bg-[#F0FDFA] hover:text-[#0D9488]',
                  ].join(' ')}
                >
                  {w}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Editor area */}
        <div className="p-4">
          <EditorContent editor={editor} />

          {/* Floating bubble menu — shows when text is selected */}
          {editor && (
            <BubbleMenu
              editor={editor}
              options={{ placement: 'top' }}
              shouldShow={({
                editor: ed,
                from,
                to,
              }: {
                editor: typeof editor;
                from: number;
                to: number;
              }) => {
                if (from === to) return false;
                if (ed.isActive('image')) return false;
                return true;
              }}
            >
              <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-[#E8E4DF] p-1">
                <ToolbarButton
                  title="Pogrubienie"
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton
                  title="Kursywa"
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton
                  title="Podkreślenie"
                  active={editor.isActive('underline')}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon size={14} />
                </ToolbarButton>
                <ToolbarButton
                  title="Link"
                  active={editor.isActive('link')}
                  onClick={handleSetLink}
                >
                  <Link2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                  title="Podświetl"
                  active={editor.isActive('highlight')}
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter size={14} />
                </ToolbarButton>
              </div>
            </BubbleMenu>
          )}
        </div>

        {/* Character count footer */}
        <div className="flex justify-end px-4 py-2 border-t border-[#E8E4DF] bg-[#FDFCFA]">
          <span className="font-['Inter'] text-[12px] text-[#AAAAAA]">
            {characterCount} znaków
          </span>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </>
  );
}

export default TipTapEditor;
