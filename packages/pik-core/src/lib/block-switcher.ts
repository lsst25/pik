import type { Selector } from './types/index.js';
import { CommentStyle } from './types/index.js';
import { CommentManipulator } from './comment-manipulator.js';

/**
 * Switcher that handles multi-line block options
 */
export class BlockSwitcher extends CommentManipulator {
  /**
   * Create a switcher for a file path
   */
  static forFilePath(filePath: string): BlockSwitcher {
    return new BlockSwitcher(CommentStyle.fromFilePath(filePath));
  }

  /**
   * Switch to a specific block option, deactivating all others.
   * - Selected block: all content lines uncommented
   * - Other blocks: all content lines commented
   */
  switch(content: string, selector: Selector, blockName: string): string {
    this.validateBlockOption(selector, blockName);

    const lines = content.split('\n');

    // Detect if any block uses block comment style
    const useBlockStyle = selector.blockOptions.some((block) => {
      if (block.contentLines.length === 0) return false;
      const line = lines[block.contentLines[0] - 1];
      return this.isBlockCommented(line);
    });

    for (const block of selector.blockOptions) {
      for (const lineNum of block.contentLines) {
        const lineIndex = lineNum - 1;
        const line = lines[lineIndex];

        if (block.name === blockName) {
          lines[lineIndex] = this.uncommentLine(line);
        } else {
          lines[lineIndex] = this.commentLine(line, useBlockStyle);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Validate that the block option exists in the selector
   */
  private validateBlockOption(selector: Selector, blockName: string): void {
    const block = selector.blockOptions.find((b) => b.name === blockName);
    if (!block) {
      throw new Error(
        `Block option "${blockName}" not found in selector "${selector.name}"`
      );
    }
  }
}
