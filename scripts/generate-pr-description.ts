const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const REPO = process.env.GITHUB_REPOSITORY ?? "";
const PR_NUMBER = process.env.PR_NUMBER ?? "";
const PR_TITLE = process.env.PR_TITLE ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const MODEL = process.env.PR_DESCRIPTION_MODEL || "gpt-4o-mini";
const MAX_BODY_LENGTH = 20_000;

interface Commit {
  sha: string;
  commit: { message: string };
}

interface ChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

async function ghGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(basePath: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const chunk = await ghGet<T[]>(`${basePath}?per_page=100&page=${page}`);
    results.push(...chunk);
    if (chunk.length < 100) break;
    page++;
  }
  return results;
}

function inferRisks(files: ChangedFile[], commits: Commit[]): string[] {
  const risks: string[] = [];
  const filenames = files.map((f) => f.filename.toLowerCase());
  const subjects = commits.map((c) => c.commit.message.split("\n")[0].toLowerCase());

  if (filenames.some((f) => f.includes("schema")))
    risks.push("Zod schema changes — validate downstream parsers and type exports.");
  if (filenames.some((f) => f.includes("src/adapters/")))
    risks.push("Adapter layer changed — verify CSS framework output compatibility.");
  if (filenames.some((f) => f.includes("src/scanners/")))
    risks.push("Scanner changed — crawl/parse behavior may differ across target sites.");
  if (filenames.some((f) => f.includes("src/generators/")))
    risks.push("Generator changed — token output format or naming may have shifted.");
  if (filenames.some((f) => f.includes("mcp")))
    risks.push("MCP server/protocol touched — verify tool schemas and client compatibility.");
  if (filenames.some((f) => f.includes("webhook")))
    risks.push("Webhook handler changed — confirm payload shape and secret validation.");
  if (filenames.some((f) => f.includes("cron") || f.includes("schedule")))
    risks.push("Scheduler/cron logic changed — verify timing and idempotency.");
  if (filenames.some((f) => f.includes("middleware")))
    risks.push("Middleware changed — audit auth/security surface.");
  if (
    filenames.some((f) =>
      ["dockerfile", "docker-compose", "nginx"].some((kw) => f.includes(kw))
    )
  )
    risks.push("Infra config changed — redeploy and smoke-test the service.");
  if (subjects.some((s) => ["env", "secret", "config"].some((kw) => s.includes(kw))))
    risks.push("Commit references env/secret/config — confirm no credentials in diff.");

  return risks;
}

function inferTests(files: ChangedFile[], commits: Commit[]): string[] {
  const steps: string[] = [];
  const filenames = files.map((f) => f.filename.toLowerCase());
  const subjects = commits.map((c) => c.commit.message.split("\n")[0].toLowerCase());

  if (filenames.some((f) => f.includes(".test.")))
    steps.push("`npm run test` — test files changed.");
  if (subjects.some((s) => s.includes("typecheck") || s.includes("tsc")))
    steps.push("`npm run typecheck` — type correctness.");
  if (subjects.some((s) => s.includes("ci") || s.includes("workflow") || s.includes("action")))
    steps.push("Verify GitHub Actions run green.");
  if (filenames.some((f) => f.includes(".github/workflows")))
    steps.push("Dry-run affected workflow via `act` or a test PR.");
  if (subjects.some((s) => s.includes("test") || s.includes("spec")))
    steps.push("`npm run test` — commit references tests.");
  if (filenames.some((f) => f.includes("src/")))
    steps.push("`npm run build` — ensure compiled output is valid.");

  if (steps.length === 0)
    steps.push("`npm run typecheck` and `npm run test` as baseline.");

  return [...new Set(steps)];
}

function buildDeterministicBody(files: ChangedFile[], commits: Commit[]): string {
  const subjects = commits.map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n");

  const fileList = files
    .slice(0, 40)
    .map((f) => `- \`${f.filename}\` (${f.status}, +${f.additions}/-${f.deletions})`)
    .join("\n");
  const fileNote = files.length > 40 ? `\n_...and ${files.length - 40} more files._` : "";

  const risks = inferRisks(files, commits);
  const risksSection =
    risks.length > 0 ? risks.map((r) => `- ${r}`).join("\n") : "- No high-risk patterns detected.";

  const tests = inferTests(files, commits);
  const testsSection = tests.map((t) => `- [ ] ${t}`).join("\n");

  return `## What
<!-- Auto-generated from ${commits.length} commit(s) and ${files.length} changed file(s). Replace with a concise summary. -->
${PR_TITLE || "See commits below."}

## Why
<!-- Describe the problem or motivation. -->

## How
<!-- Implementation details. -->

## Tests
${testsSection}

## Risks
${risksSection}

## Changed Files
${fileList}${fileNote}

## Commits
${subjects}

---
_Auto-generated from commits and changed files. Overwritten on each push._`;
}

async function enhanceWithLLM(deterministicBody: string, files: ChangedFile[], commits: Commit[]): Promise<string> {
  const fileSummary = files.slice(0, 30).map((f) => f.filename).join(", ");
  const commitList = commits
    .slice(0, 30)
    .map((c) => c.commit.message.split("\n")[0])
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are a senior engineer writing GitHub PR descriptions for a TypeScript/Node.js design-system extraction CLI and MCP server. 
The tool scrapes public websites to extract design tokens (colors, typography, spacing) and exports them as CSS custom properties, JSON, or Tailwind configs.
Fill in the What/Why/How sections with concise, specific content. Keep Tests and Risks as-is unless you can improve them. 
Return only the markdown body — no preamble, no code fences.`,
        },
        {
          role: "user",
          content: `PR title: ${PR_TITLE}

Commits:
${commitList}

Changed files: ${fileSummary}

Draft description to improve:
${deterministicBody}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API → ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? deterministicBody;
}

async function updatePRBody(body: string): Promise<void> {
  const truncated =
    body.length > MAX_BODY_LENGTH
      ? body.slice(0, MAX_BODY_LENGTH) + "\n\n_[truncated due to length]_"
      : body;

  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: truncated }),
  });

  if (res.status === 403 || res.status === 422) {
    console.warn(`⚠️  Cannot update PR description (status ${res.status}) — likely a fork PR. Skipping.`);
    return;
  }
  if (!res.ok) throw new Error(`PATCH pulls/${PR_NUMBER} → ${res.status}`);
  console.log("✅ PR description updated.");
}

async function main() {
  if (!GITHUB_TOKEN || !REPO || !PR_NUMBER) {
    console.error("Missing required env: GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER");
    process.exit(1);
  }

  console.log(`Fetching data for PR #${PR_NUMBER} in ${REPO}…`);

  const [commits, files] = await Promise.all([
    fetchAllPages<Commit>(`/pulls/${PR_NUMBER}/commits`),
    fetchAllPages<ChangedFile>(`/pulls/${PR_NUMBER}/files`),
  ]);

  console.log(`  ${commits.length} commits, ${files.length} changed files`);

  let body = buildDeterministicBody(files, commits);

  if (OPENAI_API_KEY) {
    console.log(`Enhancing with ${MODEL}…`);
    try {
      body = await enhanceWithLLM(body, files, commits);
    } catch (err) {
      console.warn(`⚠️  LLM enhancement failed (${(err as Error).message}), using deterministic output.`);
    }
  } else {
    console.log("OPENAI_API_KEY not set — using deterministic output.");
  }

  await updatePRBody(body);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
