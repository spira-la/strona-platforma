import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  id,
  className,
  placeholder,
  children,
  richText: _richText = false,
  render,
}: EditableTextProps) {
  const { isLoading, isEditMode, getFieldValue, updateField, content } =
    useCMS();

  const resolvedValue = getFieldValue(section, fieldPath);
  const hasContent = Object.keys(content).length > 0;

  // Derive a string from the children prop for use as fallback text.
  const childrenText =
    typeof children === 'string'
      ? children
      : React.Children.toArray(children)
          .map((c) => (typeof c === 'string' ? c : ''))
          .join('');

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
    const hasNoValue =
      resolvedValue === fieldPath || resolvedValue.trim() === '';
    // Pre-fill with existing CMS value, or the placeholder/fallback as reference
    const prefill = hasNoValue
      ? (placeholder ?? childrenText ?? '')
      : resolvedValue;
    setDraftValue(prefill);
    setIsEditing(true);
  }, [isEditMode, resolvedValue, fieldPath, placeholder, childrenText]);

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
  const BLOCK_TAGS = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'div',
    'blockquote',
    'li',
  ]);
  const needsFullWidth = BLOCK_TAGS.has(Tag as string);
  const hasExplicitWidth = className
    ? /(?:^|\s)w-(?:\[|full|screen|auto|\d)/.test(className)
    : false;
  const resolvedClassName =
    needsFullWidth && !hasExplicitWidth
      ? `w-full ${className ?? ''}`
      : className;

  // When the field has no CMS content, fall back to: placeholder → children text → fieldPath
  // Also treat empty/whitespace-only strings as "no content" so the placeholder shows instead of blank space
  const fallback = placeholder ?? (childrenText || undefined) ?? resolvedValue;
  const hasNoContent =
    resolvedValue === fieldPath || resolvedValue.trim() === '';
  const displayContent = hasNoContent ? fallback : resolvedValue;

  // -------------------------------------------------------------------------
  // Admin edit mode — active textarea with save/cancel buttons
  // -------------------------------------------------------------------------
  if (isEditMode && isEditing) {
    return (
      <span
        className={`relative inline-block w-full ${className ?? ''}`}
        onClick={(e) => e.preventDefault()}
      >
        <textarea
          ref={textareaRef}
          value={draftValue}
          onChange={(e) => {
            setDraftValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          className="w-full resize-none overflow-hidden rounded border border-[#B8963E] bg-white px-2 py-1 font-sans text-sm text-[#2D2D2D] leading-normal shadow-sm outline-none focus:ring-2 focus:ring-[#B8963E]/50"
          rows={1}
          aria-label={`Edit ${section}.${fieldPath}`}
        />
        <span className="flex items-center justify-between mt-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setDraftValue('');
            }}
            className="rounded px-2 py-0.5 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Clear to show default text"
          >
            Reset
          </button>
          <span className="flex items-center gap-2">
            {isSaving && (
              <span className="text-[10px] text-[#B8963E]">saving...</span>
            )}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                cancelEditing();
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-[#6B6B6B] bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void saveEditing();
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-white bg-[#B8963E] hover:bg-[#8A6F2E] transition-colors"
            >
              Save
            </button>
          </span>
        </span>
      </span>
    );
  }

  // -------------------------------------------------------------------------
  // Admin edit mode — hoverable, clickable element
  // Prevents event from reaching parent links/buttons
  // -------------------------------------------------------------------------
  if (isEditMode) {
    return React.createElement(
      Tag,
      {
        id,
        className: `relative cursor-pointer rounded transition-[outline,box-shadow] outline outline-1 outline-transparent hover:outline-[#B8963E]/70 hover:shadow-[0_0_0_3px_rgba(184,150,62,0.12)] ${resolvedClassName ?? ''}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          startEditing();
        },
        title: `Edit: ${section} → ${fieldPath}`,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
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
    return React.createElement(
      Tag,
      { id, className: resolvedClassName },
      render(displayContent),
    );
  }

  return React.createElement(
    Tag,
    { id, className: resolvedClassName },
    displayContent,
  );
}

export default EditableText;
