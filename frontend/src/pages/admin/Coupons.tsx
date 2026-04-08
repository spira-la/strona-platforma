import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  CheckCircle2,
  Clock,
  BarChart3,
  Copy,
  Check,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterTabs,
  AdminSearchBar,
  AdminStatusBadge,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import { couponsClient, type Coupon, type CreateCouponData } from '@/clients/coupons.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue}%`;
  }
  return `${coupon.discountValue} zł`;
}

function formatUses(coupon: Coupon): string {
  const max = coupon.maxUses === null ? '∞' : String(coupon.maxUses);
  return `${coupon.currentUses} / ${max}`;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const date = new Date(expiresAt);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isExpired(coupon: Coupon): boolean {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

interface StatsData {
  total: number;
  active: number;
  expired: number;
  totalUses: number;
}

function deriveStats(coupons: Coupon[]): StatsData {
  return {
    total: coupons.length,
    active: coupons.filter((c) => c.isActive && !isExpired(c)).length,
    expired: coupons.filter((c) => isExpired(c)).length,
    totalUses: coupons.reduce((sum, c) => sum + c.currentUses, 0),
  };
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={t('admin.coupons.actions.copyCode')}
      className="ml-1.5 p-0.5 rounded text-[#AAAAAA] hover:text-[#B8963E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
      aria-label={copied ? t('admin.coupons.actions.copied') : t('admin.coupons.actions.copyCode')}
    >
      {copied ? (
        <Check size={13} className="text-green-600" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dialog form state
// ---------------------------------------------------------------------------

interface FormState {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: string;
  noLimit: boolean;
  maxUses: string;
  noExpiry: boolean;
  expiresAt: string;
  isActive: boolean;
}

function buildInitialForm(coupon?: Coupon): FormState {
  if (coupon) {
    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      noLimit: coupon.maxUses === null,
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : '',
      noExpiry: coupon.expiresAt === null,
      expiresAt: coupon.expiresAt
        ? coupon.expiresAt.slice(0, 10) // yyyy-mm-dd
        : '',
      isActive: coupon.isActive,
    };
  }
  return {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    noLimit: true,
    maxUses: '',
    noExpiry: true,
    expiresAt: '',
    isActive: true,
  };
}

function formToCreateData(form: FormState): CreateCouponData {
  return {
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maxUses: form.noLimit ? null : Number(form.maxUses),
    expiresAt: form.noExpiry ? null : form.expiresAt || null,
    isActive: form.isActive,
  };
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface CouponDialogProps {
  editingCoupon: Coupon | null;
  onClose: () => void;
  onSave: (data: CreateCouponData, id?: string) => void;
  isSaving: boolean;
}

function CouponDialog({
  editingCoupon,
  onClose,
  onSave,
  isSaving,
}: CouponDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(editingCoupon ?? undefined),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.code.trim()) {
      next.code = t('admin.coupons.validation.codeRequired');
    }
    const val = Number(form.discountValue);
    if (!form.discountValue || isNaN(val) || val <= 0) {
      next.discountValue = t('admin.coupons.validation.valueRequired');
    }
    if (form.discountType === 'percentage' && val > 100) {
      next.discountValue = t('admin.coupons.validation.percentageMax');
    }
    if (!form.noLimit) {
      const uses = Number(form.maxUses);
      if (!form.maxUses || isNaN(uses) || uses < 1) {
        next.maxUses = t('admin.coupons.validation.usesRequired');
      }
    }
    if (!form.noExpiry && !form.expiresAt) {
      next.expiresAt = t('admin.coupons.validation.expiryRequired');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data = formToCreateData(form);
    onSave(data, editingCoupon?.id);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const labelClass =
    "block font-['Inter'] text-[13px] font-medium text-[#444444] mb-1";
  const inputClass =
    "w-full border border-[#E8E4DF] rounded-lg px-3 py-2 font-['Inter'] text-[14px] text-[#2D2D2D] placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-[#B8963E] focus:border-transparent transition-shadow";
  const errorClass = "mt-1 font-['Inter'] text-[12px] text-red-500";

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={editingCoupon ? t('admin.coupons.editCoupon') : t('admin.coupons.newCoupon')}
    >
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[500px] mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F0EDE8] shrink-0">
          <h2 className="font-['Cormorant_Garamond'] font-bold text-[20px] text-[#2D2D2D]">
            {editingCoupon ? t('admin.coupons.editCoupon') : t('admin.coupons.newCoupon')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            aria-label={t('admin.coupons.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 flex flex-col gap-5"
          noValidate
        >
          {/* Code */}
          <div>
            <label htmlFor="coupon-code" className={labelClass}>
              {t('admin.coupons.form.couponCode')}
            </label>
            <div className="flex gap-2">
              <input
                ref={firstInputRef}
                id="coupon-code"
                type="text"
                value={form.code}
                onChange={(e) =>
                  setField('code', e.target.value.toUpperCase())
                }
                placeholder={t('admin.coupons.form.codePlaceholder')}
                className={`${inputClass} flex-1 font-mono uppercase tracking-widest`}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setField('code', generateCode())}
                title={t('admin.coupons.form.generateTooltip')}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E4DF] rounded-lg font-['Inter'] text-[13px] text-[#6B6B6B] hover:bg-[#F9F6F0] hover:text-[#B8963E] hover:border-[#B8963E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] whitespace-nowrap"
              >
                <RefreshCw size={13} />
                {t('admin.coupons.form.generate')}
              </button>
            </div>
            {errors.code && <p className={errorClass}>{errors.code}</p>}
          </div>

          {/* Discount type */}
          <div>
            <p className={labelClass}>{t('admin.coupons.form.discountType')}</p>
            <div className="flex gap-3">
              {(
                [
                  { value: 'percentage' as const, label: t('admin.coupons.discountType.percentage') },
                  { value: 'fixed' as const, label: t('admin.coupons.discountType.fixed') },
                ]
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors font-['Inter'] text-[14px] ${
                    form.discountType === value
                      ? 'border-[#B8963E] bg-[#B8963E]/5 text-[#B8963E] font-medium'
                      : 'border-[#E8E4DF] text-[#444444] hover:bg-[#F9F6F0]'
                  }`}
                >
                  <input
                    type="radio"
                    name="discountType"
                    value={value}
                    checked={form.discountType === value}
                    onChange={() => setField('discountType', value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Discount value */}
          <div>
            <label htmlFor="coupon-value" className={labelClass}>
              {t('admin.coupons.form.discountValue')}
            </label>
            <div className="relative">
              <input
                id="coupon-value"
                type="number"
                min={0}
                max={form.discountType === 'percentage' ? 100 : undefined}
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setField('discountValue', e.target.value)}
                placeholder={t('admin.coupons.form.valuePlaceholder')}
                className={`${inputClass} pr-10`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
                {form.discountType === 'percentage' ? '%' : 'zł'}
              </span>
            </div>
            {errors.discountValue && (
              <p className={errorClass}>{errors.discountValue}</p>
            )}
          </div>

          {/* Max uses */}
          <div>
            <label htmlFor="coupon-maxuses" className={labelClass}>
              {t('admin.coupons.form.maxUses')}
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-['Inter'] text-[13px] text-[#6B6B6B]">
                <input
                  type="checkbox"
                  checked={form.noLimit}
                  onChange={(e) => setField('noLimit', e.target.checked)}
                  className="rounded border-[#E8E4DF] text-[#B8963E] focus:ring-[#B8963E] w-4 h-4"
                />
                {t('admin.coupons.form.noLimit')}
              </label>
            </div>
            {!form.noLimit && (
              <>
                <input
                  id="coupon-maxuses"
                  type="number"
                  min={1}
                  step={1}
                  value={form.maxUses}
                  onChange={(e) => setField('maxUses', e.target.value)}
                  placeholder={t('admin.coupons.form.valuePlaceholder')}
                  className={inputClass}
                />
                {errors.maxUses && (
                  <p className={errorClass}>{errors.maxUses}</p>
                )}
              </>
            )}
          </div>

          {/* Expiry date */}
          <div>
            <label htmlFor="coupon-expiry" className={labelClass}>
              {t('admin.coupons.form.expiryDate')}
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-['Inter'] text-[13px] text-[#6B6B6B]">
                <input
                  type="checkbox"
                  checked={form.noExpiry}
                  onChange={(e) => setField('noExpiry', e.target.checked)}
                  className="rounded border-[#E8E4DF] text-[#B8963E] focus:ring-[#B8963E] w-4 h-4"
                />
                {t('admin.coupons.form.noExpiry')}
              </label>
            </div>
            {!form.noExpiry && (
              <>
                <input
                  id="coupon-expiry"
                  type="date"
                  value={form.expiresAt}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setField('expiresAt', e.target.value)}
                  className={inputClass}
                />
                {errors.expiresAt && (
                  <p className={errorClass}>{errors.expiresAt}</p>
                )}
              </>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-[#F9F6F0] rounded-lg">
            <span className="font-['Inter'] text-[14px] text-[#444444]">
              {t('admin.coupons.form.activeToggle')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setField('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] ${
                form.isActive ? 'bg-[#B8963E]' : 'bg-[#DDDDDD]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-[#E8E4DF] font-['Inter'] text-[14px] text-[#444444] hover:bg-[#F9F6F0] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#B8963E] hover:bg-[#8A6F2E] text-white font-['Inter'] text-[14px] font-medium transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {editingCoupon ? t('admin.coupons.form.save') : t('admin.coupons.form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table row
// ---------------------------------------------------------------------------

interface CouponRowProps {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
  isToggling: boolean;
}

function CouponRow({
  coupon,
  onEdit,
  onToggle,
  isToggling,
}: CouponRowProps) {
  const { t } = useTranslation();
  const expired = isExpired(coupon);

  return (
    <tr className="hover:bg-[#FDFCFA] transition-colors border-b border-[#F0EDE8] last:border-b-0">
      {/* Code */}
      <td className="px-4 py-3.5">
        <div className="flex items-center">
          <span className="font-mono text-[13px] font-semibold text-[#2D2D2D] tracking-widest">
            {coupon.code}
          </span>
          <CopyButton text={coupon.code} />
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3.5">
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {coupon.discountType === 'percentage' ? t('admin.coupons.discountType.percentage') : t('admin.coupons.discountType.fixed')}
        </span>
      </td>

      {/* Value */}
      <td className="px-4 py-3.5">
        <span className="font-['Inter'] text-[14px] font-semibold text-[#2D2D2D]">
          {formatDiscount(coupon)}
        </span>
      </td>

      {/* Uses */}
      <td className="px-4 py-3.5">
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {formatUses(coupon)}
        </span>
      </td>

      {/* Expiry */}
      <td className="px-4 py-3.5">
        <span
          className={`font-['Inter'] text-[13px] ${expired ? 'text-red-500' : 'text-[#6B6B6B]'}`}
        >
          {formatExpiry(coupon.expiresAt)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <AdminStatusBadge
          variant={isExpired(coupon) ? 'warning' : coupon.isActive ? 'success' : 'neutral'}
          label={isExpired(coupon) ? t('admin.coupons.status.expired') : coupon.isActive ? t('admin.coupons.status.active') : t('admin.coupons.status.inactive')}
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(coupon)}
            title={t('admin.coupons.actions.edit')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            aria-label={t('admin.coupons.actions.editCoupon')}
          >
            <Pencil size={15} />
          </button>

          {/* Toggle active / archive */}
          <button
            type="button"
            onClick={() => onToggle(coupon)}
            disabled={isToggling}
            title={coupon.isActive ? t('admin.coupons.actions.archive') : t('admin.coupons.actions.restore')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
            aria-label={coupon.isActive ? t('admin.coupons.actions.archiveCoupon') : t('admin.coupons.actions.restoreCoupon')}
          >
            {coupon.isActive ? (
              <ToggleRight size={17} className="text-[#B8963E]" />
            ) : (
              <ToggleLeft size={17} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminCoupons() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [togglingCoupon, setTogglingCoupon] = useState<Coupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsClient.getAll(),
  });

  const coupons = data ?? [];
  const stats = deriveStats(coupons);

  const filtered = coupons.filter((c) => {
    if (statusFilter === 'active' && !c.isActive) return false;
    if (statusFilter === 'inactive' && c.isActive) return false;
    if (search.trim() && !c.code.toUpperCase().includes(search.trim().toUpperCase())) return false;
    return true;
  });

  const activeCount = coupons.filter((c) => c.isActive).length;
  const inactiveCount = coupons.filter((c) => !c.isActive).length;

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (d: CreateCouponData) => couponsClient.create(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowDialog(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<CreateCouponData> }) =>
      couponsClient.update(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowDialog(false);
      setEditingCoupon(null);
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setShowDialog(false);
    setEditingCoupon(null);
  };

  const handleSave = (formData: CreateCouponData, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleRequest = (coupon: Coupon) => {
    setTogglingCoupon(coupon);
  };

  const handleToggleConfirm = () => {
    if (!togglingCoupon) return;
    setTogglingId(togglingCoupon.id);
    updateMutation.mutate({
      id: togglingCoupon.id,
      data: { isActive: !togglingCoupon.isActive },
    });
    setTogglingCoupon(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <AdminPageHeader
        title={t('admin.coupons.title')}
        description={t('admin.coupons.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={Ticket}
          label={t('admin.coupons.stats.allCoupons')}
          value={isLoading ? '—' : stats.total}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('admin.coupons.stats.active')}
          value={isLoading ? '—' : stats.active}
        />
        <AdminStatCard
          icon={Clock}
          label={t('admin.coupons.stats.expired')}
          value={isLoading ? '—' : stats.expired}
        />
        <AdminStatCard
          icon={BarChart3}
          label={t('admin.coupons.stats.totalUses')}
          value={isLoading ? '—' : stats.totalUses}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs
          tabs={[
            { value: 'active', label: t('admin.coupons.filter.active'), count: activeCount },
            { value: 'inactive', label: t('admin.coupons.filter.inactive'), count: inactiveCount },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />
      </div>

      {/* Action bar */}
      <div className="mb-5">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('admin.coupons.searchPlaceholder')}
          ariaLabel={t('admin.coupons.searchLabel')}
          actionLabel={t('admin.coupons.newCoupon')}
          onAction={handleOpenCreate}
        />
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#E8E4DF] rounded-xl overflow-hidden">
        {isError && (
          <div className="p-8 text-center">
            <p className="font-['Inter'] text-[14px] text-red-500">
              {t('admin.coupons.errors.loadFailed')}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[#B8963E]" />
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Ticket
              size={36}
              className="mx-auto mb-3 text-[#DDDDDD]"
              strokeWidth={1.5}
            />
            <p className="font-['Inter'] text-[14px] text-[#8A8A8A]">
              {search
                ? t('admin.coupons.empty.noResults')
                : t('admin.coupons.empty.noCoupons')}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]" aria-label={t('admin.coupons.table.label')}>
              <thead>
                <tr className="bg-[#F9F6F0]">
                  {[
                    t('admin.coupons.table.code'),
                    t('admin.coupons.table.type'),
                    t('admin.coupons.table.value'),
                    t('admin.coupons.table.uses'),
                    t('admin.coupons.table.expires'),
                    t('admin.coupons.table.status'),
                    t('admin.coupons.table.actions'),
                  ].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-4 py-3 text-left font-['Inter'] text-[11px] uppercase tracking-wider text-[#8A8A8A] font-semibold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => (
                  <CouponRow
                    key={coupon.id}
                    coupon={coupon}
                    onEdit={handleOpenEdit}
                    onToggle={handleToggleRequest}
                    isToggling={togglingId === coupon.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      {showDialog && (
        <CouponDialog
          editingCoupon={editingCoupon}
          onClose={handleCloseDialog}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!togglingCoupon}
        title={
          togglingCoupon?.isActive
            ? t('admin.coupons.actions.archiveCoupon')
            : t('admin.coupons.actions.restoreCoupon')
        }
        message={`${
          togglingCoupon?.isActive
            ? t('admin.coupons.confirm.archive')
            : t('admin.coupons.confirm.restore')
        } ${togglingCoupon?.code ?? ''}?`}
        confirmLabel={
          togglingCoupon?.isActive
            ? t('admin.coupons.actions.archive')
            : t('admin.coupons.actions.restore')
        }
        variant={togglingCoupon?.isActive ? 'warning' : 'default'}
        onConfirm={handleToggleConfirm}
        onCancel={() => setTogglingCoupon(null)}
      />
    </div>
  );
}
