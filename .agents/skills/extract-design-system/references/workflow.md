# Workflow

The intended v1 flow is:

0. If Chromium is missing locally, run `npx playwright install chromium`
1. `npx extract-design-system extract <url>`
2. inspect `.extract-design-system/normalized.json`
3. `npx extract-design-system init`
4. import `design-system/tokens.css` into the app when the user is ready

Use extraction-only mode when the user wants analysis without any starter files.
