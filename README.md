# extract-design-system

Extract design primitives from a public website and generate starter token files for your current project.

## Install The Skill

```bash
npx skills add arvindrk/extract-design-system --skill extract-design-system
```

## Use The CLI

```bash
npx playwright install chromium
npx extract-design-system extract https://example.com
npx extract-design-system init
```

## What V1 Does

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
