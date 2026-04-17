import { api } from './api';
import { supabase } from '@/config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogCategory {
  id: string;
  name: string;
  nameEn: string | null;
  nameEs: string | null;
  slug: string;
}

export interface BlogPost {
  id: string;
  authorId: string | null;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  categories: BlogCategory[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  categoryIds?: string[];
  status?: BlogPostStatus;
}

export type UpdateBlogData = Partial<CreateBlogData>;

export interface BlogTranslation {
  id: string;
  postId: string;
  languageCode: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  isAutoTranslated: boolean;
  translatedAt: string | null;
}

// ─── Auth header helper (for file upload fetches) ─────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(
  endpoint: string,
  file: File,
): Promise<{ url: string }> {
  const authHeader = await getAuthHeader();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: authHeader,
    body: formData,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }

  return res.json() as Promise<{ url: string }>;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const blogsClient = {
  // Public endpoints — no auth required
  getPublished: (lang?: string): Promise<BlogPost[]> => {
    const qs = lang && lang !== 'pl' ? `?lang=${encodeURIComponent(lang)}` : '';
    return api
      .get<{ success: boolean; data: BlogPost[] }>(`/blogs${qs}`)
      .then((r) => r.data);
  },

  getBySlug: (slug: string, lang?: string): Promise<BlogPost> => {
    const qs = lang && lang !== 'pl' ? `?lang=${encodeURIComponent(lang)}` : '';
    return api
      .get<{ success: boolean; data: BlogPost }>(`/blogs/${slug}${qs}`)
      .then((r) => r.data);
  },

  // Protected endpoints
  getMyPosts: (): Promise<BlogPost[]> =>
    api
      .get<{ success: boolean; data: BlogPost[] }>('/blogs/my')
      .then((r) => r.data),

  getMyPost: (id: string): Promise<BlogPost> =>
    api
      .get<{ success: boolean; data: BlogPost }>(`/blogs/my/${id}`)
      .then((r) => r.data),

  create: (data: CreateBlogData): Promise<BlogPost> =>
    api
      .post<{ success: boolean; data: BlogPost }>('/blogs', data)
      .then((r) => r.data),

  update: (id: string, data: UpdateBlogData): Promise<BlogPost> =>
    api
      .put<{ success: boolean; data: BlogPost }>(`/blogs/${id}`, data)
      .then((r) => r.data),

  remove: (id: string): Promise<void> => api.delete<void>(`/blogs/${id}`),

  uploadEditorImage: (file: File): Promise<{ url: string }> =>
    uploadFile('/blogs/upload/image', file),

  uploadCoverImage: (file: File): Promise<{ url: string }> =>
    uploadFile('/blogs/upload/cover', file),

  // Translation
  translatePost: (
    id: string,
    targetLang: string,
    sourceLang?: string,
  ): Promise<{ success: boolean; message: string }> =>
    api.post(`/blogs/${id}/translate`, { targetLang, sourceLang }),

  getTranslations: (id: string): Promise<BlogTranslation[]> =>
    api
      .get<{
        success: boolean;
        data: BlogTranslation[];
      }>(`/blogs/${id}/translations`)
      .then((r) => r.data),

  /** Public — returns translation for a given language, or null if not translated yet. */
  getPublicTranslation: (
    id: string,
    lang: string,
  ): Promise<BlogTranslation | null> =>
    api
      .get<{
        success: boolean;
        data: BlogTranslation | null;
      }>(`/blogs/${id}/translations/${lang}`)
      .then((r) => r.data),
};
