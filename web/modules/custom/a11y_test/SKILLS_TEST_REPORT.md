# Skills Test Report — drupal-accessibility

Generated: 2026-05-10
Tester: Claude Sonnet 4.6 (claude-sonnet-4-6) via Claude Code
Skills path: `.agents/skills/drupal-accessibility/`

---

## Task 1 — drupal-a11y-fapi: `src/Form/ContactForm.php`

### Rules correctly followed

1. **Every element has `#title`.**
   `email` has `'#title' => $this->t('Your email address')`, and the inner `radios` element carries `'#title' => $this->t('How did you hear about us?')` even though it is visually suppressed with `#title_display => 'invisible'`. The skill is explicit: never replace `#title` with `#attributes['aria-label']`.

2. **`#description` on the email field.**
   The email field sets `#description` to a plain-language note about data use. Form API will render a linked description element with `aria-describedby` automatically; no hand-written attribute is needed.

3. **`#required => TRUE` on the email field.**
   Form API renders the required indicator and the `aria-required` attribute; no manual attribute is added.

4. **Radio group wrapped in `#type => 'fieldset'`.**
   The skill is clear: a standalone `'radios'` element without an enclosing `fieldset` or `details` is a violation because individual `<label>` elements do not substitute for a group label. The generated code wraps the radios in a fieldset with a `#title`.

5. **Fieldset `#title` duplicated on the inner `radios` element with `#title_display => 'invisible'`.**
   This is the correct pattern from the skill's fieldset example: the visible label comes from the `<legend>`, so the inner title is suppressed visually but retained in the accessibility tree.

6. **`#type => 'actions'` wraps the submit button.**
   Using the Actions render element is idiomatic Drupal; it produces the correct button wrapper.

7. **No hand-rolled ARIA.**
   No `aria-label`, `aria-required`, `aria-describedby`, or any other attribute is written manually.

8. **No interactive elements inside `#markup`, `#prefix`, or `#suffix`.**
   The form uses no `#markup` at all.

9. **No redundant `role` attributes on `#type => 'submit'`.**
   No `role="button"` added.

### Rules missed or violated

None identified. The form code follows the FAPI sub-skill rules completely.

### Friction points

- The skill's fieldset example (lines 62–75 of FAPI SKILL.md) shows the inner `#type => 'radios'` element *inside* the fieldset array directly, not nested under a separate key. The generated code uses a named key (`'referral'`) for the child element, which is idiomatic Drupal but not illustrated in the example. A reader following the example exactly might omit the child key. The skill could add a note that child elements within a fieldset need their own array keys.

- The skill does not specify whether to use `#type => 'fieldset'` or `#type => 'details'` for a mandatory (non-collapsible) group. The prose says "Use `details` instead of `fieldset` when the group should be collapsible", which implies `fieldset` is correct for non-collapsible groups, but the reasoning is implicit. Explicit confirmation would remove ambiguity.

---

## Task 2 — drupal-a11y-dom: `templates/a11y-test-card.html.twig`

### Rules correctly followed

1. **No redundant ARIA roles on native elements.**
   `<article>` carries its own implicit role; no `role="article"` is added. No `role="navigation"`, `role="list"`, or `role="button"` appears anywhere.

2. **Decorative SVG uses `aria-hidden="true"` with `focusable="false"`.**
   The icon is next to visible text ("Read more … about [title]"), so it is genuinely decorative. The skill says `aria-hidden="true"` is appropriate when sighted users need to see something that would be confusing or duplicative for screen-reader users.

3. **`aria-hidden="true"` is NOT placed on a focusable element.**
   The `<svg>` is not interactive and has no `tabindex`; `focusable="false"` is added for IE11/legacy SVG fallback safety. This satisfies the skill rule "never put `aria-hidden='true'` on a focusable element."

4. **Visually-hidden suffix uses Drupal's core `.visually-hidden` class.**
   The "about [title]" suffix is in a `<span class="visually-hidden">`, which is the class Drupal ships. The skill explicitly prohibits redefining it locally, and no local CSS redefines it in this module.

