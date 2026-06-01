# Contributing to CodeXCareer

Thank you for helping improve [CodeXCareer](https://codexcareer.com). This guide covers how we use Git, GitHub, and local development before you open a pull request.

For product overview, architecture, and setup, see the [README](README.md).

---

## Branching strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — deploys to [codexcareer.com](https://codexcareer.com) via Vercel |
| `develop` | Optional integration / staging (if used) |
| `feature/*`, `fix/*`, `docs/*` | Short-lived work branches |

**Workflow:**

1. Create a branch from `main` (or `develop` if your team uses it).
2. Make focused commits.
3. Open a **pull request** into `main`.
4. Wait for **CI** (`Build and test`) to pass.
5. Merge after review (if required).

**Branch naming examples:**

- `feature/prep-topic-quizzes`
- `fix/razorpay-checkout-csp`
- `docs/readme-architecture`

---

## Local development

```bash
git clone https://github.com/SAIMANEESHWAR/ProjectBazaar.git
cd ProjectBazaar
npm install
cp .env.example .env.local   # edit as needed
npm run dev
```

See [README — Getting started](README.md#getting-started) for environment variables (login API, subscription API, Judge0, Sanity, etc.).

**Razorpay keys** belong on AWS Lambda only — never commit secrets to the repo.

---

## Before you open a PR

Run these locally (same checks as CI):

```bash
npm run test:run
npm run build
```

CI also runs on every pull request via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### Pull request checklist

- Use the [PR template](.github/pull_request_template.md).
- Keep changes focused; prefer smaller PRs.
- No `.env`, API keys, or credentials in commits.
- UI changes: add screenshots or a short screen recording when helpful.
- **Lambda / AWS changes:** deploy handlers separately in AWS; document env var or table changes in the PR. See [lambda/SUBSCRIPTION_SETUP.md](lambda/SUBSCRIPTION_SETUP.md) for subscriptions.

### Commit messages (recommended)

We recommend [Conventional Commits](https://www.conventionalcommits.org/) for clarity:

- `feat: add prep core subjects filter`
- `fix: sidebar premium tooltip clipping`
- `docs: update architecture diagrams`

This is not enforced by tooling yet.

---

## Continuous integration

On every push to `main` / `develop` and on every pull request, GitHub Actions runs:

1. `npm ci`
2. `npm run test:run`
3. `npm run build`

Job name for branch protection: **Build and test**.

---

## GitHub repository settings (maintainers)

After CI is enabled on the repo, configure **branch protection** for `main`:

1. Go to **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: `main`.
3. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass** — select **Build and test**
   - **Do not allow bypassing** (optional; admins may bypass if needed)
4. Disable force-push to `main` (recommended).

Also verify:

- **Settings → Actions** — Actions are allowed for the repository.
- **Vercel** — Production branch is `main`; enable preview deployments for PRs if desired.

Optional: create a `develop` branch for staging and add the same protection with relaxed rules.

---

## Dependency updates

[Dependabot](.github/dependabot.yml) opens weekly PRs for npm and GitHub Actions updates. Review and merge when CI passes.

---

## Code of conduct

Be respectful and constructive in issues and reviews. Report serious conduct concerns to the maintainers via GitHub or project contact channels.

---

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) as the project.
