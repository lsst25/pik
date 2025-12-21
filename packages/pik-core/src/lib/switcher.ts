import type { Selector } from './types/index.js';
import { CommentManipulator } from './comment-manipulator.js';

/**
 * Abstract base class for switching pik options
 */
export abstract class Switcher extends CommentManipulator {
  /**
   * Switch options within a selector
   * Returns the modified content
   */
  abstract switch(
    content: string,
    selector: Selector,
    optionName: string
  ): string;

  /**
   * Validate that the option exists in the selector
   */
  protected validateOption(selector: Selector, optionName: string): void {
    const option = selector.options.find((o) => o.name === optionName);
    if (!option) {
      throw new Error(
        `Option "${optionName}" not found in selector "${selector.name}"`
      );
    }
  }
}
