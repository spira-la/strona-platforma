import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

interface ListResponse {
  success: boolean;
  data: Category[];
}

interface ItemResponse {
  success: boolean;
  data: Category;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const categoriesClient = {
  getAll(): Promise<Category[]> {
    return api.get<ListResponse>('/categories').then((r) => r.data);
  },

  create(data: CreateCategoryData): Promise<Category> {
    return api.post<ItemResponse>('/categories', data).then((r) => r.data);
  },

  update(id: string, data: UpdateCategoryData): Promise<Category> {
    return api.put<ItemResponse>(`/categories/${id}`, data).then((r) => r.data);
  },

  archive(id: string): Promise<Category> {
    return api
      .patch<ItemResponse>(`/categories/${id}/archive`)
      .then((r) => r.data);
  },

  restore(id: string): Promise<Category> {
    return api
      .patch<ItemResponse>(`/categories/${id}/restore`)
      .then((r) => r.data);
  },
};
