/**
 * Base interface for selector options (both single-line and block)
 */
export interface BaseOption {
  /** Option name (e.g., "DEV", "Production") */
  name: string;
  /** Whether this option is currently active */
  isActive: boolean;
}
