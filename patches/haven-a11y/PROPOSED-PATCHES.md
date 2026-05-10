# Proposed Haven Theme Accessibility Patches

All violations were identified by automated axe-core scan (`@axe-core/playwright 4.11`)
against `https://my-drupalcms-site.ddev.site/` running Haven theme 1.0.0 on DrupalCMS.
No issue was filed based solely on AI code inspection. Manual AT verification steps
are listed in each evaluation report.

## Scan provenance

```
Tool:     @axe-core/playwright 4.11
Browser:  Chromium (Playwright)
Pages:    /, /blog
Modes:    light, dark, forced-colors
Date:     2026-05-10
```

---

## Priority 1: Serious — Patches verified ✅

### HAVEN-001 — Logo link has no accessible name

| Field | Value |
|---|---|
| **axe rule** | `link-name` |
| **Impact** | Serious |
| **WCAG SC** | 4.1.2 Name, Role, Value (Level A) |
| **Status** | ✅ **Patch verified** — 0 violations after applying |
| **Patch file** | `a11y-HAVEN-001-logo-link-name.patch` |
| **Evaluation** | `a11y-HAVEN-001-logo-link-name-evaluation.md` |
| **File changed** | `templates/block/block--system-branding-block.html.twig` |

**Root cause:** `<a rel="home">` had no accessible name. When "Display site name"
is unchecked in block config, `site_name` is empty — making `alt=""` on the logo
image and leaving the link with no name.

**Fix:** Add `aria-label="{{ site_name ? site_name : 'Home'|t }}"` to the `<a>`
element (unconditional, with translatable fallback). Set `alt=""` on the `<img>` to
make it decorative — the link carries the name via `aria-label`.

**Before:** `link-name` SERIOUS × 2 (link appears twice on page)
**After:** `link-name` × 0 ✅

---

### HAVEN-002 — Secondary button colour contrast failure

| Field | Value |
|---|---|
| **axe rule** | `color-contrast` |
| **Impact** | Serious |
| **WCAG SC** | 1.4.3 Contrast (Minimum) (Level AA) |
| **Status** | ✅ **Patch verified** — 0 violations on `.bg-secondary` after applying |
| **Patch file** | `a11y-HAVEN-002-secondary-button-contrast.patch` |
| **Evaluation** | `a11y-HAVEN-002-secondary-button-contrast-evaluation.md` |
| **File changed** | `src/theme.css` (**requires `npm run build` after applying**) |

**Root cause:** `--secondary: oklch(0.653 0.131 230.943)` (~`#039dd1`) on white
text = ~3.11:1 contrast ratio. WCAG 1.4.3 AA requires 4.5:1.

**Fix:** Darken `--secondary` to `oklch(0.38 0.140 230.943)` (~`#0057a8`),
yielding ~7.1:1 against white. Derived tokens (`--secondary-light`,
`--secondary-dark`) update automatically via `color-mix()`.

**Before:** `color-contrast` SERIOUS on secondary buttons
**After:** `color-contrast` × 0 on `.bg-secondary` ✅

---

## Priority 2: Patch needed

### HAVEN-003 — Email input boundary contrast (SC 1.4.11)

| Field | Value |
|---|---|
| **axe rule** | `color-contrast` (reported under 1.4.3 by axe; correct SC is 1.4.11) |
| **Impact** | Serious |
| **WCAG SC** | 1.4.11 Non-text Contrast (Level AA) |
| **Status** | 🔧 Patch needed |
| **Selector** | `#edit-email` |
| **File** | `src/theme.css` — `--input` token |

**Root cause:** Email input background (`--input: oklch(0.872...)` ≈ `#efefef`)
against page background (`--background: oklch(0.952...)` ≈ `#f4f4f4`) yields
**1.14:1** contrast ratio. SC 1.4.11 requires 3:1 for UI component boundaries.

**Proposed fix:** Darken `--input` to provide at least 3:1 contrast against
`--background`. A value of `oklch(0.60 0.009 258.338)` (~`#8a929e`) or use a
visible border (`1px solid var(--border)`) instead of relying on background
differentiation.

**Note:** This also affects the newsletter subscription text "© Copyright 2026"
in the footer (rendered in `#efefef` on `#ffffff` in forced-colours mode —
visible in `/blog` forced-colors scan).

---

## How to apply patches

```bash
# From the haven_theme directory:
cd web/themes/contrib/haven_theme

# Check each patch applies cleanly:
git apply --check ../../../../patches/haven-a11y/a11y-HAVEN-001-logo-link-name.patch
git apply --check ../../../../patches/haven-a11y/a11y-HAVEN-002-secondary-button-contrast.patch

# Apply:
git apply ../../../../patches/haven-a11y/a11y-HAVEN-001-logo-link-name.patch
git apply ../../../../patches/haven-a11y/a11y-HAVEN-002-secondary-button-contrast.patch

# Rebuild CSS (required for patch 002 — patch 001 is a Twig-only change):
npm run build

# Clear Drupal cache:
cd ../../../../ && ddev drush cache-rebuild
```

## How to verify after patching

Quick combined verification (run from directory with Playwright installed):
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto('https://my-drupalcms-site.ddev.site/');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.11/axe.min.js' });
  await page.waitForFunction(() => typeof axe !== 'undefined');
  const results = await page.evaluate(async () => ({
    linkName: await axe.run({ runOnly: { type: 'rule', values: ['link-name'] } }),
    secondary: await axe.run('[class*=\"bg-secondary\"]', { runOnly: { type: 'rule', values: ['color-contrast'] } }),
  }));
  console.log('link-name:', results.linkName.violations.length === 0 ? 'PASS ✅' : 'FAIL ❌ ' + results.linkName.violations.length);
  console.log('secondary contrast:', results.secondary.violations.length === 0 ? 'PASS ✅' : 'FAIL ❌ ' + results.secondary.violations.length);
  await browser.close();
})();
"
```

## Applying via Composer patches

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

## Filing drupal.org issues

When filing:
1. Use the structured field block from `ai_best_practices/skills/drupal-accessibility/drupal-a11y-qa/SKILL.md`
2. Include the reproduction scan command from the evaluation file
3. Attach the `.patch` file
4. Add tag: `Accessibility`
5. Map to exact WCAG SC
6. Disclose AI assistance

Issue queue: https://www.drupal.org/project/issues/haven_theme?status[]=Open&issue_tags=Accessibility
