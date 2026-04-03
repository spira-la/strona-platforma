import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCMS } from '@/contexts/CMSContext';
import type { EditableTextProps } from '@/types/cms.types';

/**
 * EditableText renders a CMS-managed string as any HTML element.
 *
 * Non-admin mode: renders content transparently with no interactivity overhead.
 * Admin edit mode: gold border on hover, click to edit inline, Escape to
 * cancel, Ctrl+Enter or blur to save.
 *
 * Loading behaviour:
 * - No cache + still loading → render nothing (avoid layout shift)
 * - Cache available + revalidating → render cached content immediately
 *
 * `children` are treated as a plaintext fallback when no CMS content exists,
 * maintaining backward compatibility with the placeholder stub.
 */
export function EditableText({
  section,
  fieldPath,
  as: Tag = 'span',
  className,
  placeholder,
  children,
  richText: _richText = false,
  render,
}: EditableTextProps) {
  const { isLoading, isEditMode, getFieldValue, updateField, content } = useCMS();

  const resolvedValue = getFieldValue(section, fieldPath);
  const hasContent = Object.keys(content).length > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-size textarea height and focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!isEditMode) return;
    // If the resolved value equals the fieldPath, there is no CMS content yet
    setDraftValue(resolvedValue === fieldPath ? '' : resolvedValue);
    setIsEditing(true);
  }, [isEditMode, resolvedValue, fieldPath]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDraftValue('');
  }, []);

  const saveEditing = useCallback(async () => {
    if (!isEditing) return;
    const trimmed = draftValue.trim();

    // Skip API call when nothing changed
    const isUnchanged =
      trimmed === resolvedValue ||
      (trimmed === '' && resolvedValue === fieldPath);

    if (isUnchanged) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateField(section, fieldPath, trimmed);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [isEditing, draftValue, resolvedValue, fieldPath, section, updateField]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        void saveEditing();
      }
    },
    [cancelEditing, saveEditing],
  );

  // During initial load with no cache and no fallback — return null to avoid layout shift.
  // But if we have a placeholder or children, always render them immediately.
  const hasFallback = !!(placeholder || children);
  if (isLoading && !hasContent && !hasFallback) {
    return null;
  }

  // Block-level elements inside flex containers collapse without explicit width.
  // Automatically add w-full for block tags so text wraps correctly.
  // Block-level elements inside flex containers collapse without explicit width.
  // Add w-full unless the caller already set an explicit width (w-[...], w-1/2, etc.)
  const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'li']);
  const needsFullWidth = BLOCK_TAGS.has(Tag as string);
  const hasExplicitWidth = className ? /(?:^|\s)w-(?:\[|full|screen|auto|\d)/.test(className) : false;
  const resolvedClassName = needsFullWidth && !hasExplicitWidth
    ? `w-full ${className ?? ''}`
    : className;

  // Derive a string from the children prop for use as fallback text.
  // We only support plain string children (e.g. from t() calls in the Navbar).
  const childrenText = typeof children === 'string'
    ? children
    : React.Children.toArray(children).map((c) => (typeof c === 'string' ? c : '')).join('');

  // When the field has no CMS content, fall back to: placeholder → children text → fieldPath
  const fallback = placeholder ?? (childrenText || undefined) ?? resolvedValue;
  const displayContent = resolvedValue === fieldPath ? fallback : resolvedValue;

  // -------------------------------------------------------------------------
  // Admin edit mode — active textarea
  // -------------------------------------------------------------------------
  if (isEditMode && isEditing) {
    return (
      <span className={`relative inline-block w-full ${className ?? ''}`}>
        <textarea
          ref={textareaRef}
          value={draftValue}
          onChange={(e) => {
            setDraftValue(e.target.value);
            // Re-size on every change
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => void saveEditing()}
          className="w-full resize-none overflow-hidden rounded border border-[#B8963E] bg-white px-2 py-1 font-[inherit] text-[inherit] leading-[inherit] shadow-sm outline-none focus:ring-2 focus:ring-[#B8963E]/50"
          rows={1}
          aria-label={`Edit ${section}.${fieldPath}`}
        />
        <span className="pointer-events-none absolute -bottom-5 right-0 text-[10px] text-gray-400 px-1">
          Ctrl+Enter to save · Esc to cancel
          {isSaving && (
            <span className="ml-2 text-[#B8963E]">saving...</span>
          )}
        </span>
      </span>
    );
  }

  // -------------------------------------------------------------------------
  // Admin edit mode — hoverable, clickable element
  // -------------------------------------------------------------------------
  if (isEditMode) {
    return React.createElement(
      Tag,
      {
        className: `relative cursor-pointer rounded transition-[outline,box-shadow] outline outline-1 outline-transparent hover:outline-[#B8963E]/70 hover:shadow-[0_0_0_3px_rgba(184,150,62,0.12)] ${resolvedClassName ?? ''}`,
        onClick: startEditing,
        title: `Edit: ${section} → ${fieldPath}`,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startEditing();
          }
        },
      },
      render ? render(displayContent) : displayContent,
    );
  }

  // -------------------------------------------------------------------------
  // Read-only mode
  // -------------------------------------------------------------------------
  if (render) {
    return React.createElement(Tag, { className: resolvedClassName }, render(displayContent));
  }

  return React.createElement(Tag, { className: resolvedClassName }, displayContent);
}

export default EditableText;
