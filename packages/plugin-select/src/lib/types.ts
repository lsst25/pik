/**
 * Configuration for the select plugin
 */
export interface SelectConfig {
  /** File patterns to scan for @pik markers */
  include: string[];
}

/**
 * Extend PikConfig to include select plugin config
 */
declare module '@lsst/pik-core' {
  interface PikConfig {
    select?: SelectConfig;
  }
}
