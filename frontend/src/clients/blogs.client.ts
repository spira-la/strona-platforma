import { api } from './api';
import { supabase } from '@/config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  authorId: string | null;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  tags: string[] | null;
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
  tags?: string[];
  isPublished?: boolean;
}

export type UpdateBlogData = Partial<CreateBlogData>;

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
  getPublished: (): Promise<BlogPost[]> =>
    api
      .get<{ success: boolean; data: BlogPost[] }>('/blogs')
      .then((r) => r.data),

  getBySlug: (slug: string): Promise<BlogPost> =>
    api
      .get<{ success: boolean; data: BlogPost }>(`/blogs/${slug}`)
      .then((r) => r.data),

  // Protected endpoints
  getMyPosts: (): Promise<BlogPost[]> => api.get<BlogPost[]>('/blogs/my'),

  getMyPost: (id: string): Promise<BlogPost> =>
    api.get<BlogPost>(`/blogs/my/${id}`),

  create: (data: CreateBlogData): Promise<BlogPost> =>
    api.post<BlogPost>('/blogs', data),

  update: (id: string, data: UpdateBlogData): Promise<BlogPost> =>
    api.put<BlogPost>(`/blogs/${id}`, data),

  remove: (id: string): Promise<void> => api.delete<void>(`/blogs/${id}`),

  uploadEditorImage: (file: File): Promise<{ url: string }> =>
    uploadFile('/blogs/upload/image', file),

  uploadCoverImage: (file: File): Promise<{ url: string }> =>
    uploadFile('/blogs/upload/cover', file),
};
