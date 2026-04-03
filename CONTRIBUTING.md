# Contributing

Thanks for contributing to `extract-design-system`.

## Before You Start

- Use Node.js 20 or newer
- Install dependencies with `npm install`
- Install Chromium with `npx playwright install chromium`

## Local Checks

Run the full local validation flow before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
```

For a quick package sanity check, you can also run:

```bash
npm pack --dry-run
```

## Development Workflow

1. Create a focused branch for your change.
2. Make the smallest change that solves the problem.
3. Add or update tests when they materially reduce regression risk.
4. Run the local checks.
5. Open a pull request with a clear summary and test plan.

## Reporting Bugs

Open a GitHub issue with:

- what you expected to happen
- what actually happened
- reproduction steps
- sample URLs only when they are public and safe to share
- environment details such as Node.js version and operating system

## Suggesting Features

Open a GitHub issue describing:

- the user problem
- why the current workflow is insufficient
- the smallest viable behavior change

## Scope Guidelines

This project is intentionally narrow:

- public website extraction only
- starter token generation, not full app rewrites
- explicit confirmation before applying broader code or styling changes

Changes that preserve that scope are more likely to be accepted.