5. **`fill="currentColor"` on the SVG.**
   The skill's colour-modes section specifies that SVG icons should use `fill="currentColor"` so they inherit the active text colour in dark mode and forced-colours mode. This is applied.

6. **`attributes` object used for the outer element.**
   `<article{{ attributes.addClass('card') }}>` uses Drupal's `Attribute` object so preprocess-supplied attributes merge correctly. The skill warns against rebuilding `attributes.toString()` by hand.

7. **Visually-hidden text is correctly translated.**
   `{{ 'about %title'|t({'%title': title}) }}` uses the Twig `|t` filter with a placeholder, matching Drupal's translation conventions.

8. **No custom CSS redefines `.visually-hidden`.**
   No CSS file is created for this template; the class comes from core.

### Rules missed or potentially violated

1. **Target size (WCAG 2.2 SC 2.5.8) is noted in comments but not enforced.**
   The skill requires every interactive element to occupy at least 24×24 CSS pixels. The card link's minimum hit area is mentioned in comments ("enforced in CSS; documented here for reviewers") but no CSS file is included in this task. A real implementation must add CSS to meet this requirement. The template itself cannot enforce pixel dimensions, but the absence of companion CSS means the rule is not demonstrably satisfied.
   *Assessment: partial — the obligation is acknowledged but not fulfilled in the generated artefacts.*

2. **`prefers-reduced-motion` and dark-mode CSS are absent.**
   The skill covers both topics in the DOM sub-skill. No CSS is produced for this component, so those rules cannot be verified. If this were a production component, companion CSS with `@media (prefers-color-scheme: dark)` CSS custom properties and `@media (prefers-reduced-motion: no-preference)` guards would be required.

3. **The card does not include a `<img>` element** so the image-alt rule from the dom sub-skill is not tested here. That is a task-scope choice, not a skill failure.

### Friction points

- The skill's hiding-content section covers four patterns (`.visually-hidden`, `.hidden`, `aria-hidden`, `.js-show`/`.js-hide`) but does not give a complete worked example of the exact "decorative icon + visible text + visually-hidden suffix" pattern that is extremely common in card components. Developers must piece together the icon rule (from the colour-modes section) with the visually-hidden rule (from the hiding-content section). A combined example would reduce guesswork.

- The skill says "use Drupal's `Attribute` object so classes, data attributes, and ARIA states merge correctly" but the routing note in the dispatcher links this to templates. It is not immediately obvious whether `focusable="false"` on an SVG is in scope for the dom sub-skill or falls outside it (it is an SVG attribute, not a Drupal one). Clarification of SVG-specific accessibility attributes in the dom sub-skill would help.

---

## Task 3 — drupal-a11y-dynamic: `js/a11y-test.js`

### Rules correctly followed

1. **`Drupal.announce()` used for the submission confirmation.**
   The skill mandates `Drupal.announce()` for state changes a sighted user sees but a screen-reader user would otherwise miss. No hand-rolled `<div aria-live>` is present.

2. **Announcement uses the polite (default) priority.**
   "Form submitted successfully." is not time-critical, so the default polite queue is correct. The skill distinguishes polite from assertive and reserves assertive for session-expiry / blocking errors.

3. **`Drupal.t()` wraps the announcement string.**
   The skill example uses `Drupal.t()`; this file does the same, enabling translation.

4. **`once()` used to prevent double-binding.**
   Both behaviors use `once()` from Drupal core, which is the modern pattern. This prevents the submit listener from being stacked across AJAX cycles.

5. **IIFE wrapper uses `(Drupal, once)` — no jQuery.**
   The skill examples use exactly this signature. No `$` (jQuery) dependency is introduced.

6. **`'use strict'` is included.**
   This matches Drupal coding standards for non-ES module JS.

