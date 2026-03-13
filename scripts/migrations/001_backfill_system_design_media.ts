/**
 * Migration 001 — Backfill PrepSystemDesign media fields
 *
 * Purpose:
 *   The original seed embedded `diagramData` JSON inside the `content` field
 *   using the sentinel pattern `__DIAGRAM_DATA_START__...__DIAGRAM_DATA_END__`.
 *   This migration promotes `diagramData` to a first-class DynamoDB attribute
 *   and adds `additionalImageUrls` (initially empty) to every existing row.
 *
 * Run:
 *   npx tsx scripts/migrations/001_backfill_system_design_media.ts
 *
 * Rollback:
 *   Run 001_rollback_system_design_media.ts to strip the new fields and
 *   restore the embedded-sentinel format in `content`.
 *
 * Safety:
 *   - Idempotent: rows that already have a top-level `diagramData` key are
 *     skipped (unless --force is passed).
 *   - Dry-run mode (default): prints planned changes; no writes occur.
 *   - Pass --apply to commit changes to DynamoDB.
 *
 * Usage:
 *   DRY RUN:  npx tsx scripts/migrations/001_backfill_system_design_media.ts
 *   APPLY:    npx tsx scripts/migrations/001_backfill_system_design_media.ts --apply
 *   FORCE:    npx tsx scripts/migrations/001_backfill_system_design_media.ts --apply --force
 */

import { ALL_DIAGRAM_DATA } from "../../data/systemDesignDiagrams";

const PREP_ADMIN_ENDPOINT =
  process.env.VITE_PREP_ADMIN_ENDPOINT ??
  "https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

const EMBEDDED_REGEX = /__DIAGRAM_DATA_START__([\s\S]*?)__DIAGRAM_DATA_END__/;

// id prefixes: hld-* rows use hld-1..hld-30, lld-* rows use lld-1..lld-21
// ALL_DIAGRAM_DATA keys follow the same pattern.

async function adminPost(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(PREP_ADMIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function fetchAllSystemDesign(): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  for (const designType of ["hld", "lld"] as const) {
    const resp = (await adminPost({
      action: "list_content",
      contentType: "system_design",
      designType,
      limit: 500,
    })) as { success: boolean; items?: Record<string, unknown>[] };
    if (resp.success && Array.isArray(resp.items)) {
      items.push(...resp.items);
    }
  }
  return items;
}

function extractEmbeddedDiagramData(
  content: string,
): { diagramData: unknown; cleanContent: string } | null {
  const match = content.match(EMBEDDED_REGEX);
  if (!match) return null;
  try {
    const diagramData = JSON.parse(match[1]);
    const cleanContent = content.replace(EMBEDDED_REGEX, "").trim();
    return { diagramData, cleanContent };
  } catch {
    console.warn("  [warn] Failed to parse embedded diagram JSON in content");
    return null;
  }
}

async function run() {
  console.log(
    `\n=== Migration 001: Backfill PrepSystemDesign media fields ===`,
  );
  console.log(
    `Mode: ${APPLY ? "APPLY" : "DRY RUN"}${FORCE ? " (force)" : ""}\n`,
  );

  const allItems = await fetchAllSystemDesign();
  console.log(`Fetched ${allItems.length} system_design rows\n`);

  let skipped = 0;
  let toMigrate: Record<string, unknown>[] = [];

  for (const item of allItems) {
    const id = item["id"] as string;
    const alreadyHasField = "diagramData" in item;

    if (alreadyHasField && !FORCE) {
      skipped++;
      continue;
    }

    const content = (item["content"] as string) ?? "";

    // Try embedded sentinel first
    const extracted = extractEmbeddedDiagramData(content);
    // Then fall back to ALL_DIAGRAM_DATA keyed by item id
    const fallbackDiagramData = ALL_DIAGRAM_DATA[id] ?? null;
    const diagramData = extracted?.diagramData ?? fallbackDiagramData ?? null;
    const cleanContent = extracted?.cleanContent ?? content;

    const updated: Record<string, unknown> = {
      ...item,
      content: cleanContent,
      additionalImageUrls: (item["additionalImageUrls"] as string[]) ?? [],
    };
    if (diagramData !== null) {
      updated["diagramData"] = diagramData;
    }

    toMigrate.push(updated);

    const diagramSrc = extracted
      ? "embedded sentinel"
      : fallbackDiagramData
        ? "ALL_DIAGRAM_DATA"
        : "none";
    console.log(
      `  [${APPLY ? "WILL WRITE" : "plan"}] ${id} — diagramData from: ${diagramSrc}`,
    );
  }

  console.log(
    `\nSummary: ${toMigrate.length} to migrate, ${skipped} already migrated (skipped)\n`,
  );

  if (!APPLY) {
    console.log("DRY RUN complete. Pass --apply to commit changes.");
    return;
  }

  let written = 0;
  let failed = 0;
  for (const item of toMigrate) {
    const resp = (await adminPost({
      action: "put_content_single",
      contentType: "system_design",
      item,
    })) as { success: boolean; message?: string };
    if (resp.success) {
      written++;
      process.stdout.write(".");
    } else {
      failed++;
      console.error(
        `\n  [error] Failed to write ${item["id"]}: ${resp.message}`,
      );
    }
  }

  console.log(`\n\nDone: ${written} written, ${failed} failed`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
