import { CommentStyle } from './types/index.js';

/**
 * Base class for manipulating comments in source files
 */
export abstract class CommentManipulator {
  constructor(protected readonly commentStyle: CommentStyle) {}

  /**
   * Check if a line is commented out
   */
  protected isLineCommented(line: string): boolean {
    return line.trimStart().startsWith(this.commentStyle.lineComment);
  }

  /**
   * Comment out a line if not already commented
   */
  protected commentLine(line: string): string {
    const trimmed = line.trimStart();
    if (trimmed.startsWith(this.commentStyle.lineComment)) {
      return line; // Already commented
    }

    const indent = line.slice(0, line.length - trimmed.length);
    return `${indent}${this.commentStyle.lineComment} ${trimmed}`;
  }

  /**
   * Uncomment a line if commented
   */
  protected uncommentLine(line: string): string {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith(this.commentStyle.lineComment)) {
      return line; // Not commented
    }

    const indent = line.slice(0, line.length - trimmed.length);
    const withoutComment = trimmed.slice(this.commentStyle.lineComment.length);
    // Remove leading space after comment marker if present
    const content = withoutComment.startsWith(' ')
      ? withoutComment.slice(1)
      : withoutComment;

    return `${indent}${content}`;
  }
}
