import type { Option, ParseResult, Selector } from './types/index.js';
import { CommentStyle } from './types/index.js';

/**
 * Parser for pik selectors and options in source files
 */
export class Parser {
  private static readonly SELECT_REGEX = /@pik:select\s+(\S+)/;
  private static readonly OPTION_REGEX = /@pik:option\s+(\S+)/;

  constructor(private readonly commentStyle: CommentStyle) {}

  /**
   * Create a parser for a specific file extension
   */
  static forExtension(extension: string): Parser {
    return new Parser(CommentStyle.fromExtension(extension));
  }

  /**
   * Create a parser for a file path, correctly handling dotfiles like .env
   */
  static forFilePath(filePath: string): Parser {
    return new Parser(CommentStyle.fromFilePath(filePath));
  }

  /**
   * Parse content string for pik selectors and options
   */
  parse(content: string): ParseResult {
    const lines = content.split('\n');
    const selectors: Selector[] = [];
    let currentSelector: Selector | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for selector
      const selectMatch = line.match(Parser.SELECT_REGEX);
      if (selectMatch) {
        currentSelector = {
          name: selectMatch[1],
          line: lineNumber,
          options: [],
        };
        selectors.push(currentSelector);
        continue;
      }

      // Check for option
      const optionMatch = line.match(Parser.OPTION_REGEX);
      if (optionMatch && currentSelector) {
        // Check if this is a standalone marker (marker only on its own line)
        const isStandalone = this.isStandaloneMarker(line);

        if (isStandalone && i + 1 < lines.length) {
          // Standalone marker: content is on the next line
          const contentLine = lines[i + 1];
          const option: Option = {
            name: optionMatch[1],
            line: lineNumber,
            contentLine: lineNumber + 1,
            content: contentLine,
            isActive: !this.isLineCommented(contentLine),
          };
          currentSelector.options.push(option);
        } else {
          // Inline marker: content is on the same line
          const option: Option = {
            name: optionMatch[1],
            line: lineNumber,
            contentLine: lineNumber,
            content: line,
            isActive: !this.isLineCommented(line),
          };
          currentSelector.options.push(option);
        }
      }
    }

    return { selectors, content };
  }

  /**
   * Check if a line contains only a standalone marker (no other content)
   * e.g., "<!-- @pik:option Name -->" or "# @pik:option Name"
   */
  private isStandaloneMarker(line: string): boolean {
    const trimmed = line.trim();

    // Check block comment style: <!-- @pik:option Name -->
    if (this.commentStyle.hasBlockComments) {
      const { blockOpen, blockClose } = this.commentStyle;
      if (trimmed.startsWith(blockOpen!) && trimmed.endsWith(blockClose!)) {
        // Extract content between markers
        const inner = trimmed.slice(blockOpen!.length, -blockClose!.length).trim();
        // Check if inner content is ONLY the option marker
        const optionMatch = inner.match(Parser.OPTION_REGEX);
        if (optionMatch && inner === `@pik:option ${optionMatch[1]}`) {
          return true;
        }
      }
    }

    // Check line comment style: // @pik:option Name or # @pik:option Name
    if (trimmed.startsWith(this.commentStyle.lineComment)) {
      const afterComment = trimmed.slice(this.commentStyle.lineComment.length).trim();
      const optionMatch = afterComment.match(Parser.OPTION_REGEX);
      if (optionMatch && afterComment === `@pik:option ${optionMatch[1]}`) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a line is commented out
   */
  private isLineCommented(line: string): boolean {
    const trimmed = line.trimStart();

    // Check line comment
    if (trimmed.startsWith(this.commentStyle.lineComment)) {
      return true;
    }

    // Check block comment (single line only, e.g., <!-- code -->)
    if (this.commentStyle.hasBlockComments) {
      const { blockOpen, blockClose } = this.commentStyle;
      if (trimmed.startsWith(blockOpen!) && trimmed.includes(blockClose!)) {
        return true;
      }
    }

    return false;
  }
}
