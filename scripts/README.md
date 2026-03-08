# Scripts

## Seed preparation content

Pushes preparation content to the Prep Admin API:

- **Interview questions** (100+) – with answers and hints; all categories and difficulties.
- **DSA problems** (100+) – with solution links.
- **System design** – HLD & LLD questions.
- **Mass recruitment** – company-wise interview/DSA/aptitude/SQL/Core CS questions.
- **Position resources** – role-wise questions (Backend, Frontend, Data Science, System Design, DevOps, Mobile, Cybersecurity, and more). Each role has Interview, DSA, Aptitude, SQL, and Core CS questions.

**Prerequisites:** Prep Admin Lambda and DynamoDB tables must be set up.

**Run:**

```bash
npm run seed:prep
```

Optional: set `VITE_PREP_ADMIN_ENDPOINT` to your prep admin API URL.

- **Sources:** `data/seedPrepCompetitive.ts`, `data/positionResourcesData.ts`, `data/systemDesignData.ts`, `data/massRecruitmentData.ts`.
- **Upload:** `scripts/uploadPrepSeed.ts` (batches of 25 via `put_content`).
