/**
 * Preparation Mode API Service
 *
 * Two Lambda endpoints:
 *   ADMIN – content CRUD (interview questions, DSA, quizzes, etc.)
 *   USER  – progress, collections, activity, quizzes, streaks
 *
 * The frontend reads content via the USER endpoint only (no mock fallback).
 */

import { cachedFetch, invalidateCache } from '../lib/apiCache';

// ── Endpoints ──────────────────────────────────────────────
const PREP_ADMIN_ENDPOINT =
  import.meta.env.VITE_PREP_ADMIN_ENDPOINT ??
  'https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler';

const PREP_USER_ENDPOINT =
  import.meta.env.VITE_PREP_USER_ENDPOINT ??
  'https://h5bib353ti.execute-api.ap-south-2.amazonaws.com/default/prep_user_handler';

const USE_API = true;
const CACHE_TTL = 90_000; // 90 s

// ── Types ──────────────────────────────────────────────────
export type ContentType =
  | 'interview_questions'
  | 'dsa_problems'
  | 'quizzes'
  | 'cold_dm_templates'
  | 'mass_recruitment'
  | 'job_portals'
  | 'handwritten_notes'
  | 'roadmaps'
  | 'position_resources'
  | 'system_design'
  | 'fundamentals';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  message?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface ProgressMap {
  [itemKey: string]: {
    isSolved: boolean;
    isBookmarked: boolean;
    isFavorite: boolean;
    isApplied: boolean;
    solvedAt?: string;
    updatedAt?: string;
  };
}

export interface PrepCollection {
  userId: string;
  collectionId: string;
  name: string;
  description: string;
  color: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrepActivity {
  userId: string;
  timestamp: string;
  action: string;
  contentType: string;
  itemId: string;
  metadata: Record<string, unknown>;
}

export interface PrepStats {
  userId: string;
  solvedQuestions: number;
  solvedDSA: number;
  completedQuizzes: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalStudyMinutes: number;
  quizAverageScore: number;
}

export interface DashboardData {
  stats: PrepStats;
  recentActivity: PrepActivity[];
  contentCounts: Record<string, number>;
}

export interface QuizResult {
  resultId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
}

export interface QuizHistoryItem {
  userId: string;
  resultId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  timeTaken: number;
  submittedAt: string;
}

// ── Low-level request helpers ──────────────────────────────

async function adminRequest<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T> & Record<string, unknown>> {
  try {
    const res = await fetch(PREP_ADMIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    return await res.json();
  } catch (err) {
    console.error(`[prepAdmin] ${action} failed:`, err);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
    };
  }
}

async function userRequest<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T> & Record<string, unknown>> {
  try {
    const res = await fetch(PREP_USER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    return await res.json();
  } catch (err) {
    console.error(`[prepUser] ${action} failed:`, err);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
    };
  }
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem('userData');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.userId || parsed.id || '';
    }
  } catch { /* ignore */ }
  return '';
}

// ══════════════════════════════════════════════════════════════
//                    ADMIN API (content CRUD)
// ══════════════════════════════════════════════════════════════

export const prepAdminApi = {
  async listContent<T = Record<string, unknown>>(
    contentType: ContentType,
    filters: Record<string, string | number> = {},
  ): Promise<PaginatedResponse<T>> {
    const resp = await adminRequest('list_content', { contentType, ...filters });
    if (resp.success) {
      return resp as unknown as PaginatedResponse<T>;
    }
    return { success: false, items: [], total: 0, page: 1, totalPages: 1, limit: 50 };
  },

  async getContent<T = Record<string, unknown>>(contentType: ContentType, id: string): Promise<T | null> {
    const resp = await adminRequest('get_content', { contentType, id });
    return resp.success ? (resp as any).item as T : null;
  },

  async putContent(contentType: ContentType, items: Record<string, unknown>[]): Promise<boolean> {
    const resp = await adminRequest('put_content', { contentType, items });
    invalidateCache(`prep:${contentType}`);
    return resp.success === true;
  },

  async putContentSingle<T = Record<string, unknown>>(contentType: ContentType, item: Record<string, unknown>): Promise<T | null> {
    const resp = await adminRequest('put_content_single', { contentType, item });
    invalidateCache(`prep:${contentType}`);
    return resp.success ? (resp as any).item as T : null;
  },

  async deleteContent(contentType: ContentType, id: string): Promise<boolean> {
    const resp = await adminRequest('delete_content', { contentType, id });
    invalidateCache(`prep:${contentType}`);
    return resp.success === true;
  },

  async bulkDeleteContent(contentType: ContentType, ids: string[]): Promise<boolean> {
    const resp = await adminRequest('bulk_delete_content', { contentType, ids });
    invalidateCache(`prep:${contentType}`);
    return resp.success === true;
  },

  async fullSyncContent(contentType: ContentType, items: Record<string, unknown>[]): Promise<boolean> {
    const resp = await adminRequest('full_sync_content', { contentType, items });
    invalidateCache(`prep:${contentType}`);
    return resp.success === true;
  },

  async getNoteUploadUrl(filename: string, fileContentType = 'application/pdf') {
    const resp = await adminRequest('get_note_upload_url', { filename, contentType: fileContentType });
    if (resp.success) return resp as unknown as { uploadUrl: string; s3Key: string; expiresIn: number };
    return null;
  },

  async getContentStats(): Promise<Record<string, number>> {
    const resp = await adminRequest('get_content_stats');
    return resp.success ? (resp as any).counts : {};
  },
};

