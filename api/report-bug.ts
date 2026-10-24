// Vercel Function: files an in-app bug report as a GitHub issue.
//
// Needs one environment variable on the Vercel project:
//   GITHUB_ISSUES_TOKEN  fine-grained token with "Issues: Read and write" on
//                        the repository below, and nothing else.
// Without it the endpoint answers 503 and the client falls back to a
// prefilled GitHub "new issue" page.

declare const process: { env: Record<string, string | undefined> };

const REPO = process.env.GITHUB_REPO ?? 'Hasdro/tdcs-visualizer';
const MAX_TITLE = 120;
const MAX_TEXT = 4000;

// Best-effort per-instance throttle: 5 reports per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const recent = new Map<string, number[]>();

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Neutralise @mentions so a report cannot ping people.
const defuse = (text: string) => text.replace(/@(?=[\w-])/g, '@​');

export async function POST(request: Request): Promise<Response> {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) return json(503, { error: 'Direct reporting is not configured yet.' });

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  // Honeypot filled in: silently pretend success without filing anything.
  if (clean(payload.website, 200)) return json(200, { issueUrl: `https://github.com/${REPO}/issues` });

  const title = clean(payload.title, MAX_TITLE);
  const description = clean(payload.description, MAX_TEXT);
  const steps = clean(payload.steps, MAX_TEXT);
  if (!title || !description) return json(400, { error: 'A title and a description are required.' });

  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) return json(429, { error: 'Too many reports from this connection; please try again later.' });
  recent.set(ip, [...hits, now]);

  const context = (payload.context ?? {}) as Record<string, unknown>;
  const body = defuse(
    [
      '### What happened',
      description,
      '',
      '### Steps to reproduce',
      steps || '_Not provided_',
      '',
      '### Context',
      `- Page: ${clean(context.url, 500)}`,
      `- Browser: ${clean(context.userAgent, 300)}`,
      `- Viewport: ${clean(context.viewport, 50)}`,
      `- Reported: ${clean(context.reportedAt, 40)}`,
      '',
      '_Submitted from the in-app bug reporter._'
    ].join('\n')
  );

  const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'tdcs-visualizer-bug-reporter'
    },
    body: JSON.stringify({ title: `[User report] ${defuse(title)}`, body, labels: ['bug', 'user-report'] })
  });

  if (!response.ok) return json(502, { error: 'GitHub did not accept the report.' });
  const issue = (await response.json()) as { html_url?: string };
  return json(201, { issueUrl: issue.html_url });
}