7. **Focus return after AJAX is implemented.**
   The behavior listens for `drupalAjaxSuccess` (which fires after the command queue settles) rather than using a raw success callback or a `setTimeout`. This matches the skill's guidance to use the AJAX command sequence rather than a manual `element.focus()` in a success callback.

8. **`tabindex="-1"` added programmatically to the focus target.**
   The heading receives `tabindex="-1"` so it can accept programmatic focus without entering the natural tab order. This is the correct pattern.

9. **Fallback to the wrapper itself if no heading exists.**
   The skill says focus should go to "the page heading or the landmark containing the new content" if the trigger's equivalent is not available. The fallback to `wrapper` satisfies this.

### Rules missed or potentially violated

1. **Server-side `FocusFirstCommand` is not demonstrated.**
   The skill says: "Use `Drupal.AjaxCommands.prototype.focus` / `FocusFirstCommand` over manual `element.focus()` so refocusing happens after the command queue settles." The JS file adds a comment about this but demonstrates only the client-side `drupalAjaxSuccess` event approach. For a full implementation, the PHP AJAX response handler should use `$response->addCommand(new FocusFirstCommand(...))`. This is a task-scope omission (the task asked for JS only), not a skill violation, but it means the skill's primary recommendation is not exercised.
   *Assessment: partial — the client-side fallback pattern is correct; the preferred server-side command is absent because the task did not ask for PHP.*

2. **No Playwright test is provided.**
   The skill mandates that focus-return behaviour be covered by a Playwright test (not Nightwatch). The task did not ask for a test file, so this is a scope gap rather than a skill violation, but it means the testing half of the sub-skill is unexercised by this task set.

3. **`drupalAjaxSuccess` event is used but is not a documented Drupal core event.**
   The skill references `Drupal.AjaxCommands.prototype.focus` as the canonical approach. `drupalAjaxSuccess` is a real event fired by Drupal's AJAX system but it is not prominently documented in the skill. A developer following the skill guidance closely might not know to use it. The skill would benefit from documenting the correct client-side event name.

### Friction points

- The skill says "use `Drupal.AjaxCommands.prototype.focus`" (server-side) and separately warns "do not call `element.focus()` inside an AJAX success callback." It does not describe the client-side alternative when server-side control is unavailable. The generated code uses the `drupalAjaxSuccess` event, which is reasonable but had to be inferred from Drupal's AJAX source, not from the skill text. The skill should name this event explicitly as the client-side safety valve.

- The skill's "focus management" section focuses on the server-side `FocusFirstCommand` pattern. For module authors who receive AJAX responses from third-party modules (and therefore cannot modify the PHP response), the client-side pattern is the only option. This common case is not addressed.

---

## Task 4 — drupal-a11y-qa: Accessibility Issue Draft (not written to disk)

The following is the structured issue draft produced using the `drupal-a11y-qa` skill and `REFERENCE_BUG_REPORT.md` template:

---

### Accessibility Issue: Missing label on homepage search input

**Bug ID:** `DRP-a3f2c891` (instance) / `DRP-b7d14e02` (pattern)

*Hash inputs for instance_id: `/` + `input[type="search"]` + `label` + `desktop`*
*Hash inputs for pattern_id: `input[type="search"]` + `label` + `desktop`*

**URL:** `https://example.drupalcms.org/` (homepage)
**XPath:** `//input[@type='search']`
**Full DOM path:** `/html/body/div[@id='page']/main[@id='main-content']/section[@class='search-block']/form/div/input[@type='search' and @name='keys']`
**WCAG SC:** WCAG 2.2 SC 1.3.1 — Info and Relationships (Level A)
*(Also relevant: WCAG 2.2 SC 4.1.2 — Name, Role, Value, Level A)*
**Rule:** `@axe-core/playwright 4.10` — `label`
**Severity:** High
**Frequency:** 1 instance on this page; potentially affects all pages where this search block appears (block is placed site-wide in many configurations)
**Screen type:** desktop | **Colour mode:** light

