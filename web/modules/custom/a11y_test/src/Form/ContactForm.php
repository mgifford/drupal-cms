<?php

declare(strict_types=1);

namespace Drupal\a11y_test\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Provides an accessible contact form.
 *
 * Generated to verify drupal-a11y-fapi skill rules:
 * - Every element has #title and, where useful, #description.
 * - Related radio controls are grouped inside a #type => 'fieldset'.
 * - No hand-rolled aria-* attributes; Form API produces label associations.
 * - No interactive elements inside #markup.
 */
class ContactForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'a11y_test_contact_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {

    // Required email field with a description.
    // Form API generates: <label for>, aria-describedby, and the required
    // indicator automatically from #title, #description, and #required.
    // Do not add aria-label, aria-required, or a manual <label> alongside.
    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Your email address'),
      '#description' => $this->t('We will only use your address to send a confirmation. It will not be shared.'),
      '#required' => TRUE,
    ];

    // Group of radio buttons — must be wrapped in a fieldset (or details)
    // so the group has a programmatic legend. A standalone 'radios' element
    // without an enclosing fieldset is a violation per drupal-a11y-fapi:
    // individual <label> elements do not substitute for a group label.
    $form['referral_group'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('How did you hear about us?'),
      'referral' => [
        '#type' => 'radios',
        // The fieldset legend already provides the visible group label;
        // suppress the redundant inner title while keeping it in the
        // accessibility tree via #title_display => 'invisible'.
        '#title' => $this->t('How did you hear about us?'),
        '#title_display' => 'invisible',
        '#options' => [
          'search_engine' => $this->t('Search engine'),
          'social_media' => $this->t('Social media'),
          'word_of_mouth' => $this->t('Word of mouth'),
        ],
      ],
    ];

    // Submit button. #type => 'submit' produces a native <button> element;
    // do not add role="button" or any ARIA that restates what the element
    // already provides.
    $form['actions'] = [
      '#type' => 'actions',
      'submit' => [
        '#type' => 'submit',
        '#value' => $this->t('Send message'),
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    // Validation intentionally minimal for the skill-test fixture.
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->messenger()->addStatus($this->t('Your message has been sent. Thank you.'));
  }

}
