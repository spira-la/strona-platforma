import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  MailOpen,
  Mail,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterTabs,
  AdminStatusBadge,
  AdminTable,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import {
  contactClient,
  type ContactMessage,
} from '@/clients/contact.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

// ---------------------------------------------------------------------------
// MessageViewDialog — read-only popup showing full message text
// ---------------------------------------------------------------------------

interface MessageViewDialogProps {
  message: ContactMessage;
  onClose: () => void;
}

function MessageViewDialog({ message, onClose }: MessageViewDialogProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="msg-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E8E4DF] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF] flex-shrink-0">
          <h2
            id="msg-dialog-title"
            className="font-['Playfair_Display',serif] font-bold text-[18px] text-[#2D2D2D]"
          >
            {t('admin.contact.messageDialog.title')} {message.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F9F6F0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Meta */}
          <dl className="grid grid-cols-1 gap-2 text-[13px]">
            <div className="flex gap-2">
              <dt className="text-[#8A8A8A] font-medium min-w-[80px]">Email:</dt>
              <dd className="text-[#2D2D2D] break-all">
                <a href={`mailto:${message.email}`} className="hover:text-[#B8963E] underline">
                  {message.email}
                </a>
              </dd>
            </div>
            {message.phone && (
              <div className="flex gap-2">
                <dt className="text-[#8A8A8A] font-medium min-w-[80px]">
                  {t('admin.contact.messageDialog.phone')}:
                </dt>
                <dd className="text-[#2D2D2D]">{message.phone}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-[#8A8A8A] font-medium min-w-[80px]">
                {t('admin.contact.messageDialog.date')}:
              </dt>
              <dd className="text-[#2D2D2D]">{formatDate(message.createdAt)}</dd>
            </div>
          </dl>

          {/* Divider */}
          <hr className="border-[#E8E4DF]" />

          {/* Message text */}
          <p className="font-['Inter'] text-[14px] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DF] flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[14px] font-medium text-[#6B6B6B] hover:bg-[#F9F6F0] transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type StatusFilter = 'unread' | 'read';

export default function AdminContact() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unread');
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => contactClient.getAll(),
  });

  const messages = data ?? [];

  const unreadMessages = messages.filter((m) => !m.isRead);
  const readMessages = messages.filter((m) => m.isRead);

  const filtered = statusFilter === 'unread' ? unreadMessages : readMessages;

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: (id: string) => contactClient.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => contactClient.markAsUnread(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactClient.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      setDeletingMessage(null);
      toast.success(t('admin.common.deleted'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleRead = (msg: ContactMessage) => {
    if (msg.isRead) {
      markUnreadMutation.mutate(msg.id);
    } else {
      markReadMutation.mutate(msg.id);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingMessage) return;
    deleteMutation.mutate(deletingMessage.id);
  };

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<ContactMessage>[] = [
    {
      key: 'name',
      header: t('admin.contact.table.name'),
      render: (m) => (
        <span
          className={[
            "font-['Inter'] text-[14px] text-[#2D2D2D]",
            !m.isRead ? 'font-semibold' : 'font-normal',
          ].join(' ')}
        >
          {m.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: t('admin.contact.table.email'),
      render: (m) => (
        <a
          href={`mailto:${m.email}`}
          className="font-['Inter'] text-[13px] text-[#6B6B6B] hover:text-[#B8963E] transition-colors break-all"
        >
          {m.email}
        </a>
      ),
    },
    {
      key: 'phone',
      header: t('admin.contact.table.phone'),
      render: (m) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {m.phone ?? '—'}
        </span>
      ),
    },
    {
      key: 'message',
      header: t('admin.contact.table.message'),
      render: (m) => (
        <span
          className="font-['Inter'] text-[13px] text-[#6B6B6B] cursor-pointer hover:text-[#2D2D2D] transition-colors"
          title={m.message}
          onClick={() => setViewingMessage(m)}
        >
          {m.message.length > 80 ? `${m.message.slice(0, 80)}…` : m.message}
        </span>
      ),
    },
    {
      key: 'date',
      header: t('admin.contact.table.date'),
      render: (m) => (
        <span className="font-['Inter'] text-[12px] text-[#8A8A8A] whitespace-nowrap">
          {formatDate(m.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.contact.table.status'),
      render: (m) => (
        <AdminStatusBadge
          variant={!m.isRead ? 'warning' : 'neutral'}
          label={
            !m.isRead
              ? t('admin.contact.status.unread')
              : t('admin.contact.status.read')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.contact.table.actions'),
      render: (m) => {
        const isTogglingRead =
          (markReadMutation.isPending || markUnreadMutation.isPending);

        return (
          <div className="flex items-center gap-1">
            {/* View full message */}
            <button
              type="button"
              onClick={() => setViewingMessage(m)}
              title={t('admin.contact.actions.viewMessage')}
              aria-label={t('admin.contact.actions.viewMessage')}
              className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            >
              <Eye size={15} />
            </button>

            {/* Mark read / unread */}
            <button
              type="button"
              onClick={() => handleToggleRead(m)}
              disabled={isTogglingRead}
              title={
                m.isRead
                  ? t('admin.contact.actions.markUnread')
                  : t('admin.contact.actions.markRead')
              }
              aria-label={
                m.isRead
                  ? t('admin.contact.actions.markUnread')
                  : t('admin.contact.actions.markRead')
              }
              className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            >
              {m.isRead ? (
                <Mail size={15} />
              ) : (
                <MailOpen size={15} className="text-[#B8963E]" />
              )}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setDeletingMessage(m)}
              title={t('admin.contact.actions.delete')}
              aria-label={t('admin.contact.actions.deleteMessage')}
              className="p-1.5 rounded text-[#8A8A8A] hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  // ─── Empty message per tab ────────────────────────────────────────────────

  const emptyMessage =
    statusFilter === 'unread'
      ? t('admin.contact.empty.noUnread')
      : t('admin.contact.empty.noRead');

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <AdminPageHeader
        title={t('admin.contact.title')}
        description={t('admin.contact.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={MessageSquare}
          label={t('admin.contact.stats.total')}
          value={isLoading ? '—' : messages.length}
        />
        <AdminStatCard
          icon={Mail}
          label={t('admin.contact.stats.unread')}
          value={isLoading ? '—' : unreadMessages.length}
        />
        <AdminStatCard
          icon={MailOpen}
          label={t('admin.contact.stats.read')}
          value={isLoading ? '—' : readMessages.length}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-5">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'unread',
              label: t('admin.contact.filter.unread'),
              count: unreadMessages.length,
            },
            {
              value: 'read',
              label: t('admin.contact.filter.read'),
              count: readMessages.length,
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />
      </div>

      {/* Table */}
      <AdminTable<ContactMessage>
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.contact.errors.loadFailed')}
        emptyIcon={MessageSquare}
        emptyMessage={emptyMessage}
        ariaLabel={t('admin.contact.table.label')}
      />

      {/* Message view dialog */}
      {viewingMessage && (
        <MessageViewDialog
          message={viewingMessage}
          onClose={() => setViewingMessage(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingMessage}
        title={t('admin.contact.delete.title')}
        message={`${t('admin.contact.delete.confirm')} "${deletingMessage?.name ?? ''}"? ${t('admin.contact.delete.irreversible')}`}
        confirmLabel={t('admin.contact.delete.confirmLabel')}
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMessage(null)}
      />
    </div>
  );
}
