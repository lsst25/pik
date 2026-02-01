import type { BaseOption } from './base-option.js';

/**
 * Represents a multi-line block option within a selector
 */
export interface BlockOption extends BaseOption {
  /** Line number where @pik:block-start is located (1-based) */
  startLine: number;
  /** Line number where @pik:block-end is located (1-based) */
  endLine: number;
  /** Line numbers of content lines between start/end (1-based) */
  contentLines: number[];
}
