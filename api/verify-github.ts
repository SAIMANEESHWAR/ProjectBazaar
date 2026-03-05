/**
 * Serverless proxy for GitHub repo verification (Vercel).
 * GET /api/verify-github?owner=USER&repo=REPO
 * Returns 200 with { ok: true, private: false } if public repo exists,
 * or 200 with { ok: false, error: string } on failure.
 */
export default async function handler(
  req: { method?: string; query?: Record<string, string | string[] | undefined> },
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (body: object) => void }; json: (body: object) => void }
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const owner = typeof req.query?.owner === 'string' ? req.query.owner.trim() : '';
  const repo = typeof req.query?.repo === 'string' ? req.query.repo.replace(/\.git$/, '') : '';

  if (!owner || !repo) {
    return res.status(400).json({ ok: false, error: 'Missing owner or repo query parameter' });
  }

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (ghRes.status === 200) {
      const data = (await ghRes.json()) as { private?: boolean };
      if (data.private === false) {
        return res.status(200).json({ ok: true, private: false });
      }
      return res.status(200).json({ ok: false, error: 'Repository is private. Please use a public repository URL.' });
    }

    if (ghRes.status === 404) {
      return res.status(200).json({ ok: false, error: 'Repository not found. Please check the URL and try again.' });
    }

    const text = await ghRes.text();
    console.error('GitHub API error', ghRes.status, text);
    return res.status(200).json({ ok: false, error: 'Unable to verify repository. Please try again later.' });
  } catch (err) {
    console.error('Verify GitHub error', err);
    return res.status(200).json({ ok: false, error: 'Unable to verify repository. Please check your connection and try again.' });
  }
}
