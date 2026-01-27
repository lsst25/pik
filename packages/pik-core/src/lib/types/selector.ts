import type { Option } from './option.js';
import type { BlockOption } from './block-option.js';

/**
 * Represents a selector with its options
 */
export interface Selector {
  /** Selector name (e.g., "Environment") */
  name: string;
  /** Line number where the selector is defined (1-based) */
  line: number;
  /** All single-line options belonging to this selector */
  options: Option[];
  /** All multi-line block options belonging to this selector */
  blockOptions: BlockOption[];
}
