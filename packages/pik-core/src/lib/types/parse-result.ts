import type { Selector } from './selector.js';

/**
 * Result of parsing a file or content string
 */
export interface ParseResult {
  /** All selectors found in the content */
  selectors: Selector[];
  /** Original content that was parsed */
  content: string;
}
