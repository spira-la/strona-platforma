import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  ImagePlus,
  X,
  Save,
} from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { toast } from '@/stores/toast.store';
import { blogsClient, type CreateBlogData, type UpdateBlogData } from '@/clients/blogs.client';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#0D9488';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────

interface TagChipProps {
  tag: string;
  onRemove: () => void;
}

function TagChip({ tag, onRemove }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDFA] border border-[#0D9488]/20 font-['Inter'] text-[12px] text-[#0D9488]">
      {tag}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Usuń tag ${tag}`}
        className="hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0D9488] rounded-full"
      >
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLASS = [
  'w-full px-3 py-2 rounded-lg border border-[#E8E4DF] bg-white',
  "font-['Inter'] text-[14px] text-[#2D2D2D] placeholder:text-[#AAAAAA]",
  'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]',
  'transition-colors',
].join(' ');

const LABEL_CLASS = "block font-['Inter'] text-[13px] font-medium text-[#444444] mb-1.5";

// ─── BlogEditor ───────────────────────────────────────────────────────────────

export default function CoachBlogEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id);

  // ─── State ────────────────────────────────────────────────────────────────

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Cover image upload state
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch existing post for edit ─────────────────────────────────────────

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['coach', 'blogs', id],
    queryFn: () => blogsClient.getMyPost(id!),
    enabled: isEditMode,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  // Sync form when existingPost loads (only on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!existingPost || initializedRef.current) return;
    initializedRef.current = true;
    setTitle(existingPost.title);
    setContent(existingPost.content ?? '');
    setExcerpt(existingPost.excerpt ?? '');
    setSlug(existingPost.slug);
    setSlugManuallyEdited(true); // don't auto-regenerate slug in edit mode
    setTags(existingPost.tags ?? []);
    setCoverImageUrl(existingPost.coverImageUrl ?? '');
    setIsPublished(existingPost.isPublished);
  }, [existingPost]);

  // ─── Auto-generate slug from title ───────────────────────────────────────

  useEffect(() => {
    if (slugManuallyEdited) return;
    setSlug(slugify(title));
  }, [title, slugManuallyEdited]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CreateBlogData) => blogsClient.create(data),
    onSuccess: (post) => {
      void queryClient.invalidateQueries({ queryKey: ['coach', 'blogs'] });
      toast.success(t('admin.common.created', { defaultValue: 'Zapisano' }));
      navigate(`/coach/blog/${post.id}/edit`, { replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBlogData) => blogsClient.update(id!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach', 'blogs'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'blogs', id] });
      toast.success(t('admin.common.updated', { defaultValue: 'Zaktualizowano' }));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(t('coach.blogEditor.titlePlaceholder'));
      return;
    }
    const payload = {
      title: title.trim(),
      content,
      excerpt: excerpt.trim() || undefined,
      coverImageUrl: coverImageUrl || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isPublished,
      slug: slug.trim() || slugify(title),
    };
    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const { url } = await blogsClient.uploadEditorImage(file);
    return url;
  }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const { url } = await blogsClient.uploadCoverImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim().replace(/,$/, '');
    if (newTag && !tags.includes(newTag)) {
      setTags((prev) => [...prev, newTag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // ─── Loading state for edit mode ─────────────────────────────────────────

  if (isEditMode && isLoadingPost && !existingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" aria-label="Ładowanie" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/coach/blog')}
            aria-label={t('coach.blogEditor.back')}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E8E4DF] text-[#6B6B6B] hover:text-[#0D9488] hover:border-[#0D9488]/30 hover:bg-[#F0FDFA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-['Cormorant_Garamond',serif] font-bold text-2xl text-[#2D2D2D] leading-tight truncate">
            {isEditMode ? t('coach.blogEditor.editTitle') : t('coach.blogEditor.newTitle')}
          </h1>
        </div>

        {/* Publish toggle + Save */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Publish toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="font-['Inter'] text-[14px] text-[#6B6B6B]">
              {isPublished ? t('coach.blogEditor.publish') : t('coach.blogEditor.draft')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished((v) => !v)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-1',
                isPublished ? 'bg-[#0D9488]' : 'bg-[#D1D5DB]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                  isPublished ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </label>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              "font-['Inter'] text-[14px] font-medium text-white",
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0D9488]',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            ].join(' ')}
            style={{ backgroundColor: TEAL }}
            onMouseEnter={(e) => {
              if (!isSaving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL;
            }}
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isSaving ? t('coach.blogEditor.saving') : t('coach.blogEditor.save')}
          </button>
        </div>
      </div>

      {/* ── Main layout: editor + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Editor area */}
        <div className="flex-1 min-w-0">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('coach.blogEditor.titlePlaceholder')}
            className={[
              'w-full mb-4 px-0 py-2 bg-transparent border-0 border-b-2 border-[#E8E4DF]',
              "font-['Cormorant_Garamond',serif] text-[28px] font-bold text-[#2D2D2D] placeholder:text-[#CCCCCC]",
              'focus:outline-none focus:border-[#0D9488]',
              'transition-colors duration-150',
            ].join(' ')}
          />

          {/* TipTap editor */}
          <TipTapEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
            placeholder={t('coach.blogEditor.contentPlaceholder')}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-5">
          {/* Cover image */}
          <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
            <h2 className="font-['Inter'] text-[13px] font-semibold text-[#444444] mb-3">
              {t('coach.blogEditor.coverImage')}
            </h2>

            {coverImageUrl ? (
              <div className="relative group">
                <img
                  src={coverImageUrl}
                  alt={t('coach.blogEditor.coverImage')}
                  className="w-full aspect-video object-cover rounded-lg border border-[#E8E4DF]"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  aria-label={t('coach.blogEditor.removeCover')}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isUploadingCover}
                className={[
                  'w-full aspect-video flex flex-col items-center justify-center gap-2',
                  'rounded-lg border-2 border-dashed border-[#E8E4DF]',
                  'text-[#AAAAAA] hover:text-[#0D9488] hover:border-[#0D9488]/40 hover:bg-[#F0FDFA]',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {isUploadingCover ? (
                  <Loader2 size={24} className="animate-spin text-[#0D9488]" />
                ) : (
                  <>
                    <ImagePlus size={24} />
                    <span className="font-['Inter'] text-[13px]">
                      {t('coach.blogEditor.uploadCover')}
                    </span>
                  </>
                )}
              </button>
            )}

            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-hidden="true"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
            <label htmlFor="blog-excerpt" className={LABEL_CLASS}>
              {t('coach.blogEditor.excerpt')}
            </label>
            <div className="relative">
              <textarea
                id="blog-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
                placeholder={t('coach.blogEditor.excerptPlaceholder')}
                rows={4}
                className={`${INPUT_CLASS} resize-none`}
              />
              <span className="absolute bottom-2 right-3 font-['Inter'] text-[11px] text-[#AAAAAA] pointer-events-none">
                {excerpt.length}/300
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
            <label htmlFor="blog-tags" className={LABEL_CLASS}>
              {t('coach.blogEditor.tags')}
            </label>
            <input
              id="blog-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder={t('coach.blogEditor.tagsPlaceholder')}
              className={INPUT_CLASS}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <TagChip key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
              </div>
            )}
          </div>

          {/* Slug */}
          <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
            <label htmlFor="blog-slug" className={LABEL_CLASS}>
              {t('coach.blogEditor.slug')}
            </label>
            <input
              id="blog-slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugManuallyEdited(true);
              }}
              placeholder={t('coach.blogEditor.slugPlaceholder')}
              className={INPUT_CLASS}
              aria-describedby="blog-slug-hint"
            />
            <p
              id="blog-slug-hint"
              className="mt-1 font-['Inter'] text-[11px] text-[#AAAAAA]"
            >
              /blog/{slug || '...'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
