/**
 * Maps selector names to option names within a profile
 */
export interface ProfileMapping {
  [selectorName: string]: string;
}

/**
 * Collection of named profiles
 */
export interface ProfilesConfig {
  [profileName: string]: ProfileMapping;
}

/**
 * Configuration for the select plugin
 */
export interface SelectConfig {
  /** File patterns to scan for @pik markers */
  include: string[];
  /** Named profiles that apply multiple selector options at once */
  profiles?: ProfilesConfig;
}

/**
 * Extend PikConfig to include select plugin config
 */
declare module '@lsst/pik-core' {
  interface PikConfig {
    select?: SelectConfig;
  }
}