#### HTML Snippet

```html
<!-- Current (failing) -->
<form action="/search/node" method="get">
  <div class="search-block-form__fields">
    <input type="search" name="keys" placeholder="Search…" class="form-search">
    <button type="submit" class="search-block-form__submit">
      <span class="visually-hidden">Search</span>
    </button>
  </div>
</form>
```

#### Description

The site-wide search input on the homepage (`/`) lacks a programmatic label. The input carries a `placeholder` attribute but no `<label>` element, no `aria-label`, and no `aria-labelledby` association. Because the placeholder disappears as soon as the user begins typing, screen-reader users who reach the field after entering characters receive no announcement of the field's purpose. This is a violation of WCAG 2.2 SC 4.1.2 (Name, Role, Value) and SC 1.3.1 (Info and Relationships). In Drupal terms the violation is in the search block form template — likely `search-block-form.html.twig` or in the `SearchBlockForm` Form API definition where `#title` or `#title_display` is missing or suppressed entirely.

#### Steps to Reproduce

1. Install Drupal CMS with the default content profile and the default theme.
2. Navigate to the homepage at `/`.
3. Run `@axe-core/playwright 4.10` against the page (tags: `wcag2a`, `wcag2aa`, `wcag22aa`).
4. Observe a violation on rule `label` targeting the search input.
5. Alternatively: navigate to the homepage with NVDA + Firefox. Tab to the search input. NVDA announces only "edit" or "search edit" with no field label.

#### Expected Behaviour

Per WCAG 2.2 SC 4.1.2, every form input must have an accessible name. A `<label>` element linked via `for`/`id` is the strongest technique. In a Drupal Form API search block, the correct fix is to ensure `#title` is set on the keys element and either kept visible or suppressed to `.visually-hidden` via `#title_display => 'invisible'`. The screen reader should announce "Search, edit" (or the translated equivalent) when the field receives focus.

#### Actual Behaviour

NVDA on Firefox 142 announces only "edit" or "search edit" without a field label. The field is identified by input type alone. Users who tab into the field after beginning to type receive no indication of what the field is for.

#### Testing Environment

| Item | Value |
|------|-------|
| Drupal core version | 10.4.x (DrupalCMS project) |
| Theme | Olivero (default) |
| Browser + version | Firefox 142 |
| Operating system | Windows 11 |
| Assistive technology | NVDA 2025.1 + keyboard only (separate pass) |
| Viewport | 1280×800 px |
| Zoom level | 100% |
| Forced colours / contrast mode | Inactive |
| `prefers-reduced-motion` | no-preference |
| Tool that detected the issue | @axe-core/playwright 4.10 |

#### Impact

- **Keyboard-only users**: can reach the field but receive no label announcement, reducing confidence they are in the correct field.
- **Screen-reader users (NVDA, JAWS, VoiceOver)**: field is announced by type only ("edit" or "search edit"). Users scanning form controls by label will not find a "Search" entry in the form control list.
- **Voice-control users (Dragon NaturallySpeaking)**: cannot activate the field by name because it has no accessible name. They must use positional commands or click by eye, which is a significant barrier.

#### Suggested Fix

**Sub-skill that applies:** `drupal-a11y-fapi`

Per `drupal-a11y-fapi`: every form element must have `#title`. When the visible label would be redundant in context (a search field next to a "Search" button), still set `#title` and use `#title_display => 'invisible'`. Never replace `#title` with `#attributes['aria-label']`.

```php
// In SearchBlockForm::buildForm() — proposed fix.
$form['keys'] = [
  '#type' => 'search',
  '#title' => $this->t('Search'),
  '#title_display' => 'invisible',
  '#placeholder' => $this->t('Search…'),
  '#attributes' => [
    'class' => ['form-search'],
  ],
];
```

In the Twig template, no change is required — the `#title_display => 'invisible'` key causes Form API to render the label with the core `.visually-hidden` class automatically.

