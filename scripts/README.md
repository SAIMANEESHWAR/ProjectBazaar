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

## System design media migration

System design records now store media in explicit fields instead of embedding diagram JSON inside `content`.

- `diagramData`: structured interactive diagram payload
- `diagramUrl`: URL fallback for static diagrams
- `additionalImageUrls`: array of uploaded supporting images

### Backfill existing `PrepSystemDesign` rows

Dry run:

```bash
npx tsx scripts/migrations/001_backfill_system_design_media.ts
```

Apply changes:

```bash
npx tsx scripts/migrations/001_backfill_system_design_media.ts --apply
```

Force re-write already migrated rows:

```bash
npx tsx scripts/migrations/001_backfill_system_design_media.ts --apply --force
```

### Roll back the migration

```bash
npx tsx scripts/migrations/001_rollback_system_design_media.ts --apply
```

The rollback re-embeds `diagramData` into the legacy `content` sentinel format and removes explicit media fields.

### Seed behavior

`scripts/uploadPrepSeed.ts` now writes `diagramData` and `additionalImageUrls` as first-class fields. New system design seed uploads no longer embed diagram JSON inside the solution content.
