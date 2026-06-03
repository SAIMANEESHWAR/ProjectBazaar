import {
  mapCoreSubjectCategoryFromApi,
  slugifyCoreSubject,
  type CoreSubject,
} from "../../../data/coreSubjectsConfig";
import { type AdminSDItem } from "../system-design/types";

export type { CoreSubject };

export interface AdminCoreSubjectItem extends AdminSDItem {
  subject: string;
}

export function mapCoreSubjectFromApi(
  raw: Record<string, unknown>,
  categories: CoreSubject[] = [],
): AdminCoreSubjectItem {
  const subject = slugifyCoreSubject(String(raw.subject ?? ""));
  const meta = categories.find((entry) => entry.subject === subject);
  const difficultyRaw = raw.difficulty;
  const difficulty =
    difficultyRaw === "Easy" || difficultyRaw === "Medium" || difficultyRaw === "Hard"
      ? difficultyRaw
      : "Medium";

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    section: String(raw.section ?? meta?.title ?? subject),
    difficulty,
    designType: "lld",
    contentKind: "concept",
    topics: Array.isArray(raw.topics)
      ? raw.topics.map((topic) => String(topic).trim()).filter(Boolean)
      : [],
    content: String(raw.content ?? ""),
    diagramUrl: "",
    additionalImageUrls: [],
    thumbnailUrl: String(raw.thumbnailUrl ?? ""),
    displayOrder: Number(raw.displayOrder) || 0,
    subject,
  };
}

export function mapCoreSubjectToApi(
  item: Omit<AdminCoreSubjectItem, "createdAt" | "updatedAt" | "id"> & { id?: string },
): Record<string, unknown> {
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    description: item.description,
    subject: slugifyCoreSubject(item.subject),
    section: item.section,
    difficulty: item.difficulty,
    topics: item.topics ?? [],
    content: item.content,
    thumbnailUrl: item.thumbnailUrl ?? "",
    displayOrder: item.displayOrder ?? 0,
    contentKind: "concept",
  };
}

export function mapCoreSubjectCategoryToApi(
  item: Omit<CoreSubject, "id"> & { id?: string },
): Record<string, unknown> {
  const slug = slugifyCoreSubject(item.subject || item.title);
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title.trim(),
    description: item.description.trim(),
    subject: slug,
    slug,
    contentKind: "category",
    thumbnailUrl: item.thumbnailUrl ?? "",
    displayOrder: item.displayOrder ?? 0,
  };
}

export function getCoreSubjectTitle(slug: string, categories: CoreSubject[]): string {
  return categories.find((entry) => entry.subject === slug)?.title ?? slug;
}

export { mapCoreSubjectCategoryFromApi, slugifyCoreSubject };
