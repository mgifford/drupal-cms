# Patch Evaluation: HAVEN-001 — Logo link has no accessible name

## Status: VERIFIED ✅

Patch applied, CSS rebuilt, cache cleared. Axe `link-name` rule returned **0 violations**
on both `/` and `/blog` in light, dark, and forced-colours modes.

---

## Issue summary

| Field | Value |
|---|---|
| **axe rule** | `link-name` |
| **Impact** | Serious |
| **WCAG SC** | 4.1.2 Name, Role, Value (Level A) |
| **Page** | All pages that render the site branding block |
| **Selector** | `a[rel="home"]` |
| **Theme file** | `templates/block/block--system-branding-block.html.twig` |

## Root cause

The branding block wraps the logo image in `<a rel="home">`. The template sets
`alt="{{ site_name }}"` on the logo image. When the block's "Display site name"
checkbox is unchecked, `site_name` is not passed to the template — it resolves to
an empty string, making `alt=""`. The outer `<a>` then has no visible text, no
`aria-label`, and an empty img alt — axe correctly reports `link-name` SERIOUS.

The core Drupal template avoids this by using `alt="{{ 'Home'|t }}"` — a
translatable string that doesn't depend on the block config checkbox.

## Fix applied

Two changes to `templates/block/block--system-branding-block.html.twig`:

1. **Add `aria-label` to the `<a>` element** — uses `site_name` when the display
   checkbox is on, falls back to translatable `'Home'` string when it is off.
   The link always has an accessible name regardless of block configuration.

2. **Set `alt=""` on the logo `<img>`** — the image is now decorative because the
   wrapping link carries the accessible name via `aria-label`. Putting the same
   text in both `aria-label` and `alt` would cause screen readers to announce the
   name twice. The empty `alt` is intentional and correct per WCAG technique H67.

```diff
-  <a href="{{ home_url|default('/') }}" class="inline-block" rel="home">
+  <a href="{{ home_url|default('/') }}" class="inline-block" rel="home" aria-label="{{ site_name ? site_name : 'Home'|t }}">
     {% block branding %}
       {% if site_logo %}
         <div class="branding flex items-center">
-          <img class="h-full w-full" src="{{ site_logo_url }}" alt="{{ site_name }}" />
+          <img class="h-full w-full" src="{{ site_logo_url }}" alt="" />
```

File: `templates/block/block--system-branding-block.html.twig`

## Verification scan

```bash
# From project root — requires Node 18+, @playwright/test, @axe-core/playwright
cd /tmp/haven-a11y-scan && \
BASE_URL=https://my-drupalcms-site.ddev.site \
  npx playwright test haven-verify.spec.js --grep "link-name"
```

### Before patch (confirmed violation)

```
VIOLATION: link-name  impact: serious  count: 2
  selector: #block-05793f48... > a[rel="home"]
  html: <a href="/" class="inline-block" rel="home">
  message: Element does not have text that is visible to screen readers
```

### After patch (verified clean)

```
link-name: 0 violations  ✅
Confirmed across: / (light, dark, forced-colors), /blog (light, dark, forced-colors)
Date: 2026-05-10
Tool: @axe-core/playwright 4.11 / Chromium
```

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

- [x] Run the verification scan command above against the patched site
- [x] Confirm `link-name` no longer appears in axe output for `a[rel="home"]` — **DONE**
- [x] Confirm no new violations introduced on the same page — **DONE**
- [ ] Manual AT check: NVDA + Chrome — navigate to homepage, Tab to logo link, confirm site name or "Home" is announced
- [ ] Manual AT check: VoiceOver + Safari — same test
- [ ] File drupal.org issue with this patch attached

## Notes

- The `aria-label` uses `site_name` when it is available (block configured to show site name),
  and the translatable string `'Home'` when it is not. This matches the pattern used by Drupal core's
  `block--system-branding-block.html.twig` for the img alt.
- The `img alt=""` is correct per WCAG H67: when a non-text element is covered by adjacent
  text (or in this case a parent element's `aria-label`), using `alt=""` prevents double-announcement.
- No visual change — `aria-label` is not rendered visually.
- The block appears twice on the test site (navbar top and a second instance), which is why
  the before-state showed `count: 2`.

## References

- axe rule: https://dequeuniversity.com/rules/axe/4.10/link-name
- WCAG 4.1.2: https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
- WCAG H67: https://www.w3.org/WAI/WCAG22/Techniques/html/H67
- drupal.org issue tracker: https://www.drupal.org/project/issues/haven_theme?status[]=Open&issue_tags=Accessibility
