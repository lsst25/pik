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
   * Create a switcher for a file path, correctly handling dotfiles like .env
   */
  static forFilePath(filePath: string): SingleSwitcher {
    return new SingleSwitcher(CommentStyle.fromFilePath(filePath));
  }

  /**
   * Switch to a specific option, deactivating all others
   */
  switch(content: string, selector: Selector, optionName: string): string {
    this.validateOption(selector, optionName);

    const lines = content.split('\n');

    // Detect if any option uses block comment style (check the content line, not marker line)
    const useBlockStyle = selector.options.some((opt) => {
      const line = lines[opt.contentLine - 1];
      return this.isBlockCommented(line);
    });

    for (const option of selector.options) {
      // Use contentLine for the actual content to modify
      const lineIndex = option.contentLine - 1;
      const line = lines[lineIndex];

      if (option.name === optionName) {
        lines[lineIndex] = this.uncommentLine(line);
      } else {
        lines[lineIndex] = this.commentLine(line, useBlockStyle);
      }
    }

    return lines.join('\n');
  }
}