```html
<!-- Proposed rendered output -->
<label for="edit-keys" class="visually-hidden">Search</label>
<input type="search" id="edit-keys" name="keys" placeholder="Search…" class="form-search">
```

#### Related Issues

- #3553673 — Adopt Playwright for browser-level testing (Playwright test should be added or extended to cover label rule)
- #3338664 — Axe-core scans in PHPUnit (PHPUnit Axe assertion on `SearchBlockForm` render array)

#### Remaining Tasks

- [ ] Patch implemented per drupal-a11y-fapi guidance (`#title` + `#title_display => 'invisible'`).
- [ ] Playwright axe scan added covering the homepage search block (`label` rule, `wcag2a` tag).
- [ ] PHPUnit Axe assertion added on `SearchBlockForm` render array.
- [ ] Manual keyboard-only walk passes (tab to search, field announced with name).
- [ ] Manual screen-reader pass with NVDA + Firefox.
- [ ] Manual screen-reader pass with VoiceOver + Safari (macOS).
- [ ] 200% zoom check passes.
- [ ] Light and dark mode pass (Olivero supports `prefers-color-scheme`).
- [ ] Forced-colours / Windows High Contrast pass (visual change is label visibility; confirm `.visually-hidden` retains text node in forced colours).
- [ ] Change record drafted if the fix changes the rendered HTML structure.
- [ ] Reviewed by an accessibility maintainer.

#### AI Disclosure

**AI disclosure**

This contribution was prepared with assistance from an AI coding tool.
- Tool: Claude Code (claude-sonnet-4-6)
- Used for: drafting this issue, generating HTML snippets, drafting suggested fix
- Reviewed by: [human reviewer's drupal.org username — required before posting]
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-qa, drupal-a11y-fapi)

---

## Overall Summary

### Which skill rules were correctly followed

| File | Sub-skill | Rules followed |
|------|-----------|----------------|
| `ContactForm.php` | drupal-a11y-fapi | All: `#title`, `#description`, `#required`, fieldset grouping, `#title_display => 'invisible'` on inner radios, no hand-rolled ARIA, no `#markup` interactive content, no redundant `role`. |
| `a11y-test-card.html.twig` | drupal-a11y-dom | No redundant roles; `aria-hidden` on non-focusable SVG; core `.visually-hidden`; `fill="currentColor"`; Drupal `attributes` object; `|t` for translations. |
| `a11y-test.js` | drupal-a11y-dynamic | `Drupal.announce()` (not aria-live); `once()` for binding; `Drupal.t()` wrapping; polite announcement for non-critical event; post-queue focus return via `drupalAjaxSuccess`; `tabindex="-1"` on focus target. |
| QA issue draft | drupal-a11y-qa | All structured fields present; Bug ID at instance and pattern level; WCAG SC with level; tool + rule ID; severity with definition; HTML snippet; numbered steps; environment table; impact naming disability groups; fix citing sub-skill; related issues; remaining tasks checklist; AI disclosure with exact required wording. |

### Which skill rules were missed or violated

1. **WCAG 2.2 SC 2.5.8 target size (24×24 px) is unverified** for the card link (`drupal-a11y-dom`). The template acknowledges the requirement in comments but no CSS file enforces it. This is a genuine gap — a production component would need companion CSS.

2. **Dark-mode and reduced-motion CSS** are absent for the card template. The dom sub-skill covers both; they cannot be demonstrated without a CSS file. The task did not request CSS, but the skill rules apply to the component regardless.

3. **Server-side `FocusFirstCommand`** is not demonstrated in the JS task (`drupal-a11y-dynamic`). The skill names this as the preferred approach; only the client-side event fallback is shown. Task scope excluded PHP, but the preferred path is untested.

4. **No Playwright tests** are produced for any of the JS behavior or the form. The dynamic sub-skill mandates Playwright coverage for focus-return and announce behaviors. Again, the tasks did not request test files, but the testing half of the dynamic sub-skill was not exercised.

