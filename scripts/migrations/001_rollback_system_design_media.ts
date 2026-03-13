/**
 * Rollback 001 — Restore embedded-sentinel format for PrepSystemDesign
 *
 * This reverses migration 001. It:
 *   - Re-embeds `diagramData` back into the `content` field as a sentinel string
 *   - Removes the top-level `diagramData` and `additionalImageUrls` attributes
 *
 * Usage:
 *   DRY RUN:  npx tsx scripts/migrations/001_rollback_system_design_media.ts
 *   APPLY:    npx tsx scripts/migrations/001_rollback_system_design_media.ts --apply
 *
 * WARNING: This is a destructive operation. Run only if you need to revert
 *          the migration completely (e.g. to redeploy the old Lambda code).
 *          Any `additionalImageUrls` values will be lost.
 */

const PREP_ADMIN_ENDPOINT =
  process.env.VITE_PREP_ADMIN_ENDPOINT ??
  "https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler";

const APPLY = process.argv.includes("--apply");

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

async function run() {
  console.log(`\n=== Rollback 001: Restore embedded sentinel format ===`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  const items: Record<string, unknown>[] = [];
  for (const designType of ["hld", "lld"] as const) {
    const resp = (await adminPost({
      action: "list_content",
      contentType: "system_design",
      designType,
      limit: 500,
    })) as { success: boolean; items?: Record<string, unknown>[] };
    if (resp.success && Array.isArray(resp.items)) items.push(...resp.items);
  }

  console.log(`Fetched ${items.length} rows\n`);

  let count = 0;
  for (const item of items) {
    if (!("diagramData" in item)) continue;

    const diagramData = item["diagramData"];
    let content = (item["content"] as string) ?? "";
    if (diagramData) {
      content += `\n\n__DIAGRAM_DATA_START__${JSON.stringify(diagramData)}__DIAGRAM_DATA_END__`;
    }

    const rolled: Record<string, unknown> = { ...item, content };
    delete rolled["diagramData"];
    delete rolled["additionalImageUrls"];

    console.log(
      `  [${APPLY ? "WILL WRITE" : "plan"}] ${item["id"]} — re-embedding diagramData into content`,
    );
    count++;

    if (APPLY) {
      await adminPost({
        action: "put_content_single",
        contentType: "system_design",
        item: rolled,
      });
    }
  }

  console.log(
    `\nDone: ${count} rows ${APPLY ? "rolled back" : "would be rolled back"}`,
  );
  if (!APPLY) console.log("Pass --apply to commit.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
