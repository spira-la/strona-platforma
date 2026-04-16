import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle2,
  FileX2,
  Archive,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminFilterTabs } from '@/components/admin/AdminFilterTabs';
import { AdminTable } from '@/components/admin/AdminTable';
import type { AdminTableColumn } from '@/components/admin/AdminTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import { blogsClient, type BlogPost } from '@/clients/blogs.client';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#0D9488';
const TEAL_LIGHT = '#F0FDFA';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'published' | 'drafts' | 'archived';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachBlog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('published');
  const [search, setSearch] = useState('');
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  // ─── Query ───────────────────────────────────────────────────────────────

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['coach', 'blogs'],
    queryFn: () => blogsClient.getMyPosts(),
  });

  const published = posts.filter((p) => p.status === 'published');
  const drafts = posts.filter((p) => p.status === 'draft');
  const archived = posts.filter((p) => p.status === 'archived');

  const filtered = posts.filter((p) => {
    const statusMap: Record<StatusFilter, string> = {
      published: 'published',
      drafts: 'draft',
      archived: 'archived',
    };
    const matchesStatus = p.status === statusMap[statusFilter];
    const matchesSearch =
      search.trim() === '' ||
      p.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ─── Delete mutation ─────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogsClient.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach', 'blogs'] });
      setDeletingPost(null);
      toast.success(t('admin.common.deleted', { defaultValue: 'Usunięto' }));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const handleDeleteConfirm = () => {
    if (!deletingPost) return;
    deleteMutation.mutate(deletingPost.id);
  };

  // ─── Table columns ───────────────────────────────────────────────────────

  const columns: AdminTableColumn<BlogPost>[] = [
    {
      key: 'cover',
      header: '',
      className: 'w-14',
      render: (post) =>
        post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            className="w-10 h-10 rounded-lg object-cover border border-[#E8E4DF]"
            aria-hidden="true"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg bg-[#F0FDFA] border border-[#E8E4DF] flex items-center justify-center"
            aria-hidden="true"
          >
            <FileText size={16} className="text-[#CCCCCC]" />
          </div>
        ),
    },
    {
      key: 'title',
      header: t('coach.blog.table.title'),
      render: (post) => (
        <div className="min-w-0">
          <p className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D] truncate max-w-[280px]">
            {post.title}
          </p>
          {post.excerpt && (
            <p className="font-['Inter'] text-[12px] text-[#8A8A8A] truncate max-w-[280px] mt-0.5">
              {post.excerpt}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('coach.blog.table.status'),
      render: (post) => {
        const badgeClass =
          post.status === 'published'
            ? 'text-[#0D9488] bg-[#F0FDFA] border border-[#0D9488]/20'
            : post.status === 'archived'
              ? 'text-[#6B6B6B] bg-[#F5F5F5] border border-[#E8E4DF]'
              : 'text-[#B8963E] bg-[#FDF8F0] border border-[#B8963E]/20';
        const labelKey =
          post.status === 'published'
            ? 'coach.blog.status.published'
            : post.status === 'archived'
              ? 'coach.blog.status.archived'
              : 'coach.blog.status.draft';
        return (
          <span
            className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium font-["Inter"]',
              badgeClass,
            ].join(' ')}
          >
            {t(labelKey)}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: t('coach.blog.table.date'),
      render: (post) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B] whitespace-nowrap">
          {formatDate(
            post.status === 'published' && post.publishedAt
              ? post.publishedAt
              : post.createdAt,
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('coach.blog.table.actions'),
      render: (post) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(`/coach/blog/${post.id}/edit`)}
            title={t('common.edit', { defaultValue: 'Edytuj' })}
            aria-label={`${t('common.edit', { defaultValue: 'Edytuj' })}: ${post.title}`}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#0D9488] hover:bg-[#F0FDFA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeletingPost(post)}
            title={t('common.delete', { defaultValue: 'Usuń' })}
            aria-label={`${t('common.delete', { defaultValue: 'Usuń' })}: ${post.title}`}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <AdminPageHeader
        title={t('coach.blog.title')}
        description={t('coach.blog.description')}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={FileText}
          label={t('coach.blog.stats.total')}
          value={isLoading ? '—' : posts.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('coach.blog.stats.published')}
          value={isLoading ? '—' : published.length}
        />
        <AdminStatCard
          icon={FileX2}
          label={t('coach.blog.stats.drafts')}
          value={isLoading ? '—' : drafts.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('coach.blog.stats.archived')}
          value={isLoading ? '—' : archived.length}
        />
      </div>

      {/* Filter tabs + Search + New article */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'published',
              label: t('coach.blog.filter.published'),
              count: published.length,
            },
            {
              value: 'drafts',
              label: t('coach.blog.filter.drafts'),
              count: drafts.length,
            },
            {
              value: 'archived',
              label: t('coach.blog.filter.archived'),
              count: archived.length,
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('coach.blog.searchPlaceholder')}
              aria-label={t('coach.blog.searchPlaceholder')}
              className={[
                'pl-9 pr-3 py-1.5 rounded-lg border border-[#E8E4DF] bg-white',
                "font-['Inter'] text-[14px] text-[#2D2D2D] placeholder:text-[#AAAAAA]",
                'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]',
                'transition-colors w-48',
              ].join(' ')}
            />
          </div>

          {/* New article button */}
          <button
            type="button"
            onClick={() => navigate('/coach/blog/new')}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg shrink-0',
              "font-['Inter'] text-[14px] font-medium text-white",
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0D9488]',
            ].join(' ')}
            style={{ backgroundColor: TEAL }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                '#0F766E';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                TEAL;
            }}
          >
            <Plus size={16} />
            {t('coach.blog.newArticle')}
          </button>
        </div>
      </div>

      {/* Table */}
      <AdminTable<BlogPost>
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('coach.blog.errors.loadFailed')}
        emptyIcon={FileText}
        emptyMessage={
          search.trim() === ''
            ? t('coach.blog.empty.noPosts')
            : t('coach.blog.empty.noResults')
        }
        ariaLabel={t('coach.blog.title')}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingPost}
        title={t('coach.blog.delete.title')}
        message={`${t('coach.blog.delete.confirm')} "${deletingPost?.title ?? ''}"? ${t('coach.blog.delete.irreversible')}`}
        confirmLabel={t('common.delete', { defaultValue: 'Usuń' })}
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPost(null)}
      />

      {/* Teal accent reference for static analysis */}
      <div
        className="hidden"
        aria-hidden="true"
        style={{ color: TEAL_LIGHT }}
      />
    </div>
  );
}