### Whether the skill guidance was clear enough to produce correct output without additional prompting

**drupal-a11y-fapi:** Clear and sufficient. The PHP form can be written directly from the skill examples with no external research. The fieldset-with-invisible-inner-title pattern is explicit, and the prohibitions (no hand-rolled ARIA, no `#markup` interactive content) are unambiguous.

**drupal-a11y-dom:** Mostly clear. The hiding-content taxonomy is well-explained. The `aria-hidden` rule is precise about "non-focusable only." The `fill="currentColor"` rule for SVGs is buried in the colour-modes section rather than the "SVG/icon" topic, which required scanning the whole document to find. The target-size rule is clear but cannot be enforced in a template file alone.

**drupal-a11y-dynamic:** Partially clear. The `Drupal.announce()` pattern is unambiguous. The focus-return guidance prioritises the server-side `FocusFirstCommand` but gives no client-side event name for cases where server-side control is unavailable. The `drupalAjaxSuccess` event had to be inferred from Drupal core source, not from the skill. This is the most significant gap in the skill text.

**drupal-a11y-qa:** Very clear. The `REFERENCE_BUG_REPORT.md` template combined with the `SKILL.md` explanation of each field produces a complete, structured issue with almost no ambiguity. The Bug ID hashing rules are precise. The AI disclosure block is verbatim-copyable. This sub-skill is the most production-ready of the four.

### Friction points where skill wording was ambiguous

1. **`drupal-a11y-fapi` — fieldset child keys:** The skill's fieldset example shows the child `radios` element nested directly inside the fieldset array without illustrating that it needs its own named key. Developers who copy the example literally may not know to add `'referral' => [...]`. A note or updated example would help.

2. **`drupal-a11y-fapi` — fieldset vs details for mandatory groups:** The skill says "use `details` instead of `fieldset` when the group should be collapsible" but does not explicitly say "use `fieldset` for mandatory groups." The implication is correct but a one-line confirmation would remove doubt.

3. **`drupal-a11y-dom` — SVG `fill="currentColor"` discoverability:** This rule lives in the "Colour modes" section, not in a section about icons or images. An author building a card with an icon but not thinking about colour modes might miss it. Cross-referencing from the `aria-hidden` section (where icons are discussed) would improve discoverability.

4. **`drupal-a11y-dom` — target size in Twig:** The skill says "every interactive element is at least 24×24 CSS px" but does not clarify that Twig templates cannot enforce this alone — it requires CSS. A note acknowledging that the enforcement belongs in a companion CSS file (and that absence of CSS is a violation even when the template is correct) would set clearer expectations.

5. **`drupal-a11y-dynamic` — client-side focus-return event:** The skill does not name `drupalAjaxSuccess` as the event to use on the client side when the server-side `FocusFirstCommand` approach is unavailable. This is the single most impactful gap in the skill text. Developers following the skill who cannot modify PHP AJAX responses have no guidance on the correct client-side pattern.

6. **`drupal-a11y-dynamic` — no worked example combining announce + focus return in one behavior file:** The skill gives separate examples for `Drupal.announce()` (the cart behavior) and for focus return (the "Load more" Playwright test), but no example shows both in one JS file. Developers building a form submission + replacement flow (the exact scenario in this task) must synthesise from two separate sections.

---

*This report was generated by an AI coding tool as a quality test of the drupal-accessibility skill set. It should be reviewed by a human accessibility expert before being used to assess or modify the skills.*

**AI disclosure**

This contribution was prepared with assistance from an AI coding tool.
- Tool: Claude Code (claude-sonnet-4-6)
- Used for: generating all code artefacts, reviewing them against skill rules, drafting this report
- Reviewed by: [pending — mike.gifford@gmail.com]
- Skills loaded: drupal-accessibility (sub-skills: drupal-a11y-fapi, drupal-a11y-dom, drupal-a11y-dynamic, drupal-a11y-qa)
