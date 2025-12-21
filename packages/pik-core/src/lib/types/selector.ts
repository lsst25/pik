import type { Option } from './option.js';

/**
 * Represents a selector with its options
 */
export interface Selector {
  /** Selector name (e.g., "Environment") */
  name: string;
  /** Line number where the selector is defined (1-based) */
  line: number;
  /** All options belonging to this selector */
  options: Option[];
}
