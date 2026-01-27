/**
 * Represents a multi-line block option within a selector
 */
export interface BlockOption {
  /** Option name (e.g., "Development", "Production") */
  name: string;
  /** Line number where @pik:block-start is located (1-based) */
  startLine: number;
  /** Line number where @pik:block-end is located (1-based) */
  endLine: number;
  /** Line numbers of content lines between start/end (1-based) */
  contentLines: number[];
  /** Whether this block is currently active (content lines are not commented out) */
  isActive: boolean;
}
