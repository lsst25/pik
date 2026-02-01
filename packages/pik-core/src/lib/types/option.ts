import type { BaseOption } from './base-option.js';

/**
 * Represents a single option within a selector
 */
export interface Option extends BaseOption {
  /** Line number where the marker is (1-based) */
  line: number;
  /** Line number where the content is (1-based). Same as `line` for inline markers, next line for standalone markers. */
  contentLine: number;
  /** Full content of the content line */
  content: string;
}
