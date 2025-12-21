/**
 * Represents a single option within a selector
 */
export interface Option {
  /** Option name (e.g., "DEV", "LOCAL") */
  name: string;
  /** Line number (1-based) */
  line: number;
  /** Full content of the line */
  content: string;
  /** Whether this option is currently active (not commented out) */
  isActive: boolean;
}
