# extract-design-system

A collection of agent skill instructions and a companion npm CLI for extracting design primitives from public websites and generating starter token files.

Skills follow the [Agent Skills](https://agentskills.io/) format and are installable through the [skills](https://skills.sh/) ecosystem.

## Links

[![npm](https://img.shields.io/badge/npm-package-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/extract-design-system)
[![skills.sh](https://img.shields.io/badge/skills.sh-discovery-111111)](https://skills.sh/arvindrk/extract-design-system/extract-design-system)

## Available Skills

### extract-design-system

Extract a starter design system from a public website and turn it into project-local token files.

**Use when:**

- You want an agent to analyze a public website's colors, typography, spacing, and related primitives
- You want starter token files for a local project
- You want a safer, repeatable workflow instead of manually prompting an agent through extraction steps
- You want a workflow similar in spirit to foundational skills like brainstorming, but focused on design-system extraction and initialization

**What it does:**

- Installs a skill that teaches agents when and how to run the workflow
- Wraps `dembrandt` through the `extract-design-system` CLI
- Saves raw extraction output to `.extract-design-system/raw.json`
- Normalizes extracted data into `.extract-design-system/normalized.json`
- Generates `design-system/tokens.json`
- Generates `design-system/tokens.css`

**Current limitations:**

- Public websites only
- Single-page extraction workflow
- Starter tokens, not a full component library
- No framework config patching or automatic app rewrites

## Installation

Install the skill from GitHub with the `skills` CLI:

```bash
npx skills add arvindrk/extract-design-system
```

This is the installation path used by `skills.sh` discovery and ranking.

## Usage

Once installed, the skill is available to supported coding agents. The agent should use it when a request matches the extraction workflow.

**Example prompts:**

```text
Extract the design system from https://stripe.com and generate starter token files for this project.
```

```text
Analyze https://linear.app and summarize the design primitives before generating local tokens.
```

The skill is designed to:

- confirm the target website
- set expectations about scope and limitations
- run extraction through the CLI
- summarize what was found
- ask before modifying existing project styling or configuration

## CLI Workflow

The skill relies on the published npm CLI:

```bash
npx playwright install chromium
npx extract-design-system extract https://example.com
npx extract-design-system init
```

What each step does:

- installs the Playwright browser dependency used by extraction
- extracts design primitives from the target website
- generates starter token files in the current project

You can also inspect the CLI directly:

```bash
npx extract-design-system --help
```

## Generated Outputs

- `.extract-design-system/raw.json` - Raw extractor output for debugging and future compatibility
- `.extract-design-system/normalized.json` - Stable normalized representation used by the CLI
- `design-system/tokens.json` - Project-local JSON copy of the normalized design system
- `design-system/tokens.css` - Starter CSS variables file for immediate integration

## Skill Structure

This repository currently exposes:

- `skills/extract-design-system/SKILL.md` - Main skill instructions
- `skills/extract-design-system/references/` - Supporting workflow and output references

The npm package exposes the `extract-design-system` CLI that the skill invokes.

## Local Development

```bash
npm install
npm run typecheck
npm test
npm run build
node dist/cli.js --help
```

## Notes

- Node.js 20+ is required
- If extraction fails because Chromium is missing, run `npx playwright install chromium`
- Extraction quality depends on the target site's DOM and CSS exposure
- Dynamic or protected sites may yield incomplete results

## License

MIT
