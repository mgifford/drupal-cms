# Haven Theme Accessibility Patch Evaluation

This directory contains accessibility patches for the Haven Drupal theme (haven_theme),
each with a before/after evidence package modelled on the drupal-core a11y patch
evaluation workflow.

Every patch in this directory was driven by a confirmed automated tool finding.
No patch was drafted from AI code inspection alone.

---

## Directory structure

```
patches/haven-a11y/
  PROPOSED-PATCHES.md                    ← index of all patches and status
  PATCH-EVALUATION-README.md             ← this file
  a11y-HAVEN-001-*.patch                 ← unified diff, applies to theme dir
  a11y-HAVEN-001-*-evaluation.md         ← reproduction evidence and DoD
  a11y-HAVEN-002-*.patch
  a11y-HAVEN-002-*-evaluation.md
  ...
```

Naming convention: `a11y-HAVEN-{NNN}-{short-description}.patch`

---

## Evaluator flow

For each patch:

1. **Confirm the violation exists** — run the scan command from the evaluation `.md`
   file against the unpatched site. The axe rule ID must appear in output.
2. **Apply the patch** — `git apply` from within `web/themes/contrib/haven_theme/`.
3. **Rebuild assets if needed** — `npm run build` inside the theme for CSS changes.
4. **Clear Drupal cache** — `ddev drush cache-rebuild`.
5. **Re-run the same scan command** — the axe rule ID must not appear in output.
6. **Verify no regressions** — run a broader scan to confirm no new violations.
7. **Revert if needed** — `git apply -R <patch-file>`.

---

## Prerequisites

```bash
# Node 18+ and npm
node -v
npm -v

# Playwright and axe
npm install -D playwright @playwright/test @axe-core/playwright

# Or run inline with npx:
npx playwright --version
```

---

## Quick scan setup

Create `haven-a11y.spec.js` in your project root:

```javascript
const { test } = require('@playwright/test');
const { checkA11y, injectAxe } = require('axe-playwright');

const BASE_URL = process.env.BASE_URL || 'https://my-drupalcms-site.ddev.site';
const PAGES = ['/', '/blog'];
const MODES = [
  { name: 'light', colorScheme: 'light', forcedColors: 'none' },
  { name: 'dark', colorScheme: 'dark', forcedColors: 'none' },
  { name: 'forced-colors', colorScheme: 'light', forcedColors: 'active' },
];

for (const pagePath of PAGES) {
  for (const mode of MODES) {
    test(`${pagePath} — WCAG 2.2 AA (${mode.name})`, async ({ browser }) => {
      const context = await browser.newContext({
        colorScheme: mode.colorScheme,
        forcedColors: mode.forcedColors,
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await page.goto(BASE_URL + pagePath);
      await injectAxe(page);
      await checkA11y(page, null, {
        axeOptions: {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        },
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
      await context.close();
    });
  }
}
```

Run:
```bash
BASE_URL=https://my-drupalcms-site.ddev.site npx playwright test haven-a11y.spec.js
```

---

## Applying patches via Composer

If using `cweagans/composer-patches`, add to your project-root `composer.json`:

```json
"extra": {
  "patches": {
    "drupal/haven_theme": {
      "HAVEN-001: Logo link accessible name (axe: link-name, WCAG 4.1.2)":
        "patches/haven-a11y/a11y-HAVEN-001-logo-link-name.patch",
      "HAVEN-002: Secondary button colour contrast (axe: color-contrast, WCAG 1.4.3)":
        "patches/haven-a11y/a11y-HAVEN-002-secondary-button-contrast.patch"
    }
  }
}
```

Then: `composer install`

---

## References

- [Accessibility Bug Reporting Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/ACCESSIBILITY_BUG_REPORTING_BEST_PRACTICES.html)
- [CI/CD Accessibility Best Practices](https://mgifford.github.io/ACCESSIBILITY.md/examples/CI_CD_ACCESSIBILITY_BEST_PRACTICES.html)
- [Haven theme issue queue](https://www.drupal.org/project/issues/haven_theme?status[]=Open&issue_tags=Accessibility)
- [axe-core rules](https://dequeuniversity.com/rules/axe/4.10/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
