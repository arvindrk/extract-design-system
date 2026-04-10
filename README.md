[![npm downloads](https://img.shields.io/npm/dw/extract-design-system?logo=npm\&logoColor=white)](https://www.npmjs.com/package/extract-design-system)
<p align="center">
  <a href="https://skills.sh/arvindrk/extract-design-system/extract-design-system">
    <img src="https://img.shields.io/badge/skills.sh-discovery-111111" alt="skills.sh" />
  </a>
  <a href="https://github.com/arvindrk/extract-design-system/actions/workflows/ci.yml">
    <img src="https://github.com/arvindrk/extract-design-system/actions/workflows/ci.yml/badge.svg" alt="ci" />
  </a>
</p>

# extract-design-system

An agent skill for extracting design primitives from public websites and generating starter token files for the current project.

Skills follow Anthropic's [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) and are installable through the [skills.sh](https://skills.sh/arvindrk/extract-design-system/extract-design-system) ecosystem.

This repository is skills-first. It publishes an installable `extract-design-system` skill, and the bundled CLI is the executable workflow the agent runs under the hood.

## Quick Start

Install the skill:

```bash
npx skills add arvindrk/extract-design-system
```

Run it from a supported coding agent with a public website:

```text
Extract the design system from https://stripe.com and generate starter token files for this project.
```

Expected starter outputs:

- `.extract-design-system/raw.json`
- `.extract-design-system/normalized.json`
- `design-system/tokens.json`
- `design-system/tokens.css`

## About This Repository

This repository contains a focused agent skill for reverse-engineering a starter design system from a public website.

The skill is designed to give coding agents a repeatable workflow for:

- analyzing a public website's colors, typography, spacing, radius, and shadows
- normalizing the extracted output into a stable structure
- generating project-local starter token files
- summarizing findings before broader styling or app changes

## Available Skill

### extract-design-system

Extract a starter design system from a public website and turn it into local token files.

**Use when:**

- You want an agent to analyze a public website's visual primitives
- You want starter design tokens for an existing project
- You want a repeatable workflow instead of ad hoc prompting
- You want the agent to summarize findings before applying broader changes

**What it produces:**

- `.extract-design-system/raw.json`
- `.extract-design-system/normalized.json`
- `design-system/tokens.json`
- `design-system/tokens.css`

## Installation

Install the skill from GitHub with the `skills` CLI:

```bash
npx skills add arvindrk/extract-design-system
```

You can also browse the skill on [skills.sh](https://skills.sh/arvindrk/extract-design-system/extract-design-system).

## Usage

Once installed, the skill is available to supported coding agents. The agent should use it when a request matches the extraction workflow.

**Example prompts:**

```text
Extract the design system from https://stripe.com and generate starter token files for this project.
```

```text
Analyze https://linear.app and summarize the design primitives before generating local tokens.
```

```text
Extract colors, typography, spacing, and radius tokens from https://vercel.com and save them for this codebase.
```

```text
Review https://tailwindcss.com, extract the most likely design primitives, and generate starter token files only if the results look usable.
```

## How The Skill Works

The skill is designed to:

- confirm that the target site is public and reachable
- set expectations about scope and limitations
- run the extraction workflow through the bundled CLI
- summarize what was found in the normalized output
- generate starter token files for the current project
- ask before modifying existing app code, styles, or configuration

## Scope And Limitations

- Public websites only
- Single-page extraction workflow
- Starter tokens, not a full component library
- No framework config patching or automatic app rewrites
- Dynamic, protected, or highly script-driven sites may yield incomplete output
- Extraction is useful for initialization, not pixel-perfect reproduction

## Security Considerations

- Target websites are untrusted third-party input and may influence extracted output
- Generated tokens should be reviewed before being treated as authoritative design decisions
- The skill is intended for extraction and starter token generation, not automatic broad app rewrites
- Use only with public websites that you are comfortable fetching and analyzing at runtime
- Ask for confirmation before applying extracted output to existing app code, styles, or configuration

## Repository Structure

This repository currently exposes:

- `skills/extract-design-system/SKILL.md` - Main skill instructions
- `skills/extract-design-system/references/` - Supporting workflow and output references
- `src/` - Bundled CLI implementation used by the skill
- `tests/` - CLI and normalization test coverage

## Local Development

The skill's executable workflow is backed by the published npm CLI in this repository.

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build
npm run dev -- --help
npm run cli -- --help
```

Useful local commands:

```bash
npm run dev -- https://example.com
npm run dev -- https://example.com --extract-only
npm run cli -- https://example.com
npm run cli -- init
```

## Community And Support

- Read the contribution guide in [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Review expected community behavior in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Report security issues using the process in [`SECURITY.md`](./SECURITY.md)
- Support ongoing maintenance through [GitHub Sponsors](https://github.com/sponsors/arvindrk)

## Notes

- Node.js 20+ is required
- If extraction fails because Chromium is missing, run `npx playwright install chromium`
- Extraction quality depends on the target site's DOM and CSS exposure

## License

MIT
