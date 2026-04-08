import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFormField, ADMIN_INPUT_CLASS } from '@/components/admin/AdminFormField';
import { coachClient, type UpdateCoachProfileData } from '@/clients/coach.client';
import { toast } from '@/stores/toast.store';

// ─── Timezone options ─────────────────────────────────────────────────────────

const TIMEZONES = [
  'Europe/Warsaw',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Prague',
  'Europe/Vienna',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

// ─── Tag input helpers ────────────────────────────────────────────────────────

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}

// ─── TagInput component ───────────────────────────────────────────────────────

interface TagDisplayProps {
  tags: string[];
}

function TagDisplay({ tags }: TagDisplayProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#B8963E]/10 text-[#B8963E] font-['Inter']"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={[
            'w-10 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-[#B8963E]' : 'bg-[#D4D0CB]',
          ].join(' ')}
        />
        <div
          className={[
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')}
        />
      </div>
      <span className="font-['Inter'] text-[14px] text-[#2D2D2D]">{label}</span>
    </label>
  );
}

// ─── CoachProfile page ────────────────────────────────────────────────────────

export default function CoachProfile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['coach', 'profile'],
    queryFn: coachClient.getProfile,
  });

  // ── Local form state ─────────────────────────────────────────────────────────
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('Europe/Warsaw');
  const [yearsExperience, setYearsExperience] = useState('');
  const [languagesRaw, setLanguagesRaw] = useState('');
  const [expertiseRaw, setExpertiseRaw] = useState('');
  const [certificationsRaw, setCertificationsRaw] = useState('');
  const [acceptingClients, setAcceptingClients] = useState(true);

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setLocation(profile.location ?? '');
    setWebsite(profile.website ?? '');
    setTimezone(profile.timezone ?? 'Europe/Warsaw');
    setYearsExperience(profile.yearsExperience != null ? String(profile.yearsExperience) : '');
    setLanguagesRaw(joinTags(profile.languages));
    setExpertiseRaw(joinTags(profile.expertise));
    setCertificationsRaw(joinTags(profile.certifications));
    setAcceptingClients(profile.acceptingClients ?? true);
  }, [profile]);

  // ── Save mutation ─────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateCoachProfileData) => coachClient.updateProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const yearsNum = yearsExperience !== '' ? parseInt(yearsExperience, 10) : undefined;

    mutate({
      bio: bio || undefined,
      location: location || undefined,
      website: website || undefined,
      timezone,
      acceptingClients,
      yearsExperience: yearsNum,
      languages: parseTags(languagesRaw),
      expertise: parseTags(expertiseRaw),
      certifications: parseTags(certificationsRaw),
    });
  };

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader
          title={t('coach.profile.title')}
          description={t('coach.profile.description')}
        />
        <div className="flex justify-center py-16">
          <div
            className="w-8 h-8 rounded-full border-4 border-[#E8E4DF] border-t-[#B8963E] animate-spin"
            role="status"
            aria-label={t('common.loading')}
          />
        </div>
      </div>
    );
  }

  const languageTags = parseTags(languagesRaw);
  const expertiseTags = parseTags(expertiseRaw);
  const certificationTags = parseTags(certificationsRaw);

  return (
    <div>
      <AdminPageHeader
        title={t('coach.profile.title')}
        description={t('coach.profile.description')}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" noValidate>

        {/* Bio */}
        <AdminFormField label={t('coach.profile.bio')} htmlFor="profile-bio">
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('coach.profile.bioPlaceholder')}
            rows={5}
            className={[ADMIN_INPUT_CLASS, 'resize-y min-h-[120px]'].join(' ')}
          />
        </AdminFormField>

        {/* Location */}
        <AdminFormField label={t('coach.profile.location')} htmlFor="profile-location">
          <input
            id="profile-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('coach.profile.locationPlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>

        {/* Website */}
        <AdminFormField label={t('coach.profile.website')} htmlFor="profile-website">
          <input
            id="profile-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t('coach.profile.websitePlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>

        {/* Timezone */}
        <AdminFormField label={t('coach.profile.timezone')} htmlFor="profile-timezone">
          <select
            id="profile-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={ADMIN_INPUT_CLASS}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </AdminFormField>

        {/* Years of experience */}
        <AdminFormField label={t('coach.profile.yearsExperience')} htmlFor="profile-years">
          <input
            id="profile-years"
            type="number"
            min={0}
            max={60}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="0"
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>

        {/* Languages */}
        <AdminFormField label={t('coach.profile.languages')} htmlFor="profile-languages">
          <input
            id="profile-languages"
            type="text"
            value={languagesRaw}
            onChange={(e) => setLanguagesRaw(e.target.value)}
            placeholder={t('coach.profile.languagesPlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
          <TagDisplay tags={languageTags} />
        </AdminFormField>

        {/* Expertise */}
        <AdminFormField label={t('coach.profile.expertise')} htmlFor="profile-expertise">
          <input
            id="profile-expertise"
            type="text"
            value={expertiseRaw}
            onChange={(e) => setExpertiseRaw(e.target.value)}
            placeholder={t('coach.profile.expertisePlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
          <TagDisplay tags={expertiseTags} />
        </AdminFormField>

        {/* Certifications */}
        <AdminFormField label={t('coach.profile.certifications')} htmlFor="profile-certifications">
          <input
            id="profile-certifications"
            type="text"
            value={certificationsRaw}
            onChange={(e) => setCertificationsRaw(e.target.value)}
            placeholder={t('coach.profile.certificationsPlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
          <TagDisplay tags={certificationTags} />
        </AdminFormField>

        {/* Accepting clients toggle */}
        <div className="bg-white border border-[#E8E4DF] rounded-xl p-4">
          <Toggle
            id="profile-accepting"
            checked={acceptingClients}
            onChange={setAcceptingClients}
            label={t('coach.profile.acceptingClients')}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className={[
              'px-6 py-2.5 rounded-lg text-sm font-medium text-white',
              'bg-[#B8963E] hover:bg-[#8A6F2E] active:bg-[#7A6028]',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              "font-['Inter']",
            ].join(' ')}
          >
            {isPending ? t('common.loading') : t('coach.profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
