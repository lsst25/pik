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
        const option: Option = {
          name: optionMatch[1],
          line: lineNumber,
          content: line,
          isActive: !this.isLineCommented(line),
        };
        currentSelector.options.push(option);
      }
    }

    return { selectors, content };
  }

  /**
   * Check if a line is commented out
   */
  private isLineCommented(line: string): boolean {
    return line.trimStart().startsWith(this.commentStyle.lineComment);
  }
}
