# Scripts

## Seed preparation content (competitive Q&A + DSA)

Pushes **100+ interview questions** (with answers and hints) and **100+ DSA problems** (with solution links) to the Prep Admin API. Covers all categories and difficulty levels (Easy, Medium, Hard).

**Prerequisites:** Prep Admin Lambda and DynamoDB tables must be set up.

**Run:**

```bash
npm run seed:prep
```

Optional: set `VITE_PREP_ADMIN_ENDPOINT` to your prep admin API URL.

- **Source data:** `data/seedPrepCompetitive.ts` (interview questions + DSA problems).
- **Upload:** `scripts/uploadPrepSeed.ts` (batches of 25 via `put_content`).
