import type { BaseSelector } from '../selector/index.js';

/**
 * Result of parsing a file or content string
 */
export interface ParseResult {
  /** All selectors found in the content */
  selectors: BaseSelector[];
  /** Original content that was parsed */
  content: string;
}
