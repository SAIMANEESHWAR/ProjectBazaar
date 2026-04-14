/**
 * Upload seed preparation content to prep admin API.
 * Run: npx tsx scripts/uploadPrepSeed.ts
 * Or: npm run seed:prep
 *
 * Uploads: interview questions, DSA problems, system design, mass recruitment, position resources
 */
import {
  interviewQuestionsSeed,
  dsaProblemsSeed,
} from "../data/seedPrepCompetitive";
import { fullAptitudeSeed } from "../data/seedAptitude";
import { hldQuestions, lldQuestions } from "../data/systemDesignData";
import { companies } from "../data/massRecruitmentData";
import { roles } from "../data/positionResourcesData";

const PREP_ADMIN_ENDPOINT =
  process.env.VITE_PREP_ADMIN_ENDPOINT ??
  "https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler";

const BATCH_SIZE = 25;

async function putContent(
  contentType: string,
  items: Record<string, unknown>[],
): Promise<boolean> {
  const res = await fetch(PREP_ADMIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "put_content", contentType, items }),
  });
  const data = await res.json();
  if (!res.ok || !(data as { success?: boolean }).success) {
    console.error(contentType, (data as { message?: string }).message || data);
    return false;
  }
  return true;
}

async function uploadInBatches(
  contentType: string,
  items: Record<string, unknown>[],
  label: string,
) {
  let uploaded = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ok = await putContent(contentType, batch);
    if (ok) {
      uploaded += batch.length;
      console.log(`  ${label}: ${uploaded}/${items.length}`);
    } else {
      console.error(`  ${label}: batch failed at offset ${i}`);
      break;
    }
  }
  return uploaded;
}

function flattenSystemDesign(): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];
  for (const q of hldQuestions) {
    const { isSolved, isRevision, ...rest } = q;
    // Write diagramData as a first-class field instead of embedding in content
    const item: Record<string, unknown> = {
      ...rest,
      designType: "hld",
      content: q.content ?? "",
      diagramUrl: q.diagramUrl ?? "",
      section: q.section,
      topics: q.topics ?? [],
      additionalImageUrls: [],
    };
    if (q.diagramData) {
      item["diagramData"] = q.diagramData;
    }
    items.push(item);
  }
  for (const q of lldQuestions) {
    const { isSolved, isRevision, ...rest } = q;
    const item: Record<string, unknown> = {
      ...rest,
      designType: "lld",
      content: q.content ?? "",
      diagramUrl: q.diagramUrl ?? "",
      section: q.section,
      topics: q.topics ?? [],
      additionalImageUrls: [],
    };
    if (q.diagramData) {
      item["diagramData"] = q.diagramData;
    }
    items.push(item);
  }
  return items;
}

function flattenMassRecruitment(): Record<string, unknown>[] {
  const subTypes = ["interview", "dsa", "aptitude", "sql", "corecs"] as const;
  const fieldMap: Record<string, string> = {
    interview: "interviewQuestions",
    dsa: "dsaQuestions",
    aptitude: "aptitudeQuestions",
    sql: "sqlQuestions",
    corecs: "coreCSQuestions",
  };
  const items: Record<string, unknown>[] = [];
  for (const company of companies) {
    for (const st of subTypes) {
      const questions = (company as unknown as Record<string, unknown>)[
        fieldMap[st]
      ] as Record<string, unknown>[];
      if (!questions) continue;
      for (const q of questions) {
        items.push({
          ...(q as object),
          companyId: company.id,
          companyName: company.name,
          subType: st,
          isSolved: undefined,
          isRevision: undefined,
        });
      }
    }
  }
  return items;
}

function flattenPositionResources(): Record<string, unknown>[] {
  const subTypes = ["interview", "dsa", "aptitude", "sql", "corecs"] as const;
  const fieldMap: Record<string, string> = {
    interview: "interviewQuestions",
    dsa: "dsaQuestions",
    aptitude: "aptitudeQuestions",
    sql: "sqlQuestions",
    corecs: "coreCSQuestions",
  };
  const items: Record<string, unknown>[] = [];
  for (const role of roles) {
    for (const st of subTypes) {
      const questions = (role as unknown as Record<string, unknown>)[
        fieldMap[st]
      ] as Record<string, unknown>[];
      if (!questions) continue;
      for (const q of questions) {
        items.push({
          ...(q as object),
          roleId: role.id,
          roleLabel: role.label,
          subType: st,
          isSolved: undefined,
          isRevision: undefined,
        });
      }
    }
  }
  return items;
}

async function main() {
  console.log("Prep Admin endpoint:", PREP_ADMIN_ENDPOINT);
  const results: Record<string, number> = {};

  console.log("\n[1/5] Interview Questions...");
  results.interview_questions = await uploadInBatches(
    "interview_questions",
    interviewQuestionsSeed as Record<string, unknown>[],
    "Interview questions",
  );

  console.log("\n[2/5] DSA Problems...");
  results.dsa_problems = await uploadInBatches(
    "dsa_problems",
    dsaProblemsSeed as Record<string, unknown>[],
    "DSA problems",
  );

  console.log("\n[3/5] System Design...");
  const sdItems = flattenSystemDesign();
  results.system_design = await uploadInBatches(
    "system_design",
    sdItems,
    "System Design",
  );

  console.log("\n[4/5] Mass Recruitment...");
  const mrItems = flattenMassRecruitment();
  results.mass_recruitment = await uploadInBatches(
    "mass_recruitment",
    mrItems,
    "Mass Recruitment",
  );

  console.log("\n[5/6] Position Resources...");
  const prItems = flattenPositionResources();
  results.position_resources = await uploadInBatches(
    "position_resources",
    prItems,
    "Position Resources",
  );

  console.log("\n[6/6] Aptitude Quizzes...");
  results.quizzes = await uploadInBatches(
    "quizzes",
    fullAptitudeSeed as unknown as Record<string, unknown>[],
    "Quizzes",
  );

  console.log("\n=== Upload Complete ===");
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v} items`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
