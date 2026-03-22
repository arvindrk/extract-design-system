# extract-design-system

`extract-design-system` is a GitHub-hosted agent skill plus an npm CLI for extracting design primitives from public websites and generating starter token files for a local project.

## Two Ways To Use It

### Install The Skill

Use the GitHub-hosted skill when you want your coding agent to know the workflow and safety boundaries:

```bash
npx skills add arvindrk/extract-design-system --skill extract-design-system
```

This is the install path that `skills.sh` discovers and ranks.

### Run The CLI Directly

Use the npm package when you want to execute the extraction and token-generation commands yourself:

```bash
npx extract-design-system --help
```

Many users will use both: install the skill for the agent, then let the skill invoke the CLI.

## Recommended Workflow

```bash
npx skills add arvindrk/extract-design-system --skill extract-design-system
npx playwright install chromium
npx extract-design-system extract https://example.com
npx extract-design-system init
```

What each step does:
- installs the agent skill from GitHub
- installs the Playwright browser dependency used by extraction
- extracts design primitives from the target website
- generates starter token files in the current project

## What V1 Does

- provides a public agent skill that teaches when and how to run the workflow safely
- wraps `dembrandt` for website extraction
- saves raw extraction output to `.extract-design-system/raw.json`
- normalizes extracted design data into `.extract-design-system/normalized.json`
- generates `design-system/tokens.json`
- generates `design-system/tokens.css`

## What V1 Does Not Do

- patch your framework config
- generate components
- crawl multiple pages
- overwrite an existing design system automatically

## Generated Outputs

- `.extract-design-system/raw.json`: raw extractor output for debugging and future compatibility
- `.extract-design-system/normalized.json`: stable normalized representation used by the CLI
- `design-system/tokens.json`: project-local JSON copy of the normalized design system
- `design-system/tokens.css`: starter CSS variables file for immediate integration

## How It Works

- the GitHub repo exposes `skills/extract-design-system/SKILL.md` for agent installation through the `skills` ecosystem
- the npm package exposes the `extract-design-system` CLI
- the CLI wraps `dembrandt`, normalizes the results, and writes starter token artifacts

## Limitations

- works on public websites only
- extracts starter-level primitives, not a full component library
- does not guarantee pixel-perfect reproduction
- a single page is not proof of a complete product design system

## Local Development

```bash
npm install
npm run typecheck
npm test
npm run build
node dist/cli.js --help
```

## Notes

- Node.js 20+ is required.
- `dembrandt` requires a Playwright browser binary. If extraction fails because Chromium is missing, run `npx playwright install chromium`.
- Extraction quality depends on the target site's DOM and CSS exposure.
- Dynamic or protected sites may yield incomplete results.
