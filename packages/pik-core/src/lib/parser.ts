import type { BlockOption, Option, ParseResult } from './types/index.js';
import { BaseSelector, Selector, BlockSelector } from './types/index.js';
import { CommentStyle } from './types/index.js';

interface PendingSelector {
  name: string;
  line: number;
}

/**
 * Parser for pik selectors and options in source files
 */
export class Parser {
  private static readonly SELECT_REGEX = /@pik:select\s+(\S+)/;
  private static readonly OPTION_REGEX = /@pik:option\s+(\S+)/;
  private static readonly BLOCK_START_REGEX = /@pik:block-start\s+(\S+)/;
  private static readonly BLOCK_END_REGEX = /@pik:block-end/;

  constructor(private readonly commentStyle: CommentStyle) {}

  /**
   * Create a parser for a file path
   */
  static forFilePath(filePath: string): Parser {
    return new Parser(CommentStyle.fromFilePath(filePath));
  }

  /**
   * Parse content string for pik selectors and options
   */
  parse(content: string): ParseResult {
    const lines = content.split('\n');
    const selectors: BaseSelector[] = [];
    let currentSelector: Selector | BlockSelector | null = null;
    let pendingSelector: PendingSelector | null = null;
    let currentBlock: { name: string; startLine: number; contentLines: number[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for selector
      const selectMatch = line.match(Parser.SELECT_REGEX);
      if (selectMatch) {
        // Save pending selector info - we'll create the actual instance when we know the type
        pendingSelector = { name: selectMatch[1], line: lineNumber };
        currentSelector = null;
        continue;
      }

      // Check for block-start
      const blockStartMatch = line.match(Parser.BLOCK_START_REGEX);
      if (blockStartMatch && (pendingSelector || currentSelector instanceof BlockSelector)) {
        // First block option - create a BlockSelector
        if (!currentSelector && pendingSelector) {
          currentSelector = new BlockSelector(pendingSelector.name, pendingSelector.line);
          selectors.push(currentSelector);
          pendingSelector = null;
        }
        currentBlock = {
          name: blockStartMatch[1],
          startLine: lineNumber,
          contentLines: [],
        };
        continue;
      }

      // Check for block-end
      const blockEndMatch = line.match(Parser.BLOCK_END_REGEX);
      if (blockEndMatch && currentSelector instanceof BlockSelector && currentBlock) {
        // Determine if block is active by checking if first content line is uncommented
        const isActive = currentBlock.contentLines.length > 0
          ? !this.isLineCommented(lines[currentBlock.contentLines[0] - 1])
          : false;

        const blockOption: BlockOption = {
          name: currentBlock.name,
          startLine: currentBlock.startLine,
          endLine: lineNumber,
          contentLines: currentBlock.contentLines,
          isActive,
        };
        currentSelector.options.push(blockOption);
        currentBlock = null;
        continue;
      }

      // If inside a block, collect content lines
      if (currentBlock) {
        currentBlock.contentLines.push(lineNumber);
        continue;
      }

      // Check for option (single-line)
      const optionMatch = line.match(Parser.OPTION_REGEX);
      if (optionMatch && (pendingSelector || currentSelector instanceof Selector)) {
        // First single-line option - create a Selector
        if (!currentSelector && pendingSelector) {
          currentSelector = new Selector(pendingSelector.name, pendingSelector.line);
          selectors.push(currentSelector);
          pendingSelector = null;
        }

        if (currentSelector instanceof Selector) {
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
