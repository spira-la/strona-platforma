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
  Check,
  Languages,
} from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { toast } from '@/stores/toast.store';
import {
  blogsClient,
  type BlogPostStatus,
  type BlogTranslation,
  type CreateBlogData,
  type UpdateBlogData,
} from '@/clients/blogs.client';
import { categoriesClient, type Category } from '@/clients/categories.client';
import DOMPurify from 'dompurify';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#0D9488';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '') // strip diacritics
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .trim()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-');
}

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLASS = [
  'w-full px-3 py-2 rounded-lg border border-[#E8E4DF] bg-white',
  "font-['Inter'] text-[14px] text-[#2D2D2D] placeholder:text-[#AAAAAA]",
  'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]',
  'transition-colors',
].join(' ');

const LABEL_CLASS =
  "block font-['Inter'] text-[13px] font-medium text-[#444444] mb-1.5";

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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('draft');

  // Cover image upload state
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch existing post for edit ─────────────────────────────────────────

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesClient.getAll(),
    staleTime: 300_000,
  });
  const activeCategories = allCategories.filter((c: Category) => c.isActive);

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
    setSelectedCategoryIds(existingPost.categories?.map((c) => c.id) ?? []);
    setCoverImageUrl(existingPost.coverImageUrl ?? '');
    setStatus(existingPost.status);
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
      toast.success(
        t('admin.common.updated', { defaultValue: 'Zaktualizowano' }),
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Translation ─────────────────────────────────────────────────────────

  const [activeLangTab, setActiveLangTab] = useState<'pl' | 'en' | 'es'>('pl');

  const { data: translations = [], refetch: refetchTranslations } = useQuery({
    queryKey: ['coach', 'blogs', id, 'translations'],
    queryFn: () => blogsClient.getTranslations(id!),
    enabled: isEditMode,
    refetchInterval: 15_000,
  });

  const translationStatus = translations.map((t: BlogTranslation) => ({
    lang: t.languageCode,
    translatedAt: t.translatedAt ?? '',
  }));

  const activeTranslation = translations.find(
    (t: BlogTranslation) => t.languageCode === activeLangTab,
  );

  const [translatingLang, setTranslatingLang] = useState<string | null>(null);

  const translateMutation = useMutation({
    mutationFn: ({
      targetLang,
      sourceLang,
    }: {
      targetLang: string;
      sourceLang?: string;
    }) => blogsClient.translatePost(id!, targetLang, sourceLang),
    onSuccess: (_data, variables) => {
      setTranslatingLang(variables.targetLang);
      toast.success(
        t('coach.blogEditor.translationStarted', {
          defaultValue: 'Tłumaczenie uruchomione w tle...',
        }),
      );
      // Start polling more aggressively for 2 minutes
      setTimeout(() => void refetchTranslations(), 30_000);
      setTimeout(() => void refetchTranslations(), 60_000);
      setTimeout(() => {
        void refetchTranslations();
        setTranslatingLang(null);
      }, 120_000);
    },
    onError: (err) => {
      setTranslatingLang(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

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
      categoryIds:
        selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      status,
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('admin.common.error'),
      );
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  // ─── Loading state for edit mode ─────────────────────────────────────────

  if (isEditMode && isLoadingPost && !existingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2
          className="w-8 h-8 animate-spin text-[#0D9488]"
          aria-label="Ładowanie"
        />
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
            {isEditMode
              ? t('coach.blogEditor.editTitle')
              : t('coach.blogEditor.newTitle')}
          </h1>
        </div>

        {/* Status selector + Save */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status segmented control */}
          <div
            role="group"
            aria-label={t('coach.blogEditor.statusLabel')}
            className="inline-flex rounded-lg border border-[#E8E4DF] bg-[#FAF8F5] p-0.5 gap-0.5"
          >
            {(
              [
                { value: 'draft', labelKey: 'coach.blogEditor.statusDraft' },
                {
                  value: 'published',
                  labelKey: 'coach.blogEditor.statusPublished',
                },
                {
                  value: 'archived',
                  labelKey: 'coach.blogEditor.statusArchived',
                },
              ] as { value: BlogPostStatus; labelKey: string }[]
            ).map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                className={[
                  "px-3 py-1 rounded-md font-['Inter'] text-[13px] font-medium transition-colors duration-150",
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-1',
                  status === value && value === 'published'
                    ? 'bg-[#B8963E] text-white shadow-sm'
                    : status === value && value === 'draft'
                      ? 'bg-white text-[#B8963E] shadow-sm border border-[#E8E4DF]'
                      : status === value && value === 'archived'
                        ? 'bg-[#6B6B6B] text-white shadow-sm'
                        : 'text-[#6B6B6B] hover:text-[#2D2D2D]',
                ].join(' ')}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

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
              if (!isSaving)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#0F766E';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                TEAL;
            }}
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isSaving
              ? t('coach.blogEditor.saving')
              : t('coach.blogEditor.save')}
          </button>
        </div>
      </div>

      {/* ── Main layout: editor + sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Editor area */}
        <div className="flex-1 min-w-0">
          {/* Language tabs */}
          {isEditMode && (
            <div className="flex items-center gap-1 mb-4 border-b border-[#E8E4DF]">
              {(
                [
                  { code: 'pl', label: '🇵🇱 Polski', isOriginal: true },
                  { code: 'en', label: '🇬🇧 English', isOriginal: false },
                  { code: 'es', label: '🇪🇸 Español', isOriginal: false },
                ] as const
              ).map(({ code, label, isOriginal }) => {
                const hasTranslation = translations.some(
                  (tr: BlogTranslation) => tr.languageCode === code,
                );
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveLangTab(code)}
                    className={[
                      "px-4 py-2 font-['Inter'] text-[13px] font-medium transition-colors -mb-px border-b-2",
                      activeLangTab === code
                        ? 'border-[#0D9488] text-[#0D9488]'
                        : 'border-transparent text-[#8A8A8A] hover:text-[#2D2D2D]',
                    ].join(' ')}
                  >
                    {label}
                    {isOriginal && (
                      <span className="ml-1.5 text-[10px] font-semibold text-[#B8963E]">
                        ORG
                      </span>
                    )}
                    {!isOriginal && hasTranslation && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    {!isOriginal && !hasTranslation && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#E8E4DF]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* PL tab — editable */}
          {activeLangTab === 'pl' && (
            <>
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
              <TipTapEditor
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
                placeholder={t('coach.blogEditor.contentPlaceholder')}
              />
            </>
          )}

          {/* EN/ES tabs — read-only translation preview */}
          {activeLangTab !== 'pl' && (
            <div className="min-h-[400px]">
              {activeTranslation ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter'] text-[11px] text-[#8A8A8A]">
                      {activeTranslation.isAutoTranslated
                        ? t('coach.blogEditor.autoTranslated', {
                            defaultValue: 'Tłumaczenie automatyczne',
                          })
                        : t('coach.blogEditor.manualTranslation', {
                            defaultValue: 'Tłumaczenie ręczne',
                          })}
                      {activeTranslation.translatedAt && (
                        <>
                          {' '}
                          ·{' '}
                          {new Date(
                            activeTranslation.translatedAt,
                          ).toLocaleString('pl-PL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        translateMutation.mutate({
                          targetLang: activeLangTab,
                          sourceLang: 'pl',
                        })
                      }
                      disabled={translateMutation.isPending}
                      className="px-3 py-1 rounded-md font-['Inter'] text-[11px] font-medium text-[#6B6B6B] bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {translateMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin inline" />
                      ) : (
                        t('coach.blogEditor.retranslate', {
                          defaultValue: 'Przetłumacz ponownie',
                        })
                      )}
                    </button>
                  </div>
                  <h2 className="font-['Cormorant_Garamond',serif] text-[28px] font-bold text-[#2D2D2D] border-b-2 border-[#E8E4DF] pb-2">
                    {activeTranslation.title ?? '—'}
                  </h2>
                  {activeTranslation.excerpt && (
                    <p className="font-['Inter'] text-[14px] text-[#6B6B6B] italic border-l-2 border-[#B8963E] pl-4">
                      {activeTranslation.excerpt}
                    </p>
                  )}
                  <div
                    className="prose prose-base max-w-none font-['Lato'] text-[#3F3F3F] leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        activeTranslation.content ?? '',
                      ),
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <Languages size={32} className="text-[#E8E4DF]" />
                  <p className="font-['Inter'] text-[14px] text-[#8A8A8A]">
                    {t('coach.blogEditor.noTranslation', {
                      defaultValue:
                        'Brak tłumaczenia. Zostanie utworzone automatycznie po zapisaniu posta w języku polskim.',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      translateMutation.mutate({
                        targetLang: activeLangTab,
                        sourceLang: 'pl',
                      })
                    }
                    disabled={translateMutation.isPending}
                    className="px-4 py-2 rounded-lg font-['Inter'] text-[13px] font-medium text-white bg-[#0D9488] hover:bg-[#0F766E] transition-colors disabled:opacity-50"
                  >
                    {translateMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin inline mr-2" />
                    ) : (
                      <Languages size={14} className="inline mr-2" />
                    )}
                    {t('coach.blogEditor.translateNow', {
                      defaultValue: 'Przetłumacz teraz',
                    })}
                  </button>
                </div>
              )}
            </div>
          )}
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

          {/* Categories */}
          <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
            <h2 className={LABEL_CLASS}>
              {t('coach.blogEditor.categories', { defaultValue: 'Kategorie' })}
            </h2>
            {activeCategories.length === 0 ? (
              <p className="font-['Inter'] text-[12px] text-[#AAAAAA] italic">
                {t('coach.blogEditor.noCategories', {
                  defaultValue: 'Brak kategorii. Dodaj je w panelu admin.',
                })}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                {activeCategories.map((cat: Category) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={[
                        'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left',
                        "font-['Inter'] text-[13px] transition-colors",
                        isSelected
                          ? 'bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/20'
                          : 'text-[#6B6B6B] hover:bg-[#FAF8F5] border border-transparent',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
                          isSelected
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'border-[#D1D5DB] bg-white',
                        ].join(' ')}
                      >
                        {isSelected && <Check size={10} />}
                      </span>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Translations */}
          {isEditMode && (
            <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
              <h2 className="font-['Inter'] text-[13px] font-semibold text-[#444444] mb-3 flex items-center gap-2">
                <Languages size={14} />
                {t('coach.blogEditor.translations', {
                  defaultValue: 'Tłumaczenia',
                })}
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { code: 'en', label: 'English', flag: '🇬🇧' },
                  { code: 'es', label: 'Español', flag: '🇪🇸' },
                ].map(({ code, label, flag }) => {
                  const existing = translationStatus.find(
                    (t) => t.lang === code,
                  );
                  const isTranslating = translatingLang === code;
                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#E8E4DF] bg-[#FAF8F5]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[16px]">{flag}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-['Inter'] text-[13px] font-medium text-[#2D2D2D]">
                            {label}
                          </span>
                          {existing && (
                            <span className="font-['Inter'] text-[10px] text-[#8A8A8A] truncate">
                              {new Date(
                                existing.translatedAt,
                              ).toLocaleDateString('pl-PL', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {existing && (
                          <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Check size={10} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            translateMutation.mutate({
                              targetLang: code,
                              sourceLang: 'pl',
                            })
                          }
                          disabled={
                            isTranslating || translateMutation.isPending
                          }
                          className={[
                            "px-2.5 py-1 rounded-md font-['Inter'] text-[11px] font-medium transition-colors",
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            existing
                              ? 'text-[#6B6B6B] bg-gray-100 hover:bg-gray-200'
                              : 'text-white bg-[#0D9488] hover:bg-[#0F766E]',
                          ].join(' ')}
                        >
                          {isTranslating ? (
                            <Loader2
                              size={12}
                              className="animate-spin inline"
                            />
                          ) : existing ? (
                            t('coach.blogEditor.retranslate', {
                              defaultValue: 'Ponów',
                            })
                          ) : (
                            t('coach.blogEditor.translate', {
                              defaultValue: 'Tłumacz',
                            })
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 font-['Inter'] text-[10px] text-[#AAAAAA] leading-relaxed">
                {t('coach.blogEditor.translationHint', {
                  defaultValue:
                    'Tłumaczenie działa w tle i może potrwać kilka minut. Status odświeża się automatycznie.',
                })}
              </p>
            </div>
          )}

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
