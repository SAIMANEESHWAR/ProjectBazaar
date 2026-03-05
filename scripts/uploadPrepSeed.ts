/**
 * Upload seed preparation content (interview questions + DSA problems) to prep admin API.
 * Run: npx tsx scripts/uploadPrepSeed.ts
 * Or: npm run seed:prep
 *
 * Set VITE_PREP_ADMIN_ENDPOINT or uses default.
 */
import { interviewQuestionsSeed, dsaProblemsSeed } from '../data/seedPrepCompetitive';

const PREP_ADMIN_ENDPOINT =
  process.env.VITE_PREP_ADMIN_ENDPOINT ??
  'https://rsesb93sz6.execute-api.ap-south-2.amazonaws.com/default/prep_admin_handler';

const BATCH_SIZE = 25;

async function putContent(contentType: string, items: Record<string, unknown>[]): Promise<boolean> {
  const res = await fetch(PREP_ADMIN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'put_content', contentType, items }),
  });
  const data = await res.json();
  if (!res.ok || !(data as { success?: boolean }).success) {
    console.error(contentType, (data as { message?: string }).message || data);
    return false;
  }
  return true;
}

async function uploadInBatches(contentType: string, items: Record<string, unknown>[], label: string) {
  let uploaded = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const ok = await putContent(contentType, batch);
    if (ok) {
      uploaded += batch.length;
      console.log(`${label}: ${uploaded}/${items.length}`);
    } else {
      console.error(`${label}: batch failed at offset ${i}`);
      break;
    }
  }
  return uploaded;
}

async function main() {
  console.log('Prep Admin endpoint:', PREP_ADMIN_ENDPOINT);
  console.log('Uploading interview questions...');
  const iqTotal = await uploadInBatches(
    'interview_questions',
    interviewQuestionsSeed as Record<string, unknown>[],
    'Interview questions'
  );
  console.log('Uploading DSA problems...');
  const dsaTotal = await uploadInBatches(
    'dsa_problems',
    dsaProblemsSeed as Record<string, unknown>[],
    'DSA problems'
  );
  console.log('Done. Interview questions:', iqTotal, '| DSA problems:', dsaTotal);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
