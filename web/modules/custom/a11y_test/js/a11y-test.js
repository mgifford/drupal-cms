/**
 * @file
 * Accessible Drupal behaviors for a11y_test.
 *
 * Generated to verify drupal-a11y-dynamic skill rules:
 *
 * 1. Announcements use Drupal.announce(), never a hand-rolled aria-live region.
 *    A hand-rolled <div aria-live> conflicts with core's shared live region,
 *    races the polite queue, and frequently announces the wrong thing.
 *
 * 2. Focus management after AJAX:
 *    When an AJAX command replaces content, focus must return somewhere
 *    meaningful. Per the skill, Drupal.AjaxCommands.prototype.focus / the
 *    FocusFirstCommand is preferred on the server side; on the client side,
 *    use element.focus() only after the command queue has settled (i.e. inside
 *    ajax.commands callback, not an immediate setTimeout hack).
 *    Here we demonstrate the client-side pattern for returning focus to the
 *    form heading after an AJAX response replaces the form.
 *
 * 3. The IIFE uses (Drupal, once) as the canonical Drupal behavior wrapper.
 *    No jQuery dependency is introduced — once() is the modern Drupal utility.
 */

((Drupal, once) => {
  'use strict';

  /**
   * Behavior 1: Announce successful form submission to screen-reader users.
   *
   * Attaches to any form with a [data-a11y-form] attribute. On submit it
   * calls Drupal.announce() — polite by default so it queues behind whatever
   * the user is currently reading — with the confirmation message.
   *
   * drupal-a11y-dynamic rule:
   *   Use Drupal.announce() for state changes a sighted user sees but a
   *   screen-reader user would otherwise miss. Do NOT insert your own
   *   <div aria-live="polite|assertive"> into the DOM.
   */
  Drupal.behaviors.a11yTestFormAnnounce = {
    attach(context) {
      once('a11y-form-announce', '[data-a11y-form]', context).forEach((form) => {
        form.addEventListener('submit', () => {
          // Polite: queues behind any current reading; appropriate for a
          // non-time-critical success confirmation.
          Drupal.announce(Drupal.t('Form submitted successfully.'));
        });
      });
    },
  };

  /**
   * Behavior 2: Return focus to the form heading after AJAX replaces the form.
   *
   * When an AJAX response removes the form the user just interacted with and
   * replaces it with new content, the browser's focus is left stranded on
   * <body> (or wherever the removed element was). This is the single most
   * common AJAX accessibility regression.
   *
   * Pattern:
   *   - Listen for Drupal's 'drupalAjaxSuccess' event on the document, which
   *     fires after the command queue has settled and all DOM mutations are
   *     done. This is safer than a raw success callback or a setTimeout.
   *   - Find the first heading inside the replaced region and move focus to it.
   *     To be focusable, the heading needs tabindex="-1"; we set it
   *     programmatically so the heading is not in the natural tab order but
   *     can still receive programmatic focus.
   *   - If no heading is found, fall back to the landmark region containing
   *     the new content so keyboard users are not stranded on <body>.
   *
   * drupal-a11y-dynamic rules applied:
   *   • Do not call element.focus() inside an AJAX success callback directly;
   *     use the event that fires after the command queue settles.
   *   • A "Load more" / inline-form replacement that disappears with no focus
   *     return strands keyboard users. Return focus to a meaningful element.
   *   • On the server side, prefer FocusFirstCommand / Drupal.AjaxCommands
   *     .prototype.focus for a more robust solution; this client-side pattern
   *     is a complement, not a replacement.
   */
  Drupal.behaviors.a11yTestFocusReturn = {
    attach(context) {
      // Guard: only wire the document-level listener once, regardless of how
      // many times attach() is called across AJAX cycles.
      once('a11y-focus-return', document, context).forEach(() => {
        document.addEventListener('drupalAjaxSuccess', (event) => {
          // event.detail.wrapper is the CSS selector string passed to the AJAX
          // command, e.g. '[data-drupal-selector="edit-a11y-form"]'.
          // We look for a heading inside the replaced wrapper.
          const wrapperSelector = event && event.detail && event.detail.wrapper;
          if (!wrapperSelector) {
            return;
          }

          const wrapper = document.querySelector(wrapperSelector);
          if (!wrapper) {
            return;
          }

          // Find the first heading inside the new content.
          const heading = wrapper.querySelector('h1, h2, h3, h4, h5, h6');
          const target = heading || wrapper;

          // Make the element programmatically focusable without inserting it
          // into the tab order (tabindex="-1").
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }

          target.focus();
        });
      });
    },
  };

})(Drupal, once);
