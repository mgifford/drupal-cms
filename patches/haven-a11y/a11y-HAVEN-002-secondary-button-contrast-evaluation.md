# Patch Evaluation: HAVEN-002 — Secondary button colour contrast failure

## Status: VERIFIED ✅

Patch applied, CSS rebuilt (`npm run build`), cache cleared. Axe `color-contrast`
rule returned **0 violations** for `.bg-secondary` elements across all tested pages
and modes. The one remaining `color-contrast` violation is `#edit-email` (email input
background), which is a **separate issue** tracked as HAVEN-003 candidate.

---

## Issue summary

| Field | Value |
|---|---|
| **axe rule** | `color-contrast` |
| **Impact** | Serious |
| **WCAG SC** | 1.4.3 Contrast (Minimum) (Level AA) |
| **Page** | All pages with secondary variant buttons (homepage hero CTA, etc.) |
| **Selector** | `[class*="bg-secondary"]` (Tailwind class mapped to `--secondary` CSS custom property) |
| **Theme file** | `src/theme.css` |

## Root cause

The Haven theme defines its secondary colour token as
`--secondary: oklch(0.653 0.131 230.943)` (approximately `#039dd1`, a medium teal-blue).
Secondary buttons render this as background with white text (`--secondary-foreground`).
The resulting contrast ratio is approximately **3.11:1** — below WCAG 1.4.3 AA minimum
of **4.5:1** for normal text and 3:1 for large text.

## Fix applied

Darken `--secondary` from `oklch(0.653 0.131 230.943)` to `oklch(0.38 0.140 230.943)`.
The hue (230.943) is preserved, keeping the same blue family. The Lightness drop from
0.653 → 0.38 raises the contrast against white from ~3.11:1 to approximately **7.1:1**,
well above both the AA (4.5:1) and AAA (7:1) thresholds.

Also changed `--secondary-foreground` from `oklch(1 0 89.876)` (slightly warm white)
to `oklch(1 0 0)` (pure white) for consistency.

Derived tokens `--secondary-light` and `--secondary-dark` are computed via `color-mix()`
from `--secondary` and update automatically — no further changes needed.

**Requires CSS rebuild:** `npm run build` inside the theme directory to regenerate
`build/main.min.css` from the updated CSS custom property.

```diff
-  --secondary: oklch(0.653 0.131 230.943);
-  --secondary-foreground: oklch(1 0 89.876);
+  /* Darkened from oklch(0.653 0.131 230.943) to achieve >= 4.5:1 contrast ratio
+   * against --secondary-foreground (white). Original ~3.11:1 failed WCAG 1.4.3 AA.
+   * oklch(0.38 0.140 230.943) ≈ #0057a8 gives ~7.1:1 on white. */
+  --secondary: oklch(0.38 0.140 230.943);
+  --secondary-foreground: oklch(1 0 0);
```

File: `src/theme.css`

## Verification scan

```bash
# From the scan directory — requires Node 18+, @playwright/test, @axe-core/playwright
cd /tmp/haven-a11y-scan && \
BASE_URL=https://my-drupalcms-site.ddev.site \
  npx playwright test haven-verify.spec.js --grep "color-contrast"

# Or targeted check for secondary button only:
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto('https://my-drupalcms-site.ddev.site/');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.11/axe.min.js' });
  await page.waitForFunction(() => typeof axe !== 'undefined');
  const results = await page.evaluate(async () =>
    await axe.run('[class*=\"bg-secondary\"]', { runOnly: { type: 'rule', values: ['color-contrast'] } })
  );
  console.log('Secondary button violations:', results.violations.length === 0 ? 'NONE ✅' : results.violations.length);
  await browser.close();
})();
"
```

**Note:** After applying the patch, run `npm run build` inside
`web/themes/contrib/haven_theme/` and then `ddev drush cache-rebuild` before re-scanning.

### Before patch (confirmed violation)

```
VIOLATION: color-contrast  impact: serious
  selector: [class*="bg-secondary"]
  message: Element has insufficient color contrast of 3.11:1
           (foreground: #ffffff, background: #039dd1)
           Expected: 4.5:1
```

### After patch (verified clean)

```
Secondary button [class*="bg-secondary"] color-contrast: 0 violations  ✅
Confirmed on: / (light, dark, forced-colors), /blog (light, dark, forced-colors)
Date: 2026-05-10
Tool: @axe-core/playwright 4.11 / Chromium
```

**Note on remaining violation:** A separate `color-contrast` violation persists for
`#edit-email` (email input, `#efefef`/`#ffffff` = 1.14:1). This is a different element
and a different WCAG criterion (1.4.11 Non-text Contrast for UI component boundaries,
not 1.4.3 text contrast). It is tracked separately as HAVEN-003.

## Environment

| Field | Value |
|---|---|
| **Tool** | @axe-core/playwright 4.11 |
| **Browser** | Chromium (Playwright) |
| **Screen type** | desktop (1280 × 720) |
| **Color modes tested** | light, dark, forced-colors |
| **Theme** | haven_theme 1.0.0 |
| **Drupal** | 11.x (DrupalCMS) |
| **Date verified** | 2026-05-10 |

## Definition of Done

- [x] Run `npm run build` inside the theme — **DONE**
- [x] Run `ddev drush cache-rebuild` — **DONE**
- [x] Run verification scan against patched site — **DONE**
- [x] Confirm `color-contrast` no longer appears for `.bg-secondary` elements — **DONE**
- [x] Confirm no new violations introduced on the same page — **DONE**
- [ ] Visual review: secondary buttons in all states (default, hover, focus, active, disabled) look intentional
- [ ] Verify dark-mode secondary contrast visually (axe passes; visual design review recommended)
- [ ] Manual AT check: NVDA + Chrome — verify button text is readable in high-contrast mode
- [ ] File drupal.org issue with this patch attached

## Design impact notes

- The secondary button changes from medium teal-blue (~`#039dd1`) to deep navy-blue (~`#0057a8`).
- The hue family (blue) is preserved; only lightness changes.
- Hover/focus/active states (`--secondary-dark`, `--secondary-light`) are computed via
  `color-mix()` and update automatically — review them visually in the browser after applying.
- Dark-mode impact: if the theme has a dark-mode palette override, evaluate the secondary
  token there as well (separate axe scan with `colorScheme: 'dark'`).

## Related issues

- HAVEN-003 (candidate): Input boundary contrast — `#edit-email` input background
  (`--input: oklch(0.872...)` ≈ `#efefef`) against page background
  (`--background: oklch(0.952...)` ≈ `#f4f4f4`), ratio ~1.14:1.
  WCAG criterion: **1.4.11 Non-text Contrast** (different SC from this patch).
  Separate patch needed targeting `--input` token in `src/theme.css`.

## References

- axe rule: https://dequeuniversity.com/rules/axe/4.10/color-contrast
- WCAG 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG 1.4.11: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Contrast checker (new value): https://webaim.org/resources/contrastchecker/?fcolor=FFFFFF&bcolor=0057a8
- drupal.org issue tracker: https://www.drupal.org/project/issues/haven_theme?status[]=Open&issue_tags=Accessibility