// ══════════════════════════════════════════════════════════════
//                    USER API (read content + user features)
// ══════════════════════════════════════════════════════════════

export const prepUserApi = {
  // ── Read content (cached) ──

  async listContent<T = Record<string, unknown>>(
    contentType: ContentType,
    filters: Record<string, string | number> = {},
  ): Promise<PaginatedResponse<T>> {
    if (!USE_API) return { success: false, items: [], total: 0, page: 1, totalPages: 1, limit: 50 };

    const cacheKey = `prep:${contentType}:${JSON.stringify(filters)}`;
    return cachedFetch(cacheKey, async () => {
      const resp = await userRequest('list_content', { contentType, ...filters });
      if (resp.success) return resp as unknown as PaginatedResponse<T>;
      throw new Error((resp.error as any)?.message || 'Failed to load content');
    }, CACHE_TTL);
  },

  async getContent<T = Record<string, unknown>>(contentType: ContentType, id: string): Promise<T | null> {
    if (!USE_API) return null;
    const resp = await userRequest('get_content', { contentType, id });
    return resp.success ? (resp as any).item as T : null;
  },

  async listContentWithProgress<T = Record<string, unknown>>(
    contentType: ContentType,
    filters: Record<string, string | number> = {},
  ): Promise<PaginatedResponse<T>> {
    const userId = getUserId();
    if (!USE_API || !userId) return { success: false, items: [], total: 0, page: 1, totalPages: 1, limit: 50 };

    const cacheKey = `prep:wp:${contentType}:${userId}:${JSON.stringify(filters)}`;
    return cachedFetch(cacheKey, async () => {
      const resp = await userRequest('list_with_progress', { userId, contentType, ...filters });
      if (resp.success) return resp as unknown as PaginatedResponse<T>;
      throw new Error((resp.error as any)?.message || 'Failed to load content');
    }, CACHE_TTL);
  },

  // ── Progress ──

  async getProgress(contentType?: ContentType): Promise<ProgressMap> {
    const userId = getUserId();
    if (!userId) return {};
    const resp = await userRequest('get_progress', { userId, contentType });
    return resp.success ? (resp as any).progress : {};
  },

  async toggleSolved(contentType: ContentType, itemId: string): Promise<{ value: boolean } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('toggle_solved', { userId, contentType, itemId });
    invalidateCache(`prep:wp:${contentType}`);
    return resp.success ? { value: (resp as any).value } : null;
  },

  async toggleBookmarked(contentType: ContentType, itemId: string): Promise<{ value: boolean } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('toggle_bookmarked', { userId, contentType, itemId });
    invalidateCache(`prep:wp:${contentType}`);
    return resp.success ? { value: (resp as any).value } : null;
  },

  async toggleFavorite(contentType: ContentType, itemId: string): Promise<{ value: boolean } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('toggle_favorite', { userId, contentType, itemId });
    invalidateCache(`prep:wp:${contentType}`);
    return resp.success ? { value: (resp as any).value } : null;
  },

  async toggleApplied(contentType: ContentType, itemId: string): Promise<{ value: boolean } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('toggle_applied', { userId, contentType, itemId });
    invalidateCache(`prep:wp:${contentType}`);
    return resp.success ? { value: (resp as any).value } : null;
  },

  // ── Collections ──

  async listCollections(): Promise<PrepCollection[]> {
    const userId = getUserId();
    if (!userId) return [];
    const resp = await userRequest('list_collections', { userId });
    return resp.success ? (resp as any).collections : [];
  },

  async createCollection(name: string, description = '', color = '#f97316'): Promise<PrepCollection | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('create_collection', { userId, name, description, color });
    return resp.success ? (resp as any).collection : null;
  },

  async updateCollection(collectionId: string, data: { name?: string; description?: string; color?: string }): Promise<boolean> {
    const userId = getUserId();
    if (!userId) return false;
    const resp = await userRequest('update_collection', { userId, collectionId, ...data });
    return resp.success === true;
  },

  async deleteCollection(collectionId: string): Promise<boolean> {
    const userId = getUserId();
    if (!userId) return false;
    const resp = await userRequest('delete_collection', { userId, collectionId });
    return resp.success === true;
  },

  async addToCollection(collectionId: string, contentType: ContentType, itemId: string): Promise<boolean> {
    const userId = getUserId();
    if (!userId) return false;
    const resp = await userRequest('add_to_collection', { userId, collectionId, contentType, itemId });
    return resp.success === true;
  },

  async removeFromCollection(collectionId: string, contentType: ContentType, itemId: string): Promise<boolean> {
    const userId = getUserId();
    if (!userId) return false;
    const resp = await userRequest('remove_from_collection', { userId, collectionId, contentType, itemId });
    return resp.success === true;
  },

  async getCollectionItems(collectionId: string) {
    const resp = await userRequest('get_collection_items', { collectionId });
    return resp.success ? (resp as any).items as { contentType: string; itemId: string; addedAt: string }[] : [];
  },

  // ── Activity & Stats ──

  async logActivity(activityAction: string, contentType: string, itemId: string, title = '', description = ''): Promise<void> {
    const userId = getUserId();
    if (!userId) return;
    await userRequest('log_activity', { userId, activityAction, contentType, itemId, title, description });
  },

  async getActivity(limit = 20): Promise<PrepActivity[]> {
    const userId = getUserId();
    if (!userId) return [];
    const resp = await userRequest('get_activity', { userId, limit });
    return resp.success ? (resp as any).activities : [];
  },

  async getStats(): Promise<PrepStats | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('get_stats', { userId });
    return resp.success ? (resp as any).stats : null;
  },

  async getDashboard(): Promise<DashboardData | null> {
    const userId = getUserId();
    if (!userId) return null;
    const cacheKey = `prep:dashboard:${userId}`;
    return cachedFetch(cacheKey, async () => {
      const resp = await userRequest('get_dashboard', { userId });
      if (resp.success) return resp as unknown as DashboardData;
      throw new Error('Failed to load dashboard');
    }, 60_000);
  },

  async updateStreak(): Promise<{ streak: number; longestStreak: number } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('update_streak', { userId });
    return resp.success ? { streak: (resp as any).streak, longestStreak: (resp as any).longestStreak } : null;
  },

  // ── Quiz ──

  async submitQuiz(quizId: string, answers: unknown[], timeTaken: number): Promise<QuizResult | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('submit_quiz', { userId, quizId, answers, timeTaken });
    if (!resp.success) return null;
    return {
      resultId: (resp as any).resultId,
      score: (resp as any).score,
      correctCount: (resp as any).correctCount,
      totalQuestions: (resp as any).totalQuestions,
      passed: (resp as any).passed,
      passingScore: (resp as any).passingScore,
    };
  },

  async getQuizHistory(quizId?: string): Promise<QuizHistoryItem[]> {
    const userId = getUserId();
    if (!userId) return [];
    const resp = await userRequest('get_quiz_history', { userId, quizId });
    return resp.success ? (resp as any).history : [];
  },

  // ── Notes ──

  async getNoteDownloadUrl(noteId: string): Promise<string | null> {
    const resp = await userRequest('get_note_download_url', { noteId });
    return resp.success ? (resp as any).downloadUrl : null;
  },

  // ── Roadmap step progress ──

  async toggleRoadmapStep(roadmapId: string, stepIndex: number): Promise<{ completed: boolean } | null> {
    const userId = getUserId();
    if (!userId) return null;
    const resp = await userRequest('update_roadmap_step', { userId, roadmapId, stepIndex });
    return resp.success ? { completed: (resp as any).completed } : null;
  },

  async getRoadmapProgress(roadmapId: string): Promise<Record<number, boolean>> {
    const userId = getUserId();
    if (!userId) return {};
    const resp = await userRequest('get_roadmap_progress', { userId, roadmapId });
    return resp.success ? (resp as any).steps : {};
  },
};
