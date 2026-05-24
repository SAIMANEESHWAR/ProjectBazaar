/**
 * Clear all preparation content from the prep admin API.
 * Run: npx tsx scripts/clearPrepContent.ts
 *
 * Uses full_sync_content with an empty list — replaces each content type with nothing.
 */
import { PREP_ADMIN_ENDPOINT } from "./prepAdminConfig";

const CONTENT_TYPES = [
  "interview_questions",
  "dsa_problems",
  "quizzes",
  "cold_dm_templates",
  "mass_recruitment",
  "job_portals",
  "handwritten_notes",
  "roadmaps",
  "position_resources",
  "system_design",
  "fundamentals",
] as const;

async function adminRequest(
  action: string,
  body: Record<string, unknown> = {},
): Promise<{ success?: boolean; error?: { message?: string }; message?: string; counts?: Record<string, number> }> {
  const res = await fetch(PREP_ADMIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

async function clearContentType(contentType: string): Promise<boolean> {
  const resp = await adminRequest("full_sync_content", {
    contentType,
    items: [],
  });
  if (!resp.success) {
    console.error(`  ✗ ${contentType}:`, resp.error?.message || resp.message || resp);
    return false;
  }
  console.log(`  ✓ ${contentType} cleared`);
  return true;
}

async function main() {
  console.log("Clearing all prep content from API...\n");

  for (const contentType of CONTENT_TYPES) {
    await clearContentType(contentType);
  }

  const stats = await adminRequest("get_content_stats");
  if (stats.success && stats.counts) {
    console.log("\nRemaining counts:");
    for (const [type, count] of Object.entries(stats.counts)) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
