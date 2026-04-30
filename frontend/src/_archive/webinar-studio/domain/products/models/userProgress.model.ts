import { z } from 'zod';

// ✅ Esquema para el progreso de un capítulo específico
export const chapterProgressSchema = z.object({
  chapterId: z.string(),
  chapterName: z.string(),
  currentTime: z.number().min(0), // Tiempo actual en segundos
  duration: z.number().min(0), // Duración total del capítulo
  isCompleted: z.boolean().default(false),
  lastPlayedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

// ✅ Esquema para preferencias del usuario en un curso
export const coursePreferencesSchema = z.object({
  zoom: z.number().min(0.3).max(3.0).optional(), // Zoom level para PDFs (0.3x - 3.0x)
}).optional();

// ✅ Esquema para el progreso de un curso completo
export const courseProgressSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  courseType: z.enum(['audio', 'ebook', 'coaching']),
  currentChapterId: z.string().optional(), // Capítulo actualmente activo
  chapters: z.record(z.string(), chapterProgressSchema), // Progreso por capítulo
  totalChapters: z.number(),
  completedChapters: z.number().default(0),
  isCompleted: z.boolean().default(false),
  startedAt: z.date(),
  lastAccessedAt: z.date(),
  completedAt: z.date().optional(),
  totalProgress: z.number().min(0).max(100).default(0), // Porcentaje de progreso
  preferences: coursePreferencesSchema, // ✅ Preferencias del usuario para este curso
});

// ✅ Esquema para el progreso general del usuario
export const userProgressSchema = z.object({
  userId: z.string(),
  courses: z.record(z.string(), courseProgressSchema), // Progreso por curso
  totalCourses: z.number().default(0),
  completedCourses: z.number().default(0),
  totalTimeSpent: z.number().default(0), // Tiempo total en segundos
  lastActivityAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ✅ Tipos TypeScript derivados de los esquemas
export type ChapterProgress = z.infer<typeof chapterProgressSchema>;
export type CoursePreferences = z.infer<typeof coursePreferencesSchema>;
export type CourseProgress = z.infer<typeof courseProgressSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;

// ✅ Interfaz para crear nuevo progreso
export interface CreateChapterProgress {
  chapterId: string;
  chapterName: string;
  currentTime: number;
  duration: number;
}

export interface CreateCourseProgress {
  courseId: string;
  courseName: string;
  courseType: 'audio' | 'ebook' | 'coaching';
  chapters: Record<string, ChapterProgress>;
  totalChapters: number;
}

// ✅ Interfaz para actualizar progreso
export interface UpdateChapterProgress {
  currentTime: number;
  isCompleted?: boolean;
}

export interface UpdateCourseProgress {
  currentChapterId?: string;
  totalProgress?: number;
  isCompleted?: boolean;
}
