import { CommentStyle } from './types/index.js';

/**
 * Base class for manipulating comments in source files
 */
export abstract class CommentManipulator {
  constructor(protected readonly commentStyle: CommentStyle) {}

  /**
   * Check if a line is commented out (line or block comment)
   */
  protected isLineCommented(line: string): boolean {
    const trimmed = line.trimStart();

    // Check line comment
    if (trimmed.startsWith(this.commentStyle.lineComment)) {
      return true;
    }

    // Check block comment
    if (this.commentStyle.hasBlockComments) {
      const { blockOpen, blockClose } = this.commentStyle;
      if (trimmed.startsWith(blockOpen!) && trimmed.includes(blockClose!)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a line uses block comment style
   */
  protected isBlockCommented(line: string): boolean {
    if (!this.commentStyle.hasBlockComments) {
      return false;
    }

    const trimmed = line.trimStart();
    const { blockOpen, blockClose } = this.commentStyle;
    return trimmed.startsWith(blockOpen!) && trimmed.includes(blockClose!);
  }

  /**
   * Comment out a line if not already commented.
   * Uses the same comment style as the original if block-commented,
   * otherwise uses line comment style.
   */
  protected commentLine(line: string, useBlockStyle = false): string {
    const trimmed = line.trimStart();

    // Already commented with line comment
    if (trimmed.startsWith(this.commentStyle.lineComment)) {
      return line;
    }

    // Already commented with block comment
    if (this.isBlockCommented(line)) {
      return line;
    }

    const indent = line.slice(0, line.length - trimmed.length);

    // Use block style if requested and available
    if (useBlockStyle && this.commentStyle.hasBlockComments) {
      const { blockOpen, blockClose } = this.commentStyle;
      return `${indent}${blockOpen} ${trimmed} ${blockClose}`;
    }

    return `${indent}${this.commentStyle.lineComment} ${trimmed}`;
  }

  /**
   * Uncomment a line if commented (handles both line and block comments)
   */
  protected uncommentLine(line: string): string {
    const trimmed = line.trimStart();
    const indent = line.slice(0, line.length - trimmed.length);

    // Check block comment first
    if (this.commentStyle.hasBlockComments) {
      const { blockOpen, blockClose } = this.commentStyle;
      if (trimmed.startsWith(blockOpen!)) {
        // Find the FIRST closing marker (not the last, as there may be multiple block comments)
        const afterOpen = trimmed.slice(blockOpen!.length);
        const closeIndex = afterOpen.indexOf(blockClose!);
        if (closeIndex !== -1) {
          // Extract content between first open and first close
          const content = afterOpen.slice(0, closeIndex).trim();
          // Keep everything after the first block comment
          const rest = afterOpen.slice(closeIndex + blockClose!.length);
          return `${indent}${content}${rest}`;
        }
      }
    }

    // Check line comment
    if (!trimmed.startsWith(this.commentStyle.lineComment)) {
      return line; // Not commented
    }

    const withoutComment = trimmed.slice(this.commentStyle.lineComment.length);
    // Remove leading space after comment marker if present
    const content = withoutComment.startsWith(' ')
      ? withoutComment.slice(1)
      : withoutComment;

    return `${indent}${content}`;
  }
}
