import type { Selector } from './types/index.js';
import { CommentStyle } from './types/index.js';
import { Switcher } from './switcher.js';

/**
 * Switcher that allows only one option to be active at a time
 */
export class SingleSwitcher extends Switcher {
  /**
   * Create a switcher for a specific file extension
   */
  static forExtension(extension: string): SingleSwitcher {
    return new SingleSwitcher(CommentStyle.fromExtension(extension));
  }

  /**
   * Switch to a specific option, deactivating all others
   */
  switch(content: string, selector: Selector, optionName: string): string {
    this.validateOption(selector, optionName);

    const lines = content.split('\n');

    for (const option of selector.options) {
      const lineIndex = option.line - 1;
      const line = lines[lineIndex];

      if (option.name === optionName) {
        lines[lineIndex] = this.uncommentLine(line);
      } else {
        lines[lineIndex] = this.commentLine(line);
      }
    }

    return lines.join('\n');
  }
}
