import { prepUserApi, type ContentType } from '../services/preparationApi';
import type { Concept, ConceptGroup } from '../data/preparationTypes';

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function groupByCategory(concepts: Concept[]): ConceptGroup[] {
  const map = new Map<string, Concept[]>();
  for (const concept of concepts) {
    if (!map.has(concept.category)) map.set(concept.category, []);
    map.get(concept.category)!.push(concept);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    concepts: items,
  }));
}

export function distinctFieldValues(
  items: Record<string, unknown>[],
  field: string,
): string[] {
  const values = new Set<string>();
  for (const item of items) {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      values.add(value.trim());
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export async function fetchDistinctFieldValues(
  contentType: ContentType,
  field: string,
  limit = 500,
  filters: Record<string, string | number> = {},
): Promise<string[]> {
  try {
    const resp = await prepUserApi.listContent(contentType, { limit, ...filters });
    if (!resp.success) return [];
    return distinctFieldValues(
      (resp.items ?? []) as Record<string, unknown>[],
      field,
    );
  } catch {
    return [];
  }
}

export function countByDifficulty(
  items: Array<{ difficulty?: string }>,
): { total: number; easy: number; medium: number; hard: number } {
  let easy = 0;
  let medium = 0;
  let hard = 0;
  for (const item of items) {
    if (item.difficulty === 'Easy') easy += 1;
    else if (item.difficulty === 'Medium') medium += 1;
    else if (item.difficulty === 'Hard') hard += 1;
  }
  return { total: items.length, easy, medium, hard };
}

export async function fetchDifficultyStats(
  contentType: ContentType,
  limit = 500,
): Promise<{ total: number; easy: number; medium: number; hard: number }> {
  try {
    const resp = await prepUserApi.listContent(contentType, { limit });
    if (!resp.success) {
      return { total: 0, easy: 0, medium: 0, hard: 0 };
    }
    const counts = countByDifficulty(resp.items ?? []);
    return {
      total: resp.total ?? counts.total,
      easy: counts.easy,
      medium: counts.medium,
      hard: counts.hard,
    };
  } catch {
    return { total: 0, easy: 0, medium: 0, hard: 0 };
  }
}
