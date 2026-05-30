/** Shared types for Core Subjects (data loaded from Lambda, not static). */

export interface CoreSubject {
  id: string;
  title: string;
  description: string;
  /** URL-safe slug; matches `subject` on concept items. */
  subject: string;
  thumbnailUrl?: string;
  displayOrder?: number;
}

export function slugifyCoreSubject(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "subject";
}

export function mapCoreSubjectCategoryFromApi(raw: Record<string, unknown>): CoreSubject {
  const slug = slugifyCoreSubject(String(raw.slug ?? raw.subject ?? raw.title ?? ""));
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    subject: slug,
    thumbnailUrl: String(raw.thumbnailUrl ?? "") || undefined,
    displayOrder: Number(raw.displayOrder) || 0,
  };
}
