/**
 * Node 18+ — verify Peer_to_peer_Interview Lambda + DynamoDB.
 *
 * Usage:
 *   node scripts/test-peer-interview-api.mjs [userId]
 *
 * Example:
 *   node scripts/test-peer-interview-api.mjs my-cognito-sub-123
 */

const URL =
  process.env.PEER_INTERVIEW_API_URL ||
  'https://3moxuvhor9.execute-api.ap-south-2.amazonaws.com/default/Peer_to_peer_Interview';

const userId = process.argv[2] || 'test-peer-api-user';

async function post(body) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ ...body, userId }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function main() {
  console.log('URL:', URL);
  console.log('userId:', userId);
  console.log('');

  const list1 = await post({ action: 'LIST_MY_LISTINGS' });
  console.log('1) LIST_MY_LISTINGS → HTTP', list1.status, JSON.stringify(list1.json, null, 2));

  const create = await post({
    action: 'CREATE_LISTING',
    listingId: `script-test-${Date.now()}`,
    displayName: 'API test listing',
    practiceGoal: 'FAANG-style DSA — medium/hard mix · 2 problems per session',
    category: 'dsa',
    skills: 'Python, trees, graphs, DP; want strict timeboxing and debrief after each problem.',
    experienceLevel: 'fresher',
    timezoneRegion: 'ist',
    practiceMode: 'peers',
    roleTitle: 'Final-year CS · placement prep',
    orgOrContext: 'India / IST',
    availabilityWindows: [
      'Tue or Thu · 7:00–9:00 PM IST (Google Meet)',
      'Sat · 10:00 AM–1:00 PM IST',
      'Sun · 4:00–7:00 PM IST',
    ],
    queueIntent: 'Two sessions per week through interview season; happy to reciprocate on your track.',
    bio: 'ICPC-style practice; prefer video on, shared CoderPad or similar.',
    techTags: ['python', 'sql'],
    isPublic: true,
  });
  console.log('');
  console.log('2) CREATE_LISTING → HTTP', create.status, JSON.stringify(create.json, null, 2));

  const list2 = await post({ action: 'LIST_MY_LISTINGS' });
  console.log('');
  console.log('3) LIST_MY_LISTINGS (after create) → HTTP', list2.status);
  const data = list2.json?.data;
  console.log('   count:', Array.isArray(data) ? data.length : 'n/a');

  if (create.status >= 400 || list1.json?.error?.includes?.('ResourceNotFound')) {
    console.log('');
    console.log(
      'If you see ResourceNotFound: create table PeerInterview in ap-south-2 with pk (String) + sk (String),',
    );
    console.log('and set Lambda environment variable PEER_INTERVIEW_TABLE=PeerInterview.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
